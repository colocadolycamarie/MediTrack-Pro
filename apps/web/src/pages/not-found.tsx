import { Link } from "wouter";
import { Readout } from "@/components/ui/readout";
import { Button } from "@/components/ui/button";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-6 text-center gap-6">
      <Readout value="404" label="Signal Not Found" size="xl" className="w-full max-w-xs" />

      <div className="space-y-2 max-w-sm">
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          This screen isn't on the schedule.
        </h1>
        <p className="text-muted-foreground">
          The page you're looking for may have moved, or the link is out of date.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard">
          <Button variant="default" className="gap-2 w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <Compass className="w-4 h-4" /> Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
