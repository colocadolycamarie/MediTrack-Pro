import { Link } from "wouter";
import { Logo } from "@/components/Logo";

/**
 * Set these before you launch (Vercel/Render env vars, or edit the fallbacks):
 *   VITE_PRIVACY_EMAIL   — the inbox that handles privacy requests / your Data Protection Officer
 *   VITE_COMPANY_NAME    — the legal name of whoever operates the service
 */
const CONTACT_EMAIL = (import.meta.env.VITE_PRIVACY_EMAIL as string | undefined) || "privacy@your-domain.example";
const COMPANY_NAME = (import.meta.env.VITE_COMPANY_NAME as string | undefined) || "DoseMate";
const LAST_UPDATED = "November 27, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-heading font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo markSize="sm" />
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">Back to home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-heading font-semibold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated {LAST_UPDATED}</p>
          <p className="text-muted-foreground leading-relaxed pt-2">
            {COMPANY_NAME} helps caregivers and patients manage medication schedules with a connected pill dispenser.
            Because that involves health information, we handle it as <strong className="text-foreground">sensitive personal information</strong> under
            the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules. This page explains what we collect,
            why, who can see it, and the rights you have.
          </p>
        </div>

        <Section title="1. What we collect">
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong className="text-foreground">Your account:</strong> name, email address, role, and a password (stored only as a salted hash, never in readable form).</li>
            <li><strong className="text-foreground">Patient profile:</strong> name, date of birth, blood type, medical conditions, allergies, emergency contact name and phone number, and preferred language.</li>
            <li><strong className="text-foreground">Medication data:</strong> medicines, dosages, dosing schedules, stock levels, and a record of doses taken or missed.</li>
            <li><strong className="text-foreground">Device data:</strong> the dispenser's code, status, and activity log. The dispenser PIN is stored only as a hash.</li>
            <li><strong className="text-foreground">Optional contact details:</strong> a mobile number, if you turn on SMS reminders, and the emails of caregivers you invite.</li>
          </ul>
          <p>We only collect what you or your caregiver enter, plus the activity the dispenser reports. We do not use advertising or analytics trackers. The one third-party request the website makes is to Google Fonts to load its typefaces, which means Google receives your IP address and browser details when a page loads.</p>
        </Section>

        <Section title="2. Why we use it">
          <p>We use this information to run the service: show today's doses, keep the schedule and dispenser in sync, track adherence, warn about low stock, and display the patient's emergency profile. We process it based on your consent, which you give when you create an account, and which you can withdraw at any time by deleting your account.</p>
        </Section>

        <Section title="3. Who can see it">
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong className="text-foreground">The account owner</strong> who created the patient record can see and change everything.</li>
            <li><strong className="text-foreground">Invited caregivers</strong> can see the patient's data. “View only” caregivers cannot change anything; “Full access” caregivers can change medications and schedules. Only the owner can add or remove caregivers.</li>
            <li><strong className="text-foreground">Anyone who scans or opens the Emergency QR link</strong> can see the emergency profile (name, date of birth, blood type, conditions, allergies, current medicines, and emergency contact) without signing in. This is intentional, so responders can help quickly. Treat the QR code like a medical ID and only share or print it where you are comfortable with that.</li>
            <li><strong className="text-foreground">Service providers</strong> that host the app or deliver messages on our behalf process data only to provide the service.</li>
          </ul>
          <p>We do not sell personal information.</p>
        </Section>

        <Section title="4. How we protect it">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Passwords and dispenser PINs are hashed with bcrypt.</li>
            <li>Every patient record is access-controlled: you can only open records you own or have been invited to.</li>
            <li>Sessions expire automatically, and repeated sign-in attempts are rate-limited.</li>
            <li>Responses containing health data are marked so browsers and proxies do not store them.</li>
            <li>Data is sent over HTTPS when the service is deployed with a secure certificate.</li>
          </ul>
          <p>No system is perfectly secure. If a breach that puts your data at risk occurs, we will notify affected users and the National Privacy Commission as required by law.</p>
        </Section>

        <Section title="5. How long we keep it">
          <p>We keep your data while your account is active. When you delete your account, we permanently delete your profile, every patient record you own, and the related medications, schedules, dose history, devices, and logs.</p>
        </Section>

        <Section title="6. Your rights">
          <p>Under the Data Privacy Act you have the right to be informed, to access your data, to object, to correct inaccurate data, to erase or block data, to data portability, and to claim damages for unlawful use. Inside the app, go to <strong className="text-foreground">Settings → Privacy &amp; Data</strong> to:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong className="text-foreground">Download my data</strong> as a file.</li>
            <li><strong className="text-foreground">Delete my account</strong> and all data you own.</li>
          </ul>
          <p>You can correct patient details and medications at any time from the dashboard. For anything else, email <a className="text-primary font-semibold hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. If you believe your rights were violated, you may also file a complaint with the National Privacy Commission (privacy.gov.ph).</p>
        </Section>

        <Section title="7. Patients who cannot consent for themselves">
          <p>If you add a patient who is a minor or who cannot give consent, you confirm that you are their parent, legal guardian, or authorized caregiver and that you may share their health information with this service.</p>
        </Section>

        <Section title="8. Changes to this policy">
          <p>If we change how we handle personal data, we will update this page and the date at the top.</p>
        </Section>

        <Section title="9. Contact">
          <p>{COMPANY_NAME} privacy contact: <a className="text-primary font-semibold hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
        </Section>
      </main>
    </div>
  );
}
