import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const isKannada = i18n.language === "kn";

  const toggle = () => {
    i18n.changeLanguage(isKannada ? "en" : "kn");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      <Globe className="w-3.5 h-3.5" />
      {isKannada ? "English" : "ಕನ್ನಡ"}
    </Button>
  );
};

export default LanguageToggle;
