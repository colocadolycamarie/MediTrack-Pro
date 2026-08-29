import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useCreatePatient, useListPatients, useLogout, getListPatientsQueryKey } from "@meditrack/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const schema = z.object({
  name: z.string().min(2, "Enter the patient's full name"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  bloodType: z.enum(bloodTypes),
  conditions: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

/** Turns a comma-separated textarea entry into a clean string array for the API. */
function splitList(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function AddPatient() {
  const [, setLocation] = useLocation();
  const { setPatientId } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPatient = useCreatePatient();
  const logout = useLogout();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Determines whether this is the very first patient (true onboarding, no
  // dashboard to go back to yet) or a caregiver adding another patient from
  // an already-set-up account (where a "back to dashboard" escape hatch
  // makes sense).
  const { data: patients } = useListPatients({
    query: { queryKey: getListPatientsQueryKey() },
  });
  const hasExistingPatients = (patients?.length ?? 0) > 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", dateOfBirth: "", bloodType: "O+",
      conditions: "", allergies: "", emergencyContactName: "", emergencyContactPhone: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    setSubmitError(null);
    createPatient.mutate(
      {
        data: {
          name: values.name,
          dateOfBirth: values.dateOfBirth,
          bloodType: values.bloodType,
          conditions: splitList(values.conditions),
          allergies: splitList(values.allergies),
          emergencyContactName: values.emergencyContactName || undefined,
          emergencyContactPhone: values.emergencyContactPhone || undefined,
        },
      },
      {
        onSuccess: (patient) => {
          // The create-patient mutation doesn't invalidate the cached patients
          // list on its own, so without this the dashboard's ProtectedRoute
          // would still see an empty list right after creation and bounce
          // straight back to onboarding instead of loading the dashboard.
          // Writing the new patient into the cache directly avoids the race
          // between navigating and the background refetch completing.
          queryClient.setQueryData(getListPatientsQueryKey(), (old: typeof patient[] | undefined) =>
            old ? [...old, patient] : [patient],
          );
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
          setPatientId(patient.id);
          toast({ title: "Patient profile created", description: `${patient.name} is ready to go.` });
          setLocation("/dashboard");
        },
        onError: (err: unknown) => {
          setSubmitError(err instanceof Error ? err.message : "Couldn't create the patient profile. Try again.");
        },
      },
    );
  };

  const formCard = (
    <div className="w-full max-w-lg">
      <div className="flex flex-col items-center mb-8 text-center">
        <h1 className="text-3xl font-semibold font-heading">
          {hasExistingPatients ? "Add a patient" : "Add your first patient"}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Create a profile for the person you're caring for. You can invite caregivers and pair a dispenser later.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
            {submitError && (
              <div role="alert" className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium rounded-lg p-3">
                {submitError}
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="Lola Remedios Santos" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl><Input type="date" max={new Date().toISOString().slice(0, 10)} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bloodTypes.map((bt) => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Conditions <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Textarea placeholder="Hypertension, Type 2 Diabetes" rows={2} {...field} /></FormControl>
                  <FormDescription>Separate multiple conditions with commas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Textarea placeholder="Penicillin, Shellfish" rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input placeholder="Maria Santos" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input type="tel" placeholder="+63 917 000 0000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full h-14 text-lg" disabled={createPatient.isPending}>
              {createPatient.isPending ? "Creating profile…" : "Create Patient Profile"}
            </Button>
          </form>
        </Form>

        {/* First-time onboarding has no sidebar yet, so this is the only way out. */}
        {!hasExistingPatients && (
          <button
            type="button"
            onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation("/") })}
            className="w-full text-center mt-6 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Sign out instead
          </button>
        )}
      </motion.div>
    </div>
  );

  // A caregiver adding another patient already has a dashboard and other
  // patients to navigate between, so keep the sidebar around instead of
  // dropping them into an isolated full-screen form.
  if (hasExistingPatients) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center py-4">{formCard}</div>
      </AppLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 py-12">
      {formCard}
    </div>
  );
}
