import React from 'react';
import { Stage } from '../../types/database';
import { db } from '../../services/db';
import {
  Compass,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronLeft,
  Trophy,
  Layers,
  Flame,
  Radio,
  ArrowRight,
} from 'lucide-react';

interface UserDashboardProps {
  userId: string;
  onSelectStage: (stage: Stage) => void;
  onResumeTour: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  userId,
  onSelectStage,
  onResumeTour,
}) => {
  const stages = db.getStages();
  const latestStage = db.getUserLatestAvailableStage(userId);
  const attempts = db.getQuizAttempts().filter((a) => a.user_id === userId);

  // Overall progress
  let totalCorrect = 0;
  let completedSpaces = 0;
  stages.forEach((s) => {
    const status = db.getUserStageStatus(userId, s.id);
    totalCorrect += status.correctCount;
    if (status.isCompleted) completedSpaces++;
  });

  const storySteps = [
    {
      title: 'کوچه تخریب‌شده',
      desc: 'ارزیابی خطرات محیطی، نشت گاز، کابل‌های برق فشار قوی و آوار معلق',
      icon: '۱',
    },
    {
      title: 'ساختمان آسیب‌دیده',
      desc: 'ورود به ساختمان نیمه‌ویران، بررسی ترک‌های برشی و نجات محبوسین',
      icon: '۲',
    },
    {
      title: 'پناهگاه امن',
      desc: 'تثبیت مصدومان، برقراری ارتباط با بیسیم و هدایت عملیات بحران',
      icon: '۳',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-10 animate-in fade-in duration-200 text-right">
      {/* 
        Clean, Dramatic Story Hero 
        "تور مجازی مدیریت بحران"
        «در یک سناریوی واقعی بحران قرار بگیرید، محیط را جستجو کنید و با تصمیم‌های درست مسیر خود را ادامه دهید.»
        [شروع تور]
      */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 p-6 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>شبیه‌ساز یکپارچه ۳۶۰ درجه عملیات نجات شهری</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            تور مجازی تعاملی مدیریت بحران
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            در یک سناریوی واقعی بحران قرار بگیرید، محیط‌های ۳۶۰ درجه را جستجو کنید و با تصمیم‌های درست، مسیر نجات را از کوچه تخریب‌شده و ساختمان آسیب‌دیده به سوی پناهگاه امن ادامه دهید.
          </p>

          {/* Primary Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={onResumeTour}
              className="px-8 py-4 text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-2xl shadow-xl shadow-teal-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 group cursor-pointer"
            >
              <span>{totalCorrect > 0 ? 'ادامه سناریوی بحران' : 'شروع تور'}</span>
              <Play className="w-4 h-4 fill-slate-950 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {totalCorrect > 0 && (
              <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>آخرین موقعیت: {latestStage.title}</span>
              </span>
            )}
          </div>
        </div>

        {/* Narrative Continuous Timeline Bar */}
        <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
          <div className="text-xs font-semibold text-slate-400">
            مسیر پیوسته سناریو (انتقال خودکار میان فضاها درون نمایشگر):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {storySteps.map((step, idx) => {
              const stage = stages[idx];
              const status = stage ? db.getUserStageStatus(userId, stage.id) : null;
              const isCurrent = latestStage.id === stage?.id;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all text-right ${
                    status?.isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : isCurrent
                      ? 'bg-teal-500/15 border-teal-500/40 shadow-lg shadow-teal-950/30'
                      : 'bg-white/5 border-white/5 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold text-xs flex items-center justify-center">
                      {step.icon}
                    </span>
                    {status?.isCompleted ? (
                      <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> پاک‌سازی شد
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[10px] text-teal-300 font-bold">موقعیت فعلی</span>
                    ) : (
                      <span className="text-[10px] text-slate-500">گام {idx + 1}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">{step.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Panoramas of the Crisis Narrative */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">محیط‌های ۳۶۰ درجه سناریوی بحران</h2>
          <span className="text-xs text-slate-400">پیوستگی بدون خروج از نمایشگر</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stages.map((stage, index) => {
            const pano = db.getPanoramaById(stage.panorama_id);
            const status = db.getUserStageStatus(userId, stage.id);

            return (
              <div
                key={stage.id}
                className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all group"
              >
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  {pano?.file_url ? (
                    <img
                      src={pano.file_url}
                      alt={stage.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e1217] via-transparent to-black/40" />

                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-black/70 text-white backdrop-blur-md">
                    فضای {index + 1}
                  </div>

                  <div className="absolute top-3 left-3">
                    {status.isCompleted ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/90 text-slate-950 backdrop-blur-md">
                        تکمیل شد ✓
                      </span>
                    ) : status.isUnlocked ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/90 text-slate-950 backdrop-blur-md">
                        در دسترس
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 backdrop-blur-md border border-white/10">
                        قفل
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-white">{stage.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      پاسخ‌های صحیح:{' '}
                      <strong className="text-teal-300 tabular-nums">
                        {status.correctCount} / {status.totalQuestions}
                      </strong>
                    </span>

                    {status.isUnlocked ? (
                      <button
                        onClick={() => onSelectStage(stage)}
                        className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                      >
                        <span>ورود مستقیم</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">منوط به تکمیل فضای قبلی</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiz History if any */}
      {attempts.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>کارنامه تلاش‌های ثبت‌شده در سناریوی بحران</span>
            </h3>
            <span className="text-xs text-slate-400">{attempts.length} ثبت عملیاتی</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5 px-3 text-right">محیط</th>
                  <th className="py-2.5 px-3 text-center">نوبت</th>
                  <th className="py-2.5 px-3 text-center">امتیاز کسب‌شده</th>
                  <th className="py-2.5 px-3 text-center">نتیجه</th>
                  <th className="py-2.5 px-3 text-left">زمان ثبت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-medium text-white">{att.stage_title}</td>
                    <td className="py-3 px-3 text-center tabular-nums">نوبت {att.attempt_number}</td>
                    <td className="py-3 px-3 text-center font-bold text-teal-400 tabular-nums">
                      {att.correct_answers} از {att.total_questions}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {att.is_passed ? (
                        <span className="text-emerald-400 font-semibold">قبول (انتقال خودکار به فضای بعد)</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">مردود (کمتر از ۴ پاسخ صحیح)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-left text-slate-400 font-mono tabular-nums" dir="ltr">
                      {new Date(att.created_at).toLocaleDateString('fa-IR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
