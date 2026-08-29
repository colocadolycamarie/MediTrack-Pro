import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, Heart, Eye, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthSidePanel } from "@/components/AuthSidePanel";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRegister, RegistrationInputRole } from "@meditrack/api-client-react";
import { useApp } from "@/contexts/AppContext";
import { AnimatePresence, motion } from "framer-motion";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(RegistrationInputRole),
});

const setupSteps = [
  { label: "Create your account", done: false },
  { label: "Add a patient profile", done: false },
  { label: "Pair the dispenser", done: false },
  { label: "Set the dosing schedule", done: false },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const registerMut = useRegister();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "caregiver",
    },
  });

  const passwordValue = form.watch("password");

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    setFormError(null);
    registerMut.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token);
        setLocation("/dashboard");
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : "Couldn't create your account. Please try again.";
        setFormError(/409|exists|taken/i.test(message) ? "An account with this email already exists." : message);
      },
    });
  };

  const roles = [
    { id: "caregiver", icon: Heart, label: "Caregiver", desc: "Manage medications for a loved one" },
    { id: "patient", icon: UserPlus, label: "Senior Citizen", desc: "Manage my own medications" },
    { id: "pwd", icon: Eye, label: "PWD", desc: "Accessible view for my medications" },
  ] as const;

  return (
    <AuthSidePanel
      heading={<>Four steps to a<br className="hidden sm:block" /> fully paired system.</>}
      subcopy="Creating an account is step one. Here's the full path to a dispenser that's live and dosing on schedule."
      panelDetail={
        <ol className="space-y-0">
          {setupSteps.map((s, i) => (
            <li key={s.label} className="flex items-start gap-3 relative pb-4 last:pb-0 text-left">
              {i < setupSteps.length - 1 && (
                <span className="absolute left-[11px] top-6 bottom-0 w-px bg-white/15" />
              )}
              <span
                className={`relative z-10 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                  i === 0 ? "bg-gintong-digit text-panel-ink" : "bg-white/10 text-[#F5F8F6]/50 border border-white/15"
                }`}
              >
                {i === 0 ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className={`text-sm font-semibold pt-0.5 ${i === 0 ? "text-[#F5F8F6]" : "text-[#F5F8F6]/50"}`}>
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      }
    >
      <div className="flex items-center gap-2 mb-5">
        <span className={`h-1 flex-1 transition-colors ${step === 1 ? "bg-primary" : "bg-primary/30"}`} />
        <span className={`h-1 flex-1 transition-colors ${step === 2 ? "bg-primary" : "bg-primary/30"}`} />
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {step === 1 ? (
          <div>
            <h2 className="text-2xl font-heading font-semibold text-foreground">Who's this account for?</h2>
            <p className="text-muted-foreground mt-1.5 mb-5">You can add more people to care for later.</p>

            <div className="border-t border-border">
              {roles.map((role) => {
                const isActive = form.watch("role") === role.id;
                return (
                  <button
                    type="button"
                    key={role.id}
                    onClick={() => form.setValue("role", role.id as RegistrationInputRole)}
                    aria-pressed={isActive}
                    className={`w-full flex items-center gap-4 py-3.5 border-b border-border text-left transition-colors border-l-2 pl-3 -ml-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                      isActive ? "border-l-primary bg-primary/5" : "border-l-transparent hover:bg-muted/40"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <role.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold">{role.label}</div>
                      <div className="text-sm text-muted-foreground">{role.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button className="w-full mt-5 h-11" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-heading font-semibold text-foreground">Create your account</h2>
            <p className="text-muted-foreground mt-1.5 mb-5">A few details and you're in.</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
                <AnimatePresence>
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 4 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      role="alert"
                      className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium rounded-lg p-3 overflow-hidden"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {formError}
                    </motion.div>
                  )}
                </AnimatePresence>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input autoComplete="name" placeholder="Juan Dela Cruz" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="juan@example.com" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput autoComplete="new-password" placeholder="••••••••" className="h-11" {...field} />
                      </FormControl>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            passwordValue.length >= 8 ? "bg-success" : "bg-muted-foreground/30"
                          }`}
                        />
                        <span className={`text-sm transition-colors ${passwordValue.length >= 8 ? "text-success font-medium" : "text-muted-foreground"}`}>
                          At least 8 characters
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="outline" className="h-11 px-5" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" className="h-11 flex-1 gap-2" disabled={registerMut.isPending}>
                    {registerMut.isPending && <Spinner className="size-4" />}
                    {registerMut.isPending ? "Creating…" : "Create Account"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </motion.div>

      <p className="text-center mt-6 text-muted-foreground text-sm">
        Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
      </p>
    </AuthSidePanel>
  );
}
