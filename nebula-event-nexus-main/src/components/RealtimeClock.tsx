import { useState, useEffect } from "react";
import { format } from "date-fns";

export const RealtimeClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-sm text-muted-foreground font-mono">
      {format(currentTime, "dd/MM/yyyy HH:mm")}
    </div>
  );
};
