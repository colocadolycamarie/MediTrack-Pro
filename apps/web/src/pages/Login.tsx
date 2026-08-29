import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthSidePanel } from "@/components/AuthSidePanel";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLogin } from "@meditrack/api-client-react";
import { useApp } from "@/contexts/AppContext";
import { AnimatePresence, motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

function getRedirectTarget(): string {
  if (typeof window === "undefined") return "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  return redirect && redirect.startsWith("/") ? redirect : "/dashboard";
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useApp();
  const loginMut = useLogin();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setFormError(null);
    loginMut.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token);
        setLocation(getRedirectTarget());
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setFormError(/^(4\d\d|invalid|unauthorized)/i.test(message) ? "Incorrect email or password." : message);
      },
    });
  };

  return (
    <AuthSidePanel
      heading={<>Every dose,<br className="hidden sm:block" /> on schedule.</>}
      subcopy="Sign in to see today's dosing schedule, device status, and adherence — the way your caregiver dashboard left it."
    >
      <h2 className="text-2xl font-heading font-semibold text-foreground">Welcome back</h2>
      <p className="text-muted-foreground mt-1.5 mb-6">Sign in with the email you registered.</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="email@example.com" className="h-11" {...field} />
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
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                    Forgot?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput autoComplete="current-password" placeholder="••••••••" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full h-11 mt-1 gap-2" disabled={loginMut.isPending}>
            {loginMut.isPending && <Spinner className="size-4" />}
            {loginMut.isPending ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </Form>

      <p className="text-center mt-6 text-muted-foreground text-sm">
        Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Create one</Link>
      </p>
    </AuthSidePanel>
  );
}
