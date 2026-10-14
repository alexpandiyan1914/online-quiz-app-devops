import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { AttemptSummary } from '../../types';

export const AttemptHistoryPage: React.FC = () => {
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.getMyAttempts();
        setAttempts(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load attempt history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading your attempt records..." />;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-text)' }}>Attempt History</h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '1rem' }}>
            Review past assessments, scores, and answer explanations.
          </p>
        </div>
        <Link to="/quizzes" className="btn btn-primary">
          Take a Quiz &rarr;
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {attempts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Attempts Yet</h3>
          <p style={{ color: 'var(--muted-text)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            You haven't submitted any quiz attempts yet. Start a quiz to test your technical skills!
          </p>
          <Link to="/quizzes" className="btn btn-primary">Browse Available Quizzes</Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Quiz Title</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Result</th>
                <th>Date &amp; Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td style={{ fontWeight: 600 }}>{attempt.quiz_title}</td>
                  <td>{attempt.score} / {attempt.total_points}</td>
                  <td style={{ fontWeight: 700 }}>{attempt.percentage}%</td>
                  <td>
                    <span className={`badge ${attempt.passed ? 'badge-pass' : 'badge-fail'}`}>
                      {attempt.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted-text)', fontSize: '0.85rem' }}>
                    {new Date(attempt.completed_at).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/attempts/${attempt.id}/review`} className="btn btn-secondary btn-sm">
                      Review Answers &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
