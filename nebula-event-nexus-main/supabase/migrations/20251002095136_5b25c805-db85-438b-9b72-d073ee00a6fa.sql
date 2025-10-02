-- Add phone_number field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone_number text;

-- Add a check constraint to ensure phone_number format (optional but recommended)
ALTER TABLE public.profiles 
ADD CONSTRAINT phone_number_format CHECK (phone_number ~ '^\+?[1-9]\d{1,14}$' OR phone_number IS NULL);

-- Comment on the column
COMMENT ON COLUMN public.profiles.phone_number IS 'Student mobile number for SMS notifications';