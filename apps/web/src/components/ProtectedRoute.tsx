import { useEffect } from "react";
import { useLocation } from "wouter";
import { useListPatients, getListPatientsQueryKey } from "@meditrack/api-client-react";
import { useApp } from "@/contexts/AppContext";
import { ShieldAlert } from "lucide-react";

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="bg-primary text-primary-foreground p-3 rounded-2xl animate-pulse">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <p className="text-muted-foreground font-medium">Loading your account…</p>
    </div>
  );
}

/**
 * Wraps every authenticated screen. Handles three concerns that previously
 * had no real implementation:
 *  1. Redirect to /login if there's no session at all.
 *  2. Redirect brand-new caregivers with zero linked patients to onboarding
 *     instead of showing a broken dashboard for a patient they don't own.
 *  3. Keep the active patient in sync with what the caregiver actually has
 *     access to (falls back to the first patient if the stored id is stale).
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
    if (patients.length === 0) {
      if (requirePatient && location !== "/onboarding/add-patient") {
        setLocation("/onboarding/add-patient");
      }
      return;
    }
    if (patients.length > 0 && location === "/onboarding/add-patient") {
      setLocation("/dashboard");
      return;
    }
    const stillValid = patients.some((p) => p.id === patientId);
    if (!stillValid) {
      setPatientId(patients[0].id);
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
    // Onboarding screen: just needs auth to have resolved.
    if (patients && patients.length > 0) return <FullScreenLoader />; // redirecting to /dashboard
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
