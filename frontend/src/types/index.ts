export type Role = 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface QuestionStudent {
  id: string;
  text: string;
  options: string[];
  points: number;
}

export interface QuestionAdmin {
  id: string;
  text: string;
  options: string[];
  correct_index: number;
  points: number;
  explanation: string;
}

export interface QuestionCreate {
  text: string;
  options: string[];
  correct_index: number;
  points: number;
  explanation: string;
}

export interface QuizStudentListItem {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_percentage: number;
  is_published: boolean;
  question_count: number;
  total_points: number;
  created_at: string;
}

export interface QuizStudentDetail {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_percentage: number;
  is_published: boolean;
  question_count: number;
  total_points: number;
  questions: QuestionStudent[];
}

export interface QuizAdminDetail {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_percentage: number;
  is_published: boolean;
  question_count: number;
  total_points: number;
  questions: QuestionAdmin[];
  created_at: string;
  updated_at: string;
}

export interface QuizCreateRequest {
  title: string;
  description: string;
  duration_minutes: number;
  passing_percentage: number;
  is_published: boolean;
  questions: QuestionCreate[];
}

export interface QuizUpdateRequest {
  title?: string;
  description?: string;
  duration_minutes?: number;
  passing_percentage?: number;
  is_published?: boolean;
}

export interface AttemptAnswerSubmission {
  question_id: string;
  selected_index: number | null;
}

export interface AttemptSubmitRequest {
  quiz_id: string;
  answers: AttemptAnswerSubmission[];
}

export interface QuestionReviewItem {
  question_id: string;
  text: string;
  options: string[];
  selected_index: number | null;
  correct_index: number;
  is_correct: boolean;
  points_earned: number;
  points_possible: number;
  explanation: string;
}

export interface AttemptResult {
  id: string;
  quiz_id: string;
  quiz_title: string;
  user_id: string;
  user_name: string;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  started_at: string;
  completed_at: string;
  reviews: QuestionReviewItem[];
}

export interface AttemptSummary {
  id: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
}

export interface AdminDashboardStats {
  total_quizzes: number;
  published_quizzes: number;
  total_questions: number;
  total_students: number;
  total_attempts: number;
  average_score_percentage: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  storage_healthy: boolean;
  version: string;
  environment: string;
  message: string;
}
