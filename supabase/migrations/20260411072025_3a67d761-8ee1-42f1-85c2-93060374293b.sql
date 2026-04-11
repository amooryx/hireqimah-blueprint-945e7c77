
-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users upload own docs" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own docs" ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own docs" ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Interview Requests
CREATE TABLE public.interview_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_user_id UUID NOT NULL,
  student_user_id UUID NOT NULL,
  job_title TEXT,
  job_description TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  student_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR manage own interviews" ON public.interview_requests FOR ALL USING (auth.uid() = hr_user_id);
CREATE POLICY "Students view own interviews" ON public.interview_requests FOR SELECT USING (auth.uid() = student_user_id);
CREATE POLICY "Students respond to interviews" ON public.interview_requests FOR UPDATE USING (auth.uid() = student_user_id);

-- Job Postings
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  description TEXT,
  location TEXT DEFAULT 'Saudi Arabia',
  sector TEXT,
  required_skills TEXT[] DEFAULT '{}',
  min_ers_score INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR manage own postings" ON public.job_postings FOR ALL USING (auth.uid() = hr_user_id);
CREATE POLICY "Public read active postings" ON public.job_postings FOR SELECT USING (is_active = true);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- HR Candidate Pipeline
CREATE TABLE public.hr_candidate_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_user_id UUID NOT NULL,
  student_user_id UUID NOT NULL,
  stage TEXT NOT NULL DEFAULT 'discovered',
  job_title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_candidate_pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR manage own pipeline" ON public.hr_candidate_pipeline FOR ALL USING (auth.uid() = hr_user_id);

-- Student Badges
CREATE TABLE public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_label TEXT NOT NULL,
  badge_icon TEXT DEFAULT '🏆',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own badges" ON public.student_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System insert badges" ON public.student_badges FOR INSERT WITH CHECK (true);

-- Activity Feed
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read activity" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "System insert activity" ON public.activity_feed FOR INSERT WITH CHECK (true);

-- Market Skill Demand
CREATE TABLE public.market_skill_demand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  demand_score NUMERIC DEFAULT 0,
  sector TEXT,
  weekly_trend NUMERIC DEFAULT 0,
  monthly_trend NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.market_skill_demand ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read skill demand" ON public.market_skill_demand FOR SELECT USING (true);
CREATE POLICY "Admin manage skill demand" ON public.market_skill_demand FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Market Cert Demand
CREATE TABLE public.market_cert_demand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_name TEXT NOT NULL,
  demand_score NUMERIC DEFAULT 0,
  sector TEXT,
  weekly_trend NUMERIC DEFAULT 0,
  monthly_trend NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.market_cert_demand ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cert demand" ON public.market_cert_demand FOR SELECT USING (true);
CREATE POLICY "Admin manage cert demand" ON public.market_cert_demand FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Market Refresh Log
CREATE TABLE public.market_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed',
  jobs_analyzed INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.market_refresh_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read refresh log" ON public.market_refresh_log FOR SELECT USING (true);
CREATE POLICY "Admin manage refresh log" ON public.market_refresh_log FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_requests;
