import type {
  AdminDashboardStats,
  AttemptResult,
  AttemptSubmitRequest,
  AttemptSummary,
  AuthResponse,
  HealthResponse,
  QuestionAdmin,
  QuestionCreate,
  QuizAdminDetail,
  QuizCreateRequest,
  QuizStudentDetail,
  QuizStudentListItem,
  QuizUpdateRequest,
  User,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'quiz_auth_token';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(`Unable to reach the server (${errorMsg}). Please check backend connection.`, 0);
  }

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let message = 'An unexpected error occurred';
    if (data && data.detail) {
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      }
    }
    if (response.status === 401) {
      clearStoredToken();
    }
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const api = {
  // Authentication
  register: (email: string, password: string, full_name: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: () => request<User>('/api/auth/me'),

  // Student APIs
  getQuizzes: () => request<QuizStudentListItem[]>('/api/quizzes'),

  getQuizForTaking: (quizId: string) => request<QuizStudentDetail>(`/api/quizzes/${quizId}`),

  submitQuiz: (quizId: string, submission: AttemptSubmitRequest) =>
    request<AttemptResult>(`/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submission),
    }),

  getMyAttempts: () => request<AttemptSummary[]>('/api/attempts/my'),

  getAttemptDetail: (attemptId: string) => request<AttemptResult>(`/api/attempts/${attemptId}`),

  // Admin APIs
  getAdminDashboard: () => request<AdminDashboardStats>('/api/admin/dashboard'),

  getAdminQuizzes: () => request<QuizAdminDetail[]>('/api/admin/quizzes'),

  getAdminQuiz: (quizId: string) => request<QuizAdminDetail>(`/api/admin/quizzes/${quizId}`),

  createQuiz: (quizData: QuizCreateRequest) =>
    request<QuizAdminDetail>('/api/admin/quizzes', {
      method: 'POST',
      body: JSON.stringify(quizData),
    }),

  updateQuiz: (quizId: string, updates: QuizUpdateRequest) =>
    request<QuizAdminDetail>(`/api/admin/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteQuiz: (quizId: string) =>
    request<void>(`/api/admin/quizzes/${quizId}`, {
      method: 'DELETE',
    }),

  addQuestion: (quizId: string, question: QuestionCreate) =>
    request<QuestionAdmin>(`/api/admin/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(question),
    }),

  updateQuestion: (quizId: string, questionId: string, question: QuestionCreate) =>
    request<QuestionAdmin>(`/api/admin/quizzes/${quizId}/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(question),
    }),

  deleteQuestion: (quizId: string, questionId: string) =>
    request<void>(`/api/admin/quizzes/${quizId}/questions/${questionId}`, {
      method: 'DELETE',
    }),

  // Health
  getHealth: () => request<HealthResponse>('/api/health'),
};
