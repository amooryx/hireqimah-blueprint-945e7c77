
-- Add type column to job_postings
DO $$ BEGIN
  CREATE TYPE public.job_posting_type AS ENUM ('job', 'internship');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.job_postings 
  ADD COLUMN IF NOT EXISTS type public.job_posting_type NOT NULL DEFAULT 'job';

-- Create applications table
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  job_posting_id uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'applied',
  cover_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_user_id, job_posting_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Students view own applications
CREATE POLICY "Students view own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = student_user_id);

-- Students create own applications (only for active postings)
CREATE POLICY "Students create own applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    auth.uid() = student_user_id
    AND EXISTS (
      SELECT 1 FROM public.job_postings jp
      WHERE jp.id = job_posting_id AND jp.is_active = true
    )
  );

-- HR view applications for their postings
CREATE POLICY "HR view applications for own postings"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      WHERE jp.id = applications.job_posting_id AND jp.hr_user_id = auth.uid()
    )
  );

-- HR update application status for their postings
CREATE POLICY "HR update applications for own postings"
  ON public.applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      WHERE jp.id = applications.job_posting_id AND jp.hr_user_id = auth.uid()
    )
  );

-- Admins view all applications
CREATE POLICY "Admins view all applications"
  ON public.applications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for applications
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
