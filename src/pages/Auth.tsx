import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import LanguageToggle from "@/components/LanguageToggle";

interface AuthProps {
  mode: "login" | "register";
}

const Auth = ({ mode }: AuthProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser && phone) {
          await supabase.from("profiles").update({ phone }).eq("user_id", newUser.id);
        }

        toast.success("Account created! You can now login.");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-[10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-10 right-[10%] w-[300px] h-[300px] rounded-full bg-accent/10 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />{t("auth.backToHome")}
          </Link>
          <LanguageToggle />
        </div>

        <Card className="bg-card/90 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
              <span className="font-display font-bold text-primary-foreground text-lg">B</span>
            </div>
            <CardTitle className="font-display text-2xl">
              {mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t("auth.fullName")}</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("auth.fullNamePlaceholder")} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">{t("auth.mobile")}</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("auth.mobilePlaceholder")} required />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.emailPlaceholder")} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full font-semibold h-12" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mode === "login" ? t("auth.signIn") : t("auth.signUp")}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <p>{t("auth.noAccount")} <Link to="/register" className="text-primary font-semibold hover:underline">{t("auth.signUpLink")}</Link></p>
              ) : (
                <p>{t("auth.hasAccount")} <Link to="/login" className="text-primary font-semibold hover:underline">{t("auth.signInLink")}</Link></p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
