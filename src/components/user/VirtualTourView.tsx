import React, { useState, useEffect } from 'react';
import { Stage, Hotspot, Question } from '../../types/database';
import { db } from '../../services/db';
import { PanoramaViewer } from '../viewer/PanoramaViewer';
import { QuizModal } from '../quiz/QuizModal';
import { InfoModal } from '../hotspots/InfoModal';
import {
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle2,
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Compass,
} from 'lucide-react';

interface VirtualTourViewProps {
  stage?: Stage;
  initialStage?: Stage;
  userId: string;
  onBackToDashboard: () => void;
  onSelectStage?: (stage: Stage) => void;
}

export const VirtualTourView: React.FC<VirtualTourViewProps> = ({
  stage,
  initialStage,
  userId,
  onBackToDashboard,
  onSelectStage,
}) => {
  const allStages = db.getStages();
  const [currentStage, setCurrentStage] = useState<Stage>(
    stage || initialStage || db.getUserLatestAvailableStage(userId)
  );

  useEffect(() => {
    if (stage && stage.id !== currentStage.id) {
      setCurrentStage(stage);
    }
  }, [stage]);

  const [activeQuizQuestion, setActiveQuizQuestion] = useState<Question | null>(null);
  const [activeInfoHotspot, setActiveInfoHotspot] = useState<Hotspot | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Seamless Story Transition State
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [showAutoAdvanceBanner, setShowAutoAdvanceBanner] = useState<{
    text: string;
    nextTitle: string;
  } | null>(null);

  // Final mission completion debrief modal
  const [showMissionCompleteModal, setShowMissionCompleteModal] = useState(false);

  const panorama = db.getPanoramaById(currentStage.panorama_id);
  const hotspots = db.getHotspots(currentStage.id);
  const stageQuestions = db.getQuestions(currentStage.id);
  const stageStatus = db.getUserStageStatus(userId, currentStage.id);

  const currentStageIndex = allStages.findIndex((s) => s.id === currentStage.id);
  const isFinalSpace = currentStageIndex === allStages.length - 1;
  const nextStage = !isFinalSpace ? allStages[currentStageIndex + 1] : null;

  // Seamlessly transition to a stage inside the viewer with cinematic fade
  const executeSeamlessTransition = (targetStage: Stage, customMessage?: string) => {
    setIsTransitioning(true);
    setTransitionMessage(
      customMessage || `در حال ورود به ${targetStage.title}... ادامه مسیر سناریوی بحران`
    );
    setActiveQuizQuestion(null);
    setActiveInfoHotspot(null);
    setShowAutoAdvanceBanner(null);

    // Wait for black fade out
    setTimeout(() => {
      setCurrentStage(targetStage);
      setRefreshKey((k) => k + 1);

      // Fade in after texture begins loading
      setTimeout(() => {
        setIsTransitioning(false);
      }, 700);
    }, 600);
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (isTransitioning) return;

    if (hotspot.hotspot_type === 'question') {
      const q = db.getQuestionByHotspotId(hotspot.id);
      if (q) {
        setActiveQuizQuestion(q);
      }
    } else {
      setActiveInfoHotspot(hotspot);
    }
  };

  const handleSubmitAnswer = (optionId: string) => {
    if (!activeQuizQuestion) {
      return {
        isCorrect: false,
        stageCompleted: false,
        stagePassed: false,
        correctCount: 0,
        totalQuestions: 5,
      };
    }

    const result = db.submitAnswer(userId, currentStage.id, activeQuizQuestion.id, optionId);
    setRefreshKey((k) => k + 1);

    // CRITICAL USER REQUIREMENT:
    // When the passing criteria is met (stagePassed / stageCompleted e.g. 4 of 5 correct):
    // AUTOMATICALLY transition to the next continuous space inside the viewer!
    // No route change, no dashboard opening, no clicking stage 2!
    if (result.stagePassed) {
      if (nextStage) {
        setShowAutoAdvanceBanner({
          text: 'تصمیمات امدادی شما صحیح بود و مسیر به سوی فضای بعدی باز شد!',
          nextTitle: nextStage.title,
        });

        // Trigger automatic seamless fade transition after 2 seconds
        setTimeout(() => {
          executeSeamlessTransition(nextStage);
        }, 2200);
      } else {
        // Final stage completed!
        setTimeout(() => {
          setShowMissionCompleteModal(true);
        }, 1500);
      }
    }

    return result;
  };

  const handleResetStage = () => {
    if (confirm('آیا مایلید ارزیابی این محیط را دوباره از ابتدا انجام دهید؟')) {
      db.resetStageProgress(userId, currentStage.id);
      setRefreshKey((k) => k + 1);
    }
  };

  const isHotspotAnswered = (hotspotId: string) => {
    return db.isHotspotAnsweredCorrectly(userId, hotspotId);
  };

  const currentQIndex = activeQuizQuestion
    ? stageQuestions.findIndex((q) => q.id === activeQuizQuestion.id) + 1
    : 1;

  const previouslyAnsweredOption = activeQuizQuestion
    ? db.getUserAnswers(userId, currentStage.id).find((a) => a.question_id === activeQuizQuestion.id)?.selected_option_id
    : undefined;

  const isCurrentQCorrect = activeQuizQuestion
    ? db.isQuestionAnsweredCorrectly(userId, activeQuizQuestion.id)
    : false;

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-black flex flex-col select-none">
      {/* Minimal Top HUD Layered Over 360 Viewer */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto">
        {/* Left: Back to Mission Overview */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="px-3 py-1.5 rounded-xl glass-panel text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 shadow-md"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">معرفی سناریو</span>
          </button>

          {/* Unified Story Narrative Progress Tracker */}
          <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-xl text-xs">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <div className="flex items-center gap-1.5 text-slate-300">
              {allStages.map((stg, sIdx) => {
                const isActive = stg.id === currentStage.id;
                const isPassed = db.getUserStageStatus(userId, stg.id).isCompleted;
                const shortNames = ['کوچه تخریب‌شده', 'ساختمان آسیب‌دیده', 'پناهگاه امن'];

                return (
                  <React.Fragment key={stg.id}>
                    <button
                      onClick={() => {
                        // Allow navigating directly to any unlocked stage
                        if (db.getUserStageStatus(userId, stg.id).isUnlocked && !isActive) {
                          executeSeamlessTransition(stg);
                        }
                      }}
                      disabled={!db.getUserStageStatus(userId, stg.id).isUnlocked}
                      className={`text-[11px] transition-colors flex items-center gap-1 ${
                        isActive
                          ? 'text-teal-300 font-bold'
                          : isPassed
                          ? 'text-emerald-400 font-medium'
                          : 'text-slate-500 opacity-60'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive
                            ? 'bg-teal-400 ring-2 ring-teal-400/40'
                            : isPassed
                            ? 'bg-emerald-400'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span className="hidden md:inline">{shortNames[sIdx] || stg.title}</span>
                    </button>
                    {sIdx < allStages.length - 1 && (
                      <span className="text-white/20 text-[10px]">➔</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Stage Status & Re-eval */}
        <div className="flex items-center gap-2">
          {stageStatus.isCompleted && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>محیط ایمن‌سازی شد</span>
            </div>
          )}

          <button
            onClick={handleResetStage}
            className="px-2.5 py-1.5 rounded-xl glass-panel text-slate-300 hover:text-white text-xs transition-colors flex items-center gap-1"
            title="شروع مجدد ارزیابی این فضا"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">آزمون مجدد</span>
          </button>
        </div>
      </header>

      {/* 360 Panorama Viewer */}
      <div className="flex-1 w-full h-full relative" key={`${currentStage.id}_${refreshKey}`}>
        <PanoramaViewer
          panoramaUrl={panorama?.file_url || ''}
          stageTitle={currentStage.title}
          stageDescription={currentStage.description}
          hotspots={hotspots}
          onHotspotClick={handleHotspotClick}
          initialYaw={currentStage.initial_yaw}
          initialPitch={currentStage.initial_pitch}
          initialFov={currentStage.initial_fov}
          answeredQuestionsCount={stageStatus.correctCount}
          totalQuestionsCount={stageQuestions.length || 5}
          isAnsweredCorrectly={isHotspotAnswered}
          isTransitioning={isTransitioning}
          transitionMessage={transitionMessage}
        />
      </div>

      {/* Auto-Advance Floating Story Alert (Shows right after 4th correct answer) */}
      {showAutoAdvanceBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 glass-panel-card rounded-2xl border border-teal-400/50 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-teal-300">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>{showAutoAdvanceBanner.text}</span>
          </div>
          <p className="text-[11px] text-slate-300">
            در حال انتقال خودکار به فضای بعدی: <strong className="text-white">{showAutoAdvanceBanner.nextTitle}</strong>...
          </p>
        </div>
      )}

      {/* Quiz Modal (In-scene glassmorphism modal on desktop, bottom sheet on mobile) */}
      {activeQuizQuestion && (
        <QuizModal
          question={activeQuizQuestion}
          stage={currentStage}
          userId={userId}
          questionNumber={currentQIndex}
          totalQuestions={stageQuestions.length}
          previouslyAnsweredOptionId={previouslyAnsweredOption}
          isAlreadyCorrect={isCurrentQCorrect}
          onClose={() => setActiveQuizQuestion(null)}
          onSubmitAnswer={handleSubmitAnswer}
          onNextStage={() => {
            if (nextStage) {
              executeSeamlessTransition(nextStage);
            }
          }}
          onRetryStage={handleResetStage}
        />
      )}

      {/* Info Modal */}
      {activeInfoHotspot && (
        <InfoModal
          hotspot={activeInfoHotspot}
          onClose={() => setActiveInfoHotspot(null)}
        />
      )}

      {/* Final Mission Completion Modal (Safe Shelter Reached!) */}
      {showMissionCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 text-right">
          <div className="w-full max-w-lg glass-panel-card rounded-3xl border border-teal-400/40 p-6 sm:p-8 shadow-2xl relative space-y-5 text-right">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center mx-auto shadow-xl">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                پایان موفقیت‌آمیز سناریوی مدیریت بحران!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                شما با اتخاذ تصمیمات فنی و اصولی، مسیر را از <strong className="text-teal-300">کوچه تخریب‌شده</strong> و{' '}
                <strong className="text-teal-300">ساختمان آسیب‌دیده</strong> با موفقیت طی کرده و بازماندگان را به{' '}
                <strong className="text-teal-300">پناهگاه امن</strong> منتقل نمودید.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>تعداد فضاهای پاک‌سازی‌شده:</span>
                <span className="font-bold text-white tabular-nums">۳ از ۳ محیط ۳۶۰ درجه</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>وضعیت گواهی عملیاتی:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> تأییدشده
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowMissionCompleteModal(false);
                  onBackToDashboard();
                }}
                className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all shadow-lg shadow-teal-500/20"
              >
                مشاهده کارنامه و بازگشت به صفحه اصلی
              </button>

              <button
                onClick={() => {
                  setShowMissionCompleteModal(false);
                  executeSeamlessTransition(allStages[0], 'شروع مجدد تور مدیریت بحران از کوچه تخریب‌شده...');
                }}
                className="px-4 py-2.5 text-xs font-medium text-white bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
              >
                شروع مجدد از ابتدا
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
