import { useApp } from "@/contexts/AppContext";
import { 
  useGetAdherenceSummary, 
  getGetAdherenceSummaryQueryKey,
  useGetWeeklyAdherence,
  getGetWeeklyAdherenceQueryKey,
  useListAdherenceLogs,
  getListAdherenceLogsQueryKey,
  useExportAdherenceReport,
} from "@meditrack/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Share2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function Adherence() {
  const { patientId, t } = useApp();
  const { toast } = useToast();
  
  const { data: summary, isLoading: sumLoading } = useGetAdherenceSummary(patientId, {
    query: { queryKey: getGetAdherenceSummaryQueryKey(patientId) }
  });

  const { data: weekly, isLoading: weekLoading } = useGetWeeklyAdherence(patientId, {
    query: { queryKey: getGetWeeklyAdherenceQueryKey(patientId) }
  });

  const { data: logs, isLoading: logsLoading } = useListAdherenceLogs(patientId, {
    query: { queryKey: getListAdherenceLogsQueryKey(patientId) }
  });

  const { refetch: fetchReport, isFetching: isExporting } = useExportAdherenceReport(patientId, {
    query: { queryKey: ["export-report-manual", patientId], enabled: false },
  });

  const handleExport = async () => {
    const { data: report, isError } = await fetchReport();
    if (isError || !report) {
      toast({ variant: "destructive", title: "Couldn't generate the report", description: "Please try again." });
      return;
    }

    const rows = [
      ["Medication", "Scheduled At", "Confirmed At", "Status"],
      ...report.doseEvents.map((e) => [e.medicationName ?? "", formatTime(e.scheduledAt) + " " + formatDate(e.scheduledAt), e.confirmedAt ? formatTime(e.confirmedAt) : "", e.status]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(report.patientName ?? "patient").replace(/\s+/g, "-").toLowerCase()}-adherence-report.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Report downloaded", description: `${report.doseEvents.length} dose records exported.` });
  };

  const handleShare = async () => {
    const text = `Adherence report for ${summary ? `the last 30 days` : "this patient"}: ${summary?.overallRate ?? 0}% overall rate, ${summary?.currentStreak ?? 0}-day streak, ${summary?.missedCount ?? 0} missed doses.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "MediTrack Pro Adherence Report", text });
      } catch {
        // user cancelled the share sheet — not an error
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "Summary copied", description: "Adherence summary copied to your clipboard." });
    }
  };

  if (sumLoading || weekLoading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-10 w-64 bg-muted rounded"></div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="h-40 bg-muted rounded-xl"></div>
        <div className="h-40 bg-muted rounded-xl"></div>
        <div className="h-40 bg-muted rounded-xl"></div>
      </div>
      <div className="h-80 bg-muted rounded-xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold font-heading">{t("Adherence")}</h1>
          <p className="text-muted-foreground">Track medication reliability and history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-card shadow-sm" onClick={handleShare}><Share2 className="w-4 h-4 mr-2" /> Share</Button>
          <Button className="shadow-sm" onClick={handleExport} disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" /> {isExporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-panel-ink border border-[#0B2624] rounded-2xl shadow-[inset_0_1px_10px_rgba(0,0,0,0.35)] relative overflow-hidden text-gintong-digit">
          <div className="absolute inset-0 scanlines opacity-30 z-10 pointer-events-none"></div>
          <CardContent className="p-8 relative z-20 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gintong-digit/60 font-sans font-bold mb-2">Overall Rate</div>
              <div className="text-7xl font-bold font-mono tracking-tighter drop-shadow-[0_0_12px_rgba(246,196,99,0.5)]">
                {summary?.overallRate || 0}%
              </div>
            </div>
            
            <div className="h-px md:h-24 w-full md:w-px bg-gintong-digit/20" />
            
            <div className="grid grid-cols-2 gap-8 text-center md:text-left w-full md:w-auto">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gintong-digit/60 font-sans font-bold mb-2">Current Streak</div>
                <div className="text-4xl font-mono font-bold">{summary?.currentStreak || 0}</div>
                <div className="text-sm font-sans text-gintong-digit/80 mt-1">Days</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gintong-digit/60 font-sans font-bold mb-2">Doses Taken</div>
                <div className="text-4xl font-mono font-bold">{summary?.takenCount || 0}</div>
                <div className="text-sm font-sans text-gintong-digit/80 mt-1">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Misses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold font-heading text-destructive mb-2">{summary?.missedCount || 0}</div>
            <p className="text-sm text-muted-foreground">In the last 30 days</p>
            {summary?.missedCount !== undefined && summary.missedCount > 2 && (
              <Badge variant="destructive" className="mt-4 w-full justify-center">Attention Required</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 mt-4">
            {weekly && weekly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    tickFormatter={(val) => formatDate(val).split(',')[0]}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="taken" stackId="a" radius={[0, 0, 4, 4]}>
                    {weekly.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--success))" />
                    ))}
                  </Bar>
                  <Bar dataKey="missed" stackId="a" radius={[4, 4, 0, 0]}>
                    {weekly.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--destructive))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-success"></span> Taken</div>
            <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-destructive"></span> Missed</div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-semibold font-heading mb-4">Detailed History</h3>
        <Card className="overflow-hidden">
          <div className="divide-y">
            {logsLoading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading logs...</div>
            ) : !logs || logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No adherence history yet.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      log.status === 'taken' ? 'bg-success/10 text-success' :
                      log.status === 'missed' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {log.status === 'taken' ? <CheckCircle2 className="w-5 h-5" /> :
                       log.status === 'missed' ? <XCircle className="w-5 h-5" /> :
                       <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{log.medicationName}</h4>
                      <div className="text-sm text-muted-foreground flex gap-2">
                        <span>Scheduled: {formatTime(log.scheduledAt)}</span>
                        {log.confirmedAt && (
                          <>
                            <span>•</span>
                            <span>Taken: {formatTime(log.confirmedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Badge variant={log.status === 'taken' ? 'success' : log.status === 'missed' ? 'destructive' : 'outline'} className="capitalize px-3 py-1">
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
