## Database Fix Instructions

The authentication issue is caused by an outdated database trigger. You need to execute this SQL in your Supabase dashboard:

## Steps:
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: https://rpgoxykmnxmbeflisean.supabase.co
3. Go to SQL Editor
4. Execute the following SQL:

```sql
-- First, ensure the user_role enum type exists
CREATE TYPE user_role AS ENUM ('student', 'editor');

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_roles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles' 
    AND policyname = 'Users can view own roles'
  ) THEN
    CREATE POLICY "Users can view own roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create has_role function if it doesn't exist
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fix the handle_new_user trigger to work with the current database schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role_val user_role;
BEGIN
  -- Check if email ends with @srmist.edu.in
  IF NEW.email LIKE '%@srmist.edu.in' THEN
    user_role_val := 'editor';
  ELSE
    user_role_val := 'student';
  END IF;

  -- Insert into profiles table (without role column)
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Insert into user_roles table with determined role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_val);
  
  RETURN NEW;
END;
$function$;
```

## What this fixes:
- The trigger was trying to insert into a `role` column that no longer exists in the profiles table
- Roles are now stored in a separate `user_roles` table
- This ensures new user accounts are created properly with the correct database structure

After running this SQL, try creating a new account - it should work correctly.
