import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CosmicBackground } from "@/components/CosmicBackground";
import { RealtimeClock } from "@/components/RealtimeClock";
import { Plus, Edit, Trash2, Users, Calendar, LogOut } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  time_start: string;
  time_end: string;
  location: string;
  max_participants: number;
  current_participants: number;
  image_url: string | null;
  category: string | null;
}
export default function EditorDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  useEffect(() => {
    checkEditorRole();
    fetchMyEvents();
  }, []);
  const checkEditorRole = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    const {
      data: hasEditorRole,
      error: roleError
    } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'editor'
    });
    if (roleError || !hasEditorRole) {
      toast.error("Access denied: Editor role required");
      navigate("/home");
    }
  };
  const fetchMyEvents = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from("events").select("*").eq("created_by", user.id).order("event_date", {
        ascending: true
      });
      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error("Failed to load events");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const {
        error
      } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;
      toast.success("Event deleted successfully");
      setEvents(events.filter(e => e.id !== eventId));
      setDeleteEventId(null);
    } catch (error: any) {
      toast.error("Failed to delete event");
      console.error(error);
    }
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  return <div className="min-h-screen relative pb-20">
      <CosmicBackground />
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-aurora bg-clip-text text-transparent mb-2">Editors Dashboard</h1>
            <RealtimeClock />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/account")}>
              Account
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Button onClick={() => navigate("/create-event")} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create New Event
          </Button>
        </div>

        {loading ? <p className="text-center text-muted-foreground">Loading events...</p> : events.length === 0 ? <Card className="backdrop-blur-md bg-card/40 border-border/50">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first event to get started
              </p>
              <Button onClick={() => navigate("/create-event")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </CardContent>
          </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => <Card key={event.id} className="backdrop-blur-md bg-card/40 border-border/50 hover:border-primary/50 transition-all animate-fade-in">
                {event.image_url && <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                  </div>}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {event.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.event_date).toLocaleDateString()} • {event.time_start} - {event.time_end}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {event.current_participants} / {event.max_participants} participants
                  </div>
                  {event.category && <div className="inline-block px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">
                      {event.category}
                    </div>}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/edit-event/${event.id}`)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteEventId(event.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>

      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
              All RSVPs will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEventId && handleDeleteEvent(deleteEventId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}