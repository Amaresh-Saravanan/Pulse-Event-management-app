-- Step 1: Drop existing policies that depend on profiles.role
DROP POLICY IF EXISTS "Editors can create events" ON public.events;
DROP POLICY IF EXISTS "Editors can update own events" ON public.events;
DROP POLICY IF EXISTS "Editors can delete own events" ON public.events;
DROP POLICY IF EXISTS "Students can create rsvps" ON public.rsvps;
DROP POLICY IF EXISTS "Editors can view all rsvps" ON public.rsvps;

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function
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

-- Step 4: Policy for user_roles table
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Step 5: Migrate existing data
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 6: Drop role column from profiles
ALTER TABLE public.profiles DROP COLUMN role;

-- Step 7: Create new policies using has_role function
CREATE POLICY "Editors can create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can update own events"
ON public.events
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() AND public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can delete own events"
ON public.events
FOR DELETE
TO authenticated
USING (created_by = auth.uid() AND public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Students can create rsvps"
ON public.rsvps
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Editors can view all rsvps"
ON public.rsvps
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'editor'));

-- Step 8: Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;