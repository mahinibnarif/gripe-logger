-- Drop old foreign key that references auth.users
ALTER TABLE public.complaints
DROP CONSTRAINT complaints_student_id_fkey;

-- Add new foreign key that references profiles
ALTER TABLE public.complaints
ADD CONSTRAINT complaints_student_id_fkey
FOREIGN KEY (student_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add RLS policy for students to delete their own complaints
CREATE POLICY "Students can delete own complaints"
ON public.complaints
FOR DELETE
USING (auth.uid() = student_id);