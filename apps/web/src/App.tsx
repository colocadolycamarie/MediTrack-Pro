import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { Suspense, lazy, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageSpinner } from '@/components/PageSpinner';
import { bootstrapAuthToken } from '@/lib/auth-token';
import { setBaseUrl, setUnauthorizedHandler } from '@meditrack/api-client-react';

// Pages — the landing page loads eagerly since it's almost always the first
// paint; everything else is route-split so a first-time visitor isn't paying
// for the dashboard, dispenser pairing flow, etc. before they've even signed up.
import Landing from '@/pages/Landing';
const Register = lazy(() => import('@/pages/Register'));
const Login = lazy(() => import('@/pages/Login'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Medications = lazy(() => import('@/pages/Medications'));
const Dispenser = lazy(() => import('@/pages/Dispenser'));
const Adherence = lazy(() => import('@/pages/Adherence'));
const EmergencyQR = lazy(() => import('@/pages/EmergencyQR'));
const Settings = lazy(() => import('@/pages/Settings'));
const EmergencyProfile = lazy(() => import('@/pages/EmergencyProfile'));
const AddPatient = lazy(() => import('@/pages/AddPatient'));
const WatchUI = lazy(() => import('@/pages/WatchUI'));
const NotFound = lazy(() => import('@/pages/not-found'));

// When the frontend and API are deployed separately (e.g. this app on
// Vercel, the API on Render), relative `/api/...` requests would resolve
// against the Vercel domain instead of the actual backend. VITE_API_URL
// points requests at the real backend; when unset (local dev, or the API
// served from the same origin) requests stay relative as before.
setBaseUrl(import.meta.env.VITE_API_URL || null);
bootstrapAuthToken();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

/** Registers the 401 -> logout bridge once we have access to context + router. */
function SessionWatcher() {
  const { logout } = useApp();
  const [, setLocation] = useLocation();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      queryClient.clear();
      setLocation('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, setLocation]);

  return null;
}

function Router() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/emergency/:token" component={EmergencyProfile} />
        <Route path="/watch" component={WatchUI} />

        <Route path="/onboarding/add-patient">
          <ProtectedRoute requirePatient={false}><AddPatient /></ProtectedRoute>
        </Route>

        {/* Protected routes: patient-scoped, wrapped in the layout */}
        <Route path="/dashboard">
          <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
        </Route>
        <Route path="/patients/:patientId/medications">
          <ProtectedRoute><AppLayout><Medications /></AppLayout></ProtectedRoute>
        </Route>
        <Route path="/patients/:patientId/dispenser">
          <ProtectedRoute><AppLayout><Dispenser /></AppLayout></ProtectedRoute>
        </Route>
        <Route path="/patients/:patientId/adherence">
          <ProtectedRoute><AppLayout><Adherence /></AppLayout></ProtectedRoute>
        </Route>
        <Route path="/patients/:patientId/emergency-qr">
          <ProtectedRoute><AppLayout><EmergencyQR /></AppLayout></ProtectedRoute>
        </Route>
        <Route path="/patients/:patientId/settings">
          <ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <MotionConfig reducedMotion="user">
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <SessionWatcher />
              <Router />
            </WouterRouter>
            <Toaster />
          </MotionConfig>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
