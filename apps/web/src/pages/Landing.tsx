import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Activity, Scan, Watch } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

const journey = [
  {
    title: "Create your account",
    body: "Register as a caregiver in under a minute — name, email, and who you're setting this up for.",
  },
  {
    title: "Add a patient profile",
    body: "Conditions, allergies, blood type, emergency contact. This is also what powers the Emergency QR later.",
  },
  {
    title: "Pair the dispenser",
    body: "Connect the dispenser to Wi-Fi. It detects its own funnel count automatically — no manual setup.",
  },
  {
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

const stats = [
  { value: "4", label: "Funnel Slots" },
  { value: "≤5s", label: "Alert Latency" },
  { value: "3", label: "Connected Surfaces" },
  { value: "0", label: "Logins for Emergency Access" },
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

      {/* Navbar — kept structurally minimal; the mono/uppercase link style
          establishes the "instrument panel" typographic language that
          recurs as section eyebrows throughout the page. */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-[4.5rem] md:h-20 flex items-center justify-between">
          <Logo markSize="lg" textClassName="text-2xl" />
          <nav aria-label="Page sections" className="hidden lg:flex items-center gap-8 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#the-system" className="hover:text-foreground transition-colors">The system</a>
            <a href="#proof" className="hover:text-foreground transition-colors">Our approach</a>
          </nav>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="hidden sm:inline-flex font-semibold text-sm text-muted-foreground hover:text-foreground">
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
        {/* Hero — off-grid editorial headline over a full-bleed field photo.
            The photo carries a theme-matched panel-ink wash (+ scanlines)
            so it reads as part of the instrument panel rather than a stock
            background, and stays dark/uniform enough under the type for
            reliable contrast. Two distinct layouts: a simpler stacked
            composition on mobile/tablet, an off-grid asymmetric one on
            lg: up — not a reflow of the same DOM. */}
        <section className="relative overflow-hidden bg-panel-ink text-[#F5F8F6]">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1762955911431-4c44c7c3f408?auto=format&fit=crop&w=2400&q=80"
              alt="A caregiver spending time with an elderly couple at home"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-panel-ink/85" />
            <div className="absolute inset-0 bg-gradient-to-t from-panel-ink via-panel-ink/75 to-panel-ink/50" />
            <div className="absolute inset-0 scanlines opacity-10" />
          </div>

          {/* ---------- Mobile / tablet (below lg) ---------- */}
          <div className="lg:hidden relative px-5 sm:px-8 pt-28 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading font-semibold leading-[0.95] text-[13vw] sm:text-[10vw] tracking-tight">
                Because
                <br />
                <span className="italic">&ldquo;I&rsquo;ll remember&rdquo;</span>
                <br />
                <span className="text-gintong-digit">isn&rsquo;t a system.</span>
              </h1>
            </motion.div>

            <div className="mt-9 border-l-2 border-gintong-digit/40 pl-5 max-w-sm">
              <p className="text-base text-[#F5F8F6]/80 leading-relaxed">
                MediTrack Pro is the automated dispenser, caregiver dashboard, and smartwatch that catch what memory can't — so a missed dose becomes the rare exception, not something you worry about every day.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Link href="/register">
                <Button size="lg" className="w-full h-14 px-8 text-base rounded-full shadow-lg">
                  Set up for a loved one
                </Button>
              </Link>
              <Link href="/watch">
                <Button size="lg" variant="outline" className="w-full h-14 px-8 text-base rounded-full bg-white/5 border-white/20 text-[#F5F8F6] hover:bg-white/10 hover:text-[#F5F8F6]">
                  Preview Watch UI
                </Button>
              </Link>
            </div>
          </div>

          {/* ---------- Desktop (lg and up) ---------- */}
          <div className="hidden lg:flex relative flex-col px-8 xl:px-14 pt-24 pb-16 min-h-[780px]">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-heading font-semibold leading-[0.92] text-[4.6vw] xl:text-[5rem] tracking-tight max-w-[11ch]"
            >
              Because
              <br />
              <span className="italic">&ldquo;I&rsquo;ll remember&rdquo;</span>
              <br />
              <span className="text-gintong-digit">isn&rsquo;t a system.</span>
            </motion.h1>

            <div className="grid grid-cols-12 gap-x-6 mt-auto pt-20 items-end">
              <div className="col-span-5 col-start-1 border-l-2 border-gintong-digit/40 pl-6">
                <p className="text-lg text-[#F5F8F6]/80 leading-relaxed">
                  MediTrack Pro is the automated dispenser, caregiver dashboard, and smartwatch that catch what memory can't — so a missed dose becomes the rare exception, not something you worry about every day.
                </p>
              </div>

              <div className="col-span-3 col-start-9 flex flex-col gap-3">
                <Link href="/register">
                  <Button size="lg" className="w-full h-14 px-8 text-base rounded-full shadow-lg">
                    Set up for a loved one
                  </Button>
                </Link>
                <Link href="/watch">
                  <Button size="lg" variant="outline" className="w-full h-14 px-8 text-base rounded-full bg-white/5 border-white/20 text-[#F5F8F6] hover:bg-white/10 hover:text-[#F5F8F6] backdrop-blur-sm">
                    Preview Watch UI
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it works — an oversized-numeral sequence with a staggered
            baseline (odd steps sit lower) and a continuous rule running
            beneath, so it reads as a single process, not four cards. */}
        <section id="how-it-works" className="py-28 md:py-36 px-5 md:px-8 bg-card border-y border-border scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-20 md:mb-28">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className="font-heading font-semibold text-4xl md:text-6xl leading-[0.98]"
              >
                Four steps, and the dispenser takes it from there.
              </motion.h2>
            </div>

            <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
              {journey.map((step, i) => (
                <li key={step.title} className={`relative ${i % 2 === 1 ? "lg:mt-14" : ""}`}>
                  <div className="font-heading text-6xl md:text-7xl leading-none font-semibold text-primary/15 mb-4 select-none" aria-hidden="true">
                    0{i + 1}
                  </div>
                  <h3 className="font-semibold font-heading text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        {/* Trust band — full-bleed photo used as the composition rather
            than a photo boxed beside a text column; the quote overlaps the
            image directly, echoing the hero's panel-ink treatment as a
            recurring motif that ties the two moments together. */}
        <section id="proof" className="relative overflow-hidden border-y border-border scroll-mt-20 min-h-[560px] md:min-h-[640px] flex items-end">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1454875392665-2ac2c85e8d3e?auto=format&fit=crop&w=2000&q=80"
              alt="A caregiver's hand resting gently on an elderly patient's hand"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-panel-ink via-panel-ink/75 to-panel-ink/20" />
            <div className="absolute inset-0 scanlines opacity-10" />
          </div>

          <div className="relative w-full px-5 md:px-8 pb-14 md:pb-20">
            <div className="max-w-3xl">
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className="font-heading font-semibold text-[#F5F8F6] text-3xl md:text-5xl leading-[1.08] mb-6"
              >
                Missed doses are rarely about forgetting — they're about no one catching it in time.
                <span className="block text-[#F5F8F6]/55 text-lg md:text-2xl font-normal mt-4 max-w-lg">
                  MediTrack Pro closes that gap automatically.
                </span>
              </motion.p>
              <p className="text-sm font-semibold text-[#F5F8F6]/70 max-w-md border-l-2 border-gintong-digit/40 pl-4">
                Built for caregivers managing medication schedules for a parent, partner, or patient from a distance.
              </p>
            </div>
          </div>
        </section>

        {/* Spec sheet — hardware-documentation rows with oversized index
            numerals standing in for the icon-card pattern, closing on an
            asymmetric stats strip (one figure given more visual weight
            instead of four identical tiles). */}
        <section id="the-system" className="py-28 md:py-36 bg-card border-y scroll-mt-20">
          <div className="max-w-5xl mx-auto px-5 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-20">
              <div className="max-w-2xl">
                <motion.h2
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl md:text-6xl font-semibold font-heading leading-[0.98]"
                >
                  Designed as an instrument, not a lifestyle app.
                </motion.h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-sm">Every interaction is calibrated for accessibility and zero ambiguity. When health is on the line, there's no room for guesswork.</p>
            </div>

            <div className="divide-y divide-border border-t border-b border-border">
              {specs.map((spec) => (
                <div key={spec.index} className="group grid md:grid-cols-[72px_48px_1fr] gap-4 md:gap-8 py-10 md:py-12 items-start transition-colors hover:bg-muted/30 -mx-5 md:-mx-8 px-5 md:px-8">
                  <span className="font-heading text-3xl md:text-4xl leading-none text-muted-foreground/25 group-hover:text-accent transition-colors pt-1">{spec.index}</span>
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

            {/* Real specs, not vanity metrics — facts about the machine, not made-up user counts. */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 mt-16 pt-16 border-t border-border">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <div className="font-mono font-bold text-primary leading-none text-4xl md:text-5xl">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-3">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Closing CTA — bookends the hero: same panel-ink + scanlines
          treatment and mono eyebrow, but its own asymmetric grid rather
          than a centered "Ready to get started?" band. */}
      <section className="relative overflow-hidden bg-panel-ink text-[#F5F8F6] py-28 md:py-36 px-5 md:px-8">
        <div className="absolute inset-0 scanlines opacity-10" />
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-12 gap-10 md:gap-8 items-end">
          <div className="md:col-span-8">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="font-heading font-semibold text-4xl md:text-6xl leading-[0.98] max-w-xl"
            >
              Set up the first dose<br />in under ten minutes.
            </motion.h2>
          </div>

          <div className="md:col-span-4 md:border-l md:border-white/15 md:pl-8">
            <p className="text-[#F5F8F6]/60 text-base md:text-lg mb-8 max-w-xs">
              Create an account, add a patient, pair the dispenser. No credit card, no sales call.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/register">
                <Button size="lg" className="w-full h-14 px-8 text-base rounded-full shadow-lg">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full h-14 px-8 text-base rounded-full bg-transparent border-white/20 text-[#F5F8F6] hover:bg-white/10 hover:text-[#F5F8F6]">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-background py-16">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-[1.4fr_1fr_1fr] gap-10 md:gap-8">
          <div>
            <Logo markSize="md" tone="dark" textClassName="text-xl" showMark={false} />
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
          <p className="text-sm opacity-50">&copy; 2026 MediTrack Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
