import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import type { AttemptSubmitRequest, QuizStudentDetail } from '../../types';

export const QuizTakingPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  // Map of question_id -> selected_index
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const hasAutoSubmittedRef = useRef(false);

  // Fetch quiz questions
  useEffect(() => {
    if (!quizId) return;
    const fetchQuiz = async () => {
      try {
        const data = await api.getQuizForTaking(quizId);
        setQuiz(data);
        setSecondsRemaining(data.duration_minutes * 60);
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  // Submit handler
  const handleFinalSubmit = async (isAuto = false) => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    setIsConfirmModalOpen(false);

    const answersPayload = quiz.questions.map((q) => ({
      question_id: q.id,
      selected_index: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : null,
    }));

    const submission: AttemptSubmitRequest = {
      quiz_id: quiz.id,
      answers: answersPayload,
    };

    try {
      const result = await api.submitQuiz(quiz.id, submission);
      navigate(`/attempts/${result.id}/result`, { state: { attempt: result, isAuto } });
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  // Timer countdown hook
  useEffect(() => {
    if (!quiz || secondsRemaining <= 0 || submitting) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasAutoSubmittedRef.current) {
            hasAutoSubmittedRef.current = true;
            handleFinalSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, secondsRemaining, submitting]);

  if (loading) {
    return <LoadingSpinner message="Starting quiz session..." />;
  }

  if (error && !quiz) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '2rem' }}>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '2rem' }}>
        <div className="alert alert-danger">This quiz does not have any questions available.</div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Format timer MM:SS
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isTimeCritical = secondsRemaining < 60;

  const handleSelectOption = (index: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: index,
    }));
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="container" style={{ maxWidth: '750px', marginTop: '1.5rem' }}>
      {/* Top Header with Timer and Title */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '1rem 1.5rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark-text)', margin: 0 }}>
            {quiz.title}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)' }}>
            Question {currentIndex + 1} of {totalQuestions} &bull; Answered {answeredCount}/{totalQuestions}
          </span>
        </div>

        {/* Countdown Timer Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)',
            background: isTimeCritical ? 'var(--danger-light)' : 'var(--primary-light)',
            color: isTimeCritical ? 'var(--danger)' : 'var(--primary)',
            fontWeight: 700,
            fontSize: '1.15rem',
          }}
        >
          <span>⏱️</span>
          <span>{timeFormatted}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Question Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <span className="badge badge-primary">Question {currentIndex + 1}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 600 }}>
            {currentQuestion.points} {currentQuestion.points === 1 ? 'Point' : 'Points'}
          </span>
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--dark-text)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
          {currentQuestion.text}
        </h3>

        {/* Multiple Choice Options */}
        <div>
          {currentQuestion.options.map((optionText, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isSelected = selectedAnswers[currentQuestion.id] === optIdx;

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                className={`option-btn ${isSelected ? 'selected' : ''}`}
              >
                <div className="option-indicator">{letter}</div>
                <span>{optionText}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation & Submit Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0 || submitting}
          className="btn btn-secondary"
        >
          &larr; Previous
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {currentIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              disabled={submitting}
              className="btn btn-primary"
            >
              Next Question &rarr;
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={submitting}
              className="btn btn-primary"
              style={{ background: 'var(--success)' }}
            >
              {submitting ? 'Submitting...' : 'Finish & Submit Quiz'}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        title="Submit Quiz Assessment?"
        message={`You have answered ${answeredCount} out of ${totalQuestions} questions. Are you ready to submit your attempt for grading?`}
        confirmLabel="Yes, Submit Now"
        cancelLabel="Continue Quiz"
        onConfirm={() => handleFinalSubmit(false)}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
};
