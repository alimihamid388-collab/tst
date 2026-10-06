import React, { useState } from 'react';
import { db } from '../../services/db';
import { Profile, UserRole } from '../../types/database';
import { Users, Shield, User, RotateCcw, Check, UserCheck } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>(db.getProfiles());
  const stages = db.getStages();
  const currentUser = db.getCurrentUser();

  const handleRoleToggle = (profile: Profile) => {
    const newRole: UserRole = profile.role === 'admin' ? 'user' : 'admin';
    db.updateProfile(profile.id, { role: newRole });
    setProfiles(db.getProfiles());
  };

  const handleResetUserProgress = (userId: string, userName: string) => {
    if (confirm(`آیا می‌خواهید پیشرفت آزمون کاربر "${userName}" در تمام مراحل بازنشانی شود؟`)) {
      stages.forEach((s) => {
        db.resetStageProgress(userId, s.id);
      });
      alert('پیشرفت کاربر با موفقیت ریست شد.');
    }
  };

  return (
    <div className="space-y-6 text-right">
      <div>
        <h2 className="text-lg font-bold text-white">مدیریت کاربران و دسترسی‌ها</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          مشاهده کاربران ثبت‌نام‌شده، تغییر نقش دسترسی (مدیر / کاربر) و پایش پیشرفت در مراحل
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400">
                <th className="py-3 px-4 text-right">کاربر</th>
                <th className="py-3 px-4 text-right">ایمیل</th>
                <th className="py-3 px-4 text-center">نقش</th>
                <th className="py-3 px-4 text-center">مراحل تکمیل‌شده</th>
                <th className="py-3 px-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {profiles.map((p) => {
                let completedCount = 0;
                stages.forEach((s) => {
                  if (db.getUserStageStatus(p.id, s.id).isCompleted) completedCount++;
                });

                return (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.full_name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{p.full_name}</div>
                          {p.id === currentUser?.id && (
                            <span className="text-[10px] text-teal-400 font-medium">
                              (حساب کاربری فعلی شما)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]" dir="ltr">
                      {p.email}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleRoleToggle(p)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          p.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-white/5 text-slate-300 border border-white/10'
                        }`}
                        title="کلیک جهت تغییر نقش"
                      >
                        {p.role === 'admin' ? (
                          <>
                            <Shield className="w-3.5 h-3.5" /> مدیر سیستم
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5" /> کاربر عادی
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center tabular-nums font-semibold text-white">
                      {completedCount} از {stages.length} مرحله
                    </td>

                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResetUserProgress(p.id, p.full_name)}
                          className="px-2.5 py-1 text-[11px] text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1"
                          title="ریست پیشرفت آزمون کاربر"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>ریست آزمون‌ها</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
