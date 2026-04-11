import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface JobEntry {
  title: string;
  company?: string;
  sector?: string;
  location?: string;
  description?: string;
  required_skills?: string[];
  required_certifications?: string[];
  experience_level?: string;
  source?: string;
  source_url?: string;
}

interface ExtractedIntelligence {
  skills: string[];
  certifications: string[];
  role_category: string;
  sector: string;
  seniority: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, jobs } = await req.json();

    // ── ACTION: ingest ── Accept raw job data, extract intelligence, update demand tables
    if (action === "ingest") {
      if (!Array.isArray(jobs) || jobs.length === 0) {
        return new Response(JSON.stringify({ error: "jobs array required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const processed: JobEntry[] = [];
      const allSkills: Record<string, number> = {};
      const allCerts: Record<string, number> = {};
      const allRoles: Record<string, number> = {};

      for (const job of jobs as JobEntry[]) {
        let extracted: ExtractedIntelligence | null = null;

        // Use AI to extract structured data if description is present and API key available
        if (job.description && lovableKey) {
          try {
            extracted = await extractWithAI(job, lovableKey);
          } catch (e) {
            console.error("AI extraction failed for job:", job.title, e);
          }
        }

        // Merge AI-extracted data with provided data
        const skills = [
          ...(job.required_skills || []),
          ...(extracted?.skills || []),
        ].map((s) => s.toLowerCase().trim());
        const certs = [
          ...(job.required_certifications || []),
          ...(extracted?.certifications || []),
        ].map((c) => c.trim());
        const sector = extracted?.sector || job.sector || "General";
        const role = extracted?.role_category || job.title;

        // Count frequencies
        const uniqueSkills = [...new Set(skills)];
        for (const s of uniqueSkills) {
          allSkills[s] = (allSkills[s] || 0) + 1;
        }
        const uniqueCerts = [...new Set(certs)];
        for (const c of uniqueCerts) {
          allCerts[c] = (allCerts[c] || 0) + 1;
        }
        allRoles[role] = (allRoles[role] || 0) + 1;

        // Store in job_cache
        processed.push({
          title: job.title,
          company: job.company,
          sector,
          location: job.location || "Saudi Arabia",
          required_skills: uniqueSkills,
          required_certifications: uniqueCerts,
          experience_level: extracted?.seniority || job.experience_level,
          source: job.source || "api",
          source_url: job.source_url,
        });
      }

      // Batch insert jobs into job_cache
      if (processed.length > 0) {
        const { error: jobErr } = await supabase.from("job_cache").insert(
          processed.map((j) => ({
            title: j.title,
            company: j.company,
            sector: j.sector,
            location: j.location,
            required_skills: j.required_skills,
            required_certifications: j.required_certifications,
            experience_level: j.experience_level,
            source: j.source,
            source_url: j.source_url,
          }))
        );
        if (jobErr) console.error("Job insert error:", jobErr);
      }

      // Update demand tables using upsert logic
      await updateSkillDemand(supabase, allSkills);
      await updateCertDemand(supabase, allCerts);
      await updateRoleDemand(supabase, allRoles);

      // Log the refresh
      await supabase.from("market_refresh_log").insert({
        status: "completed",
        jobs_analyzed: processed.length,
        completed_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          jobs_processed: processed.length,
          skills_tracked: Object.keys(allSkills).length,
          certs_tracked: Object.keys(allCerts).length,
          roles_tracked: Object.keys(allRoles).length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: get-demand ── Return current market demand snapshot
    if (action === "get-demand") {
      const [skillsRes, certsRes, rolesRes] = await Promise.all([
        supabase
          .from("market_skill_demand")
          .select("*")
          .order("demand_score", { ascending: false })
          .limit(50),
        supabase
          .from("market_cert_demand")
          .select("*")
          .order("demand_score", { ascending: false })
          .limit(30),
        supabase
          .from("market_role_demand")
          .select("*")
          .order("demand_score", { ascending: false })
          .limit(30),
      ]);

      return new Response(
        JSON.stringify({
          skills: skillsRes.data || [],
          certifications: certsRes.data || [],
          roles: rolesRes.data || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "ingest" or "get-demand".' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("market-intelligence error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── AI Extraction using Lovable AI Gateway ──
async function extractWithAI(
  job: JobEntry,
  apiKey: string
): Promise<ExtractedIntelligence> {
  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a Saudi job market analyst. Extract structured data from job postings. 
Always respond with valid JSON only, no markdown or explanation.`,
          },
          {
            role: "user",
            content: `Extract from this job posting:
Title: ${job.title}
Company: ${job.company || "Unknown"}
Description: ${(job.description || "").slice(0, 2000)}

Return JSON with these fields:
{
  "skills": ["list of technical and soft skills required"],
  "certifications": ["list of certifications mentioned, e.g. PMP, SOCPA, CFA, AWS"],
  "role_category": "general role category like Software Engineer, Data Analyst, etc.",
  "sector": "industry sector like Technology, Finance, Healthcare, Energy, etc.",
  "seniority": "entry/mid/senior/executive"
}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_job_data",
              description: "Extract structured job data",
              parameters: {
                type: "object",
                properties: {
                  skills: { type: "array", items: { type: "string" } },
                  certifications: { type: "array", items: { type: "string" } },
                  role_category: { type: "string" },
                  sector: { type: "string" },
                  seniority: {
                    type: "string",
                    enum: ["entry", "mid", "senior", "executive"],
                  },
                },
                required: [
                  "skills",
                  "certifications",
                  "role_category",
                  "sector",
                  "seniority",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "extract_job_data" },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  throw new Error("No tool call in AI response");
}

// ── Update skill demand scores ──
async function updateSkillDemand(
  supabase: ReturnType<typeof createClient>,
  skills: Record<string, number>
) {
  for (const [skill, count] of Object.entries(skills)) {
    // Check existing
    const { data: existing } = await supabase
      .from("market_skill_demand")
      .select("id, demand_score")
      .eq("skill_name", skill)
      .maybeSingle();

    if (existing) {
      const oldScore = Number(existing.demand_score) || 0;
      const newScore = oldScore + count;
      const weeklyTrend = oldScore > 0 ? ((newScore - oldScore) / oldScore) * 100 : 100;
      await supabase
        .from("market_skill_demand")
        .update({
          demand_score: newScore,
          weekly_trend: Math.round(weeklyTrend * 10) / 10,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("market_skill_demand").insert({
        skill_name: skill,
        demand_score: count,
        weekly_trend: 100,
        monthly_trend: 0,
      });
    }
  }
}

// ── Update cert demand scores ──
async function updateCertDemand(
  supabase: ReturnType<typeof createClient>,
  certs: Record<string, number>
) {
  for (const [cert, count] of Object.entries(certs)) {
    const { data: existing } = await supabase
      .from("market_cert_demand")
      .select("id, demand_score")
      .eq("cert_name", cert)
      .maybeSingle();

    if (existing) {
      const oldScore = Number(existing.demand_score) || 0;
      const newScore = oldScore + count;
      const weeklyTrend = oldScore > 0 ? ((newScore - oldScore) / oldScore) * 100 : 100;
      await supabase
        .from("market_cert_demand")
        .update({
          demand_score: newScore,
          weekly_trend: Math.round(weeklyTrend * 10) / 10,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("market_cert_demand").insert({
        cert_name: cert,
        demand_score: count,
        weekly_trend: 100,
        monthly_trend: 0,
      });
    }
  }
}

// ── Update role demand scores ──
async function updateRoleDemand(
  supabase: ReturnType<typeof createClient>,
  roles: Record<string, number>
) {
  for (const [role, count] of Object.entries(roles)) {
    const { data: existing } = await supabase
      .from("market_role_demand")
      .select("id, demand_score")
      .eq("role_title", role)
      .maybeSingle();

    if (existing) {
      const oldScore = Number(existing.demand_score) || 0;
      const newScore = oldScore + count;
      const weeklyTrend = oldScore > 0 ? ((newScore - oldScore) / oldScore) * 100 : 100;
      await supabase
        .from("market_role_demand")
        .update({
          demand_score: newScore,
          weekly_trend: Math.round(weeklyTrend * 10) / 10,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("market_role_demand").insert({
        role_title: role,
        demand_score: count,
        weekly_trend: 100,
        monthly_trend: 0,
      });
    }
  }
}
