# 🚀 Supabase Connection Guide

## Step 1: Get Your Credentials

1. Go to: https://supabase.com/dashboard/project/ctdiqeuvzmfbutrnpnup
2. Navigate to **Settings** → **API**
3. Copy these values:
   - **Project URL**: `https://ctdiqeuvzmfbutrnpnup.supabase.co`
   - **Anon/Public Key**: (starts with `eyJhbGciOiJIUzI1NiIs...`)

## Step 2: Update Environment File

Replace the content in `.env` with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ctdiqeuvzmfbutrnpnup.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ACTUAL_ANON_KEY_HERE
```

## Step 3: Set Up Database Tables

1. Go to: https://supabase.com/dashboard/project/ctdiqeuvzmfbutrnpnup/sql
2. Run these SQL commands in order:

### Migration 1: Basic Setup
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'editor');

-- Create enum for year of study
CREATE TYPE year_of_study AS ENUM ('1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate');

-- Create users/profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT,
  university_name TEXT,
  university_location TEXT,
  degree_program TEXT,
  year_of_study year_of_study,
  graduation_date DATE,
  language_proficiency TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Migration 2: Events Table
```sql
-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  event_date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  location TEXT NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 0,
  current_participants INTEGER NOT NULL DEFAULT 0,
  amount_to_pay DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT positive_participants CHECK (current_participants >= 0 AND current_participants <= max_participants)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Editors can create events"
  ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'editor'
    )
  );
```

### Migration 3: RSVPs Table
```sql
-- Create RSVPs table
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- Create triggers for participant counting
CREATE OR REPLACE FUNCTION increment_event_participants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET current_participants = current_participants + 1
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_rsvp_created
  AFTER INSERT ON public.rsvps
  FOR EACH ROW
  EXECUTE FUNCTION increment_event_participants();
```

## Step 4: Test Connection

After updating the `.env` file, restart your development server:

```bash
npm run dev
```

The app should now connect to your Supabase database!

## 🎯 What This Gives You

- **User Authentication**: Sign up/sign in functionality
- **User Profiles**: Student and editor roles
- **Event Management**: Create, edit, delete events
- **Event Registration**: RSVP system
- **Real-time Updates**: Live participant counts

## 🔧 Troubleshooting

If you get connection errors:
1. Double-check your anon key in `.env`
2. Make sure RLS policies are set up correctly
3. Check the browser console for specific error messages

