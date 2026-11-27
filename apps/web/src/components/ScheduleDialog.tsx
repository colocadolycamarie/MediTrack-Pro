import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSchedules,
  getListSchedulesQueryKey,
  useCreateSchedule,
  useDeleteSchedule,
  getListMedicationsQueryKey,
  getGetDashboardSummaryQueryKey,
  ScheduleInputDaysOfWeekItem,
  type Medication,
  type Schedule,
} from "@dosemate/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Utensils, Trash2, Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DAYS: { id: ScheduleInputDaysOfWeekItem; label: string }[] = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

const MEAL_OPTIONS = [
  { value: "before_breakfast", label: "Before breakfast", approx: "≈ 6:30 AM" },
  { value: "after_breakfast", label: "After breakfast", approx: "≈ 7:30 AM" },
  { value: "before_lunch", label: "Before lunch", approx: "≈ 11:30 AM" },
  { value: "after_lunch", label: "After lunch", approx: "≈ 12:30 PM" },
  { value: "before_dinner", label: "Before dinner", approx: "≈ 5:30 PM" },
  { value: "after_dinner", label: "After dinner", approx: "≈ 6:30 PM" },
] as const;

function formatClock(hhmm: string | null | undefined): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? "");
  if (!m) return "—";
  const h = Number(m[1]);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${suffix}`;
}

export function describeSchedule(s: Schedule): string {
  if (s.timeType === "clock") return formatClock(s.clockTime);
  const meal = MEAL_OPTIONS.find((o) => o.value === s.mealRelation);
  return meal ? `${meal.label} (${meal.approx})` : "Meal-based";
}

export function describeDays(days: string[] | undefined): string {
  if (!days || days.length === 0 || days.length === 7) return "Every day";
  return DAYS.filter((d) => days.includes(d.id)).map((d) => d.label).join(", ");
}

function errorMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: { error?: string } } | null)?.data;
  return data?.error ?? (err instanceof Error ? err.message : fallback);
}

interface ScheduleDialogProps {
  patientId: number;
  medication: Medication | null;
  onClose: () => void;
}

export function ScheduleDialog({ patientId, medication, onClose }: ScheduleDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const medicationId = medication?.id ?? 0;

  const { data: schedules, isLoading } = useListSchedules(patientId, medicationId, {
    query: { queryKey: getListSchedulesQueryKey(patientId, medicationId), enabled: medicationId > 0 },
  });
  const createMut = useCreateSchedule();
  const deleteMut = useDeleteSchedule();

  const [mode, setMode] = useState<"clock" | "meal_relative">("clock");
  const [time, setTime] = useState("08:00");
  const [meal, setMeal] = useState<string>("after_breakfast");
  const [days, setDays] = useState<ScheduleInputDaysOfWeekItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey(patientId, medicationId) });
    queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(patientId) });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey(patientId) });
  };

  const toggleDay = (id: ScheduleInputDaysOfWeekItem) =>
    setDays((cur) => (cur.includes(id) ? cur.filter((d) => d !== id) : [...cur, id]));

  const handleAdd = () => {
    setError(null);
    if (mode === "clock" && !/^\d{2}:\d{2}$/.test(time)) {
      setError("Pick a time for this dose.");
      return;
    }
    createMut.mutate(
      {
        patientId,
        medicationId,
        data:
          mode === "clock"
            ? { timeType: "clock", clockTime: time, daysOfWeek: days }
            : { timeType: "meal_relative", mealRelation: meal as never, daysOfWeek: days },
      },
      {
        onSuccess: () => {
          refresh();
          setDays([]);
          toast({ title: "Schedule added", description: `${medication?.name} will show up on the dashboard at that time.` });
        },
        onError: (err) => setError(errorMessage(err, "Couldn't save that schedule. Please try again.")),
      },
    );
  };

  const handleDelete = (scheduleId: number) => {
    deleteMut.mutate(
      { patientId, medicationId, scheduleId },
      {
        onSuccess: refresh,
        onError: (err) => toast({ title: "Couldn't remove schedule", description: errorMessage(err, "Please try again."), variant: "destructive" }),
      },
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={medication != null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dosing schedule — {medication?.name}</DialogTitle>
          <DialogDescription>
            {medication?.dosage} · Funnel {medication?.funnelNumber}. Add one entry for each time of day this medicine is taken.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Current schedule</h4>
          {isLoading ? (
            <div className="h-14 bg-muted animate-pulse rounded-lg" />
          ) : !schedules || schedules.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-4">
              No times set yet. Until you add one, this medicine won't appear on the dashboard or be dispensed on schedule.
            </div>
          ) : (
            <ul className="divide-y border rounded-lg">
              {schedules.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {s.timeType === "clock" ? <Clock className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{describeSchedule(s)}</div>
                      <div className="text-sm text-muted-foreground">{describeDays(s.daysOfWeek)}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDelete(s.id)}
                    disabled={deleteMut.isPending}
                    aria-label={`Remove ${describeSchedule(s)} schedule`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4 border-t pt-5">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Add a time</h4>

          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Schedule type">
            {([
              { id: "clock", label: "At a set time", icon: Clock },
              { id: "meal_relative", label: "With meals", icon: Utensils },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={mode === opt.id}
                onClick={() => setMode(opt.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  mode === opt.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                <opt.icon className="w-4 h-4" /> {opt.label}
              </button>
            ))}
          </div>

          {mode === "clock" ? (
            <div className="space-y-1.5">
              <Label htmlFor="schedule-time">Time</Label>
              <Input id="schedule-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 max-w-40" />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="schedule-meal">Meal</Label>
              <Select value={meal} onValueChange={setMeal}>
                <SelectTrigger id="schedule-meal" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label} ({o.approx})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Meal times use the defaults 7:00 AM breakfast, 12:00 PM lunch and 6:00 PM dinner, shifted 30 minutes before or after.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Days</Label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Days of the week">
              {DAYS.map((d) => {
                const on = days.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDay(d.id)}
                    className={cn(
                      "h-10 min-w-12 px-3 rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      on ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {days.length === 0 ? "No days selected — this will repeat every day." : `Repeats on: ${describeDays(days)}.`}
            </p>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleAdd} disabled={createMut.isPending} className="gap-2">
              <Plus className="w-4 h-4" /> {createMut.isPending ? "Saving…" : "Add time"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
