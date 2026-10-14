import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import type { AttemptSummary, QuizStudentListItem } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizStudentListItem[]>([]);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizzesData, attemptsData] = await Promise.all([
          api.getQuizzes(),
          api.getMyAttempts(),
        ]);
        setQuizzes(quizzesData);
        setAttempts(attemptsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading your student dashboard..." />;
  }

  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0
    ? (attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts).toFixed(1)
    : '0.0';
  const passedCount = attempts.filter((a) => a.passed).length;

  return (
    <div className="container">
      {/* Welcome Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-text)' }}>
          Welcome back, {user?.full_name}!
        </h1>
        <p style={{ color: 'var(--muted-text)', fontSize: '1rem' }}>
          Track your quiz performance, view available assessments, and review past attempts.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Metrics Row */}
      <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-label">Available Quizzes</span>
          <span className="stat-value">{quizzes.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Attempts Taken</span>
          <span className="stat-value">{totalAttempts}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Score / Passes</span>
          <span className="stat-value">{avgScore}% <span style={{ fontSize: '1rem', color: 'var(--success)' }}>({passedCount} passed)</span></span>
        </div>
      </div>

      {/* Two Column Layout: Available Quizzes & Recent Attempts */}
      <div className="grid grid-cols-2">
        {/* Available Quizzes Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Available Quizzes</h2>
            <Link to="/quizzes" className="btn btn-outline btn-sm">View All &rarr;</Link>
          </div>
          {quizzes.length === 0 ? (
            <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem' }}>No quizzes are currently published.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {quizzes.slice(0, 3).map((quiz) => (
                <div
                  key={quiz.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--bg-color)',
                  }}
                >
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                    {quiz.title}
                  </h4>
                  <p style={{ color: 'var(--muted-text)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    {quiz.description.slice(0, 90)}...
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted-text)' }}>
                      ⏱️ {quiz.duration_minutes} mins &bull; 📝 {quiz.question_count} questions
                    </span>
                    <Link to={`/quizzes/${quiz.id}/start`} className="btn btn-primary btn-sm">
                      Start Quiz
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attempts Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Attempts</h2>
            <Link to="/attempts/my" className="btn btn-outline btn-sm">Full History &rarr;</Link>
          </div>
          {attempts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--muted-text)' }}>
              <p style={{ marginBottom: '1rem' }}>You haven't taken any quizzes yet.</p>
              <Link to="/quizzes" className="btn btn-primary btn-sm">Start Your First Quiz</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {attempts.slice(0, 4).map((att) => (
                <div
                  key={att.id}
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                      {att.quiz_title}
                    </h5>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>
                      {new Date(att.completed_at).toLocaleDateString()} &bull; Score: {att.score}/{att.total_points}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge ${att.passed ? 'badge-pass' : 'badge-fail'}`}>
                      {att.percentage}% {att.passed ? 'PASS' : 'FAIL'}
                    </span>
                    <Link to={`/attempts/${att.id}/review`} className="btn btn-secondary btn-sm">
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
