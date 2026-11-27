import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { 
  useListMedications, 
  getListMedicationsQueryKey,
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication,
  useListSchedules,
  getListSchedulesQueryKey,
  MedicationInputForm,
  type Medication,
} from "@dosemate/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Readout } from "@/components/ui/readout";
import { AlertTriangle, Trash2, Edit2, CalendarClock } from "lucide-react";
import { ScheduleDialog, describeSchedule, describeDays } from "@/components/ScheduleDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const medicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  genericName: z.string().optional(),
  dosage: z.string().min(1, "Dosage is required"),
  form: z.nativeEnum(MedicationInputForm),
  stockCount: z.coerce.number().min(0, "Stock can't be negative"),
  instructions: z.string().optional(),
});

/** A medication's dosing times, with the button to change them. Lives at the bottom of each card. */
function ScheduleSummary({ patientId, medicationId, onEdit }: { patientId: number; medicationId: number; onEdit: () => void }) {
  const { data: schedules, isLoading } = useListSchedules(patientId, medicationId, {
    query: { queryKey: getListSchedulesQueryKey(patientId, medicationId) },
  });
  const hasTimes = !!schedules && schedules.length > 0;
  return (
    <div className="mt-5 pt-4 border-t space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Schedule</div>
        <Button variant={hasTimes || isLoading ? "outline" : "default"} size="sm" className="gap-2 h-9" onClick={onEdit}>
          <CalendarClock className="w-4 h-4" /> {hasTimes ? "Edit schedule" : "Set schedule"}
        </Button>
      </div>
      {isLoading ? (
        <div className="h-7 w-40 bg-muted animate-pulse rounded-full" />
      ) : !hasTimes ? (
        <p className="text-sm text-accent font-medium">
          No dosing times yet. Set a schedule so this medicine shows up on the dashboard.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {schedules.map((sch) => (
            <Badge key={sch.id} variant="outline" className="font-normal gap-1.5 py-1.5 px-3 h-auto text-sm whitespace-normal text-left bg-muted/40">
              <span className="font-semibold">{describeSchedule(sch)}</span>
              <span className="text-muted-foreground">· {describeDays(sch.daysOfWeek)}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Medications() {
  const { patientId, t } = useApp();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medication | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<Medication | null>(null);

  const handleRequestRefill = (medicationName: string) => {
    toast({
      title: "Low stock noted",
      description: `We've flagged ${medicationName} as low. Automatic pharmacy reordering isn't set up yet — please contact the pharmacy directly for now.`,
    });
  };
  
  const { data: medications, isLoading } = useListMedications(patientId, {
    query: { queryKey: getListMedicationsQueryKey(patientId) }
  });

  const createMut = useCreateMedication();
  const updateMut = useUpdateMedication();
  const deleteMut = useDeleteMedication();

  const isEditing = editingMed != null;
  const isFormOpen = isAddOpen || isEditing;

  const form = useForm<z.infer<typeof medicationSchema>>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: "",
      genericName: "",
      dosage: "",
      form: "tablet",
      stockCount: 30,
      instructions: "",
    }
  });

  const closeForm = () => {
    setIsAddOpen(false);
    setEditingMed(null);
    form.reset();
  };

  const openAdd = () => {
    form.reset({
      name: "",
      genericName: "",
      dosage: "",
      form: "tablet",
      stockCount: 30,
      instructions: "",
    });
    setIsAddOpen(true);
  };

  const openEdit = (med: Medication) => {
    form.reset({
      name: med.name,
      genericName: med.genericName ?? "",
      dosage: med.dosage,
      form: (med.form as z.infer<typeof medicationSchema>["form"]) ?? "tablet",
      stockCount: med.stockCount,
      instructions: med.instructions ?? "",
    });
    setEditingMed(med);
  };

  const onSubmit = (values: z.infer<typeof medicationSchema>) => {
    if (isEditing && editingMed) {
      updateMut.mutate({ patientId, medicationId: editingMed.id, data: { ...values, funnelNumber: editingMed.funnelNumber } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(patientId) });
          closeForm();
          toast({ title: "Medication updated", description: `${values.name} was saved.` });
        },
        onError: (err: unknown) => {
          toast({ variant: "destructive", title: "Couldn't save changes", description: err instanceof Error ? err.message : "Please try again." });
        },
      });
      return;
    }
    // The API still stores a slot number for each medicine; it no longer matters here, so every new one gets 1.
    createMut.mutate({ patientId, data: { ...values, funnelNumber: 1 } }, {
      onSuccess: (created) => {
        queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(patientId) });
        closeForm();
        // A medication without a schedule never shows up on the dashboard, so go straight to setting one.
        setScheduleTarget(created);
      },
      onError: (err: unknown) => {
        toast({ variant: "destructive", title: "Couldn't add medication", description: err instanceof Error ? err.message : "Please try again." });
      },
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMut.mutate({ patientId, medicationId: deleteTarget.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(patientId) });
        setDeleteTarget(null);
        toast({ title: "Medication removed" });
      },
      onError: (err: unknown) => {
        toast({ variant: "destructive", title: "Couldn't remove medication", description: err instanceof Error ? err.message : "Please try again." });
      },
    });
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold font-heading">{t("Medications")}</h1>
          <p className="text-muted-foreground">Manage medicines, their schedules, and how many are left.</p>
        </div>

        <Button className="shrink-0 shadow-md w-full sm:w-auto h-11" onClick={openAdd}>
          {t("Add Medication")}
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit medication" : "Add a medication"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the details below." : "You'll set the dosing times right after saving."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({field}) => (
                  <FormItem className="sm:col-span-2"><FormLabel>Medicine name</FormLabel><FormControl><Input placeholder="e.g. Lipitor" className="h-11" {...field}/></FormControl><FormMessage/></FormItem>
                )} />
                <FormField control={form.control} name="genericName" render={({field}) => (
                  <FormItem className="sm:col-span-2"><FormLabel>Generic name (optional)</FormLabel><FormControl><Input placeholder="e.g. Atorvastatin" className="h-11" {...field}/></FormControl><FormMessage/></FormItem>
                )} />
                <FormField control={form.control} name="dosage" render={({field}) => (
                  <FormItem><FormLabel>Dosage</FormLabel><FormControl><Input placeholder="e.g. 20mg" className="h-11" {...field}/></FormControl><FormMessage/></FormItem>
                )} />
                <FormField control={form.control} name="form" render={({field}) => (
                  <FormItem>
                    <FormLabel>Form</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-11"><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="capsule">Capsule</SelectItem>
                        <SelectItem value="liquid">Liquid</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage/>
                  </FormItem>
                )} />
                <FormField control={form.control} name="stockCount" render={({field}) => (
                  <FormItem className="sm:col-span-2"><FormLabel>How many do you have left?</FormLabel><FormControl><Input type="number" inputMode="numeric" min="0" className="h-11 sm:max-w-40" {...field}/></FormControl><FormMessage/></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="instructions" render={({field}) => (
                <FormItem><FormLabel>Special instructions (optional)</FormLabel><FormControl><Input placeholder="e.g. Take with food" className="h-11" {...field}/></FormControl><FormMessage/></FormItem>
              )} />
              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button type="button" variant="outline" className="h-11" onClick={closeForm}>Cancel</Button>
                <Button type="submit" className="h-11" disabled={createMut.isPending || updateMut.isPending}>
                  {createMut.isPending || updateMut.isPending ? "Saving…" : isEditing ? "Save changes" : "Save medication"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="list" className="flex-1 flex flex-col">
        <TabsList className="w-full sm:w-auto self-start bg-transparent border-b rounded-none p-0 h-auto justify-start">
          <TabsTrigger value="list" className="flex-1 sm:flex-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 sm:px-6 py-3">Medicines</TabsTrigger>
          <TabsTrigger value="stock" className="flex-1 sm:flex-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 sm:px-6 py-3">Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="flex-1 mt-6">
          {isLoading ? (
            <div className="grid lg:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-56 bg-muted animate-pulse rounded-xl"></div>)}
            </div>
          ) : !medications || medications.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No medications yet</EmptyTitle>
                <EmptyDescription>
                  {t("No medications yet. Add the first one to start tracking doses.")}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={openAdd} className="h-11">
                  {t("Add Medication")}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4 items-start">
              {medications.map((med) => (
                <Card key={med.id} className="relative overflow-hidden">
                  <div className={`absolute top-5 left-0 w-1.5 h-10 rounded-r-full ${med.isLowStock ? 'bg-accent' : 'bg-primary'}`} />
                  <CardContent className="p-5 sm:p-6 pl-6 sm:pl-8">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <h3 className="text-xl font-semibold font-heading break-words">{med.name} <span className="text-muted-foreground font-normal text-base">{med.dosage}</span></h3>
                        {med.genericName && <p className="text-sm text-muted-foreground">{med.genericName}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0 -mr-2 -mt-1">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => openEdit(med)} aria-label={`Edit ${med.name}`}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(med)} aria-label={`Remove ${med.name}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <span className="capitalize font-medium">{med.form || "Tablet"}</span>
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{med.stockCount}</span> left
                        {med.daysRemaining != null && <> · about {med.daysRemaining} {med.daysRemaining === 1 ? "day" : "days"}</>}
                      </span>
                      {med.isLowStock && <Badge variant="warning">Low stock</Badge>}
                    </div>

                    {med.instructions && (
                      <div className="mt-4 text-sm flex gap-2 items-start text-muted-foreground">
                        <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{med.instructions}</span>
                      </div>
                    )}

                    <ScheduleSummary patientId={patientId} medicationId={med.id} onEdit={() => setScheduleTarget(med)} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stock" className="flex-1 mt-6">
          {!medications || medications.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              Stock levels will show up here once you add a medication.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {medications.map((med) => (
                <Card key={med.id} className={med.isLowStock ? 'border-accent ring-1 ring-accent/30' : ''}>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex justify-between items-start gap-3 mb-5">
                      <h3 className="font-semibold font-heading text-lg break-words min-w-0">{med.name} <span className="text-muted-foreground font-normal text-base">{med.dosage}</span></h3>
                      {med.isLowStock && <Badge variant="warning" className="shrink-0">Low stock</Badge>}
                    </div>

                    <div className="flex gap-6 items-end">
                      <Readout
                        value={med.daysRemaining !== null ? med.daysRemaining : '--'}
                        label="Days Left"
                        size="sm"
                        className={`flex-1 ${med.isLowStock ? 'ring-2 ring-accent border-accent/50' : ''}`}
                      />
                      <div className="text-right">
                        <div className="text-3xl font-semibold font-heading">{med.stockCount}</div>
                        <div className="text-sm text-muted-foreground font-medium">left</div>
                      </div>
                    </div>

                    {med.daysRemaining === null && (
                      <p className="text-xs text-muted-foreground mt-3">Set a schedule to see how many days this will last.</p>
                    )}

                    {med.isLowStock && (
                      <Button variant="accent" className="w-full mt-5 h-11 shadow-sm" onClick={() => handleRequestRefill(med.name)}>Request Refill</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ScheduleDialog patientId={patientId} medication={scheduleTarget} onClose={() => setScheduleTarget(null)} />

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the medication and its dosing schedule. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? "Removing…" : "Remove Medication"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
