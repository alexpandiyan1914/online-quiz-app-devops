import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { QuizStudentListItem } from '../../types';

export const AvailableQuizzesPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizStudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await api.getQuizzes();
        setQuizzes(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading available quizzes..." />;
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-text)' }}>Available Quizzes</h1>
        <p style={{ color: 'var(--muted-text)', fontSize: '1rem' }}>
          Choose a quiz below to test your technical skills. Time limits and passing scores apply.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ color: 'var(--muted-text)', fontSize: '1.1rem' }}>No quizzes are currently available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-published">PUBLISHED</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)' }}>Pass: {quiz.passing_percentage}%</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--dark-text)' }}>
                  {quiz.title}
                </h3>
                <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                  {quiz.description}
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'var(--bg-color)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                  }}
                >
                  <span>⏱️ <strong>{quiz.duration_minutes}</strong> mins</span>
                  <span>📝 <strong>{quiz.question_count}</strong> questions</span>
                  <span>🎯 <strong>{quiz.total_points}</strong> pts</span>
                </div>
                <Link to={`/quizzes/${quiz.id}/start`} className="btn btn-primary" style={{ width: '100%' }}>
                  Take Quiz &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
