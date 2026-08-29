import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity, Clock, Settings, Pill, LogOut,
  LayoutDashboard, QrCode, ChevronDown, Check, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { Button } from "./ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useLogout, useGetMe, useListPatients, getListPatientsQueryKey } from "@meditrack/api-client-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { t, patientId, setPatientId, logout: clearSession } = useApp();
  const logoutMut = useLogout();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const { data: patients } = useListPatients({
    query: { queryKey: getListPatientsQueryKey() },
  });

  const activePatient = patients?.find((p) => p.id === patientId);

  const handleLogout = () => {
    logoutMut.mutate(undefined, {
      // Regardless of whether the network call succeeds, the local session
      // must be cleared — previously the token stayed in localStorage forever
      // and the API client kept sending it on every subsequent request.
      onSettled: () => {
        clearSession();
        queryClient.clear();
        setLocation("/");
      },
    });
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Pill, label: "Medications", href: `/patients/${patientId}/medications` },
    { icon: Activity, label: "Dispenser", href: `/patients/${patientId}/dispenser` },
    { icon: Clock, label: "Adherence", href: `/patients/${patientId}/adherence` },
    { icon: QrCode, label: "Emergency QR", href: `/patients/${patientId}/emergency-qr` },
    { icon: Settings, label: "Settings", href: `/patients/${patientId}/settings` },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-card border-r shadow-sm print:hidden">
        <div className="p-6 border-b">
          <Logo href="/dashboard" markSize="md" textClassName="text-xl" />
        </div>

        {patients && patients.length > 0 && (
          <div className="px-4 pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                  aria-label="Switch patient"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-semibold font-heading shrink-0">
                    {activePatient?.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Caring for</div>
                    <div className="text-sm font-bold truncate">{activePatient?.name ?? "Select patient"}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Patients</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {patients.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => setPatientId(p.id)} className="gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.id === patientId && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/onboarding/add-patient")} className="gap-2">
                  <UserPlus className="w-4 h-4" /> Add another patient
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href) && (item.href !== "/dashboard" || location === "/dashboard");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 pl-3.5 pr-4 py-3 rounded-xl transition-colors text-sm font-semibold border-l-[3px]",
                  isActive
                    ? "bg-primary/8 border-l-primary text-primary"
                    : "border-l-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <item.icon className="w-5 h-5" />
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="px-4 py-3 mb-2 rounded-lg bg-muted/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold font-heading">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
            disabled={logoutMut.isPending}
          >
            <LogOut className="w-5 h-5 mr-3" />
            {logoutMut.isPending ? "Signing out…" : t("Log Out")}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-card border-b z-20 print:hidden">
          <Logo href="/dashboard" markSize="sm" textClassName="text-lg" />
          <div className="flex items-center gap-1">
            {patients && patients.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Switch patient">
                    <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-xs">
                      {activePatient?.name?.charAt(0) ?? "?"}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Patients</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {patients.map((p) => (
                    <DropdownMenuItem key={p.id} onClick={() => setPatientId(p.id)} className="gap-2">
                      <span className="flex-1 truncate">{p.name}</span>
                      {p.id === patientId && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Link href={`/patients/${patientId}/settings`}>
              <Button variant="ghost" size="icon" aria-label={t("Settings")}>
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} disabled={logoutMut.isPending} aria-label="Log out">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pb-24 md:pb-12 print:p-0 print:overflow-visible">
          <div className="max-w-6xl mx-auto w-full print:max-w-none">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav — 5 primary destinations; Settings lives in the header above instead of a 6th cramped tab */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around p-2 pb-safe z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] print:hidden">
        {navItems.filter((item) => item.label !== "Settings").map((item) => {
          const isActive = location.startsWith(item.href) && (item.href !== "/dashboard" || location === "/dashboard");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg min-w-[4rem]",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium leading-none">{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
