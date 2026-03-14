import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Camera, Loader2, MapPin, Sparkles, Upload, Video, X, CheckCircle2, Brain, MessageSquareText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type IssueType = Database["public"]["Enums"]["issue_type"];
type SeverityLevel = Database["public"]["Enums"]["severity_level"];
type Department = Database["public"]["Enums"]["department"];

const departmentMap: Record<IssueType, Department> = {
  pothole: "bbmp_roads",
  garbage: "waste_management",
  water_leakage: "bwssb",
  broken_streetlight: "street_lighting",
};

interface NlpResult {
  issue_type: IssueType;
  severity: SeverityLevel;
  sentiment: string;
  sentiment_score: number;
  urgency: string;
  keywords: string[];
  location: string | null;
  suggested_title: string;
  confidence: number;
  summary: string;
}

const ReportIssue = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("12.9716");
  const [longitude, setLongitude] = useState("77.5946");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingText, setAnalyzingText] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [detectedType, setDetectedType] = useState<IssueType | null>(null);
  const [detectedSeverity, setDetectedSeverity] = useState<SeverityLevel | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [nlpResult, setNlpResult] = useState<NlpResult | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    resetDetection();
  };

  const resetDetection = () => {
    setDetectedType(null);
    setDetectedSeverity(null);
    setAiConfidence(null);
    setNlpResult(null);
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        setImageFile(file);
        setImagePreview(canvas.toDataURL("image/jpeg"));
        resetDetection();
      }
    }, "image/jpeg", 0.9);
    closeCamera();
  };

  const closeCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraOpen(false);
  }, [stream]);

  const analyzeImage = async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(imageFile);
      });

      const { data, error } = await supabase.functions.invoke("analyze-issue", {
        body: { image: base64 },
      });

      if (error) throw error;

      setDetectedType(data.issue_type);
      setDetectedSeverity(data.severity);
      setAiConfidence(data.confidence);
      if (!title) setTitle(data.suggested_title || "");
      toast.success(`AI detected: ${data.issue_type.replace("_", " ")} (${(data.confidence * 100).toFixed(0)}% confidence)`);
    } catch (err: any) {
      toast.error("AI analysis failed. You can still report manually.");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeComplaintText = async (text: string) => {
    if (!text || text.trim().length < 5) {
      toast.error(t("voice.tooShort"));
      return;
    }
    setAnalyzingText(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-complaint-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text }),
      });

      if (resp.status === 429) {
        toast.error(t("voice.rateLimited"));
        return;
      }
      if (!resp.ok) throw new Error("NLP analysis failed");

      const result: NlpResult = await resp.json();
      setNlpResult(result);
      setDetectedType(result.issue_type);
      setDetectedSeverity(result.severity);
      setAiConfidence(result.confidence);

      if (!title) setTitle(result.suggested_title);
      if (!description) setDescription(text);
      if (result.location && !address) setAddress(result.location);

      toast.success(t("voice.analysisComplete"));
    } catch (err) {
      console.error(err);
      toast.error(t("voice.analysisFailed"));
      // Still set the text as description
      if (!description) setDescription(text);
    } finally {
      setAnalyzingText(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setDescription(text);
    analyzeComplaintText(text);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toString());
        setLongitude(pos.coords.longitude.toString());
        toast.success("Location captured!");
      },
      () => toast.error("Could not get location")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !detectedType) {
      toast.error("Please analyze the image or describe the issue first");
      return;
    }
    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("issue-images").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("issue-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("issues").insert({
        user_id: user.id,
        title,
        description,
        issue_type: detectedType,
        severity: detectedSeverity || "medium",
        department: departmentMap[detectedType],
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        image_url: imageUrl,
        ai_confidence: aiConfidence,
      });
      if (error) throw error;

      if (detectedSeverity === "high" || detectedSeverity === "critical") {
        const { data: latestIssue } = await supabase
          .from("issues")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (latestIssue) {
          supabase.functions.invoke("notify-department-sms", {
            body: { issue_id: latestIssue.id },
          }).catch((err) => console.warn("SMS notification failed:", err));
        }
      }

      toast.success("Issue reported successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit issue");
    } finally {
      setLoading(false);
    }
  };

  const issueTypeLabels: Record<IssueType, string> = {
    pothole: t("issueCard.pothole"),
    garbage: t("issueCard.garbage"),
    water_leakage: t("issueCard.water_leakage"),
    broken_streetlight: t("issueCard.broken_streetlight"),
  };

  const severityBg: Record<string, string> = {
    low: "bg-success/10 text-success",
    medium: "bg-warning/10 text-warning",
    high: "bg-destructive/10 text-destructive",
    critical: "bg-destructive/20 text-destructive",
  };

  const sentimentColors: Record<string, string> = {
    positive: "text-success",
    neutral: "text-muted-foreground",
    negative: "text-warning",
    very_negative: "text-destructive",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <canvas ref={canvasRef} className="hidden" />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-display font-bold">{t("reportPage.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("reportPage.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Camera Modal */}
          <AnimatePresence>
            {cameraOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-card rounded-2xl overflow-hidden max-w-lg w-full"
                >
                  <div className="relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full aspect-video object-cover bg-foreground" />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 bg-card/80" onClick={closeCamera}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="p-4 flex gap-3">
                    <Button type="button" onClick={capturePhoto} className="flex-1 font-semibold h-12">
                      <Camera className="w-5 h-5 mr-2" />{t("reportPage.capturePhoto")}
                    </Button>
                    <Button type="button" variant="outline" onClick={closeCamera} className="h-12">{t("reportPage.cancel")}</Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice Input */}
          <VoiceRecorder onTranscript={handleVoiceTranscript} disabled={analyzingText} />

          {analyzingText && (
            <Card className="border-primary/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <div>
                  <p className="font-semibold text-sm">{t("voice.analyzing")}</p>
                  <p className="text-xs text-muted-foreground">{t("voice.analyzingDesc")}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NLP Analysis Results */}
          <AnimatePresence>
            {nlpResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-accent/30 bg-accent/5">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-accent" />
                      <span className="font-display font-semibold">{t("voice.nlpResults")}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="bg-card rounded-xl p-3">
                        <div className="text-xs text-muted-foreground mb-1">{t("reportPage.issueType")}</div>
                        <div className="font-semibold text-xs">{issueTypeLabels[nlpResult.issue_type]}</div>
                      </div>
                      <div className="bg-card rounded-xl p-3">
                        <div className="text-xs text-muted-foreground mb-1">{t("voice.sentiment")}</div>
                        <div className={`font-semibold text-xs capitalize ${sentimentColors[nlpResult.sentiment]}`}>
                          {nlpResult.sentiment.replace("_", " ")}
                        </div>
                      </div>
                      <div className="bg-card rounded-xl p-3">
                        <div className="text-xs text-muted-foreground mb-1">{t("voice.urgency")}</div>
                        <Badge className={`${severityBg[nlpResult.urgency]} border-0 text-xs`}>
                          {nlpResult.urgency.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="bg-card rounded-xl p-3">
                        <div className="text-xs text-muted-foreground mb-1">{t("reportPage.confidence")}</div>
                        <div className="font-semibold text-xs text-accent">
                          {(nlpResult.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    {nlpResult.keywords.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1.5">{t("voice.keywords")}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {nlpResult.keywords.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {nlpResult.summary && (
                      <div className="text-xs text-muted-foreground bg-card rounded-lg p-2.5">
                        <MessageSquareText className="w-3 h-3 inline mr-1" />
                        {nlpResult.summary}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analyze text manually */}
          {description && !nlpResult && !analyzingText && (
            <Button
              type="button"
              variant="outline"
              onClick={() => analyzeComplaintText(description)}
              className="w-full gap-2"
            >
              <Brain className="w-4 h-4" />
              {t("voice.analyzeText")}
            </Button>
          )}

          {/* Photo upload */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                {t("reportPage.captureOrUpload")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {imagePreview ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>{t("reportPage.change")}</Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => { setImageFile(null); setImagePreview(null); resetDetection(); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={analyzeImage}
                    disabled={analyzing}
                    className="w-full font-semibold h-12"
                  >
                    {analyzing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("reportPage.analyzingWithAI")}</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" />{t("reportPage.analyzeWithAI")}</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">{t("reportPage.uploadPhoto")}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{t("reportPage.uploadHint")}</p>
                  </div>
                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={openCamera}
                  >
                    <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">{t("reportPage.openCamera")}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{t("reportPage.captureDirectly")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Image Results */}
          <AnimatePresence>
            {detectedType && !nlpResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span className="font-display font-semibold">{t("reportPage.aiResults")}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-card rounded-xl p-3">
                        <div className="text-xs text-muted-foreground mb-1">{t("reportPage.issueType")}</div>
                        <div className="font-semibold text-sm">{issueTypeLabels[detectedType]}</div>
                      </div>
                      <div className="bg-card rounded-xl p-3">
                        <div className="text-xs text-muted-foreground mb-1">{t("reportPage.severity")}</div>
                        <Badge className={`${severityBg[detectedSeverity || 'medium']} border-0`}>
                          {t(`severityLabels.${detectedSeverity || 'medium'}`)}
                        </Badge>
                      </div>
                      <div className="bg-card rounded-xl p-3">
                        <div className="text-xs text-muted-foreground mb-1">{t("reportPage.confidence")}</div>
                        <div className="font-semibold text-sm text-accent">{aiConfidence ? `${(aiConfidence * 100).toFixed(0)}%` : "—"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">{t("reportPage.issueDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">{t("reportPage.titleLabel")}</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("reportPage.titlePlaceholder")} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">{t("reportPage.descLabel")}</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("reportPage.descPlaceholder")} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">{t("reportPage.addressLabel")}</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("reportPage.addressPlaceholder")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("reportPage.latitude")}</Label>
                  <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} type="number" step="any" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("reportPage.longitude")}</Label>
                  <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} type="number" step="any" />
                </div>
              </div>
              <Button type="button" variant="outline" onClick={getLocation} className="w-full">
                <MapPin className="w-4 h-4 mr-2" />{t("reportPage.useCurrentLocation")}
              </Button>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading || !detectedType} className="w-full font-bold h-14 text-lg rounded-xl">
            {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t("reportPage.submitting")}</> : t("reportPage.submitReport")}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;
