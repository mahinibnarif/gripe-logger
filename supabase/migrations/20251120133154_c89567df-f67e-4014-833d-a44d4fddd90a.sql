-- Add priority field to complaints table
ALTER TABLE complaints ADD COLUMN priority text NOT NULL DEFAULT 'medium';

-- Create complaint_comments table for discussion threads
CREATE TABLE public.complaint_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on complaint_comments
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;

-- Students and admins can view comments on complaints they can access
CREATE POLICY "Users can view comments on accessible complaints"
ON public.complaint_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM complaints
    WHERE complaints.id = complaint_comments.complaint_id
    AND (
      complaints.student_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- Students can add comments to their own complaints
CREATE POLICY "Students can add comments to own complaints"
ON public.complaint_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM complaints
    WHERE complaints.id = complaint_comments.complaint_id
    AND complaints.student_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Admins can add comments to any complaint
CREATE POLICY "Admins can add comments"
ON public.complaint_comments
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id = auth.uid()
);

-- Create complaint_attachments table
CREATE TABLE public.complaint_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  content_type text NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on complaint_attachments
ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments on complaints they can access
CREATE POLICY "Users can view attachments on accessible complaints"
ON public.complaint_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM complaints
    WHERE complaints.id = complaint_attachments.complaint_id
    AND (
      complaints.student_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- Students can add attachments to their own complaints
CREATE POLICY "Students can add attachments to own complaints"
ON public.complaint_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM complaints
    WHERE complaints.id = complaint_attachments.complaint_id
    AND complaints.student_id = auth.uid()
  )
  AND uploaded_by = auth.uid()
);

-- Students can delete their own attachments
CREATE POLICY "Students can delete own attachments"
ON public.complaint_attachments
FOR DELETE
USING (uploaded_by = auth.uid());

-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('complaint-attachments', 'complaint-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for complaint attachments
CREATE POLICY "Users can view attachments they have access to"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'complaint-attachments'
  AND (
    -- Check if user is the complaint owner or admin
    EXISTS (
      SELECT 1 FROM complaint_attachments ca
      JOIN complaints c ON c.id = ca.complaint_id
      WHERE ca.file_path = storage.objects.name
      AND (
        c.student_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
  )
);

CREATE POLICY "Users can upload attachments to their complaints"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'complaint-attachments'
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'complaint-attachments'
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Add trigger for updated_at on complaint_comments
CREATE TRIGGER update_complaint_comments_updated_at
BEFORE UPDATE ON public.complaint_comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();