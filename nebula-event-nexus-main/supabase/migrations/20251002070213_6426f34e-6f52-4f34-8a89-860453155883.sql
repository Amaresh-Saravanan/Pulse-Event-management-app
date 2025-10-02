-- Fix search_path for existing trigger functions
CREATE OR REPLACE FUNCTION public.increment_event_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET current_participants = current_participants + 1
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_event_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET current_participants = current_participants - 1
  WHERE id = OLD.event_id;
  RETURN OLD;
END;
$$;