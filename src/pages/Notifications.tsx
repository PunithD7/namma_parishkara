import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Loader2, Phone, Mail, CheckCheck, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Tables<"notifications">[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentContacts, setDepartmentContacts] = useState<Record<string, { phone: string | null; email: string | null; department_name: string }>>({});

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [notifRes, contactsRes] = await Promise.all([
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("department_contacts").select("*"),
      ]);
      setNotifications(notifRes.data || []);
      if (contactsRes.data) {
        const map: typeof departmentContacts = {};
        contactsRes.data.forEach((c: any) => {
          map[c.department] = { phone: c.phone, email: c.email, department_name: c.department_name };
        });
        setDepartmentContacts(map);
      }
      setLoading(false);
    };
    fetchData();

   
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Tables<"notifications">;
          setNotifications(prev => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (title: string) => {
    if (title.includes("🚨") || title.includes("High Priority") || title.includes("Alert")) return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (title.includes("Reported Successfully") || title.includes("New Issue")) return <Info className="w-4 h-4 text-accent" />;
    return <Bell className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Notifications</h1>
            <p className="text-muted-foreground text-sm">
              Real-time updates about your civic issues
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-primary text-primary-foreground">{unreadCount} new</Badge>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
              <CheckCheck className="w-4 h-4" />Mark all read
            </Button>
          )}
        </div>

        {/* Department Contacts */}
        {Object.keys(departmentContacts).length > 0 && (
          <Card className="mb-6 border-primary/10">
            <CardContent className="p-4">
              <h3 className="font-display font-semibold text-sm mb-3">Department Contact Numbers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(departmentContacts).map(([dept, info]) => (
                  <div key={dept} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium text-xs">{info.department_name}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {info.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />{info.phone}
                          </span>
                        )}
                        {info.email && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />{info.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-1">No notifications yet</h3>
            <p className="text-muted-foreground text-sm">You'll be notified when issue statuses change</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {notifications.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`transition-all ${n.read ? "opacity-60" : "border-primary/20 shadow-sm"}`}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.read ? "bg-muted" : "bg-primary/10"}`}>
                        {getIcon(n.title)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && (
                        <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8" onClick={() => markRead(n.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
