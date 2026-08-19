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

export async function adminForgotPassword(email: string) {
  const res = await fetch(`${V1}/auth/admin/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handle<{ message: string }>(res);
}

export async function adminResetPassword(email: string, code: string, new_password: string) {
  const res = await fetch(`${V1}/auth/admin/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, new_password }),
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
  gym_id?: string | null;
  gym_name?: string | null;
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

export async function createAthlete(name: string, email: string) {
  const res = await fetch(`${V1}/admin/athletes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, email }),
  });
  return handle<{ message: string }>(res);
}

export async function deleteUser(id: string) {
  const res = await fetch(`${V1}/admin/users/${id}`, { method: "DELETE", headers: authHeaders() });
  return handle<{ message: string }>(res);
}

export function certUrl(filename: string) {
  return `${API_BASE}/uploads/${filename}`;
}

// ── Food database ─────────────────────────────────────────────────────────

export type FoodCategory = "protein" | "carbs" | "fats" | "produce" | "dairy" | "supplement";

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  price: number;
  currency: string;
  unit: string;
  trend: "up" | "down" | "flat";
  updated_at: string;
}

export interface FoodInput {
  name: string;
  category: FoodCategory;
  price: number;
  currency?: string;
  unit: string;
}

export async function getFood(category: string = "all") {
  const res = await fetch(`${V1}/admin/food?category=${category}`, { headers: authHeaders() });
  return handle<Food[]>(res);
}

export async function createFood(input: FoodInput) {
  const res = await fetch(`${V1}/admin/food`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  return handle<Food>(res);
}

export async function updateFood(id: string, input: Partial<FoodInput>) {
  const res = await fetch(`${V1}/admin/food/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  return handle<Food>(res);
}

export async function deleteFood(id: string) {
  const res = await fetch(`${V1}/admin/food/${id}`, { method: "DELETE", headers: authHeaders() });
  return handle<{ message: string }>(res);
}

// ── Super admin ───────────────────────────────────────────────────────────

export async function getAdmins() {
  const res = await fetch(`${V1}/super-admin/admins`, { headers: authHeaders() });
  return handle<Admin[]>(res);
}

export async function createAdmin(name: string, email: string, password: string, gym_id: string) {
  const res = await fetch(`${V1}/super-admin/admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, email, password, gym_id }),
  });
  return handle<{ message: string }>(res);
}

export async function reassignAdminGym(adminId: string, gymId: string) {
  const res = await fetch(`${V1}/super-admin/admins/${adminId}/gym?gym_id=${gymId}`, {
    method: "PUT",
    headers: authHeaders(),
  });
  return handle<{ message: string }>(res);
}

export async function deleteAdmin(id: string) {
  const res = await fetch(`${V1}/super-admin/admins/${id}`, { method: "DELETE", headers: authHeaders() });
  return handle<{ message: string }>(res);
}

export async function getAllUsers() {
  const res = await fetch(`${V1}/super-admin/users`, { headers: authHeaders() });
  return handle<Athlete[]>(res);
}

// ── Gyms ─────────────────────────────────────────────────────────────────

export interface Gym {
  id: string;
  name: string;
  owner_name: string;
  location: string;
  price_per_month: number;
  latitude?: number | null;
  longitude?: number | null;
  email?: string | null;
  phone_number?: string | null;
  admin_count: number;
  created_at: string;
  updated_at: string;
}

export interface GymInput {
  name: string;
  owner_name: string;
  location: string;
  price_per_month: number;
  latitude?: number;
  longitude?: number;
  email?: string;
  phone_number?: string;
}

export async function getGyms() {
  const res = await fetch(`${V1}/super-admin/gyms`, { headers: authHeaders() });
  return handle<Gym[]>(res);
}

export async function createGym(input: GymInput) {
  const res = await fetch(`${V1}/super-admin/gyms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  return handle<Gym>(res);
}

export async function updateGym(id: string, input: Partial<GymInput>) {
  const res = await fetch(`${V1}/super-admin/gyms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  return handle<Gym>(res);
}

export async function deleteGym(id: string) {
  const res = await fetch(`${V1}/super-admin/gyms/${id}`, { method: "DELETE", headers: authHeaders() });
  return handle<{ message: string }>(res);
}

// ── Analytics ────────────────────────────────────────────────────────────

export interface SignupPoint {
  date: string;
  athletes: number;
  coaches: number;
}

export interface CoachStatusBreakdown {
  pending: number;
  approved: number;
  rejected: number;
}

export interface FoodCategoryBreakdown {
  category: string;
  count: number;
  avg_price: number;
}

export interface Analytics {
  signups_by_day: SignupPoint[];
  coach_status_breakdown: CoachStatusBreakdown;
  food_category_breakdown: FoodCategoryBreakdown[];
  total_gyms: number;
  total_admins: number;
}

export async function getAnalytics() {
  const res = await fetch(`${V1}/super-admin/analytics`, { headers: authHeaders() });
  return handle<Analytics>(res);
}
