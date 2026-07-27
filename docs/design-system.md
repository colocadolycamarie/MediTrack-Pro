# PULSO — The MediTrack Pro Design System & End-to-End UI/UX Prompt

*A complete creative brief and paste-ready generation prompt for MediTrack Pro: An IoT Pill Dispensing System with Smartwatch-Based Alerts and Integrated QR Identity Verification.*

Why "PULSO": it's the Filipino word for **pulse** — the vital sign a caregiver checks, the beat on the wrist where the smartwatch sits, and the rhythm of a dosing schedule. One word, three anchors to the actual product. This is the design system's name — use it consistently so the capstone documentation and the UI reference the same identity instead of a generic "app theme."

---

## 1. Why this brief exists

Most AI-generated interfaces converge on the same three looks regardless of subject: (a) cream background + serif headline + terracotta accent, (b) near-black background + one neon accent, (c) hairline-rule broadsheet layout. None of these have anything to do with an IoT pill dispenser used by senior citizens in Navotas City. This brief exists to derive every visual decision from **your actual system** — its hardware, its users, its data — so a reviewer can't mistake it for a template.

---

## 2. The concept, explained

MediTrack Pro is not a phone app pretending to be a medical device — it **is** a medical device (ESP32-based dispenser) with two companion surfaces (web/mobile dashboard, smartwatch). The design system treats all three as one continuous instrument, not three unrelated screens. The signature idea:

> **The Readout.** Every live number in the system — countdown to next dose, adherence %, stock remaining — renders inside a dark, faintly scanlined panel with warm monospaced digits, the way a real embedded display would show it. This exact panel appears on the web dashboard, on the smartwatch face, and even printed on the emergency QR card. A user should recognize "that's MediTrack Pro" from the readout alone, before reading any label.

This solves the "looks AI-generated" problem structurally: the signature isn't a decorative gradient blob, it's a component tied directly to what the hardware actually does (display numbers on a screen).

---

## 3. Visual system (token spec)

### Color — named for what they reference, not just hex codes

| Token | Hex | Reference | Use |
|---|---|---|---|
| Dagat Teal | `#0E4F4F` | deep night-sea teal | Primary brand, navigation, trust |
| Dagat Teal Dark | `#093838` | — | Gradients, pressed states |
| Kalamansi Amber | `#E2992F` | kalamansi peel | Accent, CTAs, alert/attention, pill-cap color |
| Dahon Sage | `#3F7C5A` | leaf green | Adherence success, "taken" states |
| Ember Clay | `#BE4A3B` | muted brick, not fire-engine red | Missed dose / danger — urgent but not alarming for an anxious elderly user |
| Buntal Porcelain | `#F2F1EA` | woven buntal-hat neutral | App background — warm, not sterile-hospital white |
| Panel Ink | `#0A3535` | — | The Readout's background |
| Gintong Digit | `#F6C463` | golden digital-display amber | The Readout's numerals |

