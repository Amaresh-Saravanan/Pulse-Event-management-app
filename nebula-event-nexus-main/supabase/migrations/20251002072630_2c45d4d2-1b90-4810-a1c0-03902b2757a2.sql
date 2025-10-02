-- Update the role for the current user (chikash@gmail.com) from student to editor
UPDATE public.user_roles 
SET role = 'editor'
WHERE user_id = '7bc1c723-9331-4248-83e4-80bcf2514da0' AND role = 'student';