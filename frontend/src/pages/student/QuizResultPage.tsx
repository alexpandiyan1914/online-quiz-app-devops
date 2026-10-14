import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { AttemptResult } from '../../types';

export const QuizResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const location = useLocation();

  const [attempt, setAttempt] = useState<AttemptResult | null>(
    (location.state as any)?.attempt || null
  );
  const [loading, setLoading] = useState(!attempt);
  const [error, setError] = useState<string | null>(null);

  const isAuto = (location.state as any)?.isAuto;

  useEffect(() => {
    if (attempt || !attemptId) return;

    const fetchAttempt = async () => {
      try {
        const data = await api.getAttemptDetail(attemptId);
        setAttempt(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load attempt result');
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [attemptId, attempt]);

  if (loading) {
    return <LoadingSpinner message="Calculating your final score..." />;
  }

  if (error || !attempt) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '2rem' }}>
        <div className="alert alert-danger">{error || 'Attempt result not found'}</div>
        <Link to="/quizzes" className="btn btn-secondary">&larr; Back to Quizzes</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '680px', marginTop: '2rem' }}>
      {isAuto && (
        <div className="alert alert-info">
          ⏱️ The timer expired! Your quiz was automatically submitted.
        </div>
      )}

      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          {attempt.passed ? '🎉' : '📚'}
        </div>

        <span
          className={`badge ${attempt.passed ? 'badge-pass' : 'badge-fail'}`}
          style={{ fontSize: '1rem', padding: '0.4rem 1.25rem', marginBottom: '1rem' }}
        >
          {attempt.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
        </span>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-text)', marginBottom: '0.5rem' }}>
          {attempt.quiz_title}
        </h1>
        <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Attempt completed by {attempt.user_name} on {new Date(attempt.completed_at).toLocaleString()}
        </p>

        {/* Big Score Display */}
        <div
          style={{
            maxWidth: '320px',
            margin: '0 auto 2rem',
            padding: '1.5rem',
            background: 'var(--bg-color)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '3rem', fontWeight: 800, color: attempt.passed ? 'var(--success)' : 'var(--danger)' }}>
            {attempt.percentage}%
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--dark-text)' }}>
            Score: {attempt.score} / {attempt.total_points} Points
          </div>
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--success-light)', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '0.85rem', color: '#166534', display: 'block' }}>Correct</span>
            <strong style={{ fontSize: '1.4rem', color: '#166534' }}>{attempt.correct_count}</strong>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--danger-light)', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '0.85rem', color: '#991B1B', display: 'block' }}>Incorrect</span>
            <strong style={{ fontSize: '1.4rem', color: '#991B1B' }}>{attempt.incorrect_count}</strong>
          </div>
          <div style={{ padding: '0.75rem', background: '#F1F5F9', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', display: 'block' }}>Unanswered</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--dark-text)' }}>{attempt.unanswered_count}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to={`/attempts/${attempt.id}/review`} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            Review Detailed Answers &rarr;
          </Link>
          <Link to="/quizzes" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
            Take Another Quiz
          </Link>
          <Link to="/attempts/my" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
            View All Attempts
          </Link>
        </div>
      </div>
    </div>
  );
};
