import { useApp } from "@/contexts/AppContext";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useConfirmDose,
  getGetAdherenceSummaryQueryKey,
  getGetWeeklyAdherenceQueryKey,
  getListAdherenceLogsQueryKey,
  getGetAdherenceTrendsQueryKey,
} from "@meditrack/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Readout } from "@/components/ui/readout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, XCircle, Pill, Check, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { formatTime } from "@/lib/utils";

export default function Dashboard() {
  const { patientId, t } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use options object to pass queryKey properly as required by Orval
  const { data: summary, isLoading } = useGetDashboardSummary(patientId, {
    query: { queryKey: getGetDashboardSummaryQueryKey(patientId) }
  });

  const confirmMut = useConfirmDose();

  const handleMarkTaken = (doseEventId: number, medicationName: string) => {
    confirmMut.mutate(
      { patientId, doseEventId, data: { confirmedAt: new Date().toISOString(), method: "tap" } },
      {
        onSuccess: () => {
          toast({ title: "Dose confirmed", description: `${medicationName} marked as taken.` });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey(patientId) });
          queryClient.invalidateQueries({ queryKey: getGetAdherenceSummaryQueryKey(patientId) });
          queryClient.invalidateQueries({ queryKey: getGetWeeklyAdherenceQueryKey(patientId) });
          queryClient.invalidateQueries({ queryKey: getListAdherenceLogsQueryKey(patientId) });
          queryClient.invalidateQueries({ queryKey: getGetAdherenceTrendsQueryKey(patientId) });
        },
        onError: (err: unknown) => {
          toast({
            variant: "destructive",
            title: "Couldn't confirm dose",
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
        <div className="h-10 w-64 bg-muted rounded-lg animate-pulse" />
        <div className="h-40 bg-muted rounded-2xl animate-pulse" />
        <div className="h-36 bg-muted rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 gap-3">
        <AlertCircle className="w-10 h-10 text-muted-foreground" />
        <p className="font-semibold text-lg">We couldn't load this dashboard</p>
        <p className="text-muted-foreground max-w-sm">Check your connection and refresh the page. If this keeps happening, contact support.</p>
      </div>
    );
  }

  const formatCountdown = (minutes: number | null | undefined) => {
    if (minutes === null || minutes === undefined) return "--:--";
    if (minutes < 0) return "DUE";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const dosesToday = summary.dosesToday || 0;
  const dosesTaken = summary.dosesTakenToday || 0;
  const progressPct = dosesToday ? Math.round((dosesTaken / dosesToday) * 100) : 0;

  // Circular gauge geometry — a calm alternative to a linear progress bar.
  const RADIUS = 42;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE - (progressPct / 100) * CIRCUMFERENCE;

  const statusStyles: Record<string, { dot: string; ring: string; label: string }> = {
    pending: { dot: "bg-muted-foreground/40", ring: "border-border", label: "Upcoming" },
    taken: { dot: "bg-success", ring: "border-success/40 bg-success/5", label: "Taken" },
    missed: { dot: "bg-destructive", ring: "border-destructive/40 bg-destructive/5", label: "Missed" },
    overdue: { dot: "bg-destructive", ring: "border-destructive bg-destructive/10", label: "Overdue" },
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-heading font-semibold mb-2">Hello, {summary.patientName}</h1>
        <p className="text-muted-foreground text-lg">Here's your medication status for today.</p>
      </div>

      {/* Critical Alerts (Trend Flags) */}
      {summary.trendFlags && summary.trendFlags.length > 0 && (
        <div className="space-y-3">
          {summary.trendFlags.map(flag => (
            <div key={flag.id} className={`p-4 rounded-2xl border flex items-start gap-4 ${
              flag.severity === 'critical' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
              flag.severity === 'warning' ? 'bg-accent/10 border-accent/20 text-accent-foreground' :
              'bg-primary/5 border-primary/20 text-foreground'
            }`}>
              {flag.severity === 'critical' ? <XCircle className="w-6 h-6 shrink-0 mt-0.5" /> :
               flag.severity === 'warning' ? <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-accent" /> :
               <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-primary" />}
              <div>
                <div className="font-bold">{flag.message}</div>
                <div className="text-sm opacity-80 mt-1">Detected today</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instrument row — next dose readout, today's ring, device status. Calm, not stat-card noise. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr_1fr] gap-5">
        <div className="rounded-2xl border border-card-border bg-card p-6 flex flex-col justify-between shadow-[0_1px_2px_rgba(10,53,53,0.04),0_10px_28px_-16px_rgba(14,79,79,0.18)]">
          <div className="text-sm font-semibold text-muted-foreground mb-4">Next dose in</div>
          <Readout
            value={formatCountdown(summary.minutesUntilNextDose)}
            size="lg"
            className={summary.minutesUntilNextDose != null && summary.minutesUntilNextDose < 60 ? "ring-2 ring-accent/30" : ""}
          />
          {summary.nextDoseAt && (
            <div className="mt-4 text-center text-sm font-semibold text-muted-foreground">
              Scheduled for {formatTime(summary.nextDoseAt)}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 flex flex-col items-center justify-center shadow-[0_1px_2px_rgba(10,53,53,0.04),0_10px_28px_-16px_rgba(14,79,79,0.18)]">
          <div className="text-sm font-semibold text-muted-foreground mb-4 self-start">Today's progress</div>
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
              <circle
                cx="50" cy="50" r={RADIUS} fill="none"
                stroke="hsl(var(--success))" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-heading font-semibold">{dosesTaken}<span className="text-muted-foreground text-base">/{dosesToday}</span></div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-0.5">Doses</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-[0_1px_2px_rgba(10,53,53,0.04),0_10px_28px_-16px_rgba(14,79,79,0.18)]">
          <div className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Dispenser status
          </div>
          <div className="flex items-center gap-3 mb-5">
            <span className="relative flex h-2.5 w-2.5">
              {summary.deviceStatus === 'online' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${summary.deviceStatus === 'online' ? 'bg-success' : 'bg-destructive'}`} />
            </span>
            <span className="text-lg font-heading font-semibold capitalize">{summary.deviceStatus}</span>
          </div>

          {summary.stockAlerts && summary.stockAlerts.length > 0 ? (
            <div className="space-y-2.5">
              {summary.stockAlerts.map((alert, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-2.5 rounded-xl bg-accent/10 text-accent-foreground border border-accent/20">
                  <span className="font-semibold truncate">{alert.medicationName}</span>
                  <Badge variant="warning" className="shrink-0 ml-2">{alert.daysRemaining}d left</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-success bg-success/10 p-2.5 rounded-xl border border-success/20 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> All funnels stocked
            </div>
          )}
        </div>
      </div>

      {/* Blister strip — today's doses rendered the way they physically sit in a blister pack.
          This is the dashboard's signature: not another card grid, a literal medication strip. */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-semibold">Today's strip</h2>
          <Link href={`/patients/${patientId}/medications`} className="text-primary font-semibold text-sm hover:underline">
            View all medications
          </Link>
        </div>

        {summary.upcomingDoses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground bg-card">
            {t("No medications yet. Add the first one to start the dispensing schedule.")}
          </div>
        ) : (
          <div className="rounded-2xl border border-card-border bg-card p-5 md:p-6 shadow-[0_1px_2px_rgba(10,53,53,0.04),0_10px_28px_-16px_rgba(14,79,79,0.18)]">
            <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
              {summary.upcomingDoses.map((dose, i) => {
                const style = statusStyles[dose.status] ?? statusStyles.pending;
                const isNext = dose.status === 'pending' && i === summary.upcomingDoses.findIndex(d => d.status === 'pending');
                const isActionable = dose.status === 'pending' || dose.status === 'overdue';
                const isConfirmingThis = confirmMut.isPending && confirmMut.variables?.doseEventId === dose.doseEventId;
                return (
                  <div
                    key={dose.doseEventId}
                    className={`relative shrink-0 snap-start w-[148px] rounded-[20px] border-2 ${style.ring} p-4 flex flex-col items-center text-center transition-transform ${isNext ? 'border-primary bg-primary/5 -translate-y-1 shadow-md' : ''}`}
                  >
                    <div className="font-mono text-sm font-semibold text-foreground">{formatTime(dose.scheduledAt)}</div>
                    <div className={`mt-3 mb-2 w-11 h-11 rounded-full flex items-center justify-center ${
                      dose.status === 'taken' ? 'bg-success/15 text-success' :
                      dose.status === 'missed' || dose.status === 'overdue' ? 'bg-destructive/15 text-destructive' :
                      isNext ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Pill className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-semibold leading-tight line-clamp-2">{dose.medicationName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{dose.dosage}</div>
                    <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                      dose.status === 'taken' ? 'text-success' :
                      dose.status === 'missed' || dose.status === 'overdue' ? 'text-destructive' :
                      isNext ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {dose.status === 'overdue' ? 'Overdue' : style.label}
                    </div>

                    {isActionable && (
                      <Button
                        size="sm"
                        variant={dose.status === 'overdue' ? 'default' : 'outline'}
                        className="mt-3 w-full h-11 text-xs font-semibold"
                        disabled={confirmMut.isPending}
                        onClick={() => handleMarkTaken(dose.doseEventId, dose.medicationName)}
                        aria-label={`Mark ${dose.medicationName} as taken`}
                      >
                        {isConfirmingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" /> Mark taken
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
