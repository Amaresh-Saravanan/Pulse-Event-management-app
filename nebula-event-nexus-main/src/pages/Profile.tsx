import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CosmicBackground } from "@/components/CosmicBackground";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    university_name: "",
    university_location: "",
    degree_program: "",
    year_of_study: "",
    graduation_date: "",
    language_proficiency: "",
    phone_number: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) {
        navigate("/home");
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          university_name: formData.university_name,
          university_location: formData.university_location,
          degree_program: formData.degree_program,
          year_of_study: formData.year_of_study as "1st Year" | "2nd Year" | "3rd Year" | "4th Year" | "Graduate",
          graduation_date: formData.graduation_date || null,
          language_proficiency: formData.language_proficiency
            ? formData.language_proficiency.split(",").map(l => l.trim())
            : [],
          phone_number: formData.phone_number,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile created successfully!");
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <CosmicBackground />
      <Card className="w-full max-w-2xl backdrop-blur-md bg-card/40 border-border/50 shadow-2xl z-10 animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-aurora bg-clip-text text-transparent">
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            Tell us about yourself to get started with Pulse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university_name">University Name *</Label>
                <Input
                  id="university_name"
                  required
                  value={formData.university_name}
                  onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="university_location">Location *</Label>
                <Input
                  id="university_location"
                  placeholder="City, Country"
                  required
                  value={formData.university_location}
                  onChange={(e) =>
                    setFormData({ ...formData, university_location: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="degree_program">Degree Program *</Label>
              <Input
                id="degree_program"
                placeholder="e.g., B.S. in Computer Science"
                required
                value={formData.degree_program}
                onChange={(e) => setFormData({ ...formData, degree_program: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year_of_study">Year of Study *</Label>
                <Select
                  value={formData.year_of_study}
                  onValueChange={(value) => setFormData({ ...formData, year_of_study: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                    <SelectItem value="Graduate">Graduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduation_date">Expected Graduation</Label>
                <Input
                  id="graduation_date"
                  type="date"
                  value={formData.graduation_date}
                  onChange={(e) =>
                    setFormData({ ...formData, graduation_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language_proficiency">Language Proficiency</Label>
              <Input
                id="language_proficiency"
                placeholder="e.g., English, Spanish, French (comma-separated)"
                value={formData.language_proficiency}
                onChange={(e) =>
                  setFormData({ ...formData, language_proficiency: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Mobile Number *</Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                required
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
