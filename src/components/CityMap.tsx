import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Tables } from "@/integrations/supabase/types";

const severityToColor: Record<string, string> = {
  low: "#2d8a4e",
  medium: "#d4a843",
  high: "#ef4444",
  critical: "#dc2626",
};

const statusToColor: Record<string, string> = {
  reported: "#f97316",
  under_review: "#3b82f6",
  in_progress: "#eab308",
  resolved: "#22c55e",
};

interface CityMapProps {
  issues: Tables<"issues">[];
  height?: string;
  onIssueClick?: (issue: Tables<"issues">) => void;
  colorBy?: "severity" | "status";
}

const CityMap = ({ issues, height = "500px", onIssueClick, colorBy = "severity" }: CityMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView([12.9716, 77.5946], 12);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    issues.forEach((issue) => {
      const color = colorBy === "severity"
        ? severityToColor[issue.severity] || "#6b7280"
        : statusToColor[issue.status] || "#6b7280";

      const marker = L.circleMarker([issue.latitude, issue.longitude], {
        radius: issue.severity === "critical" ? 12 : issue.severity === "high" ? 10 : 8,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(map);

      const issueTypeLabel: Record<string, string> = {
        pothole: "Pothole",
        garbage: "Garbage",
        water_leakage: "Water Leakage",
        broken_streetlight: "Broken Streetlight",
      };

      marker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 180px;">
          <h3 style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${issue.title}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${issueTypeLabel[issue.issue_type]}</p>
          <p style="font-size: 11px; margin-bottom: 2px;"><b>Severity:</b> ${issue.severity.toUpperCase()}</p>
          <p style="font-size: 11px; margin-bottom: 2px;"><b>Status:</b> ${issue.status.replace("_", " ")}</p>
          <p style="font-size: 11px; color: #999;">${issue.complaint_id}</p>
        </div>
      `);

      if (onIssueClick) {
        marker.on("click", () => onIssueClick(issue));
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [issues, colorBy, onIssueClick]);

  return <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-xl overflow-hidden border" />;
};

export default CityMap;
