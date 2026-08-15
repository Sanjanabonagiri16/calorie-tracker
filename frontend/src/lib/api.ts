const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type User = { id: string; email: string; name: string };
export type Goal = {
  id: string;
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  weightGoalKg: number | null;
  isActive: boolean;
};
export type FoodEntry = {
  id: string;
  mealType: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitaminA: number;
  vitaminC: number;
  calcium: number;
  iron: number;
  eatenAt: string;
  source: string;
};
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ct_token");
}

export function setAuth(token: string, user: User) {
  localStorage.setItem("ct_token", token);
  localStorage.setItem("ct_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("ct_token");
  localStorage.removeItem("ct_user");
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("ct_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || "Request failed", res.status, data.details);
  }
  return data as T;
}

export const api = {
  register: (body: { email: string; name: string; password: string }) =>
    request<{ user: User; message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }, false),
  login: (body: { email: string; password: string }) =>
    request<{ user: User; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }, false),
  me: () => request<{ user: User }>("/api/auth/me"),
  getGoals: (page = 1) =>
    request<{ items: Goal[]; pagination: Pagination }>(`/api/goals?page=${page}&active=true`),
  saveGoal: (body: Omit<Goal, "id" | "isActive">) =>
    request<{ goal: Goal }>("/api/goals", { method: "PUT", body: JSON.stringify(body) }),
  getMeals: (params: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
    return request<{ items: FoodEntry[]; pagination: Pagination }>(`/api/meals?${q}`);
  },
  createMeal: (body: Partial<FoodEntry> & { name: string; mealType: string; calories: number }) =>
    request<{ entry: FoodEntry }>("/api/meals", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateMeal: (id: string, body: Partial<FoodEntry>) =>
    request<{ entry: FoodEntry }>(`/api/meals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMeal: (id: string) =>
    request<{ success: boolean }>(`/api/meals/${id}`, { method: "DELETE" }),
  reports: (days = 7) => request<ReportPayload>(`/api/reports?days=${days}`),
  extractImage: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return request<{ extracted: Partial<FoodEntry> & { name: string; calories: number; notes?: string }; provider: string }>(
      "/api/ai/extract",
      { method: "POST", body: form }
    );
  },
  getChat: (page = 1) =>
    request<{ items: { id: string; role: string; content: string; createdAt: string }[]; pagination: Pagination }>(
      `/api/chat?page=${page}&limit=50`
    ),
  sendChat: (message: string) =>
    request<{
      message: { id: string; role: string; content: string };
      actions: { message: string; dataChanged: boolean; entryId?: string }[];
      dataChanged: boolean;
    }>(
      "/api/chat",
      { method: "POST", body: JSON.stringify({ message }) }
    ),
  importPdf: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ imported: number; items: FoodEntry[] }>("/api/import/pdf", {
      method: "POST",
      body: form,
    });
  },
};

export type ReportPayload = {
  calorieTrend: { date: string; calories: number }[];
  macroBreakdown: { date: string; protein: number; carbs: number; fat: number }[];
  micronutrientSummary: Record<string, number>;
  goalVsActual: {
    date: string;
    caloriesActual: number;
    caloriesGoal: number | null;
    proteinActual: number;
    proteinGoal: number | null;
    carbsActual: number;
    carbsGoal: number | null;
    fatActual: number;
    fatGoal: number | null;
  }[];
  activeGoal: Goal | null;
  totals: { calories: number; protein: number; carbs: number; fat: number };
};
