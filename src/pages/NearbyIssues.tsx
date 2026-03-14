import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import IssueCard from "@/components/IssueCard";
import CityMap from "@/components/CityMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Radar, List, Map, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const NearbyIssues = () => {
  const [allIssues, setAllIssues] = useState<Tables<"issues">[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(2); // km
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase.from("issues").select("*").order("created_at", { ascending: false });
      setAllIssues(data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocationError("Unable to get location. Please allow location access.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const nearbyIssues = userLocation
    ? allIssues
        .map((issue) => ({
          ...issue,
          distance: getDistanceKm(userLocation.lat, userLocation.lng, issue.latitude, issue.longitude),
        }))
        .filter((i) => i.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
    : [];

  const stats = {
    total: nearbyIssues.length,
    critical: nearbyIssues.filter((i) => i.severity === "critical" || i.severity === "high").length,
    pending: nearbyIssues.filter((i) => i.status !== "resolved").length,
    resolved: nearbyIssues.filter((i) => i.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2">
              <Radar className="w-7 h-7 text-primary" /> Nearby Issues
            </h1>
            <p className="text-muted-foreground text-sm">
              Issues reported within {radius} km of your current location
            </p>
          </div>
          <Button variant="outline" onClick={detectLocation} disabled={locating} className="gap-2">
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {locating ? "Detecting..." : "Update Location"}
          </Button>
        </div>

        {/* Location & Radius Control */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                {userLocation ? (
                  <span className="text-muted-foreground">
                    Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </span>
                ) : locationError ? (
                  <span className="text-destructive">{locationError}</span>
                ) : (
                  <span className="text-muted-foreground">Detecting location...</span>
                )}
              </div>
              <div className="flex-1 flex items-center gap-4">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Radius:</span>
                <Slider
                  value={[radius]}
                  onValueChange={(v) => setRadius(v[0])}
                  min={0.5}
                  max={10}
                  step={0.5}
                  className="flex-1"
                />
                <Badge variant="secondary" className="whitespace-nowrap">{radius} km</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {userLocation && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Nearby Issues", value: stats.total, color: "text-primary" },
              { label: "High Priority", value: stats.critical, color: "text-destructive" },
              { label: "Pending", value: stats.pending, color: "text-civic-orange" },
              { label: "Resolved", value: stats.resolved, color: "text-success" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="stat-card text-center">
                  <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading || locating ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !userLocation ? (
          <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-xl mb-2">Location Required</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Allow location access to see civic issues reported near you.
            </p>
            <Button onClick={detectLocation}>Enable Location</Button>
          </motion.div>
        ) : nearbyIssues.length === 0 ? (
          <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Radar className="w-10 h-10 text-success" />
            </div>
            <h3 className="font-display font-semibold text-xl mb-2">No issues nearby</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              No civic issues found within {radius} km. Try increasing the radius.
            </p>
          </motion.div>
        ) : (
          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list" className="gap-1.5"><List className="w-4 h-4" />List</TabsTrigger>
              <TabsTrigger value="map" className="gap-1.5"><Map className="w-4 h-4" />Map</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyIssues.map((issue, i) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className="relative">
                      <Badge className="absolute top-2 right-2 z-10 bg-primary/90 text-primary-foreground text-[10px]">
                        {issue.distance.toFixed(1)} km away
                      </Badge>
                      <IssueCard issue={issue} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="map">
              <Card>
                <CardContent className="p-4">
                  <CityMap issues={nearbyIssues} height="500px" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default NearbyIssues;
