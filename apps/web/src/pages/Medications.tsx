import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { 
  useListMedications, 
  getListMedicationsQueryKey,
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication,
  MedicationInputForm,
  type Medication,
} from "@meditrack/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Readout } from "@/components/ui/readout";
import { Plus, AlertTriangle, Trash2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  funnelNumber: z.coerce.number().min(1).max(8),
  stockCount: z.coerce.number().min(0),
  instructions: z.string().optional(),
});

export default function Medications() {
  const { patientId, t } = useApp();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medication | null>(null);

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
      funnelNumber: 1,
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
      funnelNumber: 1,
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
      funnelNumber: med.funnelNumber,
      stockCount: med.stockCount,
      instructions: med.instructions ?? "",
    });
    setEditingMed(med);
  };

  const onSubmit = (values: z.infer<typeof medicationSchema>) => {
    if (isEditing && editingMed) {
      updateMut.mutate({ patientId, medicationId: editingMed.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(patientId) });
          closeForm();
        }
      });
      return;
    }
    createMut.mutate({ patientId, data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(patientId) });
        closeForm();
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMut.mutate({ patientId, medicationId: deleteTarget.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(patientId) });
        setDeleteTarget(null);
      }
    });
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold font-heading">{t("Medications")}</h1>
          <p className="text-muted-foreground">Manage prescriptions, schedules, and stock.</p>
        </div>
        
        <Button className="shrink-0 shadow-md" onClick={openAdd}>
          <Plus className="w-5 h-5 mr-2" />
          {t("Add Medication")}
        </Button>

        <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Medication" : "Add New Medication"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({field}) => (
                    <FormItem className="col-span-2"><FormLabel>Brand Name</FormLabel><FormControl><Input placeholder="e.g. Lipitor" {...field}/></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="genericName" render={({field}) => (
                    <FormItem className="col-span-2"><FormLabel>Generic Name (Optional)</FormLabel><FormControl><Input placeholder="e.g. Atorvastatin" {...field}/></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="dosage" render={({field}) => (
                    <FormItem><FormLabel>Dosage</FormLabel><FormControl><Input placeholder="e.g. 20mg" {...field}/></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="form" render={({field}) => (
                    <FormItem>
                      <FormLabel>Form</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
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
                  <FormField control={form.control} name="funnelNumber" render={({field}) => (
                    <FormItem><FormLabel>Funnel (1-8)</FormLabel><FormControl><Input type="number" min="1" max="8" {...field}/></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="stockCount" render={({field}) => (
                    <FormItem><FormLabel>Current Stock</FormLabel><FormControl><Input type="number" min="0" {...field}/></FormControl><FormMessage/></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="instructions" render={({field}) => (
                  <FormItem><FormLabel>Special Instructions</FormLabel><FormControl><Input placeholder="e.g. Take with food" {...field}/></FormControl><FormMessage/></FormItem>
                )} />
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                  <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                    {isEditing ? "Save Changes" : "Save Medication"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="flex-1 flex flex-col">
        <TabsList className="w-full sm:w-auto self-start bg-transparent border-b rounded-none p-0 h-auto">
          <TabsTrigger value="list" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3">List</TabsTrigger>
          <TabsTrigger value="stock" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3">Stock Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="flex-1 mt-6">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl"></div>)}
            </div>
          ) : !medications || medications.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No medications yet</EmptyTitle>
                <EmptyDescription>
                  {t("No medications yet. Add the first one to start the dispensing schedule.")}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={openAdd} className="gap-2">
                  <Plus className="w-4 h-4" /> {t("Add Medication")}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {medications.map((med) => (
                <Card key={med.id} className="relative overflow-hidden group">
                  <div className={`absolute top-4 left-0 w-1.5 h-10 rounded-r-full ${med.isLowStock ? 'bg-accent' : 'bg-primary'}`} />
                  <CardContent className="p-6 pl-8">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold font-heading">{med.name} <span className="text-muted-foreground font-normal text-base">{med.dosage}</span></h3>
                        {med.genericName && <p className="text-sm text-muted-foreground">{med.genericName}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => openEdit(med)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(med)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-xl border">
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold mb-1">Location</span>
                        <Badge variant="outline" className="font-mono">Funnel {med.funnelNumber}</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold mb-1">Form</span>
                        <span className="capitalize font-medium">{med.form || "Tablet"}</span>
                      </div>
                    </div>
                    
                    {med.instructions && (
                      <div className="mt-4 text-sm flex gap-2 items-start text-muted-foreground">
                        <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{med.instructions}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stock" className="flex-1 mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medications?.map((med) => (
              <Card key={med.id} className={med.isLowStock ? 'border-accent ring-1 ring-accent/30' : ''}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold font-heading text-lg truncate pr-4">{med.name}</h3>
                    <Badge variant={med.isLowStock ? "warning" : "secondary"}>Funnel {med.funnelNumber}</Badge>
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
                      <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Pills</div>
                    </div>
                  </div>
                  
                  {med.isLowStock && (
                    <Button variant="accent" className="w-full mt-6 shadow-sm" onClick={() => handleRequestRefill(med.name)}>Request Refill</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the medication and stop its dispensing schedule. This action can't be undone.
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
