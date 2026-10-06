/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { Profile, Stage } from './types/database';
import { UserDashboard } from './components/user/UserDashboard';
import { VirtualTourView } from './components/user/VirtualTourView';
import { AdminLayout } from './components/admin/AdminLayout';
import { AuthModal } from './components/auth/AuthModal';
import {
  Compass,
  Shield,
  User,
  Info,
  BookOpen,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(db.getCurrentUser());
  const [currentView, setCurrentView] = useState<'dashboard' | 'tour' | 'admin'>('dashboard');
  const [activeStage, setActiveStage] = useState<Stage>(db.getStages()[0]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Subscribe to DB state updates
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setCurrentUser(db.getCurrentUser());
    });
    return unsubscribe;
  }, []);

  const handleSelectStage = (stage: Stage) => {
    setActiveStage(stage);
    setCurrentView('tour');
  };

  const handleResumeTour = () => {
    const latestStage = db.getUserLatestAvailableStage(currentUser?.id || 'demo');
    setActiveStage(latestStage);
    setCurrentView('tour');
  };

  // If Admin panel is open, show AdminLayout full view
  if (currentView === 'admin') {
    return <AdminLayout onBackToApp={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* 
        Top Bar Contract (Section 2 of frontend-design):
        [Zone 1: Brand title, one line] — [Zone 2: 4-6 clean text nav links] — [Zone 3: 1-2 primary actions]
      */}
      <header className="h-16 px-4 sm:px-8 glass-panel border-b border-white/10 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setCurrentView('dashboard')}
          className="text-base sm:text-lg font-black tracking-tight text-white hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 text-right"
        >
          تور مجازی مدیریت بحران
        </button>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`hover:text-white transition-colors whitespace-nowrap ${
              currentView === 'dashboard' ? 'text-teal-400 font-bold' : ''
            }`}
          >
            معرفی سناریو
          </button>
          <button
            onClick={handleResumeTour}
            className={`hover:text-white transition-colors whitespace-nowrap ${
              currentView === 'tour' ? 'text-teal-400 font-bold' : ''
            }`}
          >
            ورود به تور ۳۶۰
          </button>
          <button
            onClick={() => setShowRulesModal(true)}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            قوانین ارزیابی
          </button>
          <button
            onClick={() => setShowAboutModal(true)}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            درباره عملیات
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Admin Panel button */}
          <button
            onClick={() => setCurrentView('admin')}
            className="px-3.5 py-2 text-xs font-bold text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
            title="ورود به پنل مدیریت"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>پنل مدیریت</span>
          </button>

          {/* User profile / Login trigger */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">
              {currentUser ? currentUser.full_name : 'ورود / ثبت‌نام'}
            </span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 w-full relative">
        {currentView === 'dashboard' && (
          <UserDashboard
            userId={currentUser?.id || 'demo'}
            onSelectStage={handleSelectStage}
            onResumeTour={handleResumeTour}
          />
        )}

        {currentView === 'tour' && (
          <VirtualTourView
            stage={activeStage}
            userId={currentUser?.id || 'demo'}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onSelectStage={handleSelectStage}
          />
        )}
      </main>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 text-right">
          <div className="w-full max-w-lg glass-panel-card rounded-2xl border border-white/20 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-400" />
              <span>قوانین تور پیوسته مدیریت بحران</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-teal-300 block mb-1">سناریوی یکپارچه و متوالی:</strong>
                این تور شامل ۳ فضای واقعی بحران شهری است: کوچه تخریب‌شده ➔ ساختمان آسیب‌دیده ➔ پناهگاه امن. تمام جابجایی‌ها به صورت پیوسته و خودکار درون همان نمایشگر انجام می‌پذیرد.
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <strong className="block mb-1 font-bold">شرط انتقال خودکار به فضای بعدی:</strong>
                در هر فضا ۵ موقعیت ارزیابی بحران وجود دارد؛ با ثبت <strong className="underline">حداقل ۴ پاسخ صحیح از ۵ سؤال (۸۰٪)</strong>، سیستم بدون نیاز به کلیک جداگانه، تصویر فضای بعدی را با انیمیشن محو شدن (Fade) بارگذاری می‌کند.
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-emerald-300 block mb-1">ذخیره خودکار پیشرفت (Resume):</strong>
                در هر لحظه از خروج، آخرین وضعیت نجات و پاسخ‌های ثبت‌شده ذخیره شده و می‌توانید سناریو را از همان نقطه ادامه دهید.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 text-right">
          <div className="w-full max-w-lg glass-panel-card rounded-2xl border border-white/20 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-teal-400" />
              <span>درباره سناریوی شبیه‌سازی مدیریت بحران ۳۶۰ درجه</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                این وب‌اپلیکیشن یک شبیه‌ساز واقعیت مجازی داستان‌محور برای آموزش تصمیم‌گیری در بحران‌های شهری (زلزله و تخریب زیرساخت) است.
              </p>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 font-mono text-[11px]" dir="ltr">
                <div>• Spaces: Damaged Street ➔ Damaged Building ➔ Safe Command Shelter</div>
                <div>• Seamless In-Viewer Transition: Automatic Fade Transition between Panoramas</div>
                <div>• Three.js WebGL: Spherical Inverted Geometry with Raycasting Hotspots</div>
                <div>• Backend: Supabase PostgreSQL Schema with RLS Policies</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth / Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
