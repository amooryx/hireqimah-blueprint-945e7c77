import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, job_posting_id, required_skills, required_certifications, min_ers, university, major, region, limit: queryLimit } = await req.json();

    // ── ACTION: match-candidates ── Find candidates that best fit a job
    if (action === "match-candidates") {
      // Get job posting details if ID provided
      let skills = required_skills || [];
      let certs = required_certifications || [];
      let minErs = min_ers || 0;

      if (job_posting_id) {
        const { data: jp } = await supabase
          .from("job_postings")
          .select("*")
          .eq("id", job_posting_id)
          .single();
        if (jp) {
          skills = jp.required_skills || skills;
          minErs = jp.min_ers_score || minErs;
        }
      }

      // Get visible students with filters
      let query = supabase
        .from("student_profiles")
        .select("user_id, university, major, ers_score, gpa, gpa_scale")
        .eq("visibility_public", true)
        .order("ers_score", { ascending: false })
        .limit(queryLimit || 100);

      if (university) query = query.eq("university", university);
      if (major) query = query.eq("major", major);
      if (minErs > 0) query = query.gte("ers_score", minErs);

      const { data: students } = await query;
      if (!students || students.length === 0) {
        return new Response(JSON.stringify({ candidates: [], total: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate job-fit for each candidate
      const results = [];
      for (const student of students) {
        if (skills.length > 0 || certs.length > 0) {
          const { data: fitResult } = await supabase.rpc("calculate_job_fit", {
            _student_user_id: student.user_id,
            _required_skills: skills,
            _required_certifications: certs,
            _min_ers: minErs,
          });

          if (fitResult) {
            results.push({
              ...student,
              fit: fitResult,
            });
          }
        } else {
          // No specific requirements — rank by ERS only
          results.push({
            ...student,
            fit: {
              fit_score: Math.min(Math.round((student.ers_score || 0) / 1.2), 100),
              skill_match: 0, skill_total: 0,
              cert_match: 0, cert_total: 0,
              ers: student.ers_score || 0,
              ers_pass: true,
              matched_skills: [], matched_certs: [],
            },
          });
        }
      }

      // Sort by fit score
      results.sort((a, b) => (b.fit?.fit_score || 0) - (a.fit?.fit_score || 0));

      // Fetch profile names
      const userIds = results.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, email")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      const enriched = results.map((r, i) => ({
        ...r,
        rank: i + 1,
        full_name: profileMap.get(r.user_id)?.full_name || "Student",
        avatar_url: profileMap.get(r.user_id)?.avatar_url,
        email: profileMap.get(r.user_id)?.email,
      }));

      return new Response(
        JSON.stringify({ candidates: enriched, total: enriched.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: refresh-leaderboard ── Refresh the materialized view
    if (action === "refresh-leaderboard") {
      await supabase.rpc("refresh_leaderboard");
      return new Response(
        JSON.stringify({ success: true, refreshed_at: new Date().toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "match-candidates" or "refresh-leaderboard".' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("hr-smart-filter error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
