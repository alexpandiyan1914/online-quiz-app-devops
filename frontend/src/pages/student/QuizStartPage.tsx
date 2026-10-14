import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { QuizStudentDetail } from '../../types';

export const QuizStartPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<QuizStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!quizId) return;
    const fetchQuiz = async () => {
      try {
        const data = await api.getQuizForTaking(quizId);
        setQuiz(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz instructions');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  if (loading) {
    return <LoadingSpinner message="Preparing quiz details..." />;
  }

  if (error || !quiz) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '2rem' }}>
        <div className="alert alert-danger">{error || 'Quiz not found'}</div>
        <Link to="/quizzes" className="btn btn-secondary">&larr; Back to Quizzes</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '680px', marginTop: '2rem' }}>
      <div className="card">
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>Timed Assessment</span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--dark-text)', marginBottom: '0.5rem' }}>
            {quiz.title}
          </h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '1rem', lineHeight: 1.5 }}>
            {quiz.description}
          </p>
        </div>

        {/* Assessment Specifications */}
        <div className="grid grid-cols-3" style={{ marginBottom: '1.75rem' }}>
          <div style={{ padding: '0.85rem', background: 'var(--bg-color)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)', display: 'block' }}>Duration</span>
            <strong style={{ fontSize: '1.15rem' }}>{quiz.duration_minutes} Minutes</strong>
          </div>
          <div style={{ padding: '0.85rem', background: 'var(--bg-color)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)', display: 'block' }}>Questions</span>
            <strong style={{ fontSize: '1.15rem' }}>{quiz.question_count} MCQs</strong>
          </div>
          <div style={{ padding: '0.85rem', background: 'var(--bg-color)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)', display: 'block' }}>Passing Score</span>
            <strong style={{ fontSize: '1.15rem' }}>{quiz.passing_percentage}%</strong>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>Instructions &amp; Rules:</h4>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--muted-text)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            <li>You will navigate through <strong>one question at a time</strong>.</li>
            <li>Each question has <strong>one correct option</strong>.</li>
            <li>The countdown timer starts immediately once you click "Start Assessment".</li>
            <li>If the timer expires before you submit, your answered questions will be <strong>automatically submitted</strong>.</li>
            <li>You can review your score, full breakdown, and explanations after completion.</li>
          </ul>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Link to="/quizzes" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => navigate(`/quizzes/${quiz.id}/take`)}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            Start Assessment &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