Explicitly avoid: cream-with-terracotta (#D97757-adjacent), pure black-with-neon, and zero-radius hairline "broadsheet" layouts — these read as default AI choices, not decisions made for this brief.

### Typography — three roles, three jobs

- **Display — Space Grotesk.** Geometric, slightly engineered-looking. Used for headings only, set with restraint (one weight jump, never more than two sizes per screen). It should feel like it belongs on hardware documentation, not a lifestyle blog.
- **Body — Public Sans.** Chosen deliberately: it's a font family built for U.S. government accessibility standards, which is the actual design requirement here (senior citizens, PWD users, low-vision readers). The rationale *is* the point — cite it in your defense if asked why this typeface.
- **Mono — IBM Plex Mono.** Reserved *only* for the Readout component and timestamps/logs — never for body text. Its job is to signal "this is a live machine value," not to look techy for its own sake.

### Motion — one rule

Motion exists in exactly three places: the Readout's countdown ticks down in real digits (no easing tricks), a medication-alert pulses once on arrival (not a looping animation), and screen transitions cross-fade at 150ms. Nothing else moves. Restraint is the point — an elderly user should never wonder if something is still loading or just decorative.

### Iconography & imagery

Line icons only (2px stroke, rounded joins), no filled glyphs, no stock medical clipart (no stethoscopes-in-circles, no generic red crosses). Where a photograph or illustration is needed (landing/marketing context), use real product context — a hand near a dispenser funnel, a wrist with the paired smartwatch — never generic stock-photo seniors smiling at a tablet.

---

## 4. Updated & enhanced feature specs (per module)

Your Table 1 (Modules and Submodules) is the baseline. Here's each module with specific upgrades worth designing for — these make the prototype feel like a *considered product*, not a re-skin of the thesis diagram, and give your panel evidence of critical enhancement beyond the original scope.

**1. User Management**
- *Care Circle permissions* — profile management supports multiple linked caregivers with tiered access (view-only vs. full control), not just one caregiver.
- *Caregiver-assisted password recovery* — a caregiver can trigger reset on behalf of a senior/PWD account they're linked to, with its own verification step.
- Allergy and condition flags surface as a persistent badge across Medications and Dispenser screens, not just buried in Profile.

**2. Medication Management**
- *Interaction check* — Add Medication runs a basic rule-based warning if a new drug conflicts with an existing one in the profile.
- *Meal-relative scheduling* — Dosing Schedule lets caregivers set "before/after meals" instead of only raw clock times, since that's how most patients actually think about dosing.
- *Predictive stock* — Stock Monitor shows "days remaining" calculated from dosing frequency, not just a raw percentage, plus a one-tap refill-request action.
- *PIN-gated manual override* — Dispense Scheduler's manual dispense requires a caregiver PIN, closing the "unauthorized access" gap your Related Literature section flags in other systems.

**3. IoT Dispensing System**
- *Jam/empty auto-detection* with an in-app troubleshooting wizard (not just a static error log).
- *Offline SMS fallback* — if Wi-Fi drops, scheduled alerts fall back to SMS so reminders don't silently fail.

**4. Smartwatch Management**
- *Geofence-aware nudges* — a second, gentler alert if the patient is away from home and hasn't confirmed a dose (directly answers your Statement of the Problem's "disruptions caused by travel" finding, mean 3.31).
- *Distinct haptic signature* — the medication buzz pattern is unique from generic notifications, so it's recognizable without looking at the screen.
- *Voice confirmation* — "Sinabi kong 'Nainom ko na'" as a hands-free alternative to tapping Take, for users with limited dexterity.
- *One-tap panic button* — new addition beyond the original modules: triggers caregiver alert + auto-displays Emergency QR, for a true emergency-response loop.

**5. Activity Monitoring**
- *Caregiver weekly digest* — auto-summary sent every Sunday, so caregivers don't have to open the app to stay informed.
- *Doctor-share mode* — generates a read-only shareable link for a clinic visit, as an alternative to only exporting a PDF.
- *Trend flags* — surfaces patterns like "missed doses cluster on weekends" instead of just raw numbers, turning data into an actionable insight.

---

## 5. End-to-end flow — by persona (this is a real sequence, so it's numbered)

### A. Caregiver first-time setup
1. Landing → value proposition, "Set up for someone you care for"
2. Register → role = Caregiver → basic info
3. Add patient profile → name, condition(s), allergies, blood type, emergency contact
4. Pair dispenser → Wi-Fi setup, funnel count detected
5. Add first medication → name, dosage, funnel assignment, interaction check runs
6. Set dosing schedule → clock time or meal-relative
7. Pair smartwatch → login on watch, confirm alert test buzz
8. Emergency QR generated automatically from profile data → preview + print/save
9. Land on Dashboard → today's schedule populated, onboarding complete

