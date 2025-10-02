import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ArrowLeft, Calendar, Clock, MapPin, Users, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchEventAndProfile();
  }, [id]);

  const fetchEventAndProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    setProfile({ ...profileData, role: roleData?.role });

    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    setEvent(eventData);

    if (roleData?.role === "student") {
      const { data: rsvpData } = await supabase
        .from("rsvps")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_id", id)
        .maybeSingle();

      setHasRegistered(!!rsvpData);
    }

    setLoading(false);
  };

  const handleRegister = async () => {
    if (!profile || profile.role !== "student") {
      toast.error("Only students can register for events");
      return;
    }

    if (event.current_participants >= event.max_participants) {
      toast.error("This event is full");
      return;
    }

    setRegistering(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase.from("rsvps").insert({
        user_id: user.id,
        event_id: event.id,
        email: profile.email,
      });

      if (error) throw error;

      // Send SMS confirmation
      if (profile.phone_number) {
        try {
          await supabase.functions.invoke("send-sms", {
            body: {
              to: profile.phone_number,
              message: `✅ You are registered for ${event.title} on ${format(new Date(event.event_date), "MMMM dd, yyyy")} at ${event.time_start}. See you there!`,
            },
          });
        } catch (smsError) {
          console.error("SMS error:", smsError);
          // Don't fail registration if SMS fails
        }
      }

      // Navigate to confirmation page
      navigate(`/registration-confirmation?eventId=${event.id}`);
    } catch (error: any) {
      toast.error(error.message);
      setRegistering(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  const isFull = event.current_participants >= event.max_participants;
  const canRegister = profile?.role === "student" && !hasRegistered && !isFull;

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="container mx-auto px-4 py-6 relative z-10 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/home")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        <Card className="backdrop-blur-md bg-card/40 border-border/50 overflow-hidden animate-fade-in">
          {/* Event Image */}
          <div className="relative h-64 md:h-96 overflow-hidden">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-cosmic" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Title and Category */}
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {event.category && <Badge>{event.category}</Badge>}
                {event.tags?.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              {event.description && (
                <p className="text-muted-foreground">{event.description}</p>
              )}
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium">Date</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(event.event_date), "EEEE, MMMM dd, yyyy")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium">Time</div>
                  <div className="text-sm text-muted-foreground">
                    {event.time_start} - {event.time_end}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-sm text-muted-foreground">{event.location}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium">Participants</div>
                  <div className="text-sm text-muted-foreground">
                    {event.current_participants} / {event.max_participants}
                    {isFull && <Badge variant="destructive" className="ml-2">Full</Badge>}
                  </div>
                </div>
              </div>

              {event.amount_to_pay > 0 && (
                <div className="flex items-start gap-3">
                  <IndianRupee className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <div className="font-medium">Registration Fee</div>
                    <div className="text-sm text-muted-foreground">
                      ₹{event.amount_to_pay}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Register Button */}
            {profile?.role === "student" && (
              <div className="pt-4">
                {hasRegistered ? (
                  <Button disabled className="w-full" size="lg">
                    Already Registered ✓
                  </Button>
                ) : (
                  <Button
                    onClick={handleRegister}
                    disabled={!canRegister || registering}
                    className="w-full"
                    size="lg"
                  >
                    {registering
                      ? "Registering..."
                      : isFull
                      ? "Event Full"
                      : "Register for Event"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
