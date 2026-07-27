import { useParams } from "wouter";
import { useGetEmergencyPublicProfile, getGetEmergencyPublicProfileQueryKey } from "@meditrack/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { ShieldAlert, Phone, AlertTriangle, Activity, Pill, User, BadgeCheck } from "lucide-react";

export default function EmergencyProfile() {
  const { token } = useParams<{ token: string }>();

  const { data: profile, isLoading, error } = useGetEmergencyPublicProfile(token || "", {
    query: {
      queryKey: getGetEmergencyPublicProfileQueryKey(token || ""),
      enabled: !!token,
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-panel-ink text-[#F5F8F6] p-6 flex flex-col items-center justify-center gap-4" aria-busy="true" aria-label="Loading emergency profile">
        <div className="relative">
          <div className="absolute inset-0 bg-gintong-digit/20 blur-2xl rounded-full" />
          <ShieldAlert className="w-14 h-14 text-gintong-digit relative animate-pulse" />
        </div>
        <div className="text-lg font-heading font-semibold tracking-wide">Accessing medical profile…</div>
        <div className="text-sm text-[#F5F8F6]/50 font-mono uppercase tracking-widest">Verifying secure link</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-panel-ink text-[#F5F8F6] p-6 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center mb-2">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-heading font-semibold">Link no longer valid</h1>
        <p className="text-[#F5F8F6]/60 max-w-sm">
          This emergency access link has expired or been revoked. Ask the patient's caregiver for a fresh QR code.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-panel-ink text-[#F5F8F6] selection:bg-destructive selection:text-white pb-16">
      {/* Critical header — instrument-panel banner, not a generic red bar */}
      <div className="relative overflow-hidden bg-gradient-to-b from-destructive to-[#8f3a2e] p-6 md:p-8 sticky top-0 z-50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 scanlines opacity-30" />
        <div className="relative max-w-3xl mx-auto flex items-center justify-center gap-4">
          <ShieldAlert className="w-9 h-9 md:w-11 md:h-11 text-white shrink-0" />
          <div>
            <h1 className="text-xl md:text-3xl font-heading font-semibold tracking-wide uppercase leading-none text-white">
              Emergency Info
            </h1>
            <div className="text-white/75 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mt-1 flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5" /> Verified medical record · No login required
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 mt-6">
        {/* Patient identity */}
        <Card className="bg-[#1A4B41] border-2 border-[#1C4A41] text-[#F5F8F6] shadow-xl">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gintong-digit/15 border border-gintong-digit/30 flex items-center justify-center text-gintong-digit shrink-0">
                <User className="w-8 h-8" />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl md:text-4xl font-heading font-semibold mb-1 truncate">{profile.name}</h2>
                <p className="text-[#F5F8F6]/60 text-base md:text-lg font-medium">Born {profile.dateOfBirth}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Readout label="Blood Type" value={profile.bloodType} size="sm" />
              {profile.emergencyContactPhone && (
                <div className="bg-panel-ink/60 p-4 rounded-xl border border-[#1C4A41] flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-semibold text-[#F5F8F6]/50 uppercase tracking-widest mb-1">Emergency Contact</div>
                    <div className="font-bold text-base leading-tight truncate">{profile.emergencyContactName}</div>
                  </div>
                  <a href={`tel:${profile.emergencyContactPhone}`} className="mt-3 block">
                    <Button variant="destructive" className="w-full shadow-lg shadow-destructive/30 font-bold">
                      <Phone className="w-4 h-4 mr-2" /> Call Now
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Critical alerts */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-destructive/10 border-2 border-destructive/30 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                <h3 className="text-lg font-heading font-semibold text-destructive uppercase tracking-wide">Allergies</h3>
              </div>
              {profile.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {profile.allergies.map((allergy, i) => (
                    <div key={i} className="bg-destructive text-white px-3.5 py-2 rounded-xl font-bold text-sm shadow-sm">
                      {allergy}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[#F5F8F6]/40 font-medium italic text-sm">No known allergies on file.</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1A4B41] border-2 border-[#1C4A41] shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <Activity className="w-6 h-6 text-gintong-digit" />
                <h3 className="text-lg font-heading font-semibold text-gintong-digit uppercase tracking-wide">Conditions</h3>
              </div>
              {profile.conditions.length > 0 ? (
                <ul className="space-y-2.5">
                  {profile.conditions.map((condition, i) => (
                    <li key={i} className="bg-panel-ink/60 text-[#F5F8F6] px-3.5 py-2.5 rounded-xl font-semibold text-sm border border-[#1C4A41]">
                      {condition}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[#F5F8F6]/40 font-medium italic text-sm">No chronic conditions listed.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active medications */}
        <Card className="bg-[#1A4B41] border-2 border-[#1C4A41] shadow-xl">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-[#1C4A41] pb-5">
              <Pill className="w-6 h-6 text-success" />
              <h3 className="text-lg font-heading font-semibold text-success uppercase tracking-wide">Current Medications</h3>
            </div>

            {profile.medications.length > 0 ? (
              <div className="space-y-3">
                {profile.medications.map((med, i) => (
                  <div key={i} className="bg-panel-ink/60 p-4 rounded-xl border border-[#1C4A41] flex justify-between items-center gap-4">
                    <div className="min-w-0">
                      <div className="font-bold text-lg truncate">{med.name}</div>
                      <div className="text-[#F5F8F6]/50 text-xs uppercase tracking-wider font-semibold mt-0.5">{med.form || "Medicine"}</div>
                    </div>
                    <div className="font-mono bg-panel-ink px-4 py-2 rounded-lg text-gintong-digit font-bold text-base shrink-0 border border-[#1C4A41]">
                      {med.dosage}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[#F5F8F6]/40 font-medium italic text-sm p-6 bg-panel-ink/40 rounded-xl border border-dashed border-[#1C4A41] text-center">
                No active medications listed.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-[#F5F8F6]/30 text-xs font-semibold mt-10 uppercase tracking-[0.2em]">
          Provided by PULSO · MediTrack Pro Medical IoT System
        </div>
      </div>
    </div>
  );
}
