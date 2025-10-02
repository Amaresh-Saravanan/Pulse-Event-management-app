import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { MobileFeatures } from "@/components/MobileFeatures";

interface EventCardProps {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  event_date: string;
  time_start: string;
  location: string;
  current_participants: number;
  max_participants: number;
  image_url: string | null;
}

export const EventCard = ({
  id,
  title,
  description,
  category,
  event_date,
  time_start,
  location,
  current_participants,
  max_participants,
  image_url,
}: EventCardProps) => {
  const navigate = useNavigate();
  const isFull = current_participants >= max_participants;

  return (
    <Card
      className="group cursor-pointer overflow-hidden backdrop-blur-md bg-card/40 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 animate-fade-in"
      onClick={() => navigate(`/event/${id}`)}
    >
      <div className="relative h-40 overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-cosmic" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        {category && (
          <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm">
            {category}
          </Badge>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            <span>
              {format(new Date(event_date), "MMM dd, yyyy")} at {time_start}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <span>
              {current_participants} / {max_participants} participants
              {isFull && <Badge variant="destructive" className="ml-2">Full</Badge>}
            </span>
          </div>
        </div>
        
        {/* Mobile-specific features */}
        <div className="pt-2 border-t border-border/50">
          <MobileFeatures
            shareData={{
              title: title,
              text: `Check out this event: ${title}`,
              url: `${window.location.origin}/event/${id}`
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
