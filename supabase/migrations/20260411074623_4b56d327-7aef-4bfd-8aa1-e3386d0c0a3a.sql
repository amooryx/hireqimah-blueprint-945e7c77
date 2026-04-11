
-- Region mapping for Saudi universities
CREATE OR REPLACE FUNCTION public.get_university_region(_university text)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _university IN ('King Saud University','Imam University','Princess Nourah University','Alfaisal University','Prince Sultan University','Saudi Electronic University','Shaqra University','Majmaah University','Prince Sattam bin Abdulaziz University') THEN 'Riyadh'
    WHEN _university IN ('King Abdulaziz University','Effat University','Dar Al-Hekma University','University of Jeddah') THEN 'Jeddah'
    WHEN _university IN ('KFUPM','King Faisal University','Prince Mohammad bin Fahd University') THEN 'Eastern'
    WHEN _university IN ('Umm Al-Qura University','Taif University') THEN 'Makkah'
    WHEN _university IN ('Taibah University') THEN 'Madinah'
    WHEN _university IN ('Qassim University') THEN 'Qassim'
    WHEN _university IN ('King Khalid University','University of Bisha') THEN 'Asir'
    WHEN _university IN ('Jazan University') THEN 'Jazan'
    WHEN _university IN ('Najran University') THEN 'Najran'
    WHEN _university IN ('University of Tabuk') THEN 'Tabuk'
    WHEN _university IN ('University of Hail') THEN 'Hail'
    WHEN _university IN ('Northern Border University') THEN 'Northern Border'
    WHEN _university IN ('Jouf University') THEN 'Jouf'
    ELSE 'Other'
  END
$$;

-- Materialized view for leaderboard
CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard_ranked AS
SELECT
  sp.user_id,
  p.full_name,
  p.avatar_url,
  sp.university,
  sp.major,
  sp.ers_score,
  sp.gpa,
  sp.gpa_scale,
  get_university_region(sp.university) AS region,
  RANK() OVER (ORDER BY sp.ers_score DESC NULLS LAST) AS national_rank,
  RANK() OVER (PARTITION BY sp.university ORDER BY sp.ers_score DESC NULLS LAST) AS university_rank,
  RANK() OVER (PARTITION BY sp.major ORDER BY sp.ers_score DESC NULLS LAST) AS major_rank
FROM student_profiles sp
JOIN profiles p ON p.user_id = sp.user_id
WHERE sp.visibility_public = true AND sp.ers_score IS NOT NULL
ORDER BY sp.ers_score DESC NULLS LAST;

-- Index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_ranked_user ON public.leaderboard_ranked(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_ranked_uni ON public.leaderboard_ranked(university);
CREATE INDEX IF NOT EXISTS idx_leaderboard_ranked_major ON public.leaderboard_ranked(major);
CREATE INDEX IF NOT EXISTS idx_leaderboard_ranked_region ON public.leaderboard_ranked(region);

-- Refresh function
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_ranked;
END;
$$;

-- Job-fit scoring function
CREATE OR REPLACE FUNCTION public.calculate_job_fit(
  _student_user_id uuid,
  _required_skills text[],
  _required_certifications text[],
  _min_ers integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _skill_match int := 0;
  _skill_total int;
  _cert_match int := 0;
  _cert_total int;
  _ers numeric;
  _ers_pass boolean;
  _skill_score numeric;
  _cert_score numeric;
  _ers_bonus numeric;
  _fit_score numeric;
  _matched_skills text[];
  _matched_certs text[];
BEGIN
  _skill_total := COALESCE(array_length(_required_skills, 1), 0);
  _cert_total := COALESCE(array_length(_required_certifications, 1), 0);

  -- Match skills
  IF _skill_total > 0 THEN
    SELECT COUNT(*), ARRAY_AGG(sm.skill_name)
    INTO _skill_match, _matched_skills
    FROM skill_matrix sm
    WHERE sm.user_id = _student_user_id
      AND LOWER(sm.skill_name) = ANY(
        SELECT LOWER(unnest) FROM unnest(_required_skills)
      );
  END IF;

  -- Match certifications
  IF _cert_total > 0 THEN
    SELECT COUNT(*), ARRAY_AGG(cc.name)
    INTO _cert_match, _matched_certs
    FROM student_certifications sc
    JOIN certification_catalog cc ON sc.certification_id = cc.id
    WHERE sc.user_id = _student_user_id
      AND LOWER(cc.name) = ANY(
        SELECT LOWER(unnest) FROM unnest(_required_certifications)
      );
  END IF;

  -- Get ERS
  SELECT COALESCE(ers_score, 0) INTO _ers FROM student_profiles WHERE user_id = _student_user_id;
  _ers_pass := _ers >= _min_ers;

  -- Calculate component scores
  _skill_score := CASE WHEN _skill_total > 0 THEN (COALESCE(_skill_match, 0)::numeric / _skill_total) * 50 ELSE 25 END;
  _cert_score := CASE WHEN _cert_total > 0 THEN (COALESCE(_cert_match, 0)::numeric / _cert_total) * 30 ELSE 15 END;
  _ers_bonus := LEAST(_ers / 5, 20);

  _fit_score := ROUND(_skill_score + _cert_score + _ers_bonus);
  IF NOT _ers_pass THEN _fit_score := _fit_score * 0.7; END IF;

  RETURN jsonb_build_object(
    'fit_score', LEAST(_fit_score, 100),
    'skill_match', COALESCE(_skill_match, 0),
    'skill_total', _skill_total,
    'cert_match', COALESCE(_cert_match, 0),
    'cert_total', _cert_total,
    'ers', _ers,
    'ers_pass', _ers_pass,
    'matched_skills', COALESCE(_matched_skills, ARRAY[]::text[]),
    'matched_certs', COALESCE(_matched_certs, ARRAY[]::text[])
  );
END;
$$;
