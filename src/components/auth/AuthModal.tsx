import React, { useState } from 'react';
import { db } from '../../services/db';
import { Profile } from '../../types/database';
import { User, LogIn, UserPlus, Shield, X, Check, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'profile'>(
    currentUser ? 'profile' : 'login'
  );
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = db.login(email.trim());
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'خطا در ورود به سامانه');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!fullName.trim() || !email.trim()) return;

    const res = db.register(fullName.trim(), email.trim());
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'خطا در ثبت نام');
    }
  };

  const handleSwitchDemo = (role: 'admin' | 'user') => {
    db.switchDemoRole(role);
    onClose();
  };

  const handleLogout = () => {
    db.logout();
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 text-right">
      <div className="w-full max-w-md glass-panel-card rounded-2xl border border-white/20 p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 transition-colors"
          title="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab selection if not viewing profile */}
        {!currentUser ? (
          <div className="flex border-b border-white/10 mb-6 pb-2 gap-4">
            <button
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`text-sm font-bold pb-2 transition-colors border-b-2 -mb-2.5 ${
                mode === 'login'
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ورود به حساب
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`text-sm font-bold pb-2 transition-colors border-b-2 -mb-2.5 ${
                mode === 'register'
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ثبت‌نام کاربر جدید
            </button>
          </div>
        ) : (
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-teal-400" />
            <span>پروفایل کاربر</span>
          </h3>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Mode: Login */}
        {mode === 'login' && !currentUser && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                آدرس ایمیل *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@tour360.ir"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20"
            >
              ورود به تور مجازی
            </button>
          </form>
        )}

        {/* Mode: Register */}
        {mode === 'register' && !currentUser && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                نام و نام خانوادگی *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: رضا صادقی"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                آدرس ایمیل *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20"
            >
              تکمیل ثبت نام و ورود
            </button>
          </form>
        )}

        {/* Mode: Profile Details */}
        {currentUser && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-base shrink-0">
                  {currentUser.full_name.slice(0, 1)}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{currentUser.full_name}</h4>
                  <div className="text-xs text-slate-400 font-mono" dir="ltr">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span>سطح دسترسی:</span>
                <span className="font-semibold text-teal-300">
                  {currentUser.role === 'admin' ? 'مدیر سیستم (Admin)' : 'کاربر عادی (User)'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition-colors"
            >
              خروج از حساب کاربری
            </button>
          </div>
        )}

        {/* Quick Demo Switcher */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
          <span className="text-[11px] font-semibold text-slate-400 block">
            ورود سریع آزمایشی (Demo Switcher):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSwitchDemo('admin')}
              className="py-2 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>ورود با نقش مدیر</span>
            </button>

            <button
              onClick={() => handleSwitchDemo('user')}
              className="py-2 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>ورود با نقش کاربر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
