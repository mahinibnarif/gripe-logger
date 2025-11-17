-- Add assigned_to column to complaints table
ALTER TABLE public.complaints 
ADD COLUMN assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_complaints_assigned_to ON public.complaints(assigned_to);

-- Update RLS policy to allow admins to see assigned complaints
CREATE POLICY "Admins can view assigned complaints"
ON public.complaints
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  (assigned_to = auth.uid() OR assigned_to IS NULL OR has_role(auth.uid(), 'admin'::app_role))
);