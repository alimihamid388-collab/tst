import React, { useState } from 'react';
import { Question, QuestionOption, Stage } from '../../types/database';
import { X, CheckCircle2, AlertCircle, Sparkles, ArrowLeft, RefreshCw, Trophy } from 'lucide-react';

interface QuizModalProps {
  question: Question;
  stage: Stage;
  userId: string;
  questionNumber: number;
  totalQuestions: number;
  previouslyAnsweredOptionId?: string;
  isAlreadyCorrect?: boolean;
  onClose: () => void;
  onSubmitAnswer: (optionId: string) => {
    isCorrect: boolean;
    stageCompleted: boolean;
    stagePassed: boolean;
    correctCount: number;
    totalQuestions: number;
    explanation?: string;
  };
  onNextStage?: () => void;
  onRetryStage?: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  question,
  stage,
  questionNumber,
  totalQuestions,
  previouslyAnsweredOptionId,
  isAlreadyCorrect = false,
  onClose,
  onSubmitAnswer,
  onNextStage,
  onRetryStage,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    previouslyAnsweredOptionId || ''
  );
  const [submittedResult, setSubmittedResult] = useState<{
    isCorrect: boolean;
    stageCompleted: boolean;
    stagePassed: boolean;
    correctCount: number;
    totalQuestions: number;
    explanation?: string;
  } | null>(null);

  const options = question.options || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOptionId) return;

    const result = onSubmitAnswer(selectedOptionId);
    setSubmittedResult(result);
  };

  const isCompletedStage = submittedResult?.stageCompleted;
  const isFailedStage =
    submittedResult?.stageCompleted === false &&
    submittedResult.correctCount < 4 &&
    submittedResult.correctCount + (totalQuestions - questionNumber) < 4; // mathematical check or at end

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container: Bottom sheet on mobile, centered card on tablet/desktop */}
      <div className="w-full sm:max-w-xl glass-panel-card rounded-t-3xl sm:rounded-2xl border-t sm:border border-white/20 p-5 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors focus:outline-none"
          title="بستن"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Badges */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 pr-1">
          <span className="text-teal-400 font-semibold">{stage.title}</span>
          <span aria-hidden="true">·</span>
          <span>
            سؤال <span className="text-white font-bold tabular-nums">{questionNumber}</span> از{' '}
            <span className="text-white font-bold tabular-nums">{totalQuestions}</span>
          </span>
          {isAlreadyCorrect && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> قبلاً پاسخ صحیح داده‌اید
              </span>
            </>
          )}
        </div>

        {/* Question Title */}
        <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed mb-5 text-right">
          {question.question_text}
        </h3>

        {/* Options List */}
        {!submittedResult ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2.5">
              {options.map((option, idx) => {
                const isSelected = selectedOptionId === option.id;
                const optionLetters = ['الف', 'ب', 'ج', 'د'];
                return (
                  <label
                    key={option.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-right cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'border-teal-400 bg-teal-500/15 text-white shadow-lg shadow-teal-950/40'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                          isSelected ? 'bg-teal-400 text-slate-950 font-bold' : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {optionLetters[idx] || idx + 1}
                      </span>
                      <span className="text-sm font-medium leading-relaxed">{option.option_text}</span>
                    </div>

                    <input
                      type="radio"
                      name="quiz-option"
                      value={option.id}
                      checked={isSelected}
                      onChange={() => setSelectedOptionId(option.id)}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                انصراف و گشت در تور
              </button>
              <button
                type="submit"
                disabled={!selectedOptionId}
                className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-40 disabled:hover:bg-teal-400 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95"
              >
                ثبت و بررسی پاسخ
              </button>
            </div>
          </form>
        ) : (
          /* Result & Explanation Feedback Screen */
          <div className="space-y-4 animate-in fade-in duration-200 text-right">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                submittedResult.isCorrect
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
              }`}
            >
              {submittedResult.isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-sm text-white mb-1">
                  {submittedResult.isCorrect ? 'پاسخ شما کاملاً صحیح است!' : 'متأسفانه پاسخ نادرست بود.'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {submittedResult.explanation ||
                    (submittedResult.isCorrect
                      ? 'آفرین! نشانه سه‌بعدی به درستی شناسایی شد و وضعیت این نقطه به حالت تکمیل شده (✓) درآمد.'
                      : 'این گزینه صحیح نبود. شما می‌توانید به گشت در محیط ادامه داده و سایر سؤالات را بیابید.')}
                </p>
              </div>
            </div>

            {/* Stage Completion Banner if stage finished */}
            {submittedResult.stageCompleted && (
              <div className="p-4 rounded-xl bg-gradient-to-l from-amber-500/20 to-teal-500/20 border border-amber-400/30 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm text-amber-300">
                    تبریک! شما این مرحله را با موفقیت پشت سر گذاشتید!
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  نمره شما: <strong className="text-teal-300">{submittedResult.correctCount}</strong> از{' '}
                  <strong className="text-teal-300">{submittedResult.totalQuestions}</strong> پاسخ صحیح. مرحله بعدی برای شما باز شد.
                </p>
              </div>
            )}

            {/* Actions after submit */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
              <span className="text-xs text-slate-400">
                مجموع پاسخ‌های صحیح این مرحله:{' '}
                <strong className="text-teal-400 font-bold tabular-nums">
                  {submittedResult.correctCount} / {submittedResult.totalQuestions}
                </strong>
              </span>

              <div className="flex items-center gap-2">
                {submittedResult.stageCompleted && onNextStage && (
                  <button
                    onClick={onNextStage}
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                  >
                    <span>ورود به مرحله بعدی</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-white/10"
                >
                  ادامه گشت ۳۶۰ درجه
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
