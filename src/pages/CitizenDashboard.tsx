import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import IssueCard from "@/components/IssueCard";
import CityMap from "@/components/CityMap";
import AcknowledgementReceipt from "@/components/AcknowledgementReceipt";
import VoiceCallAssistant from "@/components/VoiceCallAssistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, AlertTriangle, Clock, CheckCircle2, Loader2, Map, List, TrendingUp, Phone, Mail, Trash2, Info, ExternalLink, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const CitizenDashboard = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [issues, setIssues] = useState<Tables<"issues">[]>([]);
  const [deptContacts, setDeptContacts] = useState<Tables<"department_contacts">[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    if (!user) return;
    const { data } = await supabase.from("issues").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setIssues(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [_, deptRes] = await Promise.all([
        fetchIssues(),
        supabase.from("department_contacts").select("*"),
      ]);
      setDeptContacts(deptRes.data || []);
    };
    fetchData();
  }, [user]);

  const deleteIssue = async (issueId: string) => {
    const { error } = await supabase.from("issues").delete().eq("id", issueId);
    if (error) {
      toast.error(t("citizenDash.deleteFailed"));
    } else {
      toast.success(t("citizenDash.deleteSuccess"));
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
    }
  };

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status !== "resolved").length,
    resolved: issues.filter(i => i.status === "resolved").length,
    highPriority: issues.filter(i => i.severity === "high" || i.severity === "critical").length,
  };

  const statCards = [
    { label: t("citizenDash.totalReports"), value: stats.total, icon: TrendingUp },
    { label: t("citizenDash.pending"), value: stats.pending, icon: Clock },
    { label: t("citizenDash.resolved"), value: stats.resolved, icon: CheckCircle2 },
    { label: t("citizenDash.highPriority"), value: stats.highPriority, icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background text-slate-900 dark:text-slate-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        
        {/* --- Header Area --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">
              {t("citizenDash.welcome")}{profile?.full_name ? `, ${profile.full_name}` : ""}
            </h1>
            <p className="text-slate-500 mt-1">{t("citizenDash.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <VoiceCallAssistant />
            <Button className="rounded-full px-6 font-semibold shadow-lg shadow-primary/20" asChild>
              <Link to="/report"><PlusCircle className="w-4 h-4 mr-2" />{t("citizenDash.reportIssue")}</Link>
            </Button>
          </div>
        </div>

        {/* --- Neat Stats Row --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {statCards.map((s, i) => (
            <motion.div 
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm"
            >
              <s.icon className="w-5 h-5 text-primary mb-3" />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* --- Main Content --- */}
        <div className="mb-20">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <Tabs defaultValue="list" className="space-y-8">
              <TabsList className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-full">
                <TabsTrigger value="list" className="rounded-full px-8 gap-2"><List className="w-4 h-4" />{t("citizenDash.myIssues")}</TabsTrigger>
                <TabsTrigger value="map" className="rounded-full px-8 gap-2"><Map className="w-4 h-4" />{t("citizenDash.mapView")}</TabsTrigger>
              </TabsList>

              <TabsContent value="list">
                {issues.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed rounded-3xl border-slate-200">
                    <p className="text-slate-400">{t("citizenDash.noIssues")}</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {issues.map((issue) => (
                      <div key={issue.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-primary transition-colors group">
                        <IssueCard issue={issue} />
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                          <AcknowledgementReceipt issue={issue} citizenName={profile?.full_name} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                                <AlertDialogDescription>{t("citizenDash.deleteConfirm")}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteIssue(issue.id)} className="bg-red-500">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="map">
                <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
                  <CityMap issues={issues} height="500px" />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* --- Information Footer (New Section) --- */}
        <hr className="border-slate-200 dark:border-slate-800 mb-10" />
        
        <div className="grid md:grid-cols-3 gap-12">
          {/* Column 1: Emergency Contacts */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> {t("citizenDash.deptContacts")}
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {deptContacts.slice(0, 4).map((d) => (
                <div key={d.id} className="text-sm">
                  <p className="font-semibold">{d.department_name}</p>
                  <a href={`tel:${d.phone}`} className="text-primary text-xs hover:underline">{d.phone}</a>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> {t("footer.info") || "Guidelines"}
            </h4>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                All reports are verified by AI before being assigned to departments.
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                Average resolution time is currently 48-72 hours.
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                View our transparency report on city maintenance.
              </li>
            </ul>
          </div>

          {/* Column 3: App Status */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> System Status
            </h4>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Server Status</span>
                <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full uppercase">Operational</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your data is securely synced with Supabase Real-time infrastructure. 
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CitizenDashboard;