### B. Senior citizen / PWD daily loop (repeats each dose)
1. Smartwatch buzzes at scheduled time (distinct haptic) → Alert screen shows medication name + dose
2. Dispenser physically releases the dose into the tray at the same moment
3. Patient taps **Take** (or says the voice-confirm phrase) → Confirmation screen
4. Dose logs instantly to Adherence Tracking, visible to caregiver
5. *Branch — missed:* if unconfirmed after 15 minutes → caregiver gets a push/SMS alert → if patient is also away from home (geofence) → second gentler watch nudge fires
6. *Branch — emergency:* patient or bystander opens Emergency QR directly from watch face → no login required to view

### C. Emergency responder scan
1. Responder scans the physical QR card (dispenser sticker, wallet card, or watch face)
2. Zero-login read-only page opens → name, condition(s), allergies, current medications, emergency contact with tap-to-call
3. No edit access, no account required — this is the entire flow, by design

---

## 6. Content & microcopy voice

Write from the patient's or caregiver's side of the screen, not the system's:

- Buttons name the action, not the mechanism: **"Dispense Now"**, not "Trigger Dispense Event." **"Take"** / **"Snooze"**, not "Confirm" / "Defer."
- A control keeps its name through the whole flow: if a button says "Save Medication," the confirmation says "Medication saved," never "Record updated."
- Errors state what happened and what to do, without apologizing: *"Funnel 4 is empty. Refill it, then tap Retry."* — not *"Oops! Something went wrong."*
- Empty states are an invitation, not a dead end: *"No medications yet. Add the first one to start the dispensing schedule."*
- Filipino-language toggle should carry real translated microcopy for key actions (Take → "Inumin", Snooze → "I-snooze", Dispense Now → "Ilabas Ngayon"), not just a language switch that does nothing.

---

## 7. Accessibility requirements (non-negotiable for this audience)

- Minimum 44×44px touch targets everywhere a senior citizen or PWD user taps.
- A working "Larger Text" toggle that actually rescales the interface, not just a settings row that does nothing.
- A working "High Contrast" toggle for low-vision users.
- Never rely on color alone to communicate status — pair every status color with an icon or label (e.g., a checkmark *and* "Taken", not just a green dot).
- Voice/haptic alternatives to tap-only interactions wherever the flow allows it (see Smartwatch enhancements above).

---

## 8. The master prompt (paste this into any AI design tool)

