import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    event_date: "",
    time_start: "",
    time_end: "",
    location: "",
    max_participants: "",
    amount_to_pay: "",
    image_url: "",
  });

  useEffect(() => {
    checkEditorRoleAndLoadEvent();
  }, [id]);

  const checkEditorRoleAndLoadEvent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role !== "editor") {
      toast.error("Only editors can edit events");
      navigate("/home");
      return;
    }

    // Load event data
    const { data: eventData, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .maybeSingle();

    if (error || !eventData) {
      toast.error("Event not found or you don't have permission to edit it");
      navigate("/editor");
      return;
    }

    setFormData({
      title: eventData.title || "",
      description: eventData.description || "",
      category: eventData.category || "",
      tags: eventData.tags ? eventData.tags.join(", ") : "",
      event_date: eventData.event_date || "",
      time_start: eventData.time_start || "",
      time_end: eventData.time_end || "",
      location: eventData.location || "",
      max_participants: eventData.max_participants?.toString() || "",
      amount_to_pay: eventData.amount_to_pay?.toString() || "",
      image_url: eventData.image_url || "",
    });

    setLoadingEvent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.event_date || !formData.time_start || 
        !formData.time_end || !formData.location || !formData.max_participants) {
      toast.error("⚠️ Please fill in all required fields before continuing.");
      return;
    }

    const selectedDate = new Date(formData.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error("Event date cannot be in the past");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("events")
        .update({
          title: formData.title,
          description: formData.description || null,
          category: formData.category || null,
          tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
          event_date: formData.event_date,
          time_start: formData.time_start,
          time_end: formData.time_end,
          location: formData.location,
          max_participants: parseInt(formData.max_participants),
          amount_to_pay: formData.amount_to_pay ? parseFloat(formData.amount_to_pay) : 0,
          image_url: formData.image_url || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Event updated successfully!");
      navigate("/editor");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CosmicBackground />
        <div className="text-primary text-xl relative z-10">Loading event...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20">
      <CosmicBackground />
      
      <div className="container mx-auto px-4 py-6 relative z-10 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/editor")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="backdrop-blur-md bg-card/40 border-border/50 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-aurora bg-clip-text text-transparent">
              Edit Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Workshop, Seminar, Fest"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="Comma-separated"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">Event Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time_start">Start Time *</Label>
                  <Input
                    id="time_start"
                    type="time"
                    required
                    value={formData.time_start}
                    onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_end">End Time *</Label>
                  <Input
                    id="time_end"
                    type="time"
                    required
                    value={formData.time_end}
                    onChange={(e) => setFormData({ ...formData, time_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_participants">Max Participants *</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="1"
                    required
                    value={formData.max_participants}
                    onChange={(e) =>
                      setFormData({ ...formData, max_participants: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount_to_pay">Registration Fee (₹)</Label>
                  <Input
                    id="amount_to_pay"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount_to_pay}
                    onChange={(e) =>
                      setFormData({ ...formData, amount_to_pay: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Event Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating Event..." : "Update Event"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
