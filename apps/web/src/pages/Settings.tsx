import { useApp } from "@/contexts/AppContext";
import {
  useGetNotificationSettings,
  useUpdateNotificationSettings,
  getGetNotificationSettingsQueryKey,
  useListPatientCaregivers,
  getListPatientCaregiversQueryKey,
  useInviteCaregiver,
  useRemoveCaregiver,
  CaregiverInviteInputAccessLevel,
  type NotificationSettings,
} from "@meditrack/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bell, Smartphone, Globe, Eye, UserCog, AlertCircle, Plus, Trash2, Mail, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type SettingsTab = "preferences" | "accessibility" | "notifications" | "care-circle";

const TABS: { id: SettingsTab; label: string; icon: typeof Globe }[] = [
  { id: "preferences", label: "Preferences", icon: Globe },
  { id: "accessibility", label: "Accessibility", icon: Eye },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "care-circle", label: "Care Circle", icon: UserCog },
];

export default function Settings() {
  const { patientId, language, setLanguage, largerTextEnabled, setLargerTextEnabled, highContrastEnabled, setHighContrastEnabled, t } = useApp();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");

  const { data: settings } = useGetNotificationSettings(patientId, {
    query: { queryKey: getGetNotificationSettingsQueryKey(patientId) },
  });

  const updateMut = useUpdateNotificationSettings();

  // Local state for optimistic UI updates
  const [localSettings, setLocalSettings] = useState<NotificationSettings | undefined>(settings);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  function handleToggle<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    if (!localSettings) return;
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);

    // Also update global context if accessibility/language changes
    if (key === "language") setLanguage(value as "en" | "fil");
    if (key === "largerTextEnabled") setLargerTextEnabled(Boolean(value));
    if (key === "highContrastEnabled") setHighContrastEnabled(Boolean(value));

    updateMut.mutate(
      { patientId, data: { [key]: value } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNotificationSettingsQueryKey(patientId) });
        },
        onError: () => {
          // roll back optimistic update
          setLocalSettings(settings);
        },
      },
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold font-heading">{t("Settings")}</h1>
        <p className="text-muted-foreground">Configure preferences and accessibility.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0" role="tablist" aria-label="Settings sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={cn(
                "flex items-center gap-3 pl-3.5 pr-4 py-2.5 rounded-xl transition-colors text-sm font-semibold shrink-0 border-l-[3px] text-left",
                activeTab === tab.id
                  ? "bg-primary/8 border-l-primary text-primary"
                  : "border-l-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="space-y-8">
          {activeTab === "preferences" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Language & Region</CardTitle>
                <CardDescription>Choose the primary language for the device and dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">System Language</Label>
                    <p className="text-sm text-muted-foreground">Applies to UI and voice alerts.</p>
                  </div>
                  <Select
                    value={language}
                    onValueChange={(val: "en" | "fil") => handleToggle("language", val)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English (US)</SelectItem>
                      <SelectItem value="fil">Filipino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "accessibility" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> Accessibility</CardTitle>
                <CardDescription>Adjust the interface for better visibility.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[70%]">
                    <Label className="text-base">Large Text</Label>
                    <p className="text-sm text-muted-foreground">Increases font size across the entire application.</p>
                  </div>
                  <Switch
                    checked={largerTextEnabled}
                    onCheckedChange={(val) => handleToggle("largerTextEnabled", val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[70%]">
                    <Label className="text-base">High Contrast Mode</Label>
                    <p className="text-sm text-muted-foreground">Maximizes legibility with a stark black and white palette.</p>
                  </div>
                  <Switch
                    checked={highContrastEnabled}
                    onCheckedChange={(val) => handleToggle("highContrastEnabled", val)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle>
                <CardDescription>How caregivers are alerted about medication events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[70%]">
                    <Label className="text-base flex items-center gap-2"><Smartphone className="w-4 h-4" /> Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts on your browser and smartwatch.</p>
                  </div>
                  <Switch
                    checked={localSettings?.pushEnabled ?? true}
                    onCheckedChange={(val) => handleToggle("pushEnabled", val)}
                  />
                </div>
                <div className="flex items-center justify-between border-t pt-6">
                  <div className="space-y-0.5 max-w-[70%]">
                    <Label className="text-base flex items-center gap-2 text-destructive"><AlertCircle className="w-4 h-4" /> Critical SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">Fallback SMS text messages for missed doses or device offline status.</p>
                  </div>
                  <Switch
                    checked={localSettings?.smsEnabled ?? true}
                    onCheckedChange={(val) => handleToggle("smsEnabled", val)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "care-circle" && <CareCircleTab patientId={patientId} />}
        </div>
      </div>
    </div>
  );
}

function CareCircleTab({ patientId }: { patientId: number }) {
  const queryClient = useQueryClient();
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteAccess, setInviteAccess] = useState<CaregiverInviteInputAccessLevel>(CaregiverInviteInputAccessLevel.full);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{ id: number; name: string } | null>(null);

  const { data: caregivers, isLoading } = useListPatientCaregivers(patientId, {
    query: { queryKey: getListPatientCaregiversQueryKey(patientId) },
  });

  const inviteMut = useInviteCaregiver();
  const removeMut = useRemoveCaregiver();

  const handleInvite = () => {
    setInviteError(null);
    if (!inviteEmail.trim()) {
      setInviteError("Enter an email address to invite.");
      return;
    }
    inviteMut.mutate(
      { patientId, data: { email: inviteEmail.trim(), accessLevel: inviteAccess } },
      {
        onSuccess: () => {
          setInviteEmail("");
          setIsInviting(false);
          queryClient.invalidateQueries({ queryKey: getListPatientCaregiversQueryKey(patientId) });
        },
        onError: (err: unknown) => {
          setInviteError(err instanceof Error ? err.message : "Couldn't send the invite. Try again.");
        },
      },
    );
  };

  const handleRemove = () => {
    if (!pendingRemoval) return;
    removeMut.mutate(
      { patientId, caregiverId: pendingRemoval.id },
      {
        onSuccess: () => {
          setPendingRemoval(null);
          queryClient.invalidateQueries({ queryKey: getListPatientCaregiversQueryKey(patientId) });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><UserCog className="w-5 h-5" /> Care Circle</CardTitle>
          <CardDescription>Everyone who can view and manage this patient's medications.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setIsInviting(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" /> Invite
        </Button>
      </CardHeader>
      <CardContent>
        {isInviting && (
          <div className="mb-6 p-4 rounded-xl border bg-muted/30 space-y-3">
            {inviteError && (
              <div role="alert" className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium rounded-lg p-3">
                {inviteError}
              </div>
            )}
            <div className="grid sm:grid-cols-[1fr_160px] gap-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="caregiver@example.com"
                  className="pl-9"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Select value={inviteAccess} onValueChange={(val: CaregiverInviteInputAccessLevel) => setInviteAccess(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={CaregiverInviteInputAccessLevel.full}>Full Access</SelectItem>
                  <SelectItem value={CaregiverInviteInputAccessLevel.view}>View Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setIsInviting(false); setInviteError(null); }}>Cancel</Button>
              <Button size="sm" onClick={handleInvite} disabled={inviteMut.isPending}>
                {inviteMut.isPending ? "Sending…" : "Send Invite"}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : !caregivers || caregivers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No caregivers linked yet. Invite someone to help manage this patient's care.
          </div>
        ) : (
          <div className="divide-y">
            {caregivers.map((cg) => (
              <div key={cg.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold font-heading shrink-0">
                    {cg.caregiverName?.charAt(0) ?? cg.caregiverEmail?.charAt(0) ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{cg.caregiverName ?? cg.caregiverEmail}</div>
                    <div className="text-sm text-muted-foreground truncate">{cg.caregiverEmail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {cg.status === "pending" && (
                    <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>
                  )}
                  <Badge variant={cg.accessLevel === "full" ? "secondary" : "outline"} className="capitalize">
                    {cg.accessLevel === "full" ? "Full Access" : "View Only"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setPendingRemoval({ id: cg.caregiverId, name: cg.caregiverName ?? cg.caregiverEmail ?? "this caregiver" })}
                    aria-label={`Remove ${cg.caregiverName ?? cg.caregiverEmail}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!pendingRemoval} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingRemoval?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll immediately lose access to this patient's medications, schedule, and dispenser controls.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {removeMut.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
