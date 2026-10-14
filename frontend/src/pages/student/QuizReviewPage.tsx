import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { AttemptResult } from '../../types';

export const QuizReviewPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    const fetchAttempt = async () => {
      try {
        const data = await api.getAttemptDetail(attemptId);
        setAttempt(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load attempt review');
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [attemptId]);

  if (loading) {
    return <LoadingSpinner message="Loading answer review..." />;
  }

  if (error || !attempt) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '2rem' }}>
        <div className="alert alert-danger">{error || 'Attempt not found'}</div>
        <Link to="/attempts/my" className="btn btn-secondary">&larr; Back to History</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '1.5rem' }}>
      {/* Header Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.25rem' }}>Answer Review</span>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-text)', margin: 0 }}>
            {attempt.quiz_title}
          </h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)' }}>
            Completed on {new Date(attempt.completed_at).toLocaleString()}
          </span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: attempt.passed ? 'var(--success)' : 'var(--danger)' }}>
            {attempt.percentage}%
          </div>
          <span className={`badge ${attempt.passed ? 'badge-pass' : 'badge-fail'}`}>
            {attempt.score}/{attempt.total_points} PTS
          </span>
        </div>
      </div>

      {/* Questions Review List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {attempt.reviews.map((item, idx) => {
          const isCorrect = item.is_correct;
          const isUnanswered = item.selected_index === null;

          return (
            <div
              key={item.question_id || idx}
              className="card"
              style={{
                borderLeft: `4px solid ${
                  isCorrect ? 'var(--success)' : isUnanswered ? 'var(--warning)' : 'var(--danger)'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--dark-text)' }}>
                  Question {idx + 1}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {isCorrect ? (
                    <span className="badge badge-pass">✓ Correct (+{item.points_earned} pts)</span>
                  ) : isUnanswered ? (
                    <span className="badge badge-draft">⚠️ Unanswered (0 pts)</span>
                  ) : (
                    <span className="badge badge-fail">✗ Incorrect (0 pts)</span>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>
                    Max: {item.points_possible} pts
                  </span>
                </div>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--dark-text)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                {item.text}
              </h3>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {item.options.map((optText, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isUserSelection = item.selected_index === optIdx;
                  const isCorrectAnswer = item.correct_index === optIdx;

                  let optionBorder = 'var(--border-color)';
                  let optionBg = 'var(--card-bg)';
                  let statusTag = null;

                  if (isCorrectAnswer) {
                    optionBorder = 'var(--success)';
                    optionBg = 'var(--success-light)';
                    statusTag = <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem' }}>✓ Correct Answer</span>;
                  } else if (isUserSelection && !isCorrect) {
                    optionBorder = 'var(--danger)';
                    optionBg = 'var(--danger-light)';
                    statusTag = <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.85rem' }}>✗ Your Choice</span>;
                  }

                  return (
                    <div
                      key={optIdx}
                      style={{
                        padding: '0.75rem 1rem',
                        border: `2px solid ${optionBorder}`,
                        backgroundColor: optionBg,
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isCorrectAnswer ? 'var(--success)' : isUserSelection ? 'var(--danger)' : '#E2E8F0',
                            color: isCorrectAnswer || isUserSelection ? '#FFF' : 'var(--dark-text)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          {letter}
                        </span>
                        <span style={{ fontSize: '0.95rem', color: 'var(--dark-text)', fontWeight: isUserSelection || isCorrectAnswer ? 600 : 400 }}>
                          {optText}
                        </span>
                      </div>
                      {statusTag}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Note */}
              {item.explanation && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.9rem',
                    color: 'var(--dark-text)',
                  }}
                >
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.2rem' }}>
                    💡 Explanation:
                  </strong>
                  {item.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Back Button */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/attempts/my" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
          &larr; Back to My Attempt History
        </Link>
      </div>
    </div>
  );
};
