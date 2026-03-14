import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Mic, Loader2, CheckCircle2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type IssueType = Database["public"]["Enums"]["issue_type"];
type Department = Database["public"]["Enums"]["department"];

const departmentMap: Record<IssueType, Department> = {
  pothole: "bbmp_roads",
  garbage: "waste_management",
  water_leakage: "bwssb",
  broken_streetlight: "street_lighting",
};

interface ConversationStep {
  question: string;
  field: "issue" | "location" | "landmark" | "duration";
}

const VoiceCallAssistant = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [conversationLog, setConversationLog] = useState<{ role: "ai" | "user"; text: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);
  const logEndRef = useRef<HTMLDivElement>(null);

  const lang = i18n.language;

  const getSteps = useCallback((): ConversationStep[] => {
    if (lang === "kn") {
      return [
        { question: "ನೀವು ಯಾವ ಸಮಸ್ಯೆಯನ್ನು ಎದುರಿಸುತ್ತಿದ್ದೀರಿ? ಗುಂಡಿ, ಕಸ, ನೀರಿನ ಸೋರಿಕೆ, ಅಥವಾ ಮುರಿದ ಬೀದಿ ದೀಪ?", field: "issue" },
        { question: "ಸಮಸ್ಯೆ ಎಲ್ಲಿದೆ? ಪ್ರದೇಶ ಅಥವಾ ರಸ್ತೆ ಹೆಸರು ಹೇಳಿ.", field: "location" },
        { question: "ಹತ್ತಿರದ ಹೆಗ್ಗುರುತು ಏನು?", field: "landmark" },
        { question: "ಈ ಸಮಸ್ಯೆ ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ?", field: "duration" },
      ];
    }
    if (lang === "hi") {
      return [
        { question: "आपको कौन सी समस्या हो रही है? गड्ढा, कचरा, पानी का रिसाव, या टूटी स्ट्रीट लाइट?", field: "issue" },
        { question: "समस्या कहाँ है? क्षेत्र या सड़क का नाम बताएं।", field: "location" },
        { question: "पास का लैंडमार्क क्या है?", field: "landmark" },
        { question: "यह समस्या कितने दिनों से है?", field: "duration" },
      ];
    }
    return [
      { question: "What issue are you facing? Pothole, garbage overflow, water leakage, or broken streetlight?", field: "issue" },
      { question: "Where is the location? Please tell me the area or street name.", field: "location" },
      { question: "What is the nearby landmark?", field: "landmark" },
      { question: "How long has this issue existed?", field: "duration" },
    ];
  }, [lang]);

  const getWelcome = () => {
    if (lang === "kn") return "ನಮಸ್ಕಾರ. ನಮ್ಮ ಪರಿಷ್ಕಾರ ಬೆಂಗಳೂರು ಸಿವಿಕ್ ದೂರು ವ್ಯವಸ್ಥೆಗೆ ಸ್ವಾಗತ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಹೇಳಿ.";
    if (lang === "hi") return "नमस्ते. नम्मा परिष्कार बेंगलुरु सिविक शिकायत प्रणाली में आपका स्वागत है। कृपया अपनी समस्या बताएं।";
    return "Hello. Welcome to Namma Parishkara, Bengaluru Civic Complaint System. Please tell me about your problem.";
  };

  const getSuccessMsg = (complaintId: string) => {
    if (lang === "kn") return `ನಿಮ್ಮ ದೂರು ನಮ್ಮ ಪರಿಷ್ಕಾರದಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ದೂರು ID: ${complaintId}. ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು 24 ಗಂಟೆಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಿ ಪರಿಹರಿಸಲಾಗುವುದು.`;
    if (lang === "hi") return `आपकी शिकायत नम्मा परिष्कार में सफलतापूर्वक दर्ज हो गई है। शिकायत ID: ${complaintId}। आपकी समस्या 24 घंटे में समीक्षा और समाधान की जाएगी।`;
    return `Your complaint has been successfully registered in Namma Parishkara. Complaint ID: ${complaintId}. Your issue will be reviewed and resolved within 24 hours.`;
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationLog]);

  const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      synthRef.current.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === "kn" ? "kn-IN" : lang === "hi" ? "hi-IN" : "en-IN";
      utter.rate = 0.9;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      synthRef.current.speak(utter);
    });
  };

  const startListening = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        reject(new Error("Speech recognition not supported"));
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = lang === "kn" ? "kn-IN" : lang === "hi" ? "hi-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        resolve(result);
      };
      recognition.onerror = (event: any) => {
        reject(new Error(event.error));
      };
      recognition.onend = () => {
        setListening(false);
      };

      setListening(true);
      recognition.start();
    });
  };

  const addLog = (role: "ai" | "user", text: string) => {
    setConversationLog((prev) => [...prev, { role, text }]);
  };

  const runConversation = async () => {
    setCallActive(true);
    setCompleted(false);
    setAnswers({});
    setConversationLog([]);
    setCurrentStep(-1);

    const welcome = getWelcome();
    addLog("ai", welcome);
    await speak(welcome);

    const steps = getSteps();
    const collectedAnswers: Record<string, string> = {};

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      addLog("ai", steps[i].question);
      await speak(steps[i].question);

      try {
        const answer = await startListening();
        collectedAnswers[steps[i].field] = answer;
        setAnswers({ ...collectedAnswers });
        addLog("user", answer);
      } catch {
        addLog("ai", lang === "kn" ? "ಕ್ಷಮಿಸಿ, ಕೇಳಲಾಗಲಿಲ್ಲ. ಮುಂದೆ ಹೋಗೋಣ." : "Sorry, I couldn't hear you. Let's continue.");
        await speak(lang === "kn" ? "ಕ್ಷಮಿಸಿ, ಮುಂದೆ ಹೋಗೋಣ." : "Sorry, let's continue.");
      }
    }

    // Process and submit
    setProcessing(true);
    const fullText = Object.values(collectedAnswers).filter(Boolean).join(". ");

    try {
      // NLP analysis
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-complaint-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: fullText }),
      });

      let issueType: IssueType = "pothole";
      let severity: any = "medium";
      let confidence: number | null = null;
      let suggestedTitle = collectedAnswers.issue || "Civic Issue Report";

      if (resp.ok) {
        const nlp = await resp.json();
        issueType = nlp.issue_type || "pothole";
        severity = nlp.severity || "medium";
        confidence = nlp.confidence || null;
        suggestedTitle = nlp.suggested_title || suggestedTitle;
      }

      const address = [collectedAnswers.location, collectedAnswers.landmark].filter(Boolean).join(", ");

      const { data: insertedIssue, error } = await supabase.from("issues").insert({
        user_id: user!.id,
        title: suggestedTitle,
        description: fullText,
        issue_type: issueType,
        severity,
        department: departmentMap[issueType],
        latitude: 12.9716,
        longitude: 77.5946,
        address: address || null,
        ai_confidence: confidence,
      }).select("complaint_id").single();

      if (error) throw error;

      const successMsg = getSuccessMsg(insertedIssue.complaint_id);
      addLog("ai", successMsg);
      await speak(successMsg);
      setCompleted(true);
      toast.success(t("voiceCall.complaintRegistered"));
    } catch (err) {
      console.error(err);
      const errorMsg = lang === "kn" ? "ಕ್ಷಮಿಸಿ, ದೂರು ನೋಂದಾಯಿಸಲು ವಿಫಲವಾಯಿತು." : "Sorry, failed to register the complaint. Please try again.";
      addLog("ai", errorMsg);
      await speak(errorMsg);
      toast.error(t("voiceCall.failed"));
    } finally {
      setProcessing(false);
    }
  };

  const endCall = () => {
    synthRef.current.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setCallActive(false);
    setListening(false);
    setProcessing(false);
    setCurrentStep(-1);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      endCall();
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-semibold" variant="default">
          <Phone className="w-4 h-4" />
          {t("voiceCall.callButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            {t("voiceCall.title")}
          </DialogTitle>
        </DialogHeader>

        {!callActive && !completed ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Phone className="w-10 h-10 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {t("voiceCall.description")}
            </p>
            <Button onClick={runConversation} size="lg" className="gap-2 font-semibold">
              <Phone className="w-5 h-5" />
              {t("voiceCall.startCall")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Conversation log */}
            <div className="h-64 overflow-y-auto space-y-2 bg-muted/30 rounded-xl p-3">
              <AnimatePresence>
                {conversationLog.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border"
                      }`}
                    >
                      {msg.role === "ai" && <Volume2 className="w-3 h-3 inline mr-1 opacity-60" />}
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-3">
              {listening && (
                <Badge variant="outline" className="gap-1.5 animate-pulse border-primary text-primary">
                  <Mic className="w-3 h-3" />
                  {t("voiceCall.listening")}
                </Badge>
              )}
              {processing && (
                <Badge variant="outline" className="gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t("voiceCall.processing")}
                </Badge>
              )}
              {completed && (
                <Badge className="gap-1.5 bg-success text-success-foreground">
                  <CheckCircle2 className="w-3 h-3" />
                  {t("voiceCall.completed")}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              {completed ? (
                <Button onClick={() => { setOpen(false); navigate("/dashboard"); }} className="gap-2">
                  {t("voiceCall.viewDashboard")}
                </Button>
              ) : (
                <Button variant="destructive" onClick={endCall} className="gap-2">
                  <PhoneOff className="w-4 h-4" />
                  {t("voiceCall.endCall")}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceCallAssistant;
