
-- Fix permissive INSERT policy on notifications - restrict to system/service role or issue owners
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Fix function search path for get_department_for_issue
CREATE OR REPLACE FUNCTION public.get_department_for_issue(type issue_type)
RETURNS department
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE type
    WHEN 'pothole' THEN 'bbmp_roads'::department
    WHEN 'garbage' THEN 'waste_management'::department
    WHEN 'water_leakage' THEN 'bwssb'::department
    WHEN 'broken_streetlight' THEN 'street_lighting'::department
  END
$$;
