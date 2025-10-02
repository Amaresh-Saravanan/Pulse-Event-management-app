import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ArrowLeft, User, Mail, GraduationCap, Calendar, MapPin, Languages } from "lucide-react";

export default function Account() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditor, setIsEditor] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Check if user is an editor
    const { data: hasEditorRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'editor',
    });

    setIsEditor(hasEditorRole || false);
    setProfile(data);
    setLoading(false);
  };

  const handleBackToDashboard = () => {
    navigate(isEditor ? "/editor-dashboard" : "/home");
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="container mx-auto px-4 py-6 relative z-10 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToDashboard}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="backdrop-blur-md bg-card/40 border-border/50 animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl bg-gradient-aurora bg-clip-text text-transparent">
                My Profile
              </CardTitle>
              <Badge variant={profile.role === "editor" ? "default" : "secondary"}>
                {profile.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <div className="font-medium">Full Name</div>
                <div className="text-sm text-muted-foreground">{profile.full_name}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <div className="font-medium">Email</div>
                <div className="text-sm text-muted-foreground">{profile.email}</div>
              </div>
            </div>

            {profile.university_name && (
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium">University</div>
                  <div className="text-sm text-muted-foreground">{profile.university_name}</div>
                </div>
              </div>
            )}

            {profile.university_location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-sm text-muted-foreground">{profile.university_location}</div>
                </div>
              </div>
            )}

            {profile.degree_program && (
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium">Degree Program</div>
                  <div className="text-sm text-muted-foreground">{profile.degree_program}</div>
                </div>
              </div>
            )}

            {profile.year_of_study && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium">Year of Study</div>
                  <div className="text-sm text-muted-foreground">{profile.year_of_study}</div>
                </div>
              </div>
            )}

            {profile.graduation_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium">Expected Graduation</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(profile.graduation_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {profile.language_proficiency && profile.language_proficiency.length > 0 && (
              <div className="flex items-start gap-3">
                <Languages className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium">Languages</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.language_proficiency.map((lang: string) => (
                      <Badge key={lang} variant="outline">{lang}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
