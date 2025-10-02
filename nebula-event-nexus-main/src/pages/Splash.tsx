import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CosmicBackground } from "@/components/CosmicBackground";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <CosmicBackground />
      <div className="relative z-10 text-center animate-fade-in">
        <h1 className="text-7xl md:text-9xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Pulse
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground">
          Where Ideas Meet Action
        </p>
      </div>
    </div>
  );
};

export default Splash;
