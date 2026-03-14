import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera, Map, BarChart3, Bot, ArrowRight, Shield, Zap, Users, TrendingUp,
  AlertTriangle, Droplets, Lightbulb, Trash2, Play, CheckCircle2, Building2,
  ChevronRight, Sparkles, Eye, Bell, MapPin, Globe, Github, Mail,
  Smartphone, Clock, Award, Heart, Star, Target, Layers, MessageSquare
} from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import LanguageToggle from "@/components/LanguageToggle";
import MarqueeImages from "@/components/MarqueeImages";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const }
  })
};

const Landing = () => {
  const { t } = useTranslation();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const problems = [
    { icon: AlertTriangle, title: t("problem.potholes"), stat: "12,000+", desc: t("problem.potholesDesc"), color: "text-destructive", bg: "bg-destructive/10" },
    { icon: Trash2, title: t("problem.garbage"), stat: "8,500+", desc: t("problem.garbageDesc"), color: "text-civic-orange", bg: "bg-civic-orange/10" },
    { icon: Droplets, title: t("problem.waterLeakage"), stat: "3,200+", desc: t("problem.waterLeakageDesc"), color: "text-primary", bg: "bg-primary/10" },
    { icon: Lightbulb, title: t("problem.streetlights"), stat: "5,400+", desc: t("problem.streetlightsDesc"), color: "text-warning", bg: "bg-warning/10" },
  ];

  const steps = [
    { num: "01", icon: Camera, title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
    { num: "02", icon: Sparkles, title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
    { num: "03", icon: Bell, title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
  ];

  const features = [
    { icon: Eye, title: t("features.aiDetection"), desc: t("features.aiDetectionDesc") },
    { icon: Map, title: t("features.cityDashboard"), desc: t("features.cityDashboardDesc") },
    { icon: Shield, title: t("features.autoRouting"), desc: t("features.autoRoutingDesc") },
    { icon: BarChart3, title: t("features.analytics"), desc: t("features.analyticsDesc") },
    { icon: MapPin, title: t("features.tracking"), desc: t("features.trackingDesc") },
    { icon: Bot, title: t("features.assistant"), desc: t("features.assistantDesc") },
  ];

  const impacts = [
    { icon: Zap, title: t("impact.fasterResolution"), stat: "60%", desc: t("impact.fasterResolutionDesc") },
    { icon: Building2, title: t("impact.smartInfra"), stat: "4", desc: t("impact.smartInfraDesc") },
    { icon: Users, title: t("impact.citizenEngagement"), stat: "10K+", desc: t("impact.citizenEngagementDesc") },
    { icon: TrendingUp, title: t("impact.dataGov"), stat: "85%", desc: t("impact.dataGovDesc") },
  ];

  const testimonials = [
    { name: t("testimonials.t1Name"), role: t("testimonials.t1Role"), text: t("testimonials.t1Text"), rating: 5 },
    { name: t("testimonials.t2Name"), role: t("testimonials.t2Role"), text: t("testimonials.t2Text"), rating: 5 },
    { name: t("testimonials.t3Name"), role: t("testimonials.t3Role"), text: t("testimonials.t3Text"), rating: 5 },
  ];

  const whyChoose = [
    { icon: Smartphone, title: t("whyChoose.mobileFirst"), desc: t("whyChoose.mobileFirstDesc") },
    { icon: Clock, title: t("whyChoose.realTime"), desc: t("whyChoose.realTimeDesc") },
    { icon: Award, title: t("whyChoose.trusted"), desc: t("whyChoose.trustedDesc") },
    { icon: Target, title: t("whyChoose.accurate"), desc: t("whyChoose.accurateDesc") },
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 antialiased">
      {/* Scroll Progress */}
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[100] origin-left" style={{ scaleX }} />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-[11px] font-bold text-primary-foreground tracking-tighter">NP</span>
            </div>
            <span className="font-display font-bold tracking-tight">{t("brand")}</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["problem", "how-it-works", "features", "impact"].map((link) => (
              <a key={link} href={`#${link}`} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {t(`nav.${link.replace(/-/g, '')}`)}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" size="sm" asChild><Link to="/login">{t("nav.login")}</Link></Button>
            <Button size="sm" className="rounded-full px-5 font-semibold" asChild>
              <Link to="/register">{t("nav.getStarted")}</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Video */}
      <section className="relative overflow-hidden min-h-[90vh] flex flex-col">
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover">
          <source src="/src/components/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-foreground/70" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-[10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-0 right-[5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-primary-foreground/5 animate-[spin_60s_linear_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-primary-foreground/5 animate-[spin_40s_linear_infinite_reverse]" />
        </div>

        <div className="container mx-auto px-6 pt-24 pb-28 md:pt-32 md:pb-36 relative z-10 flex-1 flex items-center">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/15 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-sm font-semibold text-primary-foreground/90">{t("hero.badge")}</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary-foreground mb-6 leading-[1.08] tracking-tight">
              {t("hero.title1")}<br />
              {t("hero.title2")}{" "}
              <span className="text-gradient">{t("hero.title3")}</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-primary-foreground/60 mb-10 max-w-xl mx-auto leading-relaxed">
              {t("hero.subtitle")}
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="font-bold text-lg px-8 h-14 rounded-xl shadow-lg shadow-primary/25" asChild>
                <Link to="/register">{t("hero.reportIssue")} <ArrowRight className="ml-2 w-5 h-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-14 text-lg rounded-xl" asChild>
                <Link to="/login">{t("hero.viewDashboard")}</Link>
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fadeUp} custom={4} className="mt-12 flex items-center justify-center gap-6 flex-wrap">
              {[
                { icon: CheckCircle2, text: t("hero.trustBadge1") },
                { icon: Shield, text: t("hero.trustBadge2") },
                { icon: Zap, text: t("hero.trustBadge3") },
              ].map((badge) => (
                <div key={badge.text} className="flex items-center gap-2 text-primary-foreground/50 text-sm">
                  <badge.icon className="w-4 h-4 text-primary" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <div className="border-t border-primary-foreground/10 bg-primary-foreground/5 backdrop-blur-sm relative z-10">
          <div className="container mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { num: "10K+", label: t("stats.issuesReported") },
              { num: "85%", label: t("stats.resolutionRate") },
              { num: "4", label: t("stats.deptsIntegrated") },
              { num: "<24h", label: t("stats.avgResponseTime") },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display font-bold text-2xl md:text-3xl text-primary">{s.num}</div>
                <div className="text-sm text-primary-foreground/50">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee Images */}
      <MarqueeImages />

      {/* Problem Section */}
      <section id="problem" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="max-w-2xl">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">{t("problem.label")}</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mt-3 mb-4">
                {t("problem.title")} <span className="text-gradient">{t("problem.titleHighlight")}</span> {t("problem.titleEnd")}
              </h2>
              <p className="text-muted-foreground text-lg">{t("problem.subtitle")}</p>
            </div>
            <div className="px-5 py-3 bg-card rounded-xl border border-border/50 glass-card">
              <span className="text-xs font-bold text-muted-foreground block uppercase tracking-wider">{t("problem.totalLabel")}</span>
              <span className="text-2xl font-mono font-bold tabular-nums">29,102</span>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                <Card className="glass-card-hover h-full border-none rounded-3xl">
                  <CardContent className="p-8 text-center">
                    <div className={`w-14 h-14 rounded-2xl ${p.bg} flex items-center justify-center mx-auto mb-5`}>
                      <p.icon className={`w-7 h-7 ${p.color}`} />
                    </div>
                    <div className="font-mono text-3xl font-bold tracking-tight mb-1 tabular-nums">{p.stat}</div>
                    <h3 className="font-display font-semibold text-lg mb-2">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-muted/50">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">{t("howItWorks.label")}</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">{t("howItWorks.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("howItWorks.subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }} className="relative">
                <Card className="glass-card-hover h-full border-2 border-transparent hover:border-primary/20">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl font-display font-bold text-primary/10 mb-4">{step.num}</div>
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5">
                      <step.icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="font-display font-bold text-xl mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 z-10">
                    <ChevronRight className="w-8 h-8 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo / Video Section — Browser Frame */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div className="max-w-5xl mx-auto" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-center mb-12">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">{t("demo.label")}</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">{t("demo.title")}</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("demo.subtitle")}</p>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-2 glass-card">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/30" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-muted rounded-lg px-4 py-1.5 text-xs text-muted-foreground font-mono text-center">
                    nagarpalika.app/dashboard
                  </div>
                </div>
              </div>
              {/* Video */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
                <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                  <source src="/src/components/background.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-md flex items-center justify-center border-2 border-primary-foreground/30 hover:scale-110 transition-transform cursor-pointer shadow-2xl shadow-primary/40">
                    <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-6 left-6">
                  <span className="text-primary-foreground text-sm font-semibold block">{t("demo.videoTitle")}</span>
                  <span className="text-primary-foreground/60 text-xs">{t("demo.videoTime")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">{t("whyChoose.label")}</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
              {t("whyChoose.title")} <span className="text-gradient">{t("whyChoose.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("whyChoose.subtitle")}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {whyChoose.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">{t("features.label")}</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
              {t("features.title1")} <span className="text-gradient">{t("features.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("features.subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}>
                <Card className="glass-card-hover h-full group rounded-2xl">
                  <CardContent className="p-7">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">{t("testimonials.label")}</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
              {t("testimonials.title")} <span className="text-gradient">{t("testimonials.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("testimonials.subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((t_item, i) => (
              <motion.div key={t_item.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}>
                <Card className="glass-card-hover h-full rounded-2xl">
                  <CardContent className="p-7">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t_item.rating }).map((_, si) => (
                        <Star key={si} className="w-4 h-4 text-warning fill-warning" />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic">"{t_item.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">{t_item.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-display font-semibold text-sm">{t_item.name}</div>
                        <div className="text-xs text-muted-foreground">{t_item.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact — Dark Section */}
      <section id="impact" className="py-24 bg-foreground overflow-hidden relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">{t("impact.label")}</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4 text-primary-foreground">
              {t("impact.title")} <span className="text-primary">{t("impact.titleHighlight")}</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 max-w-5xl mx-auto">
            {impacts.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="font-mono text-5xl font-bold text-primary mb-2 tabular-nums">{item.stat}</div>
                <h3 className="font-display font-semibold text-primary-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-primary-foreground/50">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[120px] rounded-full translate-x-1/2" />
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">{t("faq.label")}</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">{t("faq.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("faq.subtitle")}</p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: t("faq.q1"), a: t("faq.a1") },
              { q: t("faq.q2"), a: t("faq.a2") },
              { q: t("faq.q3"), a: t("faq.a3") },
              { q: t("faq.q4"), a: t("faq.a4") },
              { q: t("faq.q5"), a: t("faq.a5") },
            ].map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}>
                <details className="group glass-card rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-display font-semibold text-lg hover:text-primary transition-colors">
                    {faq.q}
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div className="max-w-4xl mx-auto rounded-3xl gradient-hero p-12 md:p-16 text-center relative overflow-hidden" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[80px]" />
              <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-primary/5 blur-[80px]" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-4">{t("cta.title")}</h2>
              <p className="text-lg text-primary-foreground/60 mb-8 max-w-xl mx-auto">{t("cta.subtitle")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="font-bold text-lg px-8 h-14 rounded-xl" asChild>
                  <Link to="/register">{t("cta.getStarted")} <ArrowRight className="ml-2 w-5 h-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-14 text-lg rounded-xl" asChild>
                  <Link to="/login">{t("hero.viewDashboard")}</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <span className="text-[11px] font-bold text-primary-foreground tracking-tighter">NP</span>
                </div>
                <span className="font-display font-bold tracking-tight">{t("brand")}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md mb-6">{t("footer.description")}</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Github className="w-5 h-5" /></a>
                <a href="#" className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Globe className="w-5 h-5" /></a>
                <a href="#" className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Mail className="w-5 h-5" /></a>
              </div>
            </div>
            <div>
              <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-4">{t("footer.product")}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">{t("features.label")}</a></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">{t("howItWorks.label")}</a></li>
                <li><a href="#impact" className="hover:text-primary transition-colors">{t("impact.label")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-4">{t("footer.company")}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">{t("footer.about")}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t("footer.careers")}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t("footer.blog")}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t("footer.privacy")}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2026 Namma Prashikshan {t("brand")}. {t("footer.rights")}</p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">{t("footer.privacy")}</a>
              <a href="#" className="hover:text-primary transition-colors">{t("footer.terms")}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;