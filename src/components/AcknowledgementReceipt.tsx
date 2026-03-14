import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Eye, Building2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Tables } from "@/integrations/supabase/types";

const departmentNames: Record<string, string> = {
  bbmp_roads: "BBMP Roads Infrastructure Department",
  waste_management: "Waste Management Department (SWM)",
  bwssb: "Bangalore Water Supply & Sewerage Board (BWSSB)",
  street_lighting: "Street Lighting Department (BESCOM)",
};

const issueTypeNames: Record<string, string> = {
  pothole: "Pothole / Road Damage",
  garbage: "Garbage / Waste Overflow",
  water_leakage: "Water Leakage / Drainage",
  broken_streetlight: "Broken Streetlight",
};

interface Props {
  issue: Tables<"issues">;
  citizenName?: string;
  mode?: "view" | "download" | "both";
}

const ReceiptContent = ({ issue, citizenName }: { issue: Tables<"issues">; citizenName?: string }) => (
  <div
    id={`receipt-${issue.id}`}
    className="bg-white text-black p-8 max-w-[600px] mx-auto"
    style={{ fontFamily: "'Times New Roman', Times, serif" }}
  >
    {/* Header */}
    <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
      <div className="flex items-center justify-center gap-3 mb-2">
        <Building2 className="w-10 h-10 text-black" />
        <div>
          <h1 className="text-xl font-bold tracking-wide">NAMMA PARISHKARA</h1>
          <p className="text-xs tracking-[0.3em] uppercase">Bengaluru Civic AI Governance Platform</p>
        </div>
        <Building2 className="w-10 h-10 text-black" />
      </div>
      <p className="text-xs mt-1 text-gray-600">Government of Karnataka · Bruhat Bengaluru Mahanagara Palike</p>
    </div>

    {/* Title */}
    <div className="text-center mb-6">
      <h2 className="text-lg font-bold border border-black inline-block px-6 py-1 tracking-wider">
        COMPLAINT ACKNOWLEDGEMENT RECEIPT
      </h2>
    </div>

    {/* Details */}
    <table className="w-full text-sm mb-6" style={{ borderCollapse: "collapse" }}>
      <tbody>
        {[
          ["Complaint ID", issue.complaint_id],
          ["Citizen Name", citizenName || "—"],
          ["Date & Time", new Date(issue.created_at).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })],
          ["Issue Category", issueTypeNames[issue.issue_type] || issue.issue_type],
          ["Severity", issue.severity.toUpperCase()],
          ["Location", issue.address || "—"],
          ["Department Assigned", departmentNames[issue.department] || issue.department],
          ["Status", "REGISTERED"],
        ].map(([label, value]) => (
          <tr key={label} className="border border-gray-400">
            <td className="px-3 py-2 font-bold bg-gray-100 w-[40%] border-r border-gray-400">{label}</td>
            <td className="px-3 py-2">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {issue.description && (
      <div className="mb-6 text-sm">
        <p className="font-bold mb-1">Issue Description:</p>
        <p className="border border-gray-300 p-2 rounded bg-gray-50 italic">{issue.description}</p>
      </div>
    )}

    {/* Official Message */}
    <div className="border-2 border-black p-4 mb-6 bg-gray-50">
      <p className="text-sm leading-relaxed">
        Your issue has been registered successfully through <strong>Namma Parishkara</strong> and
        has been routed to the <strong>{departmentNames[issue.department] || issue.department}</strong>.
        Your complaint will be reviewed and resolved within <strong>24 hours</strong>.
        For any queries, please quote your Complaint ID: <strong>{issue.complaint_id}</strong>.
      </p>
    </div>

    {/* Stamp / Seal */}
    <div className="flex justify-between items-end mt-8">
      <div className="text-xs text-gray-500">
        <p>Generated: {new Date().toLocaleString("en-IN")}</p>
        <p>Platform: Namma Parishkara AI</p>
      </div>
      <div className="text-center">
        <div className="w-24 h-24 rounded-full border-4 border-black/30 flex items-center justify-center mx-auto">
          <div className="text-center">
            <p className="text-[8px] font-bold leading-tight">NAMMA<br />PARISHKARA</p>
            <p className="text-[6px]">DIGITAL SEAL</p>
          </div>
        </div>
        <p className="text-[10px] mt-1 font-semibold">Authorized Digital Copy</p>
      </div>
    </div>
  </div>
);

const AcknowledgementReceipt = ({ issue, citizenName, mode = "both" }: Props) => {
  const { t } = useTranslation();
  const receiptRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    const el = document.getElementById(`receipt-${issue.id}`);
    if (!el) return;

    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`NammaParishkara_${issue.complaint_id}.pdf`);
  };

  return (
    <div className="flex items-center gap-2">
      {(mode === "view" || mode === "both") && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Eye className="w-3 h-3" />
              {t("ack.view")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{t("ack.title")}</DialogTitle>
            </DialogHeader>
            <div ref={receiptRef}>
              <ReceiptContent issue={issue} citizenName={citizenName} />
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={downloadPDF} className="gap-2">
                <Download className="w-4 h-4" />{t("ack.downloadPDF")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {(mode === "download" || mode === "both") && (
        <>
          {/* Hidden receipt for PDF generation */}
          <div className="fixed -left-[9999px] top-0">
            <ReceiptContent issue={issue} citizenName={citizenName} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadPDF}>
            <Download className="w-3 h-3" />
            {t("ack.download")}
          </Button>
        </>
      )}
    </div>
  );
};

export default AcknowledgementReceipt;