```
Design a complete, professional, end-to-end UI/UX prototype for "MediTrack Pro,"
an IoT-based pill dispensing system with smartwatch-based alerts and integrated
QR identity verification, for senior citizens, persons with disabilities (PWDs),
and their caregivers in the Philippines.

DESIGN SYSTEM NAME: "PULSO" — reference the pulse/wrist/rhythm concept
throughout; every live number (countdown, adherence %, stock level) must use
one consistent signature component: a dark, monospaced "device readout" panel
that appears identically on the web dashboard, the smartwatch face, and the
printed emergency QR card, so all three surfaces read as one instrument.

VISUAL SYSTEM — follow exactly, do not substitute defaults:
- Color: deep teal #0E4F4F (primary), amber #E2992F (accent/alerts), sage
  green #3F7C5A (adherence success), muted brick #BE4A3B (missed dose/danger),
  warm porcelain #F2F1EA (background), dark panel #0A3535 with golden digits
  #F6C463 (the readout component only).
- Type: Space Grotesk for headings (restrained, max two sizes per screen),
  Public Sans for body (accessibility-grade legibility), IBM Plex Mono
  reserved only for readouts/timestamps/logs.
- Motion: countdown ticks in real digits, one single pulse on alert arrival,
  150ms cross-fades between screens — nothing else animates.
- Icons: 2px line icons, rounded joins, no filled glyphs, no stock medical
  clipart, no generic red-cross imagery.
- Explicitly avoid: cream+terracotta palettes, near-black+neon-accent
  palettes, hairline-rule zero-radius "broadsheet" layouts — these are
  generic AI defaults, not choices for this brief.

USERS: senior citizens/PWDs (low tech literacy, possible vision/motor
limits — need large targets, high contrast, minimal steps, voice/haptic
alternatives), caregivers (need oversight, alerts, reporting, multi-user
"Care Circle" permissions), emergency responders (need a zero-login QR scan).

MODULES & ENHANCED FEATURES TO DESIGN FOR:
1. User Management — Registration & Auth (role select: caregiver / senior
   citizen / PWD), Forgot Password (+ caregiver-assisted recovery), Profile
   Management (+ Care Circle multi-caregiver permissions, persistent allergy
   badges), Emergency QR Code generation on first setup.
2. Medication Management — Add Medication (name, dosage, funnel assignment,
   + basic drug-interaction warning), Dosing Schedule (clock time OR
   meal-relative scheduling), Stock Monitor (+ predictive "days remaining,"
   one-tap refill request), Dispense Scheduler (+ caregiver-PIN-gated manual
   override).
3. IoT Dispensing System — funnel map, connection status, device health,
   system logs, + jam/empty auto-detection with troubleshooting wizard,
   + offline SMS fallback for alerts.
4. Smartwatch Management — Login, Dashboard (next dose, stock, time),
   Medication Alert (Take/Snooze with distinct haptic pattern, + voice
   confirmation option, + geofence-aware second nudge if away from home),
   Emergency QR Display, + one-tap panic button.
5. Activity Monitoring — Adherence Tracking (rate, streak, weekly chart,
   history log), Export Data (+ doctor-share read-only link, + caregiver
   weekly digest email, + trend flags like weekend-clustered misses).

REQUIRED END-TO-END SCREENS, IN FLOW ORDER:
Landing (value prop) → Register (role selection) → Login → Forgot Password
→ Add Patient Profile (conditions, allergies, blood type, emergency contact)
→ Pair Dispenser (Wi-Fi + funnel detection) → Add first Medication (with
interaction check) → Set Dosing Schedule → Pair Smartwatch (+ test alert)
→ Emergency QR generated (preview + print/save) → Dashboard (today's
schedule, next-dose readout, adherence snapshot, stock alerts, quick QR
access) → Medications (list / dosing schedule / stock monitor tabs) → IoT
Dispenser control (funnel map, dispense now, device health, logs) →
Adherence Tracking (weekly chart, history log, export, trend flags) →
Emergency QR full ID card → Smartwatch companion states (dashboard → alert →
take/snooze confirmation → panic button → QR display) → Settings
(notifications, accessibility toggles that actually function, linked
caregivers/Care Circle, account, Filipino-language toggle with real
translated microcopy).

INCLUDE REAL INTERACTION STATES, NOT JUST THE HAPPY PATH: empty state (no
medications yet), low-stock warning, missed-dose state with caregiver alert,
device-offline state, drug-interaction warning, and the emergency responder's
zero-login QR scan view.

CONTENT RULES: name buttons by the action ("Dispense Now," "Take," "Snooze"),
keep a control's name consistent from action to confirmation, write errors
that state what happened and how to fix it without apologizing, write empty
states as an invitation to act, and provide real Filipino translations for
key actions when the language toggle is on (not a non-functional switch).

ACCESSIBILITY: 44px minimum touch targets, functioning larger-text and
high-contrast toggles, never color-only status indicators (always pair with
icon + label).

DELIVERABLE: an interactive, clickable prototype covering the full flow
above with realistic sample data (patient "Juanita Dela Cruz," medications
Losartan/Metformin/Atorvastatin, caregiver "Ranier Reyes"), demo-ready for a
capstone thesis panel — not static mockups, and not a generic dashboard
template.
```

---

## 9. How to use this for your defense

- The enhanced features in Section 4 are explicitly framed as *upgrades beyond your Chapter 2 documentation* — if a panelist asks "hindi ba ito wala sa proposal niyo," you can answer directly: these are UI/UX-stage refinements building on the approved module list, not a scope change.
- Section 3's color/type choices each have a stated rationale (e.g., Public Sans → accessibility standard) — memorize those one-liners, panels like design decisions that are justified rather than aesthetic-only.
- If you regenerate screens across multiple tools/sessions, always paste the **Visual System** paragraph from Section 8 first, unchanged, so every screen still reads as one product when assembled into your final presentation deck.