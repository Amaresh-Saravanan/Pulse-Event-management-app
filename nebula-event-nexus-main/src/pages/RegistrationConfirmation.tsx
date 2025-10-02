import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { CheckCircle, Calendar, Clock, MapPin, IndianRupee } from "lucide-react";

interface Event {
  id: string;
  title: string;
  event_date: string;
  time_start: string;
  time_end: string;
  location: string;
  amount_to_pay: number;
}

const RegistrationConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const eventId = searchParams.get("eventId");

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error || !data) {
        navigate("/");
        return;
      }

      setEvent(data);
      setLoading(false);
    };

    fetchEvent();
  }, [eventId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <CosmicBackground />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />
      <div className="container relative z-10 py-8 px-4 max-w-2xl mx-auto">
        <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-20 w-20 text-green-500 animate-scale-in" />
            </div>
            <CardTitle className="text-3xl mb-2">Registration Successful!</CardTitle>
            <p className="text-muted-foreground">
              You have successfully registered for this event
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">{event.title}</h2>
              
              <div className="space-y-3 text-foreground/90">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>{new Date(event.event_date).toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{event.time_start} - {event.time_end}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{event.location}</span>
                </div>
                
                {event.amount_to_pay > 0 && (
                  <div className="flex items-center gap-3">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    <span className="font-semibold">₹{event.amount_to_pay}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground/80">
                📱 You will receive an SMS confirmation shortly and a reminder one day before the event.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/")}
                className="flex-1"
              >
                Back to Home
              </Button>
              <Button
                onClick={() => navigate(`/event/${event.id}`)}
                variant="outline"
                className="flex-1"
              >
                View Event Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationConfirmation;
