import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@dosemate/api-client-react";
import { Download, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

function errorMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: { error?: string } } | null)?.data;
  return data?.error ?? (err instanceof Error ? err.message : fallback);
}

export function PrivacyDataPanel() {
  const { logout } = useApp();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [downloading, setDownloading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmWord, setConfirmWord] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const data = await customFetch<unknown>("/api/privacy/export", { method: "GET" });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dosemate-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Your data was downloaded", description: "Keep the file somewhere safe — it contains health information." });
    } catch (err) {
      toast({ title: "Couldn't download your data", description: errorMessage(err, "Please try again."), variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const closeConfirm = (open: boolean) => {
    setConfirmOpen(open);
    if (!open) {
      setPassword("");
      setConfirmWord("");
      setDeleteError(null);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await customFetch("/api/privacy/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm: confirmWord }),
      });
      setConfirmOpen(false);
      logout();
      queryClient.clear();
      setLocation("/");
      toast({ title: "Account deleted", description: "Your account and all data you owned have been permanently removed." });
    } catch (err) {
      setDeleteError(errorMessage(err, "Couldn't delete your account. Please try again."));
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = password.length > 0 && confirmWord === "DELETE" && !deleting;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>
            DoseMate treats health information as sensitive personal data under the Philippine Data Privacy Act (RA 10173).{" "}
            <Link href="/privacy" className="text-primary font-semibold hover:underline">Read the Privacy Policy</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="font-semibold">Download my data</div>
              <p className="text-sm text-muted-foreground">
                A file with your account, the patients you own, their medications, schedules and dose history. Passwords are never included.
              </p>
            </div>
            <Button variant="outline" className="gap-2 shrink-0 w-full sm:w-auto" onClick={handleDownload} disabled={downloading}>
              <Download className="w-4 h-4" /> {downloading ? "Preparing…" : "Download"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Delete my account</CardTitle>
          <CardDescription>
            Permanently removes your account and every patient you own, including their medications, schedules, dose history and Emergency QR. This cannot be undone,
            and caregivers you invited will lose access to those patients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="gap-2 w-full sm:w-auto" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="w-4 h-4" /> Delete my account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={closeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Consider downloading your data first. Enter your password and type DELETE to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="delete-password">Password</Label>
              <PasswordInput
                id="delete-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
              <Input id="delete-confirm" value={confirmWord} onChange={(e) => setConfirmWord(e.target.value)} autoComplete="off" />
            </div>
            {deleteError && (
              <div role="alert" className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {deleteError}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            {/* A plain Button (not AlertDialogAction) so a wrong password doesn't auto-close the dialog. */}
            <Button variant="destructive" onClick={handleDelete} disabled={!canDelete}>
              {deleting ? "Deleting…" : "Delete everything"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
