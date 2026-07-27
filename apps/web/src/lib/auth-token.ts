import { setAuthTokenGetter } from "@meditrack/api-client-react";

const TOKEN_KEY = "meditrack_token";
const PATIENT_KEY = "meditrack_active_patient";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage unavailable (private browsing, etc) — session just won't persist across reloads
  }
}

export function getStoredPatientId(): number | null {
  try {
    const raw = localStorage.getItem(PATIENT_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredPatientId(id: number | null) {
  try {
    if (id) localStorage.setItem(PATIENT_KEY, String(id));
    else localStorage.removeItem(PATIENT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Wires the generated API client to attach `Authorization: Bearer <token>`
 * on every request. Must run once before any query fires — previously this
 * was never called anywhere, so the token saved at login was never actually
 * sent back to the server on subsequent requests.
 */
export function bootstrapAuthToken() {
  setAuthTokenGetter(() => getStoredToken());
}
