import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, Map, LayoutDashboard, MessageSquare, PlusCircle, Menu, X, Radar } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import LanguageToggle from "@/components/LanguageToggle";

const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);
    };
    fetchUnread();

    const channel = supabase
      .channel('navbar-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) return null;
  const isAdmin = role === "admin";

  const links = [
    ...(!isAdmin ? [
      { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
      { to: "/report", icon: PlusCircle, label: t("nav.report") },
    ] : [
      { to: "/admin", icon: LayoutDashboard, label: t("nav.admin") },
    ]),
    { to: "/nearby", icon: Radar, label: t("nav.nearby") },
    { to: "/map", icon: Map, label: t("nav.map") },
    { to: "/assistant", icon: MessageSquare, label: t("nav.aiAssistant") },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-[10px]">NP</span>
          </div>
          <span className="font-display font-bold text-base hidden sm:inline">{t("brand")}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {links.map(l => (
            <Button
              key={l.to}
              variant="ghost"
              size="sm"
              className={cn(
                "text-muted-foreground hover:text-foreground gap-1.5 text-sm font-medium",
                location.pathname === l.to && "text-foreground bg-muted"
              )}
              asChild
            >
              <Link to={l.to}><l.icon className="w-4 h-4" />{l.label}</Link>
            </Button>
          ))}
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground ml-1 relative" asChild>
            <Link to="/notifications">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground border-0">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>
          <LanguageToggle />
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground gap-1.5 text-sm">
            <LogOut className="w-4 h-4" />{t("nav.logout")}
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageToggle />
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/notifications">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground border-0">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-3 space-y-1">
          {links.map(l => (
            <Button key={l.to} variant="ghost" className="w-full justify-start gap-2" asChild onClick={() => setMobileOpen(false)}>
              <Link to={l.to}><l.icon className="w-4 h-4" />{l.label}</Link>
            </Button>
          ))}
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />{t("nav.logout")}
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
