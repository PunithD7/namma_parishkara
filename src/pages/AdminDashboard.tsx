import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import IssueCard, { departmentLabels, statusLabels } from "@/components/IssueCard";
import CityMap from "@/components/CityMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Loader2, BarChart3, MapPin, List, X, Activity, Phone, Mail, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Tables, Database } from "@/integrations/supabase/types";

type IssueStatus = Database["public"]["Enums"]["issue_status"];

const CHART_COLORS = ["hsl(0, 72%, 51%)", "hsl(25, 90%, 55%)", "hsl(38, 92%, 50%)", "hsl(152, 60%, 38%)"];
const CATEGORY_COLORS = ["hsl(0, 72%, 51%)", "hsl(160, 60%, 38%)", "hsl(200, 75%, 48%)", "hsl(38, 92%, 50%)"];

const AdminDashboard = () => {
  const { department } = useAuth();
  const [issues, setIssues] = useState<Tables<"issues">[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Tables<"issues"> | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [departmentContacts, setDepartmentContacts] = useState<any[]>([]);

  const fetchIssues = async () => {
    let query = supabase.from("issues").select("*").order("created_at", { ascending: false });
    if (department) {
      query = query.eq("department", department);
    }
    const { data } = await query;
    setIssues(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues();
    supabase.from("department_contacts").select("*").then(({ data }) => {
      setDepartmentContacts(data || []);
    });

    // Real-time subscription for issues
    const channel = supabase
      .channel('admin-issues')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
        },
        () => {
          fetchIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [department]);

  const updateStatus = async (issueId: string, newStatus: IssueStatus) => {
    setUpdatingStatus(true);
    const { error } = await supabase.from("issues").update({ status: newStatus }).eq("id", issueId);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status updated to ${statusLabels[newStatus]}`);
      setSelectedIssue(null);

      // Send SMS notification to citizen (especially on resolution)
      if (newStatus === "resolved") {
        supabase.functions.invoke("notify-department-sms", {
          body: { issue_id: issueId },
        }).catch((err) => console.warn("SMS notification failed:", err));
      }
    }
    setUpdatingStatus(false);
  };

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status !== "resolved").length,
    resolved: issues.filter(i => i.status === "resolved").length,
    highPriority: issues.filter(i => i.severity === "high" || i.severity === "critical").length,
  };

  const categoryData = [
    { name: "Pothole", count: issues.filter(i => i.issue_type === "pothole").length },
    { name: "Garbage", count: issues.filter(i => i.issue_type === "garbage").length },
    { name: "Water Leak", count: issues.filter(i => i.issue_type === "water_leakage").length },
    { name: "Streetlight", count: issues.filter(i => i.issue_type === "broken_streetlight").length },
  ];

  const statusData = [
    { name: "Reported", value: issues.filter(i => i.status === "reported").length },
    { name: "Under Review", value: issues.filter(i => i.status === "under_review").length },
    { name: "In Progress", value: issues.filter(i => i.status === "in_progress").length },
    { name: "Resolved", value: issues.filter(i => i.status === "resolved").length },
  ];

  const severityData = [
    { name: "Low", value: issues.filter(i => i.severity === "low").length },
    { name: "Medium", value: issues.filter(i => i.severity === "medium").length },
    { name: "High", value: issues.filter(i => i.severity === "high").length },
    { name: "Critical", value: issues.filter(i => i.severity === "critical").length },
  ];

  const trendData = (() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
    return last7.map(date => ({
      date: new Date(date).toLocaleDateString("en", { weekday: "short" }),
      reported: issues.filter(i => i.created_at.startsWith(date)).length,
      resolved: issues.filter(i => i.status === "resolved" && i.updated_at.startsWith(date)).length,
    }));
  })();

  const statCards = [
    { label: "Total Issues", value: stats.total, icon: BarChart3, color: "text-accent", bg: "bg-accent/10" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-civic-orange", bg: "bg-civic-orange/10" },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "High Priority", value: stats.highPriority, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Namma Parishkara — Department Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              {department ? departmentLabels[department] : "All Departments"} — Real-time analytics & issue management
            </p>
          </div>
          <Badge variant="outline" className="hidden md:flex items-center gap-1.5 px-3 py-1.5">
            <Activity className="w-3.5 h-3.5 text-success" />
            <span className="text-xs font-medium">Live</span>
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
              <div className="stat-card">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Department Contacts Banner */}
        {departmentContacts.length > 0 && (
          <Card className="mb-6 border-primary/10">
            <CardContent className="p-4">
              <h3 className="font-display font-semibold text-sm mb-3">Department Contact Numbers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {departmentContacts.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                    <div className="flex-1">
                      <div className="font-medium">{c.department_name}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                        {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                        {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="w-4 h-4" />Analytics</TabsTrigger>
            <TabsTrigger value="map" className="gap-1.5"><MapPin className="w-4 h-4" />Map View</TabsTrigger>
            <TabsTrigger value="issues" className="gap-1.5"><List className="w-4 h-4" />All Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-base font-display">Issues by Category</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={categoryData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220, 15%, 90%)" }} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {categoryData.map((_, i) => (<Cell key={i} fill={CATEGORY_COLORS[i]} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base font-display">Status Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                        {statusData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i]} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {statusData.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                        <span className="text-muted-foreground">{s.name} ({s.value})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base font-display">7-Day Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip contentStyle={{ borderRadius: 12 }} />
                      <Area type="monotone" dataKey="reported" stroke="hsl(200, 75%, 48%)" fill="hsl(200, 75%, 48%)" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="resolved" stroke="hsl(152, 60%, 38%)" fill="hsl(152, 60%, 38%)" fillOpacity={0.15} strokeWidth={2} />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base font-display">Severity Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={severityData} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis dataKey="name" type="category" fontSize={12} width={60} />
                      <Tooltip contentStyle={{ borderRadius: 12 }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {severityData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i]} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {stats.highPriority > 0 && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-display flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />High Priority Alerts ({stats.highPriority})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {issues.filter(i => i.severity === "high" || i.severity === "critical").slice(0, 6).map(issue => (
                      <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="map">
            <Card><CardContent className="p-4">{!loading && <CityMap issues={issues} height="calc(100vh - 320px)" />}</CardContent></Card>
          </TabsContent>

          <TabsContent value="issues">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {issues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                {selectedIssue ? (
                  <Card className="sticky top-20 animate-scale-in border-primary/20">
                    <CardHeader className="flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base font-display">Manage Issue</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedIssue(null)}><X className="w-4 h-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-semibold text-sm">{selectedIssue.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">{selectedIssue.complaint_id}</p>
                      </div>
                      {selectedIssue.image_url && (
                        <img src={selectedIssue.image_url} alt="" className="w-full h-40 object-cover rounded-xl" />
                      )}
                      {selectedIssue.description && (
                        <p className="text-sm text-muted-foreground">{selectedIssue.description}</p>
                      )}
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Change Status</span>
                        <Select
                          value={selectedIssue.status}
                          onValueChange={(val) => updateStatus(selectedIssue.id, val as IssueStatus)}
                          disabled={updatingStatus}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reported">Reported</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="w-full gap-2 mt-2">
                            <Trash2 className="w-4 h-4" />Delete Complaint
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Complaint</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete this complaint? This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={async () => {
                                const { error } = await supabase.from("issues").delete().eq("id", selectedIssue.id);
                                if (error) {
                                  toast.error("Failed to delete complaint");
                                } else {
                                  toast.success("Complaint deleted successfully");
                                  setSelectedIssue(null);
                                }
                              }}
                            >Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <List className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select an issue to manage</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
