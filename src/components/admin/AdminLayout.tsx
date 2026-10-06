import React, { useState } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { AdminStages } from './AdminStages';
import { AdminPanoramas } from './AdminPanoramas';
import { AdminHotspots } from './AdminHotspots';
import { AdminQuestions } from './AdminQuestions';
import { AdminQuizResults } from './AdminQuizResults';
import { AdminUsers } from './AdminUsers';
import { AdminSiteContent } from './AdminSiteContent';
import { AdminActivityLogs } from './AdminActivityLogs';
import { AdminSqlSchema } from './AdminSqlSchema';
import {
  LayoutDashboard,
  Layers,
  Image as ImageIcon,
  Crosshair,
  HelpCircle,
  Trophy,
  Users,
  FileText,
  Activity,
  Database,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface AdminLayoutProps {
  onBackToApp: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onBackToApp }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'stages', label: 'مراحل تور', icon: Layers },
    { id: 'panoramas', label: 'تصاویر ۳۶۰', icon: ImageIcon },
    { id: 'hotspots', label: 'نقاط تعاملی', icon: Crosshair },
    { id: 'questions', label: 'سؤالات آزمون', icon: HelpCircle },
    { id: 'results', label: 'نتایج آزمون', icon: Trophy },
    { id: 'users', label: 'کاربران', icon: Users },
    { id: 'content', label: 'محتوای سایت', icon: FileText },
    { id: 'logs', label: 'گزارش فعالیت', icon: Activity },
    { id: 'database', label: 'پایگاه داده و RLS', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-[#0a0d11] text-slate-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="h-16 px-6 glass-panel border-b border-white/10 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Shield className="w-5 h-5" />
          </div>
          <div className="text-right">
            <h1 className="text-sm font-bold text-white tracking-tight">
              پنل مدیریت سامانه تور مجازی ۳۶۰ درجه
            </h1>
            <span className="text-[10px] text-teal-400 font-medium">سطح دسترسی: مدیر ارشد (Admin)</span>
          </div>
        </div>

        <button
          onClick={onBackToApp}
          className="px-4 py-2 glass-panel text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-white/10 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>مشاهده و تست محیط کاربری تور</span>
        </button>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-[#0d1016] border-b md:border-b-0 md:border-l border-white/10 p-4 shrink-0 overflow-x-auto md:overflow-y-auto">
          <nav className="flex md:flex-col gap-1 text-right">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-md shadow-teal-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveTab} />}
          {activeTab === 'stages' && <AdminStages />}
          {activeTab === 'panoramas' && <AdminPanoramas />}
          {activeTab === 'hotspots' && <AdminHotspots />}
          {activeTab === 'questions' && <AdminQuestions />}
          {activeTab === 'results' && <AdminQuizResults />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'content' && <AdminSiteContent />}
          {activeTab === 'logs' && <AdminActivityLogs />}
          {activeTab === 'database' && <AdminSqlSchema />}
        </main>
      </div>
    </div>
  );
};
