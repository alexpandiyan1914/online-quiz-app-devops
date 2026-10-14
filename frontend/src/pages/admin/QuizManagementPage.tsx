import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import type { QuizAdminDetail } from '../../types';

export const QuizManagementPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizAdminDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Deletion modal state
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);
  const [deleteQuizTitle, setDeleteQuizTitle] = useState<string>('');

  const fetchQuizzes = async () => {
    try {
      const data = await api.getAdminQuizzes();
      setQuizzes(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleTogglePublish = async (quiz: QuizAdminDetail) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await api.updateQuiz(quiz.id, { is_published: !quiz.is_published });
      setSuccessMsg(`Quiz "${quiz.title}" ${!quiz.is_published ? 'published' : 'unpublished'} successfully.`);
      fetchQuizzes();
    } catch (err: any) {
      setError(err.message || 'Failed to update publication status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteQuizId) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.deleteQuiz(deleteQuizId);
      setSuccessMsg(`Quiz "${deleteQuizTitle}" deleted successfully.`);
      setDeleteQuizId(null);
      fetchQuizzes();
    } catch (err: any) {
      setError(err.message || 'Failed to delete quiz');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading quiz catalog..." />;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-text)' }}>Quiz Management</h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '1rem' }}>
            Create, edit, publish, and manage quiz assessments and question pools.
          </p>
        </div>
        <Link to="/admin/quizzes/create" className="btn btn-primary">
          + Create New Quiz
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card">
        {quizzes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--muted-text)', marginBottom: '1rem' }}>No quizzes created yet.</p>
            <Link to="/admin/quizzes/create" className="btn btn-primary">Create Your First Quiz</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Questions</th>
                  <th>Total Pts</th>
                  <th>Duration</th>
                  <th>Passing %</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div>{q.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>
                        Created: {new Date(q.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>{q.question_count}</td>
                    <td>{q.total_points}</td>
                    <td>{q.duration_minutes}m</td>
                    <td>{q.passing_percentage}%</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(q)}
                        className={`badge ${q.is_published ? 'badge-published' : 'badge-draft'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle status"
                      >
                        {q.is_published ? 'PUBLISHED (Live)' : 'DRAFT (Hidden)'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Link to={`/admin/quizzes/${q.id}/questions`} className="btn btn-secondary btn-sm">
                          Questions ({q.question_count})
                        </Link>
                        <Link to={`/admin/quizzes/${q.id}/edit`} className="btn btn-outline btn-sm">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteQuizId(q.id);
                            setDeleteQuizTitle(q.title);
                          }}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteQuizId)}
        title="Delete Quiz"
        message={`Are you sure you want to permanently delete "${deleteQuizTitle}"? This will remove all associated questions.`}
        confirmLabel="Delete Quiz"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteQuizId(null)}
      />
    </div>
  );
};
