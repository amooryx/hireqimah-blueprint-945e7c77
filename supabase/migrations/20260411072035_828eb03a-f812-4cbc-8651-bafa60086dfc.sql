
DROP POLICY "Authenticated insert notifications" ON public.notifications;
CREATE POLICY "Authenticated insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY "System insert badges" ON public.student_badges;
CREATE POLICY "Authenticated insert badges" ON public.student_badges FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY "System insert activity" ON public.activity_feed;
CREATE POLICY "Authenticated insert activity" ON public.activity_feed FOR INSERT TO authenticated WITH CHECK (true);
