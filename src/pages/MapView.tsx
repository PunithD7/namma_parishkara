import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import CityMap from "@/components/CityMap";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const MapView = () => {
  const [issues, setIssues] = useState<Tables<"issues">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("issues").select("*").order("created_at", { ascending: false });
      setIssues(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">City Issue Map</h1>
            <p className="text-muted-foreground">All reported issues across Bengaluru</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-civic-red/10 text-civic-red border-civic-red/30">High</Badge>
            <Badge className="bg-civic-orange/10 text-civic-orange border-civic-orange/30">Medium</Badge>
            <Badge className="bg-civic-green/10 text-civic-green border-civic-green/30">Low/Resolved</Badge>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <CityMap issues={issues} height="calc(100vh - 200px)" />
        )}
      </div>
    </div>
  );
};

export default MapView;
