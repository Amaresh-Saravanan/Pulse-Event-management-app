-- Update the handle_new_user function to automatically assign roles based on email domain
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role user_role;
BEGIN
  -- Check if email ends with @srmist.edu.in
  IF NEW.email LIKE '%@srmist.edu.in' THEN
    user_role := 'editor';
  ELSE
    user_role := 'student';
  END IF;

  -- Insert into profiles table
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Insert into user_roles table with determined role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$function$;