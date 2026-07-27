import { useApp } from "@/contexts/AppContext";
import { useGetEmergencyQr, getGetEmergencyQrQueryKey } from "@meditrack/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Printer, ShieldAlert, HeartPulse } from "lucide-react";
import { Readout } from "@/components/ui/readout";

export default function EmergencyQR() {
  const { patientId, t } = useApp();
  
  const { data: qrData, isLoading } = useGetEmergencyQr(patientId, {
    query: { queryKey: getGetEmergencyQrQueryKey(patientId) }
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-10 w-48 bg-muted rounded"></div>
      <div className="max-w-md mx-auto h-[600px] bg-muted rounded-xl mt-12"></div>
    </div>;
  }

  return (
    <div className="space-y-8 flex flex-col items-center">
      <div className="text-center max-w-2xl mx-auto mb-8 print:hidden">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
          <QrCode className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-semibold font-heading mb-4">{t("Emergency QR")}</h1>
        <p className="text-muted-foreground text-lg">
          Print this card and keep it in the patient's wallet. First responders can scan the QR code to instantly access life-saving medical profile without needing a login.
        </p>
        
        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={handlePrint} className="shadow-md h-12 px-6">
            <Printer className="w-5 h-5 mr-2" /> Print Card
          </Button>
          <Button variant="outline" className="bg-card h-12 px-6">
            <Download className="w-5 h-5 mr-2" /> Save PDF
          </Button>
        </div>
      </div>

      {/* The ID Card to be printed */}
      <Card className="w-full max-w-[400px] border-2 shadow-xl bg-card overflow-hidden print:shadow-none print:border-black print:max-w-[3.375in] print:h-[2.125in] print:flex-row print:flex">
        {/* Header Bar */}
        <div className="bg-destructive text-destructive-foreground p-4 flex items-center justify-between print:w-12 print:flex-col print:p-2">
          <div className="flex items-center gap-2 print:flex-col">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <span className="font-heading font-semibold tracking-widest uppercase text-sm print:-rotate-90 print:mt-12 whitespace-nowrap">MEDICAL ALERT</span>
          </div>
        </div>
        
        <CardContent className="p-6 md:p-8 print:p-4 print:flex-1 flex flex-col items-center text-center gap-6">
          <div className="space-y-1 w-full">
            <h2 className="text-2xl font-semibold font-heading uppercase tracking-tight print:text-xl">Juanita Dela Cruz</h2>
            <div className="text-muted-foreground font-semibold tracking-wider text-sm print:text-xs">DOB: Jan 14, 1954 (72)</div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 text-left p-4 bg-muted/30 rounded-xl border print:p-2 print:gap-2">
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Blood Type</div>
              <div className="text-2xl font-bold text-destructive font-heading print:text-lg">O+</div>
            </div>
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Allergies</div>
              <div className="font-bold text-destructive print:text-sm">Penicillin</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-inner border mx-auto w-48 h-48 print:w-24 print:h-24 print:p-1 flex items-center justify-center">
            {qrData?.qrUrl ? (
              <img src={qrData.qrUrl} alt="Emergency QR Code" className="w-full h-full object-contain" />
            ) : (
              // Placeholder QR pattern if real URL not available in demo
              <div className="w-full h-full border-4 border-black border-dashed flex items-center justify-center bg-black/5">
                <QrCode className="w-16 h-16 opacity-50" />
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground font-semibold mt-2 print:text-[10px]">
            <HeartPulse className="w-4 h-4 text-primary" /> Scan for medications & contacts
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground max-w-md print:hidden">
        The QR code links to a secure, public profile valid only for emergencies. The link cannot be guessed and can be revoked from the Settings page.
      </div>
    </div>
  );
}
