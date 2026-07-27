import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Link } from "wouter";
import { HeartPulse, Activity, Scan, Watch, QrCode, UserPlus, Wifi, Pill, CalendarClock } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

const journey = [
  {
    icon: UserPlus,
    title: "Create your account",
    body: "Register as a caregiver in under a minute — name, email, and who you're setting this up for.",
  },
  {
    icon: HeartPulse,
    title: "Add a patient profile",
    body: "Conditions, allergies, blood type, emergency contact. This is also what powers the Emergency QR later.",
  },
  {
    icon: Wifi,
    title: "Pair the dispenser",
    body: "Connect the PULSO device to Wi-Fi. It detects its own funnel count automatically — no manual setup.",
  },
  {
    icon: CalendarClock,
    title: "Set the dosing schedule",
    body: "Clock time or meal-relative. From this point, the dispenser, watch, and dashboard all stay in sync on their own.",
  },
];

const specs = [
  {
    index: "01",
    icon: Activity,
    title: "IoT connected, not app-only",
    body: "The dispenser syncs directly to the cloud over Wi-Fi. Miss a dose and the device beeps, the watch vibrates, and the caregiver gets an alert — in that order, every time.",
  },
  {
    index: "02",
    icon: Watch,
    title: "The Readout, on every surface",
    body: "One signature display component — dark, scanlined, warm monospaced digits — renders identically on the web dashboard, the smartwatch face, and the printed emergency card.",
  },
  {
    index: "03",
    icon: Scan,
    title: "Zero-login emergency access",
    body: "A responder scans the patient's QR card or watch face and instantly sees allergies, conditions, and current medications. No account, no app, no delay.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[60] -translate-y-20 focus:translate-y-0 transition-transform bg-primary text-primary-foreground font-semibold text-sm px-4 py-2.5 rounded-full shadow-lg"
      >
        Skip to content
      </a>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <Link href="/">
            <Logo markSize="lg" textClassName="text-2xl" />
          </Link>
          <nav aria-label="Page sections" className="hidden lg:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#why-pulso" className="hover:text-foreground transition-colors">Why PULSO</a>
            <a href="#proof" className="hover:text-foreground transition-colors">From caregivers</a>
          </nav>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="hidden sm:inline-flex font-semibold text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Link href="/register" className="inline-flex">
              <Button size="lg" className="rounded-full shadow-md font-semibold px-8 text-base">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 min-h-[calc(100vh-5rem)] flex items-center">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold font-heading leading-[1.08] mb-8 text-foreground">
                Medical-grade adherence, <br className="hidden md:block" />
                <span className="text-primary">engineered for home.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
                An automated multi-funnel pill dispenser, a connected caregiver dashboard, and a smartwatch that buzzes at exactly the right moment — one system, three surfaces.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base rounded-full shadow-lg">
                    Set up for a loved one
                  </Button>
                </Link>
                <Link href="/watch">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base rounded-full bg-card">
                    Preview Watch UI
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Product preview — a clean, modern status card instead of a dense instrument-panel mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative mx-auto w-full max-w-md"
            >
              <div className="relative rounded-3xl bg-card border shadow-2xl shadow-primary/10 p-6 md:p-8">
                <div className="flex items-center justify-between mb-7">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                    </span>
                    Live · Lola's Dispenser
                  </div>
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Watch className="w-4 h-4" />
                  </div>
                </div>

                <div className="mb-7">
                  <div className="text-sm font-medium text-muted-foreground mb-1.5">Next dose</div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl md:text-6xl font-heading font-semibold text-foreground tabular-nums">2:14</span>
                    <span className="text-lg text-muted-foreground font-medium">PM</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 mt-3 bg-primary/8 text-primary text-sm font-semibold px-3 py-1.5 rounded-full">
                    <Pill className="w-3.5 h-3.5" /> Metformin 500mg — Funnel 2
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-muted/50 p-3.5 text-center">
                    <div className="font-heading text-xl font-semibold text-foreground">94%</div>
                    <div className="text-[11px] text-muted-foreground font-medium mt-0.5">Adherence</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3.5 text-center">
                    <div className="font-heading text-xl font-semibold text-foreground">3/4</div>
                    <div className="text-[11px] text-muted-foreground font-medium mt-0.5">Funnels loaded</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3.5 text-center">
                    <div className="font-heading text-xl font-semibold text-success">0</div>
                    <div className="text-[11px] text-muted-foreground font-medium mt-0.5">Missed today</div>
                  </div>
                </div>
              </div>

              {/* Satellite: the watch — same alert, second surface */}
              <div className="hidden sm:flex absolute -right-8 -bottom-10 w-24 h-24 rounded-[22px] bg-panel-ink shadow-xl items-center justify-center flex-col gap-1 border-4 border-background">
                <Watch className="w-3.5 h-3.5 text-gintong-digit mb-0.5" />
                <span className="font-mono text-gintong-digit text-base font-bold">2:14</span>
                <span className="text-[7px] text-white/40 uppercase tracking-widest">synced</span>
              </div>

              {/* Satellite: the QR card — third surface */}
              <div className="hidden sm:flex absolute -left-5 -top-5 w-14 h-14 rounded-2xl bg-card border shadow-lg items-center justify-center">
                <QrCode className="w-7 h-7 text-foreground" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it works — the actual onboarding path, not a generic "3 easy steps" icon row */}
        <section id="how-it-works" className="py-24 px-4 bg-card border-y border-border scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-16">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-4">How it works</div>
              <h2 className="text-3xl md:text-4xl font-semibold font-heading leading-tight">
                Four steps, and the dispenser takes it from there.
              </h2>
            </div>

            <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {journey.map((step, i) => (
                <li key={step.title} className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <step.icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-sm text-muted-foreground/60 tracking-widest">0{i + 1}</span>
                  </div>
                  <h3 className="font-semibold font-heading text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        {/* Trust band — real photography, treated as part of the instrument, not a stock-photo slap-on */}
        <section id="proof" className="border-y border-border scroll-mt-20">
          <div className="grid md:grid-cols-2">
            <div className="relative h-72 md:h-[420px] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1454875392665-2ac2c85e8d3e?auto=format&fit=crop&w=1600&q=80"
                alt="A caregiver's hand resting gently on an elderly patient's hand"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-panel-ink/90 via-panel-ink/40 to-gintong-digit/20 mix-blend-multiply" />
              <div className="absolute inset-0 bg-panel-ink/10" />
            </div>
            <div className="bg-panel-ink text-[#F5F8F6] relative flex items-center px-8 py-14 md:px-14 overflow-hidden">
              <div className="absolute inset-0 scanlines opacity-20" />
              <div className="relative max-w-md">
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-gintong-digit mb-5">Why we built this</div>
                <p className="text-2xl md:text-[1.75rem] font-heading font-semibold leading-snug mb-6">
                  "Lola used to skip her afternoon dose whenever I couldn't call to remind her. Now the dispenser just does it — and I get a ping either way."
                </p>
                <div className="text-sm font-semibold text-[#F5F8F6]/70">Maricel S. — Caregiver, Quezon City</div>
                <div className="h-px bg-white/10 my-6" />
                <Readout value="98%" label="Avg. Adherence, Paired Households" size="sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Spec sheet — hardware-documentation style rows, not a repeated icon-card grid */}
        <section id="why-pulso" className="py-24 bg-card border-y scroll-mt-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="max-w-2xl mb-16">
              <h2 className="text-4xl md:text-5xl font-semibold font-heading mb-5">Designed as an instrument, not a lifestyle app.</h2>
              <p className="text-xl text-muted-foreground">Every interaction is calibrated for accessibility and zero ambiguity. When health is on the line, there's no room for guesswork.</p>
            </div>

            <div className="divide-y divide-border border-t border-b border-border">
              {specs.map((spec) => (
                <div key={spec.index} className="group grid md:grid-cols-[80px_48px_1fr] gap-4 md:gap-8 py-9 items-start transition-colors hover:bg-muted/30 -mx-4 px-4 rounded-lg">
                  <span className="font-mono text-sm text-muted-foreground/60 tracking-widest pt-1 group-hover:text-accent transition-colors">{spec.index}</span>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <spec.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold font-heading mb-2">{spec.title}</h3>
                    <p className="text-muted-foreground text-base md:text-lg max-w-2xl">{spec.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Real specs, not vanity metrics — facts about the machine, not made-up user counts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-border">
              {[
                { value: "4", label: "Funnel Slots" },
                { value: "≤5s", label: "Alert Latency" },
                { value: "3", label: "Connected Surfaces" },
                { value: "0", label: "Logins for Emergency Access" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-mono text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Closing CTA — its own instrument-panel moment, not a centered "Ready to get started?" band */}
      <section className="relative overflow-hidden bg-panel-ink text-[#F5F8F6] py-24 px-4">
        <div className="absolute inset-0 scanlines opacity-20" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gintong-digit mb-5">Ready when you are</div>
          <h2 className="text-3xl md:text-5xl font-semibold font-heading leading-tight mb-6">
            Set up the first dose<br />in under ten minutes.
          </h2>
          <p className="text-[#F5F8F6]/60 text-lg mb-10 max-w-xl mx-auto">
            Create an account, add a patient, pair the dispenser. No credit card, no sales call.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base rounded-full shadow-lg">
                Create Free Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base rounded-full bg-transparent border-white/20 text-[#F5F8F6] hover:bg-white/10 hover:text-[#F5F8F6]">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-background py-16">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-[1.4fr_1fr_1fr] gap-10 md:gap-8">
          <div>
            <Logo markSize="md" tone="dark" textClassName="text-xl" />
            <p className="text-sm opacity-50 mt-4 max-w-xs">
              An automated dosing dispenser, caregiver dashboard, and smartwatch companion — one connected system for medication adherence.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-4">Get Started</div>
            <ul className="space-y-3 text-sm">
              <li><Link href="/register" className="opacity-70 hover:opacity-100 transition-opacity">Create Account</Link></li>
              <li><Link href="/login" className="opacity-70 hover:opacity-100 transition-opacity">Sign In</Link></li>
              <li><Link href="/watch" className="opacity-70 hover:opacity-100 transition-opacity">Watch UI Preview</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-4">Account</div>
            <ul className="space-y-3 text-sm">
              <li><Link href="/forgot-password" className="opacity-70 hover:opacity-100 transition-opacity">Recover Access</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <p className="text-sm opacity-50">Capstone Thesis MVP &copy; 2026</p>
        </div>
      </footer>
    </div>
  );
}
