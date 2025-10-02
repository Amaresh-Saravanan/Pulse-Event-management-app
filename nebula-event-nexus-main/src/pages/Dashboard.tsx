import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMobile } from "@/hooks/useMobile";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CosmicBackground } from "@/components/CosmicBackground";
import { RealtimeClock } from "@/components/RealtimeClock";
import { EventCard } from "@/components/EventCard";
import { LogOut, Plus, Search, User } from "lucide-react";
import { toast } from "sonner";
import { isToday, isFuture, parseISO } from "date-fns";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Mobile hooks
  const { isNative, platform } = useMobile();
  const { isRegistered } = usePushNotifications();

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    setUser(user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.full_name) {
      navigate("/profile");
      return;
    }

    setProfile({ ...profile, role: roleData?.role });
    
    // Fetch my registered events if student
    if (roleData?.role === "student") {
      await fetchMyEvents(user.id);
    }
    
    setLoading(false);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } else {
      setEvents(data || []);
    }
  };

  const fetchMyEvents = async (userId: string) => {
    const { data: rsvpData, error } = await supabase
      .from("rsvps")
      .select("event_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching RSVPs:", error);
      return;
    }

    const eventIds = rsvpData?.map((rsvp) => rsvp.event_id) || [];
    
    if (eventIds.length > 0) {
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds)
        .order("event_date", { ascending: true });
      
      setMyEvents(eventsData || []);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags?.some((tag: string) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  const todayEvents = filteredEvents.filter((event) =>
    isToday(parseISO(event.event_date))
  );

  const upcomingEvents = filteredEvents.filter((event) =>
    isFuture(parseISO(event.event_date)) && !isToday(parseISO(event.event_date))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20">
      <CosmicBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/60 border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-aurora bg-clip-text text-transparent">
              Pulse
            </h1>
            <RealtimeClock />
          </div>
          <div className="flex items-center gap-2">
            {profile?.role === "editor" && (
              <>
                <Button
                  size="sm"
                  onClick={() => navigate("/editor")}
                  className="gap-2"
                >
                  <span className="hidden sm:inline">Editor Dashboard</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/create-event")}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create Event</span>
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate("/account")}>
              <User className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search events, clubs, or categories..."
            className="pl-10 h-12 bg-card/60 backdrop-blur-md border-border/50 focus:border-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Events Tabs */}
      <div className="container mx-auto px-4 relative z-10">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className={`grid w-full max-w-md mx-auto mb-6 ${profile?.role === "student" ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="today">Today ({todayEvents.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingEvents.length})</TabsTrigger>
            {profile?.role === "student" && (
              <TabsTrigger value="my-events">My Events ({myEvents.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {todayEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No events happening today
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayEvents.map((event) => (
                  <EventCard key={event.id} {...event} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No upcoming events
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} {...event} />
                ))}
              </div>
            )}
          </TabsContent>

          {profile?.role === "student" && (
            <TabsContent value="my-events" className="space-y-4">
              {myEvents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  You haven't registered for any events yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myEvents.map((event) => (
                    <EventCard key={event.id} {...event} />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
