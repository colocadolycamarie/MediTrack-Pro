import { useApp } from "@/contexts/AppContext";
import {
  useListDevices,
  getListDevicesQueryKey,
  useGetDevice,
  getGetDeviceQueryKey,
  useManualDispense,
  usePairDevice,
  useGetDeviceLogs,
  getGetDeviceLogsQueryKey,
  ApiError,
} from "@meditrack/api-client-react";
import type { Funnel } from "@meditrack/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Activity, Power, Wifi, AlertCircle, RefreshCw, KeyRound, Terminal, CheckCircle2 } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Dispenser() {
  const { patientId, t } = useApp();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dispensePin, setDispensePin] = useState("");
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [dispenseError, setDispenseError] = useState<string | null>(null);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [pairForm, setPairForm] = useState({ deviceCode: "", ssid: "", wifiPassword: "", nickname: "" });
  const [pairError, setPairError] = useState<string | null>(null);

  const { data: devices, isLoading: devicesLoading } = useListDevices(patientId);
  const deviceId = devices?.[0]?.id;

  const { data: device, isLoading: deviceLoading, refetch: refetchDevice, isFetching: isRefreshingDevice } = useGetDevice(patientId, deviceId ?? 0, {
    query: { queryKey: getGetDeviceQueryKey(patientId, deviceId ?? 0), enabled: deviceId != null },
  });

  const { data: logs } = useGetDeviceLogs(patientId, deviceId ?? 0, {
    query: { queryKey: getGetDeviceLogsQueryKey(patientId, deviceId ?? 0), enabled: deviceId != null },
  });

  const dispenseMut = useManualDispense();
  const pairMut = usePairDevice();

  const handlePairDevice = () => {
    setPairError(null);
    if (!pairForm.deviceCode || !pairForm.ssid || !pairForm.wifiPassword) {
      setPairError("Fill in the device code, Wi-Fi network, and password.");
      return;
    }
    pairMut.mutate(
      { patientId, data: { ...pairForm, nickname: pairForm.nickname || undefined } },
      {
        onSuccess: (paired) => {
          setIsPairModalOpen(false);
          setPairForm({ deviceCode: "", ssid: "", wifiPassword: "", nickname: "" });
          toast({ title: "Dispenser paired", description: `${paired.nickname} is now connected.` });
          queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey(patientId) });
        },
        onError: (err: unknown) => {
          setPairError(err instanceof Error ? err.message : "Couldn't pair the device. Check the code and try again.");
        },
      },
    );
  };

  const handleDispense = () => {
    if (!selectedFunnel?.medicationId || !dispensePin || deviceId == null) return;
    setDispenseError(null);

    dispenseMut.mutate(
      {
        patientId,
        deviceId,
        data: {
          medicationId: selectedFunnel.medicationId,
          pin: dispensePin,
          funnelNumber: selectedFunnel.number,
        },
      },
      {
        onSuccess: () => {
          setDispensePin("");
          setIsDispenseModalOpen(false);
          setSelectedFunnel(null);
          toast({
            title: "Dose dispensed",
            description: `Funnel ${selectedFunnel.number} released ${selectedFunnel.medicationName ?? "a dose"}.`,
          });
          queryClient.invalidateQueries({ queryKey: getGetDeviceQueryKey(patientId, deviceId) });
          queryClient.invalidateQueries({ queryKey: getGetDeviceLogsQueryKey(patientId, deviceId) });
        },
        onError: (err: unknown) => {
          if (err instanceof ApiError && err.response.status === 403) {
            setDispenseError("Incorrect PIN. Please try again.");
          } else {
            setDispenseError(err instanceof Error ? err.message : "Couldn't reach the dispenser. Try again.");
          }
        },
      },
    );
  };

  const openDispenseModal = (funnel: Funnel) => {
    setSelectedFunnel(funnel);
    setDispenseError(null);
    setDispensePin("");
    setIsDispenseModalOpen(true);
  };

  const funnels = device?.funnels ?? [];

  if (devicesLoading || (deviceId != null && deviceLoading)) {
    return (
      <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading dispenser">
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!devicesLoading && devices?.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold font-heading">{t("Dispenser")}</h1>
          <p className="text-muted-foreground">Manage the IoT device, funnels, and system health.</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="p-12 flex flex-col items-center text-center gap-4">
            <div>
              <h2 className="text-xl font-semibold font-heading">No dispenser paired yet</h2>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Pair a MediTrack dispenser to enable automatic dispensing, funnel monitoring, and manual overrides.
              </p>
            </div>
            <Button className="mt-2 h-12 px-6" onClick={() => setIsPairModalOpen(true)}>Pair a Device</Button>
          </CardContent>
        </Card>

        <Dialog open={isPairModalOpen} onOpenChange={setIsPairModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pair a Dispenser</DialogTitle>
              <DialogDescription>
                Find the device code printed on the base unit, then enter the Wi-Fi network it should join.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {pairError && (
                <div role="alert" className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium rounded-lg p-3">
                  {pairError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="device-code">Device Code</Label>
                <Input id="device-code" placeholder="PUL-8492-X" value={pairForm.deviceCode}
                  onChange={(e) => setPairForm((f) => ({ ...f, deviceCode: e.target.value }))} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nickname">Nickname <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="nickname" placeholder="Living Room Dispenser" value={pairForm.nickname}
                  onChange={(e) => setPairForm((f) => ({ ...f, nickname: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ssid">Wi-Fi Network</Label>
                  <Input id="ssid" placeholder="Home_WiFi" value={pairForm.ssid}
                    onChange={(e) => setPairForm((f) => ({ ...f, ssid: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wifi-password">Wi-Fi Password</Label>
                  <Input id="wifi-password" type="password" value={pairForm.wifiPassword}
                    onChange={(e) => setPairForm((f) => ({ ...f, wifiPassword: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPairModalOpen(false)}>Cancel</Button>
              <Button onClick={handlePairDevice} disabled={pairMut.isPending}>
                {pairMut.isPending ? "Pairing…" : "Pair Device"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold font-heading">{t("Dispenser")}</h1>
        <p className="text-muted-foreground">Manage the IoT device, funnels, and system health.</p>
      </div>

      <div className="relative overflow-hidden rounded-[28px] bg-panel-ink border border-[#0B2624] shadow-[0_1px_2px_rgba(10,53,53,0.04),0_20px_40px_-24px_rgba(14,79,79,0.35)] p-6 sm:p-8">
        <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
              device?.status === 'online' ? 'bg-success/10 border-success/30 text-success' :
              device?.status === 'error' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
              'bg-white/5 border-white/15 text-gintong-digit/60'
            }`}>
              <Power className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-semibold text-gintong-digit">{device?.nickname || "MediTrack Dispenser"}</h2>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <Badge variant={device?.status === 'online' ? 'success' : 'destructive'} className="uppercase">
                  {device?.status || 'Unknown'}
                </Badge>
                <span className="text-sm text-gintong-digit/50 flex items-center gap-1.5 font-mono">
                  <Terminal className="w-4 h-4" /> {device?.deviceCode || "PUL-8492-X"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl min-w-[120px]">
              <div className="text-[10px] font-semibold text-gintong-digit/50 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5" /> Signal
              </div>
              <div className="font-mono font-bold text-lg text-gintong-digit">{device?.wifiStrength || 85}%</div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-auto w-14 shrink-0 rounded-xl bg-white/5 border-white/15 text-gintong-digit hover:bg-white/10 hover:text-gintong-digit"
              onClick={() => refetchDevice()}
              disabled={isRefreshingDevice}
              aria-label="Refresh signal status"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshingDevice ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold font-heading mb-4">Funnel Map</h3>
        {/* One integrated faceplate, not a scattered card grid — funnels are physical slots on the same unit. */}
        <div className="rounded-2xl border border-card-border bg-card p-2 shadow-[0_1px_2px_rgba(10,53,53,0.04),0_10px_28px_-16px_rgba(14,79,79,0.18)]">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-border">
            {funnels.map((funnel: Funnel) => (
              <div key={funnel.number} className="p-4 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-bold font-mono text-muted-foreground text-xs">
                      {funnel.number}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      funnel.status === 'jam' ? 'bg-destructive animate-pulse' :
                      funnel.status === 'low' ? 'bg-accent' :
                      funnel.status === 'empty' && funnel.medicationId ? 'bg-destructive' :
                      funnel.medicationId ? 'bg-success' : 'bg-muted-foreground/30'
                    }`} />
                  </div>
                  {funnel.status === 'jam' && <Badge variant="destructive" className="animate-pulse">JAM</Badge>}
                  {funnel.status === 'low' && <Badge variant="warning">LOW</Badge>}
                  {funnel.status === 'ok' && funnel.medicationId && <Badge variant="success">OK</Badge>}
                </div>

                <div>
                  <div className="font-semibold leading-tight mb-1 text-sm">
                    {funnel.medicationName || <span className="text-muted-foreground italic font-normal">Empty</span>}
                  </div>
                  {funnel.medicationId && (
                    <div className="text-sm font-mono text-muted-foreground">
                      {funnel.stockCount} pills
                    </div>
                  )}
                </div>

                <Button
                  variant={funnel.medicationId ? "outline" : "ghost"}
                  size="sm"
                  className="w-full mt-auto"
                  disabled={!funnel.medicationId || funnel.status === 'jam'}
                  onClick={() => openDispenseModal(funnel)}
                >
                  {t("Dispense Now")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold font-heading mb-4">System Logs</h3>
        <Card className="overflow-hidden rounded-2xl">
          <div className="bg-panel-ink px-4 py-2.5 flex items-center gap-2 text-gintong-digit/50 text-xs font-mono uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-destructive/60" />
            <span className="w-2 h-2 rounded-full bg-accent/60" />
            <span className="w-2 h-2 rounded-full bg-success/60" />
            <span className="ml-2">device.log</span>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto font-mono text-sm">
            {logs?.map((log) => (
              <div key={log.id} className="p-4 flex gap-4 items-start hover:bg-muted/30 transition-colors">
                <div className="shrink-0 text-muted-foreground">
                  {formatTime(log.timestamp)}
                </div>
                <div className="flex-1">
                  <span className={`font-bold mr-2 ${
                    log.event === 'error' || log.event === 'jam' ? 'text-destructive' :
                    log.event === 'missed' ? 'text-accent' : 'text-primary'
                  }`}>
                    [{log.event.toUpperCase()}]
                  </span>
                  {log.message}
                  {log.funnelNumber && <span className="ml-2 text-muted-foreground">(Funnel {log.funnelNumber})</span>}
                </div>
              </div>
            )) || (
              <div className="p-8 text-center text-muted-foreground font-sans">No recent logs</div>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={isDispenseModalOpen} onOpenChange={setIsDispenseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-accent" /> Manual Dispense
            </DialogTitle>
            <DialogDescription>
              This action requires caregiver authorization. Enter your 4-digit PIN to force funnel {selectedFunnel?.number} to dispense one dose.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            {dispenseError && (
              <div role="alert" className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium rounded-lg p-3">
                {dispenseError}
              </div>
            )}
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                type="password" 
                maxLength={4} 
                className="pl-10 text-2xl tracking-[1em] font-mono h-14" 
                placeholder="••••"
                value={dispensePin}
                onChange={(e) => { setDispensePin(e.target.value.replace(/[^0-9]/g, '')); setDispenseError(null); }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDispenseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleDispense} disabled={dispensePin.length < 4 || dispenseMut.isPending}>
              {dispenseMut.isPending ? "Authenticating..." : "Authorize Dispense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
