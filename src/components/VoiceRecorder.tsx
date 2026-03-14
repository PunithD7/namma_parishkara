import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const VoiceRecorder = ({ onTranscript, disabled }: VoiceRecorderProps) => {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const getLangCode = () => {
    const lang = i18n.language;
    if (lang === "kn") return "kn-IN";
    if (lang === "hi") return "hi-IN";
    return "en-IN";
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(t("voice.notSupported"));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getLangCode();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) setTranscript(prev => prev + final);
      setInterimText(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error(t("voice.micPermission"));
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    setTranscript("");
    setInterimText("");
    recognition.start();
  }, [i18n.language, t]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    // Send accumulated transcript
    const fullText = transcript.trim();
    if (fullText) {
      onTranscript(fullText);
    }
  }, [transcript, onTranscript]);

  if (!isSupported) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          {t("voice.notSupported")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold text-sm">{t("voice.title")}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant={isListening ? "destructive" : "default"}
            onClick={isListening ? stopListening : startListening}
            disabled={disabled}
            className="gap-2"
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                {t("voice.stop")}
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                {t("voice.start")}
              </>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-destructive">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                {t("voice.listening")}
              </div>
              <div className="bg-muted/50 rounded-lg p-3 min-h-[60px] text-sm">
                {transcript && <span>{transcript}</span>}
                {interimText && <span className="text-muted-foreground italic">{interimText}</span>}
                {!transcript && !interimText && (
                  <span className="text-muted-foreground">{t("voice.speakNow")}</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isListening && transcript && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-xs text-muted-foreground mb-1">{t("voice.transcribed")}:</p>
            <p>{transcript}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceRecorder;
