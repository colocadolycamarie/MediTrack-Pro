import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, Users, KeyRound, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthSidePanel } from "@/components/AuthSidePanel";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForgotPassword } from "@meditrack/api-client-react";
import { AnimatePresence, motion } from "framer-motion";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function ForgotPassword() {
  const forgotMut = useForgotPassword();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    setFormError(null);
    forgotMut.mutate({ data: values }, {
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setFormError(message);
      },
    });
  };

  return (
    <AuthSidePanel
      heading={<>Locked out is<br className="hidden sm:block" /> never a dead end.</>}
      subcopy="Recovery instructions go to your email. If the account belongs to a senior citizen or PWD, their linked caregiver has a second way in."
      panelDetail={
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3 pb-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-lg bg-gintong-digit/15 text-gintong-digit flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold">Email recovery</div>
              <div className="text-xs text-[#F5F8F6]/50 mt-0.5">A reset link, sent to the address on file.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gintong-digit/15 text-gintong-digit flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold">Caregiver-assisted reset</div>
              <div className="text-xs text-[#F5F8F6]/50 mt-0.5">A linked caregiver can reset a device PIN from their own Settings.</div>
            </div>
          </div>
        </div>
      }
    >
      {forgotMut.isSuccess ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="w-12 h-12 bg-success/10 text-success flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-heading font-semibold text-foreground">Check your email</h2>
          <p className="text-muted-foreground mt-1.5 mb-5">
            If an account exists for <span className="font-semibold text-foreground">{form.getValues().email}</span>, we've sent recovery instructions.
          </p>
          <div className="p-4 bg-muted/40 text-sm mb-5 border-l-2 border-primary">
            <strong className="block mb-1 text-foreground">Caregiver assistance:</strong>
            <span className="text-muted-foreground">If you're a patient, your linked caregiver can also reset your device PIN from their Settings dashboard.</span>
          </div>
          <Link href="/login">
            <Button className="w-full h-11">Return to Login</Button>
          </Link>
        </motion.div>
      ) : (
        <>
          <h2 className="text-2xl font-heading font-semibold text-foreground">Recover access</h2>
          <p className="text-muted-foreground mt-1.5 mb-6">Enter your email and we'll send reset instructions.</p>

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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" placeholder="email@example.com" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-11 mt-1 gap-2" disabled={forgotMut.isPending}>
                {forgotMut.isPending && <Spinner className="size-4" />}
                {forgotMut.isPending ? "Sending…" : "Send Instructions"}
              </Button>
            </form>
          </Form>

          <p className="text-center mt-6 text-muted-foreground text-sm">
            Remembered it? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </>
      )}
    </AuthSidePanel>
  );
}
