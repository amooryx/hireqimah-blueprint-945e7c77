
-- Create market_role_demand table
CREATE TABLE IF NOT EXISTS public.market_role_demand (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_title text NOT NULL,
  demand_score numeric DEFAULT 0,
  sector text,
  weekly_trend numeric DEFAULT 0,
  monthly_trend numeric DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.market_role_demand ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read role demand" ON public.market_role_demand FOR SELECT USING (true);
CREATE POLICY "Admin manage role demand" ON public.market_role_demand FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
