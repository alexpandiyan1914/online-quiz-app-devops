import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { QuizAdminDetail } from '../../types';

export const EditQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();

  const [quiz, setQuiz] = useState<QuizAdminDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    const fetchQuiz = async () => {
      try {
        const data = await api.getAdminQuiz(quizId);
        setQuiz(data);
        setTitle(data.title);
        setDescription(data.description);
        setDurationMinutes(data.duration_minutes);
        setPassingPercentage(data.passing_percentage);
        setIsPublished(data.is_published);
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizId) return;
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const updated = await api.updateQuiz(quizId, {
        title,
        description,
        duration_minutes: Number(durationMinutes),
        passing_percentage: Number(passingPercentage),
        is_published: isPublished,
      });
      setQuiz(updated);
      setSuccess('Quiz settings updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update quiz settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading quiz details..." />;
  }

  if (error && !quiz) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '2rem' }}>
        <div className="alert alert-danger">{error}</div>
        <Link to="/admin/quizzes" className="btn btn-secondary">&larr; Back to Quizzes</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '750px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-text)' }}>Edit Quiz Settings</h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem' }}>
            Modify quiz configuration, timing, and publication state.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`/admin/quizzes/${quizId}/questions`} className="btn btn-primary">
            Manage Questions ({quiz?.question_count}) &rarr;
          </Link>
          <Link to="/admin/quizzes" className="btn btn-secondary">
            Back
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Quiz Title *</label>
            <input
              type="text"
              required
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={4}
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3">
            <div className="form-group">
              <label className="form-label">Duration (Minutes)</label>
              <input
                type="number"
                min={1}
                max={180}
                required
                className="form-input"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Passing Percentage (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                required
                className="form-input"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Publication Status</label>
              <div style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="publishEdit"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="publishEdit" style={{ fontSize: '0.95rem', cursor: 'pointer', fontWeight: 600 }}>
                  Published (Live to Students)
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <Link to="/admin/quizzes" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
