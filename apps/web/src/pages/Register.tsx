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
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <AuthSidePanel
        backHref="/"
        backLabel="Back to site"
        heading={<>Four steps to a<br className="hidden sm:block" /> fully paired system.</>}
        subcopy="Creating an account is step one. Here's the full path to a dispenser that's live and dosing on schedule."
      >
        <ol className="space-y-0">
          {setupSteps.map((s, i) => (
            <li key={s.label} className="flex items-start gap-3.5 relative pb-7 last:pb-0 text-left">
              {i < setupSteps.length - 1 && (
                <span className="absolute left-[13px] top-7 bottom-0 w-px bg-white/15" />
              )}
              <span
                className={`relative z-10 shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                  i === 0 ? "bg-gintong-digit text-panel-ink" : "bg-white/10 text-[#F5F8F6]/50 border border-white/15"
                }`}
              >
                {i === 0 ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className={`text-base font-semibold pt-1 ${i === 0 ? "text-[#F5F8F6]" : "text-[#F5F8F6]/50"}`}>
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </AuthSidePanel>

      {/* Right — the actual form. */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <span className={`h-1.5 flex-1 rounded-full transition-colors ${step === 1 ? "bg-primary" : "bg-primary/30"}`} />
            <span className={`h-1.5 flex-1 rounded-full transition-colors ${step === 2 ? "bg-primary" : "bg-primary/30"}`} />
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 ? (
              <div>
                <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground text-center">Who's this account for?</h2>
                <p className="text-muted-foreground mt-2 mb-8 text-lg text-center">You can add more people to care for later.</p>

                <div className="space-y-3">
                  {roles.map((role) => {
                    const isActive = form.watch("role") === role.id;
                    return (
                      <Card
                        key={role.id}
                        className={`cursor-pointer transition-all hover:border-primary active:scale-[0.98] ${
                          isActive ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""
                        }`}
                        onClick={() => form.setValue("role", role.id as RegistrationInputRole)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            <role.icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-lg">{role.label}</div>
                            <div className="text-base text-muted-foreground">{role.desc}</div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Button className="w-full mt-6 h-14 text-lg" onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            ) : (
              <div>
                <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground text-center">Create your account</h2>
                <p className="text-muted-foreground mt-2 mb-8 text-lg text-center">A few details and you're in.</p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 text-left">
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
                          <FormLabel className="text-lg">Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan Dela Cruz" className="h-14 text-lg" {...field} />
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
                          <FormLabel className="text-lg">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="juan@example.com" className="h-14 text-lg" {...field} />
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
                          <FormLabel className="text-lg">Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" className="h-14 text-lg" {...field} />
                          </FormControl>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                passwordValue.length >= 8 ? "bg-success" : "bg-muted-foreground/30"
                              }`}
                            />
                            <span className={`text-base transition-colors ${passwordValue.length >= 8 ? "text-success font-medium" : "text-muted-foreground"}`}>
                              At least 8 characters
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" className="h-13 px-5 text-base" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button type="submit" className="h-13 flex-1 text-base gap-2" disabled={registerMut.isPending}>
                        {registerMut.isPending && <Spinner className="size-4" />}
                        {registerMut.isPending ? "Creating…" : "Create Account"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </motion.div>

          <p className="text-center mt-8 text-muted-foreground text-lg">
            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
