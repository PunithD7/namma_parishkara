
-- Allow citizens to delete their own issues
CREATE POLICY "Citizens can delete own issues"
ON public.issues
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to delete any issue
CREATE POLICY "Admins can delete any issue"
ON public.issues
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow deleting related notifications when issue is deleted
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any notification"
ON public.notifications
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
