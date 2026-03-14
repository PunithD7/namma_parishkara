import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Sparkles } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const statusColors: Record<string, string> = {
  reported: "bg-civic-orange/10 text-civic-orange border-civic-orange/30",
  under_review: "bg-accent/10 text-accent border-accent/30",
  in_progress: "bg-warning/10 text-warning border-warning/30",
  resolved: "bg-success/10 text-success border-success/30",
};

const severityColors: Record<string, string> = {
  low: "severity-low",
  medium: "severity-medium",
  high: "severity-high",
  critical: "severity-critical",
};

interface IssueCardProps {
  issue: Tables<"issues">;
  onClick?: () => void;
}

const IssueCard = ({ issue, onClick }: IssueCardProps) => {
  const { t } = useTranslation();

  const issueTypeLabels: Record<string, string> = {
    pothole: t("issueCard.pothole"),
    garbage: t("issueCard.garbage"),
    water_leakage: t("issueCard.water_leakage"),
    broken_streetlight: t("issueCard.broken_streetlight"),
  };

  const departmentLabels: Record<string, string> = {
    bbmp_roads: t("departments.bbmp_roads"),
    waste_management: t("departments.waste_management"),
    bwssb: t("departments.bwssb"),
    street_lighting: t("departments.street_lighting"),
  };

  const statusLabels: Record<string, string> = {
    reported: t("status.reported"),
    under_review: t("status.under_review"),
    in_progress: t("status.in_progress"),
    resolved: t("status.resolved"),
  };

  return (
    <Card
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border hover:border-primary/20"
      onClick={onClick}
    >
      {issue.image_url && (
        <div className="h-32 overflow-hidden">
          <img src={issue.image_url} alt={issue.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2">{issue.title}</h3>
          <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${severityColors[issue.severity]}`}>
            {t(`severityLabels.${issue.severity}`)}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground">{issueTypeLabels[issue.issue_type]}</span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-xs text-muted-foreground">{departmentLabels[issue.department]}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] ${statusColors[issue.status]}`}>
              {statusLabels[issue.status]}
            </Badge>
            {issue.ai_confidence && (
              <span className="text-[10px] text-accent flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" />{(issue.ai_confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(issue.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="mt-2 pt-2 border-t flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground">{issue.complaint_id}</span>
          {issue.address && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate max-w-[140px]">
              <MapPin className="w-3 h-3 flex-shrink-0" />{issue.address}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Export labels for use in AdminDashboard
export const departmentLabels: Record<string, string> = {
  bbmp_roads: "BBMP Roads",
  waste_management: "Waste Mgmt",
  bwssb: "BWSSB",
  street_lighting: "Street Lighting",
};

export const statusLabels: Record<string, string> = {
  reported: "Reported",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export { statusColors, severityColors };
export default IssueCard;
