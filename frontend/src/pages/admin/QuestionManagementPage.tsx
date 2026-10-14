import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import type { QuestionAdmin, QuestionCreate, QuizAdminDetail } from '../../types';

export const QuestionManagementPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();

  const [quiz, setQuiz] = useState<QuizAdminDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New question form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Question form data
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [points, setPoints] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Deletion state
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

  const fetchQuiz = async () => {
    if (!quizId) return;
    try {
      const data = await api.getAdminQuiz(quizId);
      setQuiz(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const resetForm = () => {
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
    setPoints(1);
    setExplanation('');
    setIsAdding(false);
    setEditingQuestionId(null);
  };

  const handleStartEdit = (q: QuestionAdmin) => {
    setEditingQuestionId(q.id);
    setQuestionText(q.text);
    setOptions([...q.options]);
    setCorrectIndex(q.correct_index);
    setPoints(q.points);
    setExplanation(q.explanation || '');
    setIsAdding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizId) return;
    setError(null);
    setSuccess(null);

    if (!questionText.trim()) {
      setError('Question text is required.');
      return;
    }

    for (let i = 0; i < options.length; i++) {
      if (!options[i].trim()) {
        setError(`Option ${String.fromCharCode(65 + i)} cannot be blank.`);
        return;
      }
    }

    setSavingQuestion(true);
    const payload: QuestionCreate = {
      text: questionText,
      options,
      correct_index: correctIndex,
      points: Number(points),
      explanation,
    };

    try {
      if (editingQuestionId) {
        await api.updateQuestion(quizId, editingQuestionId, payload);
        setSuccess('Question updated successfully.');
      } else {
        await api.addQuestion(quizId, payload);
        setSuccess('Question added successfully.');
      }
      resetForm();
      fetchQuiz();
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!quizId || !deleteQuestionId) return;
    setError(null);
    setSuccess(null);
    try {
      await api.deleteQuestion(quizId, deleteQuestionId);
      setSuccess('Question deleted successfully.');
      setDeleteQuestionId(null);
      fetchQuiz();
    } catch (err: any) {
      setError(err.message || 'Failed to delete question');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading questions pool..." />;
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
    <div className="container" style={{ maxWidth: '850px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.25rem' }}>Question Bank</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-text)' }}>
            {quiz?.title}
          </h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem' }}>
            {quiz?.question_count} Questions &bull; {quiz?.total_points} Total Points &bull; {quiz?.duration_minutes} Mins
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="btn btn-primary"
          >
            + Add Question
          </button>
          <Link to="/admin/quizzes" className="btn btn-secondary">
            Done
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add or Edit Question Form Card */}
      {(isAdding || editingQuestionId) && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark-text)' }}>
              {editingQuestionId ? 'Edit Question' : 'Add New Multiple-Choice Question'}
            </h3>
            <button type="button" onClick={resetForm} className="btn btn-secondary btn-sm">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveQuestion}>
            <div className="form-group">
              <label className="form-label">Question Text *</label>
              <input
                type="text"
                required
                className="form-input"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="What is the result of...?"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Options (Mark the radio button for the correct answer) *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  return (
                    <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="radio"
                        name="correct_answer_radio"
                        checked={correctIndex === optIdx}
                        onChange={() => setCorrectIndex(optIdx)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        title="Mark as correct answer"
                      />
                      <span style={{ fontWeight: 700, width: '20px' }}>{letter}.</span>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[optIdx] = e.target.value;
                          setOptions(updated);
                        }}
                        placeholder={`Option ${letter}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Points Value</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  className="form-input"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Explanation</label>
                <input
                  type="text"
                  className="form-input"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Rationale shown to students after submitting..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={savingQuestion} className="btn btn-primary">
                {savingQuestion ? 'Saving...' : editingQuestionId ? 'Update Question' : 'Save Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {quiz?.questions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--muted-text)', marginBottom: '1rem' }}>
              No questions added to this quiz yet.
            </p>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
              className="btn btn-primary"
            >
              Add First Question
            </button>
          </div>
        ) : (
          quiz?.questions.map((q, idx) => (
            <div key={q.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span className="badge badge-primary" style={{ marginRight: '0.5rem' }}>
                    Q{idx + 1}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 600 }}>
                    {q.points} {q.points === 1 ? 'Point' : 'Points'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(q)}
                    className="btn btn-outline btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteQuestionId(q.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--dark-text)', marginBottom: '1rem', lineHeight: 1.4 }}>
                {q.text}
              </h4>

              {/* Options breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {q.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isCorrect = q.correct_index === optIdx;

                  return (
                    <div
                      key={optIdx}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius)',
                        border: `1px solid ${isCorrect ? 'var(--success)' : 'var(--border-color)'}`,
                        background: isCorrect ? 'var(--success-light)' : 'var(--bg-color)',
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        <strong>{letter}.</strong> {opt}
                      </span>
                      {isCorrect && (
                        <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.75rem' }}>
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div style={{ fontSize: '0.85rem', color: 'var(--muted-text)', marginTop: '0.5rem' }}>
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Question Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteQuestionId)}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmLabel="Delete Question"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteQuestionId(null)}
      />
    </div>
  );
};
