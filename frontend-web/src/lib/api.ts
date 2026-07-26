const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const V1 = `${API_BASE}/api/v1`;

export class ApiError extends Error {}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.detail || data.message || "Something went wrong.");
  }
  return data as T;
}

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  name: string;
}

export async function login(email: string, password: string) {
  const form = new FormData();
  form.append("username", email);
  form.append("password", password);
  const res = await fetch(`${V1}/auth/login`, { method: "POST", body: form });
  return handle<LoginResponse>(res);
}

export interface AthleteRegisterInput {
  name: string;
  email: string;
  password: string;
  date_of_birth: string;
}

export async function registerAthlete(input: AthleteRegisterInput) {
  const form = new FormData();
  Object.entries(input).forEach(([k, v]) => form.append(k, v));
  const res = await fetch(`${V1}/auth/register/athlete/send-code`, { method: "POST", body: form });
  return handle<{ message: string }>(res);
}

export interface CoachRegisterInput extends AthleteRegisterInput {
  years_of_experience?: number;
  bio?: string;
  certification?: File | null;
}

export async function registerCoach(input: CoachRegisterInput) {
  const form = new FormData();
  form.append("name", input.name);
  form.append("email", input.email);
  form.append("password", input.password);
  form.append("date_of_birth", input.date_of_birth);
  if (input.years_of_experience != null) form.append("years_of_experience", String(input.years_of_experience));
  if (input.bio) form.append("bio", input.bio);
  if (input.certification) form.append("certification", input.certification);
  const res = await fetch(`${V1}/auth/register/coach/send-code`, { method: "POST", body: form });
  return handle<{ message: string }>(res);
}

export async function verifyCode(email: string, code: string) {
  const res = await fetch(`${V1}/auth/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  return handle<{ message: string }>(res);
}

export async function resendCode(email: string) {
  const res = await fetch(`${V1}/auth/resend-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handle<{ message: string }>(res);
}

// ── Admin ─────────────────────────────────────────────────────────────────

export interface Coach {
  id: string;
  name: string;
  email: string;
  is_verified: boolean;
  created_at: string;
  status: string;
  years_of_experience?: number;
  bio?: string;
  certification_filename?: string;
}

export interface Athlete {
  id: string;
  name: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_athletes: number;
  total_coaches: number;
  pending_coaches: number;
  approved_coaches: number;
  rejected_coaches: number;
  total_admins?: number;
}

export async function getStats() {
  const res = await fetch(`${V1}/admin/stats`, { headers: authHeaders() });
  return handle<DashboardStats>(res);
}

export async function getCoaches(status: string = "all") {
  const res = await fetch(`${V1}/admin/coaches?status=${status}`, { headers: authHeaders() });
  return handle<Coach[]>(res);
}

export async function reviewCoach(id: string, action: "approve" | "reject", reason?: string) {
  const res = await fetch(`${V1}/admin/coaches/${id}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action, reason }),
  });
  return handle<{ message: string }>(res);
}

export async function getAthletes() {
  const res = await fetch(`${V1}/admin/athletes`, { headers: authHeaders() });
  return handle<Athlete[]>(res);
}

export async function deleteUser(id: string) {
  const res = await fetch(`${V1}/admin/users/${id}`, { method: "DELETE", headers: authHeaders() });
  return handle<{ message: string }>(res);
}

export function certUrl(filename: string) {
  return `${API_BASE}/uploads/${filename}`;
}

// ── Super admin ───────────────────────────────────────────────────────────

export async function getAdmins() {
  const res = await fetch(`${V1}/super-admin/admins`, { headers: authHeaders() });
  return handle<Admin[]>(res);
}

export async function createAdmin(name: string, email: string, password: string) {
  const res = await fetch(`${V1}/super-admin/admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, email, password }),
  });
  return handle<{ message: string }>(res);
}

export async function deleteAdmin(id: string) {
  const res = await fetch(`${V1}/super-admin/admins/${id}`, { method: "DELETE", headers: authHeaders() });
  return handle<{ message: string }>(res);
}
