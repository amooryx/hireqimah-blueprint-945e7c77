
CREATE OR REPLACE FUNCTION public.calculate_dynamic_ers(_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _sp student_profiles%ROWTYPE;
  _academic numeric;
  _cert numeric;
  _project numeric;
  _soft numeric;
  _conduct numeric;
  _base_score numeric;
  _demand_multiplier numeric := 1.0;
  _synergy_bonus numeric := 0;
  _decay numeric := 0;
  _national_readiness numeric := 0;
  _skill_match_count int := 0;
  _cert_match_count int := 0;
  _total numeric;
  _last_activity timestamptz;
  _days_inactive int;
BEGIN
  -- Get student profile
  SELECT * INTO _sp FROM student_profiles WHERE user_id = _user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Base component scores (from student_profiles)
  _academic := COALESCE(_sp.academic_score, 0);
  _cert := COALESCE(_sp.certification_score, 0);
  _project := COALESCE(_sp.project_score, 0);
  _soft := COALESCE(_sp.soft_skills_score, 0);
  _conduct := COALESCE(_sp.conduct_score, 100);

  -- Weighted base score
  _base_score := (_academic * 0.25) + (_cert * 0.25) + (_project * 0.15) + (_soft * 0.10) + (_conduct * 0.10);

  -- Market demand multiplier: check how many user skills match high-demand skills
  SELECT COUNT(*) INTO _skill_match_count
  FROM skill_matrix sm
  JOIN market_skill_demand msd ON LOWER(sm.skill_name) = LOWER(msd.skill_name)
  WHERE sm.user_id = _user_id AND msd.demand_score > 5;

  -- Check certification matches
  SELECT COUNT(*) INTO _cert_match_count
  FROM student_certifications sc
  JOIN certification_catalog cc ON sc.certification_id = cc.id
  JOIN market_cert_demand mcd ON LOWER(cc.name) = LOWER(mcd.cert_name)
  WHERE sc.user_id = _user_id AND mcd.demand_score > 3;

  -- Calculate demand multiplier (up to 15% bonus)
  _demand_multiplier := 1.0 + LEAST((_skill_match_count * 0.03) + (_cert_match_count * 0.05), 0.15);

  -- Synergy bonus: if student has both high-demand skills AND certs
  IF _skill_match_count >= 2 AND _cert_match_count >= 1 THEN
    _synergy_bonus := LEAST(_skill_match_count * 1.5 + _cert_match_count * 2.0, 10);
  END IF;

  -- National readiness bonus (Saudi nationality + high-demand alignment)
  IF EXISTS (SELECT 1 FROM profiles WHERE user_id = _user_id AND nationality = 'Saudi') THEN
    _national_readiness := LEAST(_skill_match_count * 0.5, 5);
  END IF;

  -- Decay: reduce score if profile inactive for 90+ days
  SELECT GREATEST(
    COALESCE((SELECT MAX(created_at) FROM skill_matrix WHERE user_id = _user_id), '2000-01-01'),
    COALESCE((SELECT MAX(uploaded_at) FROM student_certifications WHERE user_id = _user_id), '2000-01-01'),
    COALESCE((SELECT MAX(created_at) FROM student_projects WHERE user_id = _user_id), '2000-01-01'),
    _sp.updated_at
  ) INTO _last_activity;

  _days_inactive := EXTRACT(DAY FROM now() - _last_activity)::int;
  IF _days_inactive > 90 THEN
    _decay := LEAST((_days_inactive - 90) * 0.1, 15);
  END IF;

  -- Final score
  _total := ROUND((_base_score * _demand_multiplier) + _synergy_bonus + _national_readiness - _decay);
  _total := GREATEST(_total, 0);
  _total := LEAST(_total, 100);

  -- Upsert into ers_scores
  INSERT INTO ers_scores (user_id, total_score, academic_score, certification_score, project_score, soft_skills_score, conduct_score, decay_applied, synergy_bonus, national_readiness_bonus, calculated_at)
  VALUES (_user_id, _total, _academic, _cert, _project, _soft, _conduct, _decay, _synergy_bonus, _national_readiness, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_score = EXCLUDED.total_score,
    academic_score = EXCLUDED.academic_score,
    certification_score = EXCLUDED.certification_score,
    project_score = EXCLUDED.project_score,
    soft_skills_score = EXCLUDED.soft_skills_score,
    conduct_score = EXCLUDED.conduct_score,
    decay_applied = EXCLUDED.decay_applied,
    synergy_bonus = EXCLUDED.synergy_bonus,
    national_readiness_bonus = EXCLUDED.national_readiness_bonus,
    calculated_at = now();

  -- Update student_profiles
  UPDATE student_profiles SET ers_score = _total WHERE user_id = _user_id;

  RETURN _total;
END;
$$;

-- Add unique constraint on ers_scores.user_id for upsert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ers_scores_user_id_unique') THEN
    ALTER TABLE ers_scores ADD CONSTRAINT ers_scores_user_id_unique UNIQUE (user_id);
  END IF;
END $$;
