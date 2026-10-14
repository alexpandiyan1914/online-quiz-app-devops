import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { QuestionCreate, QuizCreateRequest } from '../../types';

export const CreateQuizPage: React.FC = () => {
  const navigate = useNavigate();

  // Quiz details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [isPublished, setIsPublished] = useState(false);

  // Dynamic question builder list
  const [questions, setQuestions] = useState<QuestionCreate[]>([
    {
      text: '',
      options: ['', '', '', ''],
      correct_index: 0,
      points: 1,
      explanation: '',
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Question manipulation helpers
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        text: '',
        options: ['', '', '', ''],
        correct_index: 0,
        points: 1,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx: number, val: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx].text = val;
      return copy;
    });
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options[optIdx] = val;
      return copy;
    });
  };

  const handleCorrectIndexChange = (qIdx: number, optIdx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].correct_index = optIdx;
      return copy;
    });
  };

  const handleExplanationChange = (qIdx: number, val: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].explanation = val;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Quiz title is required.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question #${i + 1} is missing question text.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`Question #${i + 1}, Option ${String.fromCharCode(65 + j)} cannot be empty.`);
          return;
        }
      }
    }

    setSaving(true);
    const payload: QuizCreateRequest = {
      title,
      description,
      duration_minutes: Number(durationMinutes),
      passing_percentage: Number(passingPercentage),
      is_published: isPublished,
      questions,
    };

    try {
      await api.createQuiz(payload);
      navigate('/admin/quizzes');
    } catch (err: any) {
      setError(err.message || 'Failed to create quiz');
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '850px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-text)' }}>Create New Quiz</h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem' }}>
            Configure assessment parameters and build questions before publishing.
          </p>
        </div>
        <Link to="/admin/quizzes" className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Quiz Parameters Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--dark-text)' }}>
            1. Quiz Details &amp; Settings
          </h3>

          <div className="form-group">
            <label className="form-label">Quiz Title *</label>
            <input
              type="text"
              required
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cloud Architecture &amp; DevOps Fundamentals"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a clear description of the topics covered in this quiz..."
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
              <label className="form-label">Status</label>
              <div style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="publishCheckbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="publishCheckbox" style={{ fontSize: '0.95rem', cursor: 'pointer', fontWeight: 600 }}>
                  Publish Immediately
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Question Builder Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark-text)' }}>
              2. Questions Builder ({questions.length})
            </h3>
            <button type="button" onClick={handleAddQuestion} className="btn btn-outline btn-sm">
              + Add Question
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary">Question #{qIdx + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Question Text *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={q.text}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    placeholder="Enter the question here..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                    Options (Select the radio button for the correct answer) *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options.map((optText, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      return (
                        <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="radio"
                            name={`correct_radio_${qIdx}`}
                            checked={q.correct_index === optIdx}
                            onChange={() => handleCorrectIndexChange(qIdx, optIdx)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            title="Mark as correct answer"
                          />
                          <span style={{ fontWeight: 700, width: '20px' }}>{letter}.</span>
                          <input
                            type="text"
                            required
                            className="form-input"
                            value={optText}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${letter}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Explanation (Revealed to students after completion)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={q.explanation}
                    onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                    placeholder="Provide context explaining why the selected answer is correct..."
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button type="button" onClick={handleAddQuestion} className="btn btn-secondary">
              + Add Another Question
            </button>
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '3rem' }}>
          <Link to="/admin/quizzes" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
          >
            {saving ? 'Creating Quiz...' : 'Create & Save Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};
