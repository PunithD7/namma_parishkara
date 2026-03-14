
-- Department contacts table with phone numbers
CREATE TABLE public.department_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department public.department NOT NULL UNIQUE,
  department_name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.department_contacts ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view department contacts
CREATE POLICY "Anyone can view department contacts"
  ON public.department_contacts FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update department contacts
CREATE POLICY "Admins can manage department contacts"
  ON public.department_contacts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed department contacts
INSERT INTO public.department_contacts (department, department_name, phone, email) VALUES
  ('bbmp_roads', 'BBMP Roads Department', '+91-80-22660000', 'roads@bbmp.gov.in'),
  ('waste_management', 'Waste Management Department', '+91-80-22975501', 'waste@bbmp.gov.in'),
  ('bwssb', 'BWSSB Water Supply', '+91-80-22945300', 'complaints@bwssb.gov.in'),
  ('street_lighting', 'Street Lighting Department', '+91-80-22975555', 'streetlight@bescom.co.in');

-- Function to create notifications on issue status change
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  status_label text;
  dept_name text;
  admin_user_ids uuid[];
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get readable status label
  status_label := CASE NEW.status
    WHEN 'reported' THEN 'Reported'
    WHEN 'under_review' THEN 'Under Review'
    WHEN 'in_progress' THEN 'In Progress'
    WHEN 'resolved' THEN 'Resolved'
  END;

  -- Get department name
  SELECT department_name INTO dept_name
    FROM public.department_contacts
    WHERE department = NEW.department;

  -- Notify the citizen who reported the issue
  INSERT INTO public.notifications (user_id, issue_id, title, message)
  VALUES (
    NEW.user_id,
    NEW.id,
    'Issue Status Updated: ' || status_label,
    'Your complaint ' || NEW.complaint_id || ' (' || NEW.title || ') has been updated to "' || status_label || '" by ' || COALESCE(dept_name, NEW.department::text) || '.'
  );

  -- Notify all admin users for this department
  SELECT array_agg(user_id) INTO admin_user_ids
    FROM public.user_roles
    WHERE role = 'admin'
      AND (department = NEW.department OR department IS NULL);

  IF admin_user_ids IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, issue_id, title, message)
    SELECT
      uid,
      NEW.id,
      'Issue ' || status_label || ': ' || NEW.complaint_id,
      'Complaint ' || NEW.complaint_id || ' (' || NEW.title || ') status changed to "' || status_label || '". Contact: ' || COALESCE(
        (SELECT phone FROM public.department_contacts WHERE department = NEW.department), 'N/A'
      )
    FROM unnest(admin_user_ids) AS uid;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on issue status update
CREATE TRIGGER trigger_notify_on_status_change
  AFTER UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_status_change();

-- Also notify department admins when a NEW issue is reported
CREATE OR REPLACE FUNCTION public.notify_on_new_issue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  dept_name text;
  dept_phone text;
  admin_user_ids uuid[];
BEGIN
  -- Get department info
  SELECT department_name, phone INTO dept_name, dept_phone
    FROM public.department_contacts
    WHERE department = NEW.department;

  -- Notify citizen of successful submission
  INSERT INTO public.notifications (user_id, issue_id, title, message)
  VALUES (
    NEW.user_id,
    NEW.id,
    'Issue Reported Successfully',
    'Your complaint ' || NEW.complaint_id || ' has been submitted and routed to ' || COALESCE(dept_name, NEW.department::text) || '. Department contact: ' || COALESCE(dept_phone, 'N/A') || '. You will be notified of updates.'
  );

  -- Notify admins
  SELECT array_agg(user_id) INTO admin_user_ids
    FROM public.user_roles
    WHERE role = 'admin'
      AND (department = NEW.department OR department IS NULL);

  IF admin_user_ids IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, issue_id, title, message)
    SELECT
      uid,
      NEW.id,
      '🚨 New Issue: ' || NEW.title,
      'New ' || NEW.issue_type::text || ' complaint (' || NEW.complaint_id || ') reported. Severity: ' || NEW.severity::text || '. Address: ' || COALESCE(NEW.address, 'Not provided') || '. Department phone: ' || COALESCE(dept_phone, 'N/A')
    FROM unnest(admin_user_ids) AS uid;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_new_issue
  AFTER INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_issue();

-- Enable realtime for notifications and issues
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
