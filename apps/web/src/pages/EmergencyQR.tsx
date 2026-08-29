import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useGetEmergencyQr, getGetEmergencyQrQueryKey, useGetPatient, getGetPatientQueryKey } from "@meditrack/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Printer, ShieldAlert, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

/** Age in whole years from an ISO date-of-birth string. */
function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function formatDob(dateOfBirth: string): string {
  return new Date(dateOfBirth).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function EmergencyQR() {
  const { patientId, t } = useApp();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  const { data: patient, isLoading: isPatientLoading } = useGetPatient(patientId, {
    query: { queryKey: getGetPatientQueryKey(patientId) },
  });

  const { data: qrData, isLoading: isQrLoading } = useGetEmergencyQr(patientId, {
    query: { queryKey: getGetEmergencyQrQueryKey(patientId) },
  });

  const isLoading = isPatientLoading || isQrLoading;

  // qrUrl from the API is a relative path (e.g. "/emergency/<token>"); the
  // QR code needs to encode a full, scannable URL.
  const emergencyProfileUrl = qrData?.qrUrl
    ? new URL(qrData.qrUrl, window.location.origin).toString()
    : null;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    if (!cardRef.current || isSavingPdf) return;
    setIsSavingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: "#ffffff" });
      const imageData = canvas.toDataURL("image/png");

      // Standard US wallet card size, matching the card's print dimensions.
      const pdf = new jsPDF({ orientation: "landscape", unit: "in", format: [3.375, 2.125] });
      pdf.addImage(imageData, "PNG", 0, 0, 3.375, 2.125);
      pdf.save(`${patient?.name ?? "emergency"}-medical-card.pdf`.replace(/\s+/g, "-").toLowerCase());
    } catch (err) {
      console.error("Save PDF failed:", err);
      toast({
        variant: "destructive",
        title: "Couldn't save the PDF",
        description: "Please try again, or use Print Card and choose \"Save as PDF\" instead.",
      });
    } finally {
      setIsSavingPdf(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-10 w-48 bg-muted rounded"></div>
      <div className="max-w-md mx-auto h-[600px] bg-muted rounded-xl mt-12"></div>
    </div>;
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-16">
        <ShieldAlert className="w-10 h-10 text-destructive" />
        <p className="font-semibold text-lg">Couldn't load this patient's emergency card</p>
        <p className="text-muted-foreground max-w-sm">Check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 flex flex-col items-center">
      <div className="text-center max-w-2xl mx-auto mb-8 print:hidden">
        <h1 className="text-3xl font-semibold font-heading mb-4">{t("Emergency QR")}</h1>
        <p className="text-muted-foreground text-lg">
          Print this card and keep it in the patient's wallet. First responders can scan the QR code to instantly access life-saving medical profile without needing a login.
        </p>
        
        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={handlePrint} className="shadow-md h-12 px-6">
            <Printer className="w-5 h-5 mr-2" /> Print Card
          </Button>
          <Button variant="outline" className="bg-card h-12 px-6" onClick={handleSavePdf} disabled={isSavingPdf}>
            {isSavingPdf ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
            {isSavingPdf ? "Saving…" : "Save PDF"}
          </Button>
        </div>
      </div>

      {/* The ID Card to be printed */}
      <Card ref={cardRef} className="w-full max-w-[400px] border-2 rounded-3xl shadow-xl bg-card overflow-hidden print:rounded-none print:shadow-none print:border-black print:max-w-[3.375in] print:h-[2.125in] print:flex-row print:flex">
        {/* Header Bar */}
        <div className="bg-destructive text-destructive-foreground p-4 flex items-center justify-center print:w-12 print:flex-col print:p-2">
          <div className="flex items-center gap-2 print:flex-col">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <span className="font-heading font-semibold tracking-widest uppercase text-sm print:-rotate-90 print:mt-12 whitespace-nowrap">MEDICAL ALERT</span>
          </div>
        </div>
        
        <CardContent className="p-6 md:p-8 print:p-4 print:flex-1 flex flex-col items-center text-center gap-6">
          <div className="space-y-1 w-full">
            <h2 className="text-2xl font-semibold font-heading uppercase tracking-tight print:text-xl">{patient.name}</h2>
            <div className="text-muted-foreground font-semibold tracking-wider text-sm print:text-xs">
              DOB: {formatDob(patient.dateOfBirth)} ({calculateAge(patient.dateOfBirth)})
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 text-left p-4 bg-destructive/5 rounded-2xl border border-destructive/20 print:p-2 print:gap-2 print:bg-transparent">
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Blood Type</div>
              <div className="text-2xl font-bold text-destructive font-heading print:text-lg">{patient.bloodType}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Allergies</div>
              <div className="font-bold text-destructive print:text-sm break-words">
                {patient.allergies.length > 0 ? patient.allergies.join(", ") : "None known"}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-inner border mx-auto w-48 h-48 print:w-24 print:h-24 print:p-1 flex items-center justify-center">
            {emergencyProfileUrl ? (
              <QRCodeSVG value={emergencyProfileUrl} size={256} className="w-full h-full" level="M" />
            ) : (
              <div className="w-full h-full border-4 border-black border-dashed flex items-center justify-center bg-black/5">
                <QrCode className="w-16 h-16 opacity-50" />
              </div>
            )}
          </div>

          <div className="w-full text-sm text-muted-foreground font-semibold mt-2 print:text-[10px]">
            Scan for medications & contacts
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground max-w-md print:hidden">
        The QR code links to a secure, public profile valid only for emergencies. The link cannot be guessed and can be revoked from the Settings page.
      </div>
    </div>
  );
}
