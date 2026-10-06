import {
  Profile,
  Panorama,
  Stage,
  Hotspot,
  Question,
  QuestionOption,
  UserAnswer,
  UserProgress,
  QuizAttempt,
  ActivityLog,
  SiteContent,
} from '../types/database';
import {
  initialProfiles,
  initialPanoramas,
  initialStages,
  initialHotspots,
  initialQuestions,
  initialQuestionOptions,
  initialSiteContent,
  initialActivityLogs,
} from './mockData';

const STORAGE_KEY_PREFIX = 'tour360_crisis_db_v2_';

class DatabaseService {
  private profiles: Profile[] = [];
  private panoramas: Panorama[] = [];
  private stages: Stage[] = [];
  private hotspots: Hotspot[] = [];
  private questions: Question[] = [];
  private questionOptions: QuestionOption[] = [];
  private userAnswers: UserAnswer[] = [];
  private userProgress: UserProgress[] = [];
  private quizAttempts: QuizAttempt[] = [];
  private activityLogs: ActivityLog[] = [];
  private siteContent: SiteContent[] = [];

  private currentUser: Profile | null = null;
  private subscribers: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify() {
    this.saveToStorage();
    this.subscribers.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Subscriber error:', err);
      }
    });
  }

  private loadFromStorage() {
    try {
      const getStored = <T>(key: string, fallback: T): T => {
        const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
        if (!item) return fallback;
        try {
          return JSON.parse(item);
        } catch {
          return fallback;
        }
      };

      this.profiles = getStored('profiles', initialProfiles);
      this.panoramas = getStored('panoramas', initialPanoramas);
      this.stages = getStored('stages', initialStages);
      this.hotspots = getStored('hotspots', initialHotspots);
      this.questions = getStored('questions', initialQuestions);
      this.questionOptions = getStored('question_options', initialQuestionOptions);
      this.userAnswers = getStored('user_answers', []);
      this.userProgress = getStored('user_progress', []);
      this.quizAttempts = getStored('quiz_attempts', []);
      this.activityLogs = getStored('activity_logs', initialActivityLogs);
      this.siteContent = getStored('site_content', initialSiteContent);

      const savedUser = localStorage.getItem(STORAGE_KEY_PREFIX + 'current_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      } else {
        // Default to demo user
        this.currentUser = this.profiles.find((p) => p.role === 'user') || this.profiles[0];
      }
    } catch (e) {
      console.warn('LocalStorage error, fallback to memory', e);
      this.profiles = [...initialProfiles];
      this.panoramas = [...initialPanoramas];
      this.stages = [...initialStages];
      this.hotspots = [...initialHotspots];
      this.questions = [...initialQuestions];
      this.questionOptions = [...initialQuestionOptions];
      this.activityLogs = [...initialActivityLogs];
      this.siteContent = [...initialSiteContent];
      this.currentUser = this.profiles[1] || this.profiles[0];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'profiles', JSON.stringify(this.profiles));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'panoramas', JSON.stringify(this.panoramas));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'stages', JSON.stringify(this.stages));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'hotspots', JSON.stringify(this.hotspots));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'questions', JSON.stringify(this.questions));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'question_options', JSON.stringify(this.questionOptions));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'user_answers', JSON.stringify(this.userAnswers));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'user_progress', JSON.stringify(this.userProgress));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'quiz_attempts', JSON.stringify(this.quizAttempts));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'activity_logs', JSON.stringify(this.activityLogs));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'site_content', JSON.stringify(this.siteContent));
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'current_user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'current_user');
      }
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  public resetToDefaults() {
    this.profiles = [...initialProfiles];
    this.panoramas = [...initialPanoramas];
    this.stages = [...initialStages];
    this.hotspots = [...initialHotspots];
    this.questions = [...initialQuestions];
    this.questionOptions = [...initialQuestionOptions];
    this.userAnswers = [];
    this.userProgress = [];
    this.quizAttempts = [];
    this.activityLogs = [...initialActivityLogs];
    this.siteContent = [...initialSiteContent];
    this.currentUser = this.profiles.find((p) => p.role === 'user') || this.profiles[0];
    this.notify();
  }

  // --- Auth / User Management ---
  public getCurrentUser(): Profile | null {
    return this.currentUser;
  }

  public setCurrentUser(user: Profile | null) {
    this.currentUser = user;
    if (user) {
      this.logActivity(user.id, user.email, 'login', `ورود کاربر: ${user.full_name}`);
    }
    this.notify();
  }

  public switchDemoRole(role: 'admin' | 'user') {
    const target = this.profiles.find((p) => p.role === role);
    if (target) {
      this.setCurrentUser(target);
    }
  }

  public login(email: string): { success: boolean; user?: Profile; error?: string } {
    const user = this.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, error: 'کاربری با این ایمیل یافت نشد.' };
    }
    this.setCurrentUser(user);
    return { success: true, user };
  }

  public register(fullName: string, email: string): { success: boolean; user?: Profile; error?: string } {
    if (this.profiles.some((p) => p.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'این آدرس ایمیل قبلاً ثبت نام کرده است.' };
    }
    const newUser: Profile = {
      id: `user_${Date.now()}`,
      email,
      full_name: fullName,
      role: 'user',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.push(newUser);
    this.setCurrentUser(newUser);
    this.logActivity(newUser.id, newUser.email, 'register', `ثبت نام کاربر جدید: ${fullName}`);
    this.notify();
    return { success: true, user: newUser };
  }

  public logout() {
    if (this.currentUser) {
      this.logActivity(this.currentUser.id, this.currentUser.email, 'logout', `خروج کاربر: ${this.currentUser.full_name}`);
    }
    this.currentUser = null;
    this.notify();
  }

  public getProfiles(): Profile[] {
    return [...this.profiles];
  }

  public updateProfile(id: string, updates: Partial<Profile>) {
    const idx = this.profiles.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.profiles[idx] = { ...this.profiles[idx], ...updates, updated_at: new Date().toISOString() };
      if (this.currentUser?.id === id) {
        this.currentUser = this.profiles[idx];
      }
      this.notify();
    }
  }

  // --- Panoramas ---
  public getPanoramas(): Panorama[] {
    return [...this.panoramas];
  }

  public getPanoramaById(id: string): Panorama | undefined {
    return this.panoramas.find((p) => p.id === id);
  }

  public createPanorama(pano: Omit<Panorama, 'id' | 'created_at' | 'updated_at'>): Panorama {
    const newPano: Panorama = {
      ...pano,
      id: `pano_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.panoramas.push(newPano);
    this.logActivity(
      this.currentUser?.id || 'sys',
      this.currentUser?.email || 'admin@tour360.ir',
      'create_panorama',
      `افزودن تصویر ۳۶۰: ${newPano.title}`
    );
    this.notify();
    return newPano;
  }

  public deletePanorama(id: string): { success: boolean; error?: string } {
    // Check if used by any stage
    const usedByStage = this.stages.find((s) => s.panorama_id === id);
    if (usedByStage) {
      return { success: false, error: `این تصویر در مرحله "${usedByStage.title}" در حال استفاده است و قابل حذف نیست.` };
    }
    const idx = this.panoramas.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const title = this.panoramas[idx].title;
      this.panoramas.splice(idx, 1);
      // Delete associated hotspots
      this.hotspots = this.hotspots.filter((h) => h.panorama_id !== id);
      this.logActivity(
        this.currentUser?.id || 'sys',
        this.currentUser?.email || 'admin@tour360.ir',
        'delete_panorama',
        `حذف تصویر ۳۶۰: ${title}`
      );
      this.notify();
      return { success: true };
    }
    return { success: false, error: 'تصویر یافت نشد' };
  }

  // --- Stages ---
  public getStages(): Stage[] {
    return [...this.stages].sort((a, b) => a.order - b.order);
  }

  public getStageById(id: string): Stage | undefined {
    return this.stages.find((s) => s.id === id);
  }

  public createStage(stage: Omit<Stage, 'id' | 'created_at' | 'updated_at'>): Stage {
    const newStage: Stage = {
      ...stage,
      id: `stage_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.stages.push(newStage);
    this.notify();
    return newStage;
  }

  public updateStage(id: string, updates: Partial<Stage>) {
    const idx = this.stages.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.stages[idx] = { ...this.stages[idx], ...updates, updated_at: new Date().toISOString() };
      this.notify();
    }
  }

  public deleteStage(id: string): { success: boolean; error?: string } {
    const idx = this.stages.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.stages.splice(idx, 1);
      // Cascade delete hotspots and questions for this stage
      this.hotspots = this.hotspots.filter((h) => h.stage_id !== id);
      const stageQuestions = this.questions.filter((q) => q.stage_id === id);
      stageQuestions.forEach((q) => {
        this.questionOptions = this.questionOptions.filter((opt) => opt.question_id !== q.id);
      });
      this.questions = this.questions.filter((q) => q.stage_id !== id);
      this.notify();
      return { success: true };
    }
    return { success: false, error: 'مرحله یافت نشد' };
  }

  // --- Hotspots ---
  public getHotspots(stageId?: string): Hotspot[] {
    if (stageId) {
      return this.hotspots.filter((h) => h.stage_id === stageId && h.is_active);
    }
    return [...this.hotspots];
  }

  public getAllHotspots(): Hotspot[] {
    return [...this.hotspots];
  }

  public getHotspotById(id: string): Hotspot | undefined {
    return this.hotspots.find((h) => h.id === id);
  }

  public createHotspot(
    hotspot: Omit<Hotspot, 'id' | 'created_at' | 'updated_at'>,
    associatedQuestionId?: string
  ): Hotspot {
    const newHotspot: Hotspot = {
      ...hotspot,
      id: `hotspot_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.hotspots.push(newHotspot);

    // If a question was linked to this hotspot, update the question record
    if (associatedQuestionId) {
      const qIndex = this.questions.findIndex((q) => q.id === associatedQuestionId);
      if (qIndex !== -1) {
        this.questions[qIndex] = {
          ...this.questions[qIndex],
          hotspot_id: newHotspot.id,
          updated_at: new Date().toISOString(),
        };
      }
    }

    this.logActivity(
      this.currentUser?.id || 'sys',
      this.currentUser?.email || 'admin@tour360.ir',
      'create_hotspot',
      `افزودن نقطه تعاملی: ${newHotspot.title} (${newHotspot.hotspot_type})`
    );
    this.notify();
    return newHotspot;
  }

  public updateHotspot(id: string, updates: Partial<Hotspot>) {
    const idx = this.hotspots.findIndex((h) => h.id === id);
    if (idx !== -1) {
      this.hotspots[idx] = { ...this.hotspots[idx], ...updates, updated_at: new Date().toISOString() };
      this.logActivity(
        this.currentUser?.id || 'sys',
        this.currentUser?.email || 'admin@tour360.ir',
        'edit_hotspot',
        `ویرایش نقطه تعاملی: ${this.hotspots[idx].title}`
      );
      this.notify();
    }
  }

  public deleteHotspot(id: string) {
    const idx = this.hotspots.findIndex((h) => h.id === id);
    if (idx !== -1) {
      const title = this.hotspots[idx].title;
      this.hotspots.splice(idx, 1);
      // Unlink any question pointing to this hotspot
      this.questions = this.questions.map((q) => (q.hotspot_id === id ? { ...q, hotspot_id: null } : q));
      this.logActivity(
        this.currentUser?.id || 'sys',
        this.currentUser?.email || 'admin@tour360.ir',
        'delete_hotspot',
        `حذف نقطه تعاملی: ${title}`
      );
      this.notify();
    }
  }

  // --- Questions & Options ---
  public getQuestions(stageId?: string): Question[] {
    let list = stageId ? this.questions.filter((q) => q.stage_id === stageId) : [...this.questions];
    return list.map((q) => ({
      ...q,
      options: this.questionOptions
        .filter((opt) => opt.question_id === q.id)
        .sort((a, b) => a.order - b.order),
    }));
  }

  public getQuestionByHotspotId(hotspotId: string): Question | undefined {
    const q = this.questions.find((item) => item.hotspot_id === hotspotId);
    if (!q) return undefined;
    return {
      ...q,
      options: this.questionOptions
        .filter((opt) => opt.question_id === q.id)
        .sort((a, b) => a.order - b.order),
    };
  }

  public createQuestion(
    questionData: Omit<Question, 'id' | 'created_at' | 'updated_at' | 'options'>,
    options: { text: string; is_correct: boolean }[]
  ): Question {
    const newQId = `q_${Date.now()}`;
    const newQuestion: Question = {
      ...questionData,
      id: newQId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.questions.push(newQuestion);

    options.forEach((opt, index) => {
      this.questionOptions.push({
        id: `opt_${Date.now()}_${index}`,
        question_id: newQId,
        option_text: opt.text,
        is_correct: opt.is_correct,
        order: index + 1,
      });
    });

    this.logActivity(
      this.currentUser?.id || 'sys',
      this.currentUser?.email || 'admin@tour360.ir',
      'create_question',
      `ایجاد سؤال جدید: ${newQuestion.question_text.slice(0, 35)}...`
    );
    this.notify();
    return this.getQuestions().find((q) => q.id === newQId)!;
  }

  public updateQuestion(
    id: string,
    updates: Partial<Question>,
    options?: { id?: string; text: string; is_correct: boolean; order?: number }[]
  ) {
    const idx = this.questions.findIndex((q) => q.id === id);
    if (idx !== -1) {
      this.questions[idx] = { ...this.questions[idx], ...updates, updated_at: new Date().toISOString() };

      if (options && options.length > 0) {
        // Replace options
        this.questionOptions = this.questionOptions.filter((opt) => opt.question_id !== id);
        options.forEach((opt, oIdx) => {
          this.questionOptions.push({
            id: opt.id || `opt_${Date.now()}_${oIdx}`,
            question_id: id,
            option_text: opt.text,
            is_correct: opt.is_correct,
            order: opt.order ?? oIdx + 1,
          });
        });
      }

      this.logActivity(
        this.currentUser?.id || 'sys',
        this.currentUser?.email || 'admin@tour360.ir',
        'edit_question',
        `ویرایش سؤال: ${this.questions[idx].question_text.slice(0, 35)}...`
      );
      this.notify();
    }
  }

  public deleteQuestion(id: string) {
    const idx = this.questions.findIndex((q) => q.id === id);
    if (idx !== -1) {
      const qText = this.questions[idx].question_text;
      this.questions.splice(idx, 1);
      this.questionOptions = this.questionOptions.filter((opt) => opt.question_id !== id);
      this.logActivity(
        this.currentUser?.id || 'sys',
        this.currentUser?.email || 'admin@tour360.ir',
        'delete_question',
        `حذف سؤال: ${qText.slice(0, 35)}...`
      );
      this.notify();
    }
  }

  // --- Quiz Answers & Backend Validation ---
  public getUserAnswers(userId: string, stageId?: string): UserAnswer[] {
    return this.userAnswers.filter(
      (ans) => ans.user_id === userId && (!stageId || ans.stage_id === stageId)
    );
  }

  public isQuestionAnsweredCorrectly(userId: string, questionId: string): boolean {
    const ans = this.userAnswers.find((a) => a.user_id === userId && a.question_id === questionId);
    return ans ? ans.is_correct : false;
  }

  public isHotspotAnsweredCorrectly(userId: string, hotspotId: string): boolean {
    const q = this.questions.find((item) => item.hotspot_id === hotspotId);
    if (!q) return false;
    return this.isQuestionAnsweredCorrectly(userId, q.id);
  }

  public submitAnswer(
    userId: string,
    stageId: string,
    questionId: string,
    selectedOptionId: string
  ): {
    isCorrect: boolean;
    stageCompleted: boolean;
    stagePassed: boolean;
    correctCount: number;
    totalQuestions: number;
    explanation?: string;
  } {
    const question = this.questions.find((q) => q.id === questionId);
    const selectedOption = this.questionOptions.find((o) => o.id === selectedOptionId);
    const isCorrect = selectedOption?.is_correct || false;

    // Remove existing answer for this question if any, or update it
    const existingIdx = this.userAnswers.findIndex(
      (a) => a.user_id === userId && a.question_id === questionId
    );
    const newAnswer: UserAnswer = {
      id: `ans_${Date.now()}`,
      user_id: userId,
      stage_id: stageId,
      question_id: questionId,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      this.userAnswers[existingIdx] = newAnswer;
    } else {
      this.userAnswers.push(newAnswer);
    }

    // Backend stage completion calculation:
    // Total questions for this stage:
    const stageQuestions = this.questions.filter((q) => q.stage_id === stageId && q.is_active);
    const totalQuestions = stageQuestions.length || 5;

    // Get all answers for this user in this stage:
    const userStageAnswers = this.userAnswers.filter(
      (a) => a.user_id === userId && a.stage_id === stageId
    );
    const correctCount = userStageAnswers.filter((a) => a.is_correct).length;
    const answeredCount = userStageAnswers.length;

    // Pass rule: at least 4 out of 5 correct (or 80% if different total)
    const passingThreshold = Math.max(1, Math.ceil(totalQuestions * 0.8)); // e.g. 4 for 5
    const isAllAnswered = answeredCount >= totalQuestions;
    const stagePassed = correctCount >= passingThreshold;
    const stageCompleted = stagePassed;

    // Update user_progress
    const progIdx = this.userProgress.findIndex(
      (p) => p.user_id === userId && p.stage_id === stageId
    );
    const updatedProgress: UserProgress = {
      id: progIdx !== -1 ? this.userProgress[progIdx].id : `prog_${Date.now()}`,
      user_id: userId,
      stage_id: stageId,
      correct_count: correctCount,
      total_questions: totalQuestions,
      is_completed: stageCompleted,
      completed_at: stageCompleted ? new Date().toISOString() : null,
    };

    if (progIdx !== -1) {
      this.userProgress[progIdx] = updatedProgress;
    } else {
      this.userProgress.push(updatedProgress);
    }

    this.logActivity(
      userId,
      this.currentUser?.email || 'user',
      'answer_question',
      `پاسخ به سؤال "${question?.question_text.slice(0, 25)}...": ${isCorrect ? 'صحیح' : 'نادرست'}`
    );

    // If all answered or passed, record quiz attempt
    if (isAllAnswered || stageCompleted) {
      const stage = this.stages.find((s) => s.id === stageId);
      const existingAttempts = this.quizAttempts.filter(
        (qa) => qa.user_id === userId && qa.stage_id === stageId
      );
      this.quizAttempts.push({
        id: `attempt_${Date.now()}`,
        user_id: userId,
        user_email: this.currentUser?.email,
        user_name: this.currentUser?.full_name,
        stage_id: stageId,
        stage_title: stage?.title || 'مرحله',
        attempt_number: existingAttempts.length + 1,
        correct_answers: correctCount,
        total_questions: totalQuestions,
        is_passed: stagePassed,
        created_at: new Date().toISOString(),
      });

      if (stagePassed) {
        this.logActivity(
          userId,
          this.currentUser?.email || 'user',
          'complete_stage',
          `تکمیل موفقیت‌آمیز ${stage?.title}: کسب نمره ${correctCount}/${totalQuestions}`
        );
      } else if (isAllAnswered) {
        this.logActivity(
          userId,
          this.currentUser?.email || 'user',
          'fail_stage',
          `عدم عبور از ${stage?.title}: کسب نمره ${correctCount}/${totalQuestions} (حداقل نیاز: ${passingThreshold})`
        );
      }
    }

    this.notify();

    return {
      isCorrect,
      stageCompleted,
      stagePassed,
      correctCount,
      totalQuestions,
      explanation: question?.explanation,
    };
  }

  public resetStageProgress(userId: string, stageId: string) {
    this.userAnswers = this.userAnswers.filter(
      (a) => !(a.user_id === userId && a.stage_id === stageId)
    );
    const progIdx = this.userProgress.findIndex(
      (p) => p.user_id === userId && p.stage_id === stageId
    );
    if (progIdx !== -1) {
      this.userProgress[progIdx] = {
        ...this.userProgress[progIdx],
        correct_count: 0,
        is_completed: false,
        completed_at: null,
      };
    }
    this.logActivity(
      userId,
      this.currentUser?.email || 'user',
      'reset_stage',
      `شروع مجدد آزمون برای مرحله ${stageId}`
    );
    this.notify();
  }

  // --- Stage Access & Progression ---
  public getUserStageStatus(userId: string, stageId: string): {
    isUnlocked: boolean;
    isCompleted: boolean;
    correctCount: number;
    totalQuestions: number;
    answeredCount: number;
  } {
    const sortedStages = this.getStages();
    const stageIndex = sortedStages.findIndex((s) => s.id === stageId);
    const stageQuestions = this.questions.filter((q) => q.stage_id === stageId && q.is_active);
    const totalQuestions = stageQuestions.length || 5;

    const progress = this.userProgress.find((p) => p.user_id === userId && p.stage_id === stageId);
    const userAnswers = this.userAnswers.filter((a) => a.user_id === userId && a.stage_id === stageId);
    const correctCount = progress?.correct_count || userAnswers.filter((a) => a.is_correct).length;
    const isCompleted = progress?.is_completed || false;

    // Stage 1 is always unlocked.
    // Subsequent stages are unlocked if the PREVIOUS stage is completed (passed).
    let isUnlocked = stageIndex === 0;
    if (stageIndex > 0) {
      const prevStage = sortedStages[stageIndex - 1];
      const prevProg = this.userProgress.find((p) => p.user_id === userId && p.stage_id === prevStage.id);
      isUnlocked = prevProg?.is_completed === true;
    }

    return {
      isUnlocked,
      isCompleted,
      correctCount,
      totalQuestions,
      answeredCount: userAnswers.length,
    };
  }

  public getUserLatestAvailableStage(userId: string): Stage {
    const sortedStages = this.getStages();
    for (let i = 0; i < sortedStages.length; i++) {
      const stage = sortedStages[i];
      const status = this.getUserStageStatus(userId, stage.id);
      if (!status.isCompleted && status.isUnlocked) {
        return stage;
      }
    }
    // If all completed or none found, return the last unlocked or first
    const unlocked = sortedStages.filter((s) => this.getUserStageStatus(userId, s.id).isUnlocked);
    return unlocked[unlocked.length - 1] || sortedStages[0];
  }

  // --- Quiz Attempts & Stats ---
  public getQuizAttempts(): QuizAttempt[] {
    return [...this.quizAttempts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // --- Activity Logs ---
  public getActivityLogs(): ActivityLog[] {
    return [...this.activityLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public logActivity(userId: string, email: string, action: ActivityLog['action'], details: string) {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      user_email: email,
      action,
      details,
      created_at: new Date().toISOString(),
    };
    this.activityLogs.unshift(newLog);
    if (this.activityLogs.length > 200) {
      this.activityLogs = this.activityLogs.slice(0, 200);
    }
    // We don't notify here to prevent infinite recursion
  }

  // --- Site Content ---
  public getSiteContent(): SiteContent[] {
    return [...this.siteContent];
  }

  public updateSiteContent(key: string, content: string, title?: string) {
    const idx = this.siteContent.findIndex((sc) => sc.key === key);
    if (idx !== -1) {
      this.siteContent[idx] = {
        ...this.siteContent[idx],
        content,
        title: title || this.siteContent[idx].title,
        updated_at: new Date().toISOString(),
      };
      this.notify();
    }
  }

  // --- Supabase PostgreSQL DDL & RLS Generator ---
  public getSupabaseSqlSchema(): string {
    return `-- ==============================================================
-- Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Tour 360 & Interactive Spatial Quiz Platform
-- ==============================================================

-- 1. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Panoramas Table
CREATE TABLE IF NOT EXISTS public.panoramas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    width INTEGER NOT NULL DEFAULT 4096,
    height INTEGER NOT NULL DEFAULT 2048,
    aspect_ratio NUMERIC(5,2) NOT NULL DEFAULT 2.00,
    file_size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Stages Table
CREATE TABLE IF NOT EXISTS public.stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    panorama_id UUID NOT NULL REFERENCES public.panoramas(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    initial_yaw NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    initial_pitch NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    initial_fov INTEGER NOT NULL DEFAULT 75,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Hotspots Table
CREATE TABLE IF NOT EXISTS public.hotspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panorama_id UUID NOT NULL REFERENCES public.panoramas(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    hotspot_type TEXT NOT NULL CHECK (hotspot_type IN ('information', 'question')),
    title TEXT NOT NULL,
    description TEXT,
    pos_x NUMERIC(10,3) NOT NULL,
    pos_y NUMERIC(10,3) NOT NULL,
    pos_z NUMERIC(10,3) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    hotspot_id UUID REFERENCES public.hotspots(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    explanation TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Question Options Table (Exactly 4 options per question)
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 1
);

-- 7. User Answers Table
CREATE TABLE IF NOT EXISTS public.user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id UUID NOT NULL REFERENCES public.question_options(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_question_answer UNIQUE (user_id, question_id)
);

-- 8. User Progress Table (Calculated progress & completion)
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    correct_count INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 5,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_user_stage_progress UNIQUE (user_id, stage_id)
);

-- 9. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    correct_answers INTEGER NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 5,
    is_passed BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Site Content Table
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================
-- Row Level Security (RLS) Policies
-- ==============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panoramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users see their own profile, Admins see all
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Stages & Panoramas: Public read, Admin write
CREATE POLICY "Anyone can view active stages" ON public.stages
    FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins have full access to stages" ON public.stages
    FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view panoramas" ON public.panoramas
    FOR SELECT USING (true);
CREATE POLICY "Admins have full access to panoramas" ON public.panoramas
    FOR ALL USING (public.is_admin());

-- Hotspots: Public read active, Admin write
CREATE POLICY "Anyone can view active hotspots" ON public.hotspots
    FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins have full access to hotspots" ON public.hotspots
    FOR ALL USING (public.is_admin());

-- Questions: Public read active, Admin write
CREATE POLICY "Anyone can view active questions" ON public.questions
    FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins have full access to questions" ON public.questions
    FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view question options" ON public.question_options
    FOR SELECT USING (true);
CREATE POLICY "Admins have full access to question options" ON public.question_options
    FOR ALL USING (public.is_admin());

-- User Answers: User manages own answers, Admin can read
CREATE POLICY "Users read own answers" ON public.user_answers
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users insert own answers" ON public.user_answers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Progress: User reads own progress, Admin reads all
CREATE POLICY "Users read own progress" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users update own progress" ON public.user_progress
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Activity Logs: Admins read all, authenticated users insert
CREATE POLICY "Admins read activity logs" ON public.activity_logs
    FOR SELECT USING (public.is_admin());
CREATE POLICY "Authenticated users insert logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
`;
  }
}

export const db = new DatabaseService();
