import { useEffect } from "react";
import { useLocation } from "wouter";
import { useListPatients, getListPatientsQueryKey } from "@meditrack/api-client-react";
import { useApp } from "@/contexts/AppContext";
import { ShieldAlert } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Spinner className="size-8 text-muted-foreground" />
      <p className="text-muted-foreground font-medium">Loading your account…</p>
    </div>
  );
}

/**
 * Wraps every authenticated screen. Handles three concerns:
 *  1. Redirect to /login if there's no session at all.
 *  2. Redirect brand-new caregivers with zero linked patients to onboarding
 *     instead of showing a broken dashboard for a patient they don't own.
 *  3. Keep the active patient in sync with what the caregiver actually has
 *     access to (falls back to the first patient if the stored id is stale).
 *
 * Important: /onboarding/add-patient (requirePatient=false) is reachable in
 * two situations — brand-new caregivers with zero patients, AND existing
 * caregivers deliberately adding another patient from the sidebar. This
 * component must never force caregivers who already have patients away from
 * that route, or "Add another patient" breaks.
 */
export function ProtectedRoute({ children, requirePatient = true }: { children: React.ReactNode; requirePatient?: boolean }) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, patientId, setPatientId } = useApp();

  const { data: patients, isLoading, isError } = useListPatients({
    query: { enabled: isAuthenticated, queryKey: getListPatientsQueryKey() },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation(`/login?redirect=${encodeURIComponent(location)}`);
    }
  }, [isAuthenticated, location, setLocation]);

  useEffect(() => {
    if (!patients) return;
    if (requirePatient && patients.length === 0 && location !== "/onboarding/add-patient") {
      setLocation("/onboarding/add-patient");
      return;
    }
    if (patients.length > 0) {
      const stillValid = patients.some((p) => p.id === patientId);
      if (!stillValid) {
        setPatientId(patients[0].id);
      }
    }
  }, [patients, patientId, setPatientId, location, setLocation, requirePatient]);

  if (!isAuthenticated) {
    return <FullScreenLoader />;
  }

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 p-6 text-center">
        <ShieldAlert className="w-10 h-10 text-destructive" />
        <p className="font-semibold text-lg">Couldn't load your account</p>
        <p className="text-muted-foreground max-w-sm">
          Check your connection and try again. If this keeps happening, sign out and back in.
        </p>
      </div>
    );
  }

  if (!requirePatient) {
    // Onboarding / "add another patient" screen: just needs auth + the
    // patients list to have resolved. Landing here with existing patients
    // is expected (adding another one), so we render normally either way.
    return <>{children}</>;
  }

  if (!patients || patients.length === 0) {
    return <FullScreenLoader />;
  }

  if (!patients.some((p) => p.id === patientId)) {
    // waiting for the effect above to settle on a valid patient
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}
