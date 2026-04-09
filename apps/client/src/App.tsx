import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { getOperationalEnvironment } from '@apps-in-toss/web-framework';
import BannerAd from './components/BannerAd';
import { track } from './services/analytics';
import { adsService } from './services/ads';
import { fireNextStageStart, fireSuccess, fireTodayHabitCheck } from './utils/confetti';
import { readScreenshotInit } from './screenshotFixtures';
import brandLogoUrl from './assets/app-brand-logo.png';

type Stage = {
  id: string;
  stageNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  checkDates: string[];
  completed: boolean;
  needsSetup?: boolean;
  failed?: boolean;
};

type HabitProject = {
  id: string;
  name: string;
  createdAt: string;
  stageDurationDays: number;
  stages: Stage[];
};

type AppState = {
  projects: HabitProject[];
};

const STORAGE_KEY = 'korea-habit-projects-v2';
const GOALS_PER_PAGE = 5;
const PRESET_TITLES = ['물 2L 마시기', '10분 독서', '15분 걷기'];

/** 홈 달성률 카드 옆에 표시 — 앱을 열 때마다 하나 무작위 */
const HABIT_CHEER_MESSAGES = [
  '오늘도 한 걸음씩, 당신의 페이스가 가장 예뻐요.',
  '꾸준함은 재능을 이겨요. 지금 이 순간도 충분히 멋져요.',
  '완벽하지 않아도 괜찮아요. 와 준 그 마음이 이미 빛나요.',
  '작은 실천이 쌓이면, 어느새 습관이 되고 인생이 바뀌어요.',
  '당신이 자신을 응원해 줄 때, 세상도 함께 응원해요.',
  '오늘의 나를 칭찬해 주세요. 그게 내일의 힘이 돼요.',
  '느려도 좋아요. 멈지만 않는다면 언젠가 꼭 도착해요.',
  '지금까지 온 길, 정말 수고 많았어요. 앞으로도 화이팅!',
  '습관은 선물이에요. 미래의 나에게 보내는 따뜻한 편지 같아요.',
  '포기하지 않은 하루하루가, 가장 값진 성공이에요.',
];

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(dateKey: string, days: number): string {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function formatDateLabel(dateKey: string): string {
  const date = fromDateKey(dateKey);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function daysInclusive(startDate: string, endDate: string): number {
  const start = fromDateKey(startDate).getTime();
  const end = fromDateKey(endDate).getTime();
  return Math.max(Math.floor((end - start) / 86_400_000) + 1, 1);
}

function stageRate(stage: Stage): number {
  const planned = daysInclusive(stage.startDate, stage.endDate);
  return Math.min(100, Math.round((stage.checkDates.length / planned) * 100));
}

function stageRateByConfiguredPeriod(stage: Stage, periodDays: number, today: string): number {
  const rangeStart = addDays(today, -(periodDays - 1));
  const effectiveStart = stage.startDate > rangeStart ? stage.startDate : rangeStart;
  const effectiveEnd = stage.endDate < today ? stage.endDate : today;
  if (effectiveEnd < effectiveStart) return 0;
  const plannedDays = daysInclusive(effectiveStart, effectiveEnd);
  const done = stage.checkDates.filter((date) => date >= effectiveStart && date <= effectiveEnd).length;
  return Math.min(100, Math.round((done / plannedDays) * 100));
}

function isStageWindowToday(stage: Stage, today: string): boolean {
  return today >= stage.startDate && today <= stage.endDate;
}

/** 오늘 체크를 추가한 뒤 stageRate 기준 100%가 되는지 (단계 완료 직전) */
function willReachFullStageAfterTodayCheck(stage: Stage, todayKey: string): boolean {
  if (stage.completed || stage.needsSetup || !isStageWindowToday(stage, todayKey)) return false;
  if (stage.checkDates.includes(todayKey)) return false;
  const planned = daysInclusive(stage.startDate, stage.endDate);
  const nextCount = stage.checkDates.length + 1;
  return Math.min(100, Math.round((nextCount / planned) * 100)) >= 100;
}

function activeStage(project: HabitProject): Stage {
  const next = project.stages.find((stage) => !stage.completed && !stage.failed);
  return next ?? project.stages[project.stages.length - 1];
}

/** 전 단계를 오늘까지 체크해 완료한 뒤, 새 단계(설정 대기)로 넘어온 경우에도 '오늘 완료'로 표시 */
function effectivelyCompletedToday(project: HabitProject, current: Stage, todayKey: string): boolean {
  if (current.checkDates.includes(todayKey)) return true;
  if (!current.needsSetup || current.stageNumber < 2) return false;
  const prev = project.stages.find((s) => s.stageNumber === current.stageNumber - 1);
  if (!prev?.completed) return false;
  return prev.checkDates.includes(todayKey);
}

function safeLoadState(): AppState {
  if (typeof window === 'undefined') return { projects: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { projects: [] };
    const parsed = JSON.parse(raw) as AppState;
    if (!Array.isArray(parsed.projects)) return { projects: [] };
    return {
      projects: parsed.projects.map((project) => ({
        ...project,
        stageDurationDays: Number.isFinite(project.stageDurationDays) ? project.stageDurationDays : 7,
        stages: Array.isArray(project.stages)
          ? project.stages.map((stage, idx) => ({
              ...stage,
              stageNumber: Number.isFinite(stage.stageNumber) ? stage.stageNumber : idx + 1,
              checkDates: Array.isArray(stage.checkDates) ? stage.checkDates : [],
              completed: Boolean(stage.completed),
              needsSetup: Boolean(stage.needsSetup),
              failed: Boolean(stage.failed),
            }))
          : [],
      })),
    };
  } catch {
    return { projects: [] };
  }
}

function buildNextStage(previous: Stage, stageNumber: number, durationDays: number, nextStart?: string): Stage {
  const startDate = nextStart ?? addDays(previous.endDate, 1);
  const nextEnd = addDays(startDate, durationDays - 1);
  return {
    id: makeId(),
    stageNumber,
    title: '',
    startDate,
    endDate: nextEnd,
    checkDates: [],
    completed: false,
    needsSetup: true,
    failed: false,
  };
}

function maybeAdvanceStage(project: HabitProject, transitionDate: string): HabitProject {
  const current = activeStage(project);
  if (current.completed || stageRate(current) < 100) return project;
  const updatedStages = project.stages.map((stage) =>
    stage.id === current.id ? { ...stage, completed: true } : stage
  );
  // Next stage starts from the day after success transition date.
  const next = buildNextStage(current, current.stageNumber + 1, project.stageDurationDays, addDays(transitionDate, 1));
  return { ...project, stages: [...updatedStages, next] };
}

function resolveStageByDeadline(project: HabitProject, today: string): HabitProject {
  const current = activeStage(project);
  if (current.completed || current.failed || current.needsSetup) return project;
  if (today <= current.endDate) return project;

  const rate = stageRate(current);
  if (rate >= 100) {
    return maybeAdvanceStage(project, current.endDate);
  }

  const failedStages = project.stages.map((stage) =>
    stage.id === current.id ? { ...stage, failed: true, completed: true } : stage
  );
  const retryStage = {
    ...buildNextStage(current, current.stageNumber + 1, project.stageDurationDays),
    startDate: today,
    endDate: addDays(today, project.stageDurationDays - 1),
  };
  return { ...project, stages: [...failedStages, retryStage] };
}

function lastNDays(days: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    result.push(toDateKey(date));
  }
  return result;
}

function buildStageSuggestions(previousTitle: string): string[] {
  const base = previousTitle.trim() || '현재 목표';
  return [
    `${base} 유지`,
    `${base} 조금 올리기`,
    `${base} 다시 도전`,
  ];
}

function stageDurationDays(stage: Stage): number {
  return daysInclusive(stage.startDate, stage.endDate);
}

function rebalanceProjectAfterStageEdit(project: HabitProject, stageId: string, title: string, durationDays: number): HabitProject {
  const stages = [...project.stages].sort((a, b) => a.stageNumber - b.stageNumber);
  const editIndex = stages.findIndex((stage) => stage.id === stageId);
  if (editIndex < 0) return project;

  const edited = stages[editIndex];
  const originalDuration = stageDurationDays(edited);
  const isDurationIncreased = durationDays > originalDuration;
  const updatedEdited: Stage = {
    ...edited,
    title: title.trim().slice(0, 30) || edited.title,
    endDate: addDays(edited.startDate, durationDays - 1),
    completed: false,
    failed: false,
    needsSetup: false,
  };

  const nextStages: Stage[] = [];
  for (let i = 0; i < stages.length; i += 1) {
    const source = i === editIndex ? updatedEdited : stages[i];
    if (i < editIndex) {
      nextStages.push(source);
      continue;
    }
    if (i === editIndex) {
      // Keep only checks that are inside the updated period.
      const filteredChecks = source.checkDates.filter((date) => date >= source.startDate && date <= source.endDate);
      nextStages.push({ ...source, checkDates: filteredChecks });
      continue;
    }

    const previous = nextStages[i - 1];
    const duration = stageDurationDays(source);
    const startDate = addDays(previous.endDate, 1);
    const endDate = addDays(startDate, duration - 1);
    const checkDates = source.checkDates.filter((date) => date >= startDate && date <= endDate);
    nextStages.push({
      ...source,
      startDate,
      endDate,
      checkDates,
      completed: false,
      failed: false,
      needsSetup: source.needsSetup,
    });
  }

  // Re-evaluate stage progression from the edited stage.
  let blockNextStages = false;
  const normalized = nextStages.map((stage, idx) => {
    if (idx < editIndex) return stage;
    if (blockNextStages) {
      return {
        ...stage,
        completed: false,
        failed: false,
      };
    }
    const rate = stageRate(stage);
    if (stage.needsSetup) {
      blockNextStages = true;
      return { ...stage, completed: false, failed: false };
    }
    if (rate >= 100) {
      return { ...stage, completed: true, failed: false };
    }
    blockNextStages = true;
    return { ...stage, completed: false, failed: false };
  });

  if (isDurationIncreased) {
    return { ...project, stages: normalized.slice(0, editIndex + 1) };
  }

  const hasActiveStage = normalized.some((stage) => !stage.completed && !stage.failed);
  if (!hasActiveStage && normalized.length > 0) {
    const last = normalized[normalized.length - 1];
    return {
      ...project,
      stages: [...normalized, buildNextStage(last, last.stageNumber + 1, project.stageDurationDays)],
    };
  }

  return { ...project, stages: normalized };
}

type ShotInitRef = {
  shot: string | null;
  state: AppState;
  view: 'create' | 'list';
  selected: string | null;
  celebration?: string;
  celebrationConfetti?: 'success' | 'today' | 'next';
  celebrationConfettiLevel?: number;
};

const shotInitSingleton: { current: ShotInitRef | null } = { current: null };

function resolveShotInitOnce(): ShotInitRef {
  if (shotInitSingleton.current) return shotInitSingleton.current;
  const init = readScreenshotInit();
  if (init) {
    shotInitSingleton.current = {
      shot: init.shot,
      state: { projects: init.bootstrap.state.projects as HabitProject[] },
      view: init.bootstrap.view,
      selected: init.bootstrap.selectedProjectId,
      celebration: init.bootstrap.celebrationMessage,
      celebrationConfetti: init.bootstrap.celebrationConfetti,
      celebrationConfettiLevel: init.bootstrap.celebrationConfettiLevel,
    };
  } else {
    shotInitSingleton.current = {
      shot: null,
      state: safeLoadState(),
      view: 'create',
      selected: null,
    };
  }
  return shotInitSingleton.current;
}

export default function App() {
  const shotInit = resolveShotInitOnce();
  const screenshotShotKey = shotInit.shot;

  const [state, setState] = useState<AppState>(() => shotInit.state);
  const [view, setView] = useState<'create' | 'list'>(() => shotInit.view);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => shotInit.selected);
  const [goalPage, setGoalPage] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [firstStageTitle, setFirstStageTitle] = useState('');
  const [stageDays, setStageDays] = useState(7);
  const [nextStageTitle, setNextStageTitle] = useState('');
  const [nextStageDays, setNextStageDays] = useState(7);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const [celebrationCountdown, setCelebrationCountdown] = useState<number | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageTitle, setEditingStageTitle] = useState('');
  const [editingStageDays, setEditingStageDays] = useState(7);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [navLogoFailed, setNavLogoFailed] = useState(false);
  const [detailPage, setDetailPage] = useState<'today' | 'setup' | 'result' | 'history'>('today');
  /** 토스/샌드박스 WebView — 표준 내비가 있으므로 웹 전용 상단 브랜딩은 숨김 */
  const [inTossMiniApp, setInTossMiniApp] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const today = toDateKey();
  const calendarKeys = useMemo(() => lastNDays(30), []);
  const showWebOnlyNavBranding = !screenshotShotKey && !inTossMiniApp;

  useEffect(() => {
    try {
      const env = getOperationalEnvironment();
      setInTossMiniApp(env === 'toss' || env === 'sandbox');
    } catch {
      setInTossMiniApp(false);
    }
  }, []);

  function scrollToTop(): void {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const celebrationTimeoutRef = useRef<number | null>(null);
  const celebrationSliceTimeoutsRef = useRef<number[]>([]);
  const dailyStageSuccessCountRef = useRef<number>(0);
  const dailyOverallSuccessCountRef = useRef<number>(0);
  const lastOverallTodayRateRef = useRef<number>(0);
  const didInitOverallCelebrationRef = useRef<boolean>(false);
  /** 목표별 이번 날짜에 몇 번 단계 100%를 달성했는지 — 폭죽 강도(목표마다 따로) */
  const perProjectStageCompleteTodayRef = useRef<Record<string, number>>({});
  const lastCalendarDateRef = useRef<string>(today);
  const createOpenedViaNewGoalButtonRef = useRef(false);

  function clearCelebrationTimers(): void {
    if (celebrationTimeoutRef.current !== null) {
      window.clearTimeout(celebrationTimeoutRef.current);
      celebrationTimeoutRef.current = null;
    }
    for (const id of celebrationSliceTimeoutsRef.current) {
      window.clearTimeout(id);
    }
    celebrationSliceTimeoutsRef.current = [];
  }

  function dismissCelebration(): void {
    clearCelebrationTimers();
    setCelebrationMessage(null);
    setCelebrationCountdown(null);
  }

  /** 2초 뒤 자동 닫힘, 메시지 아래 (2)→(1)→(0) 카운트다운 */
  function showCelebration(message: string, durationMs: number = 2000): void {
    clearCelebrationTimers();
    setCelebrationMessage(message);
    setCelebrationCountdown(2);
    const slice = Math.max(200, durationMs / 3);
    celebrationSliceTimeoutsRef.current.push(
      window.setTimeout(() => setCelebrationCountdown(1), slice)
    );
    celebrationSliceTimeoutsRef.current.push(
      window.setTimeout(() => setCelebrationCountdown(0), slice * 2)
    );
    celebrationTimeoutRef.current = window.setTimeout(() => dismissCelebration(), durationMs);
  }

  useEffect(() => () => clearCelebrationTimers(), []);

  useEffect(() => {
    if (!screenshotShotKey || !shotInit.celebration) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      const kind = shotInit.celebrationConfetti;
      if (kind === 'success') fireSuccess(shotInit.celebrationConfettiLevel ?? 1);
      else if (kind === 'today') fireTodayHabitCheck();
      else if (kind === 'next') fireNextStageStart();
      showCelebration(shotInit.celebration!, 60000);
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 스크린샷 픽스처 표시
  }, [screenshotShotKey]);

  useEffect(() => {
    if (view !== 'create' || !createOpenedViaNewGoalButtonRef.current) return;
    createOpenedViaNewGoalButtonRef.current = false;
    const t = window.setTimeout(() => {
      const h = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      window.scrollTo({ top: h, behavior: 'smooth' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [view]);

  useEffect(() => {
    if (screenshotShotKey) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, screenshotShotKey]);

  useEffect(() => {
    if (screenshotShotKey) return;
    if (state.projects.length === 0) {
      setView('create');
      return;
    }
    if (!selectedProjectId) {
      setSelectedProjectId(state.projects[0].id);
      setView('list');
    }
  }, [screenshotShotKey, selectedProjectId, state.projects]);

  useEffect(() => {
    track('app_open', { projects: state.projects.length });
  }, [state.projects.length]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(state.projects.length / GOALS_PER_PAGE) - 1);
    setGoalPage((p) => Math.min(Math.max(0, p), maxPage));
  }, [state.projects.length]);

  useEffect(() => {
    if (!selectedProjectId) return;
    const idx = state.projects.findIndex((p) => p.id === selectedProjectId);
    if (idx < 0) return;
    setGoalPage(Math.floor(idx / GOALS_PER_PAGE));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goal page follows selection, not every project edit
  }, [selectedProjectId]);

  useEffect(() => {
    if (lastCalendarDateRef.current === today) return;
    lastCalendarDateRef.current = today;
    perProjectStageCompleteTodayRef.current = {};
    dailyStageSuccessCountRef.current = 0;
    dailyOverallSuccessCountRef.current = 0;
    didInitOverallCelebrationRef.current = false;
    lastOverallTodayRateRef.current = 0;
  }, [today]);

  useEffect(() => {
    const detect = () => {
      const width = window.innerWidth;
      if (width < 640) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };
    detect();
    window.addEventListener('resize', detect);
    return () => window.removeEventListener('resize', detect);
  }, []);

  useEffect(() => {
    setState((prev) => {
      let changed = false;
      const projects = prev.projects.map((project) => {
        const resolved = resolveStageByDeadline(project, today);
        if (resolved !== project) changed = true;
        return resolved;
      });
      return changed ? { ...prev, projects } : prev;
    });
  }, [today]);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return state.projects.find((project) => project.id === selectedProjectId) ?? null;
  }, [selectedProjectId, state.projects]);

  useEffect(() => {
    if (!selectedProject) return;
    const current = activeStage(selectedProject);
    if (current.needsSetup) {
      setDetailPage('setup');
      return;
    }
    setDetailPage('today');
  }, [selectedProject, selectedProjectId]);

  const selectedCurrentStage = useMemo(() => {
    if (!selectedProject) return null;
    return activeStage(selectedProject);
  }, [selectedProject]);
  const previousStage = useMemo(() => {
    if (!selectedProject || !selectedCurrentStage) return null;
    return selectedProject.stages.find((stage) => stage.stageNumber === selectedCurrentStage.stageNumber - 1) ?? null;
  }, [selectedProject, selectedCurrentStage]);
  const suggestionTitles = useMemo(
    () => buildStageSuggestions(previousStage?.title ?? ''),
    [previousStage?.title]
  );

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = projectName.trim();
    const stageTitle = firstStageTitle.trim();
    if (!name || !stageTitle) return;
    const start = today;
    const end = addDays(start, stageDays - 1);
    const newProject: HabitProject = {
      id: makeId(),
      name: name.slice(0, 30),
      createdAt: new Date().toISOString(),
      stageDurationDays: stageDays,
      stages: [
        {
          id: makeId(),
          stageNumber: 1,
          title: stageTitle.slice(0, 30),
          startDate: start,
          endDate: end,
          checkDates: [],
          completed: false,
          needsSetup: false,
          failed: false,
        },
      ],
    };
    setState((prev) => ({ ...prev, projects: [newProject, ...prev.projects] }));
    setSelectedProjectId(newProject.id);
    setView('list');
    setProjectName('');
    setFirstStageTitle('');
    setStageDays(7);
    track('project_create', { duration_days: stageDays });
  }

  function toggleTodayOnActiveStage(projectId: string) {
    const targetProject = state.projects.find((project) => project.id === projectId);
    const current = targetProject ? activeStage(targetProject) : null;
    const addingTodayCheck = Boolean(
      current &&
        !current.checkDates.includes(today) &&
        !current.completed &&
        !current.needsSetup &&
        isStageWindowToday(current, today)
    );
    const willCompleteStage = Boolean(current && willReachFullStageAfterTodayCheck(current, today));

    setState((prev) => {
      const projects = prev.projects.map((project) => {
        if (project.id !== projectId) return project;
        const current = activeStage(project);
        if (!isStageWindowToday(current, today) || current.completed || current.needsSetup) return project;
        const checked = current.checkDates.includes(today);
        const nextStages = project.stages.map((stage) =>
          stage.id !== current.id
            ? stage
            : {
                ...stage,
                checkDates: checked
                  ? stage.checkDates.filter((key) => key !== today)
                  : [...stage.checkDates, today].sort(),
              }
        );
        return maybeAdvanceStage({ ...project, stages: nextStages }, today);
      });
      return { ...prev, projects };
    });
    if (willCompleteStage && current) {
      dailyStageSuccessCountRef.current += 1;
      const n = (perProjectStageCompleteTodayRef.current[projectId] ?? 0) + 1;
      perProjectStageCompleteTodayRef.current[projectId] = n;
      const level = Math.min(10, n);
      fireSuccess(level);
      showCelebration(
        `${current.stageNumber}단계 완주, 정말 멋져요.\n꾸준함이 빛났어요.\n앞으로도 화이팅!`,
        2800
      );
      setDetailPage('result');
      track('stage_completed_100', { stage_number: current.stageNumber, celebration_level: level });
    } else if (addingTodayCheck && current) {
      fireTodayHabitCheck();
      showCelebration('오늘도 약속 지키셨네요.\n작은 승리가 쌓여요.\n응원할게요!', 2800);
      setDetailPage('result');
      track('stage_today_checked', { project_id: projectId });
    }
    track('stage_toggle_today');
  }

  function setupActiveStage(projectId: string, title: string, durationDays: number) {
    const trimmed = title.trim();
    if (!trimmed) return;
    setState((prev) => {
      const projects = prev.projects.map((project) => {
        if (project.id !== projectId) return project;
        const current = activeStage(project);
        const newEnd = addDays(current.startDate, durationDays - 1);
        const nextStages = project.stages.map((stage) =>
          stage.id === current.id
            ? {
                ...stage,
                title: trimmed.slice(0, 30),
                endDate: newEnd,
                needsSetup: false,
              }
            : stage
        );
        return { ...project, stages: nextStages, stageDurationDays: durationDays };
      });
      return { ...prev, projects };
    });
    setNextStageTitle('');
    fireNextStageStart();
    showCelebration('새 도전이 시작됐어요.\n지금까지 온 힘으로 한 걸음 더,\n화이팅!', 2800);
    setDetailPage('today');
    track('stage_setup', { duration_days: durationDays });
  }

  function removeProject(projectId: string) {
    setState((prev) => ({ ...prev, projects: prev.projects.filter((project) => project.id !== projectId) }));
    if (selectedProjectId === projectId) setSelectedProjectId(null);
    track('project_delete');
  }

  function startEditProject(project: HabitProject) {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  }

  function applyProjectNameEdit(projectId: string) {
    const trimmed = editingProjectName.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === projectId ? { ...project, name: trimmed.slice(0, 30) } : project
      ),
    }));
    setEditingProjectId(null);
    track('project_rename');
  }

  async function copyShareLink() {
    const baseUrl = 'https://korea-habits.vercel.app/';
    const shareText = `좋은 습관 만들기\n현재 달성률 ${overallProjectProgressRate}% · 오늘 하루 달성률 ${overallTodayRate}%\n${baseUrl}`;
    try {
      try {
        await adsService.loadInterstitial();
        await adsService.showInterstitial();
        track('ad_interstitial_shown', { trigger: 'share_link' });
      } catch {
        // 광고 실패해도 공유 플로우는 유지
      }
      await navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
      track('share_link_copy');
    } catch {
      // fallback
      window.prompt('아래 내용을 복사해 공유해 주세요.', shareText);
    }
  }

  const overallTodayRate = useMemo(() => {
    if (state.projects.length === 0) return 0;
    const done = state.projects.filter((project) => {
      return project.stages.some((stage) => stage.checkDates.includes(today));
    }).length;
    return Math.round((done / state.projects.length) * 100);
  }, [state.projects, today]);
  const todayProjectStatus = useMemo(() => {
    return state.projects.map((project) => {
      const doneToday = project.stages.some((stage) => stage.checkDates.includes(today));
      return {
        projectId: project.id,
        projectName: project.name,
        doneToday,
      };
    });
  }, [state.projects, today]);
  const displayTodayRate = overallTodayRate;
  const displayTodayProjectRows = todayProjectStatus;
  const habitCheerLine = useMemo(
    () => HABIT_CHEER_MESSAGES[Math.floor(Math.random() * HABIT_CHEER_MESSAGES.length)] ?? '',
    []
  );

  useEffect(() => {
    if (state.projects.length === 0) return;
    if (!didInitOverallCelebrationRef.current) {
      didInitOverallCelebrationRef.current = true;
      lastOverallTodayRateRef.current = overallTodayRate;
      return;
    }

    if (lastOverallTodayRateRef.current < 100 && overallTodayRate === 100) {
      dailyOverallSuccessCountRef.current += 1;
      const level = Math.min(
        10,
        dailyStageSuccessCountRef.current + dailyOverallSuccessCountRef.current + 1
      );
      fireSuccess(level);
      showCelebration('오늘 목표를 모두 채웠어요!\n대단해요.\n내일도 화이팅!', 2800);
      track('overall_today_completed_100', { level });
    }

    lastOverallTodayRateRef.current = overallTodayRate;
  }, [overallTodayRate, state.projects.length, todayProjectStatus.length]);
  const selectedProjectConfiguredRate = useMemo(() => {
    if (!selectedProject) return 0;
    return stageRateByConfiguredPeriod(activeStage(selectedProject), selectedProject.stageDurationDays, today);
  }, [selectedProject, today]);
  const overallProjectProgressRate = useMemo(() => {
    if (state.projects.length === 0) return 0;
    const sum = state.projects.reduce((acc, project) => {
      return acc + stageRate(activeStage(project));
    }, 0);
    return Math.round(sum / state.projects.length);
  }, [state.projects]);
  const dashboardRate = overallProjectProgressRate;
  const displayRate = Math.min(94, Math.max(6, dashboardRate));
  const stairHeights = [12, 20, 31, 45, 60, 76, 94];
  const stepIndex = Math.round((dashboardRate / 100) * (stairHeights.length - 1));
  const climberBottom = stairHeights[Math.max(0, Math.min(stepIndex, stairHeights.length - 1))] + 14;
  const checkButtonLabel = deviceType === 'mobile' ? '오늘 완료 체크하기' : '오늘 완료하기';
  const climberIcon = dashboardRate <= 0 ? '🚶‍➡️' : '🏃‍➡️';
  const selectedProjectDateStageMap = useMemo(() => {
    if (!selectedProject) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const stage of selectedProject.stages) {
      for (const date of stage.checkDates) {
        map.set(date, stage.stageNumber);
      }
    }
    return map;
  }, [selectedProject]);

  const goalPageMax = Math.max(0, Math.ceil(state.projects.length / GOALS_PER_PAGE) - 1);
  const goalPageStart = goalPage * GOALS_PER_PAGE;
  const goalsOnPage = state.projects.slice(goalPageStart, goalPageStart + GOALS_PER_PAGE);
  const showGoalNavArrows = state.projects.length > GOALS_PER_PAGE;

  function startEditStage(stage: Stage) {
    setEditingStageId(stage.id);
    setEditingStageTitle(stage.title || '');
    setEditingStageDays(stageDurationDays(stage));
  }

  function applyStageEdit(projectId: string, stageId: string) {
    if (!editingStageTitle.trim()) return;
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === projectId
          ? rebalanceProjectAfterStageEdit(project, stageId, editingStageTitle, editingStageDays)
          : project
      ),
    }));
    setEditingStageId(null);
    track('stage_edit', { duration_days: editingStageDays });
  }

  return (
    <main className="mx-auto w-full max-w-5xl min-h-[100dvh] bg-slate-50 text-toss-text">
      <header className="sticky top-0 z-40 border-b border-toss-border bg-white/95 backdrop-blur-sm">
        <nav
          className="mx-auto flex h-12 max-w-5xl items-center gap-3 px-4 sm:px-6 lg:px-8"
          aria-label="공통 내비게이션"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {showWebOnlyNavBranding &&
              (navLogoFailed ? (
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 text-base font-bold text-white shadow-sm ring-2 ring-slate-200 ring-offset-1"
                  role="img"
                  aria-label="좋은 습관 만들기"
                >
                  ✓
                </div>
              ) : (
                <img
                  src={brandLogoUrl}
                  alt="좋은 습관 만들기"
                  className="h-9 w-9 shrink-0 rounded-lg object-cover ring-2 ring-slate-200 ring-offset-1"
                  width={36}
                  height={36}
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                  onError={() => setNavLogoFailed(true)}
                />
              ))}
            {showWebOnlyNavBranding && (
              <span className="truncate text-sm font-semibold text-slate-800">좋은 습관 만들기</span>
            )}
          </div>
        </nav>
      </header>

      <section className="px-4 pb-2 pt-5 text-center sm:px-6 sm:pt-6 lg:px-8">
        {view === 'create' ? (
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">새 목표 만들기</h1>
        ) : (
          <h1 className="text-2xl font-bold text-slate-900">나의 홈화면</h1>
        )}
        <p className="mt-2 text-sm text-toss-sub">하루 체크로 습관을 쌓아요.</p>
      </section>

      {view !== 'create' && (
        <section className="flex items-center gap-2 overflow-x-auto px-4 pb-3 text-left sm:px-6 lg:px-8">
          <button
            type="button"
            className="whitespace-nowrap rounded-lg bg-toss-blue px-3 py-2 text-sm text-white"
            onClick={() => {
              setView('list');
              scrollToTop();
            }}
          >
            나의 전체 목표
          </button>
          <button
            type="button"
            className="ml-auto whitespace-nowrap rounded-lg border border-toss-border bg-white px-3 py-2 text-sm"
            onClick={() => {
              createOpenedViaNewGoalButtonRef.current = true;
              setView('create');
            }}
          >
            + 새 목표
          </button>
        </section>
      )}

      {view === 'list' && (
        <>
          <section className="px-4 pb-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-toss-border bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm font-semibold">나의 습관형성 달성률</p>
                  <p className="mt-1 text-xs font-medium leading-snug text-emerald-700">
                    <span className="text-slate-400">— </span>
                    {habitCheerLine}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                  <button
                    type="button"
                    className={`rounded-lg border-[3px] px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      shareCopied
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-emerald-600 bg-white text-emerald-800 hover:bg-emerald-50/80'
                    }`}
                    onClick={() => {
                      void copyShareLink();
                    }}
                  >
                    {shareCopied ? '링크가 복사되었습니다.' : '내 성공률 공유하기'}
                  </button>
                  <p className="text-lg font-bold text-toss-blue">{dashboardRate}%</p>
                </div>
              </div>
              <div className="relative mt-4 h-[138px] overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                <div className="absolute inset-x-3 bottom-3 flex items-end gap-2">
                  {stairHeights.map((height, index) => (
                    <div
                      key={`step-${height}`}
                      className={`flex-1 rounded-2xl transition-all duration-500 ${
                        index <= stepIndex ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
                <div
                  className="absolute text-2xl transition-all duration-700 ease-out"
                  style={{
                    left: `calc(${displayRate}% - 12px)`,
                    bottom: `${climberBottom + 5}px`,
                  }}
                  aria-label="진도 캐릭터"
                >
                  {climberIcon}
                </div>
              </div>
              <div className="mt-1 flex justify-between px-1 text-[10px] text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </section>

          <section className="px-4 pb-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-toss-border bg-white p-3">
                <p className="text-xs text-toss-sub">전체 진행 달성률</p>
                <p className="mt-1 text-xl font-semibold">{overallProjectProgressRate}%</p>
              </div>
              <div className="rounded-xl border border-toss-border bg-white p-3">
                <p className="text-xs text-toss-sub">진행 현황</p>
                <p className="mt-1 text-xl font-semibold">{state.projects.length}개</p>
                <p className="mt-1 text-[11px] text-toss-sub">오늘 달성률 {displayTodayRate}%</p>
              </div>
            </div>
            <div
              className={`mt-2 rounded-xl border-2 bg-white p-3 ${
                displayTodayRate === 100 ? 'border-emerald-500' : 'border-emerald-300'
              }`}
            >
              <p className="text-sm font-semibold text-emerald-700">오늘 하루 달성률</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{displayTodayRate}%</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">나의 목표들</p>
              <div className="mt-2 space-y-1">
                {displayTodayProjectRows.length === 0 ? (
                  <p className="text-[11px] text-toss-sub">아직 만든 프로젝트가 없어요</p>
                ) : (
                  displayTodayProjectRows.map((item) => (
                    <div key={item.projectId} className="flex items-center justify-between text-xs">
                      <span className="truncate pr-2 text-slate-600">{item.projectName}</span>
                      <span className={item.doneToday ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-500'}>
                        {item.doneToday ? 'O' : 'X'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {celebrationMessage && (
        <>
          <div
            className="fixed inset-0 z-[100000] bg-slate-900/45 backdrop-blur-[2px]"
            aria-hidden
          />
          <button
            type="button"
            className="fixed inset-0 z-[100002] cursor-default"
            aria-label="닫기"
            onClick={() => dismissCelebration()}
          />
          <div
            className="fixed inset-0 z-[100003] flex items-center justify-center p-6 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="celebration-dialog-title"
          >
            <div
              className="pointer-events-auto relative flex w-full max-w-sm flex-col items-center rounded-2xl border-2 border-emerald-400 bg-white px-6 py-6 text-center shadow-2xl shadow-emerald-900/10"
              onClick={(e) => e.stopPropagation()}
            >
              <p
                id="celebration-dialog-title"
                className="w-full whitespace-pre-line text-balance text-base font-semibold leading-relaxed text-emerald-800 sm:text-lg"
              >
                {celebrationMessage}
              </p>
              {celebrationCountdown !== null && (
                <p
                  className="mt-4 text-[11px] font-medium tabular-nums tracking-[0.2em] text-slate-400"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  ({celebrationCountdown})
                </p>
              )}
              <p className="mt-1 text-[10px] text-slate-400">잠시 후 자동으로 닫혀요</p>
            </div>
          </div>
        </>
      )}
      {view === 'create' && (
        <section className="px-4 sm:px-6 lg:px-8 pb-8">
          {state.projects.length > 0 && (
            <div className="mb-3">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm bg-white border border-toss-border text-slate-700 hover:bg-slate-50"
                onClick={() => setView('list')}
              >
                ← 나의 전체 목표로 돌아가기
              </button>
            </div>
          )}
          <div className="rounded-xl border border-toss-border bg-white p-4 sm:p-5">
            <h2 className="font-semibold">새 목표 만들기</h2>
            <form className="mt-3 space-y-3" onSubmit={createProject}>
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                className="w-full rounded-xl border border-toss-border px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-toss-blue/20"
                placeholder="목표 이름 (예: 아침 루틴)"
                maxLength={30}
                aria-label="목표 이름"
              />
              <input
                value={firstStageTitle}
                onChange={(event) => setFirstStageTitle(event.target.value)}
                className="w-full rounded-xl border border-toss-border px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-toss-blue/20"
                placeholder="첫 단계 목표 (예: 물 2L 마시기)"
                maxLength={30}
                aria-label="첫 단계 목표"
              />
              <div className="flex gap-2 flex-wrap">
                {PRESET_TITLES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs text-slate-700"
                    onClick={() => setFirstStageTitle(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <label className="block sm:max-w-xs">
                <span className="text-sm text-toss-sub">기간</span>
                <select
                  value={stageDays}
                  onChange={(event) => setStageDays(Number(event.target.value))}
                  className="mt-1 w-full rounded-xl border border-toss-border px-3 py-2 bg-white"
                >
                  <option value={1}>1일</option>
                  <option value={3}>3일</option>
                  <option value={7}>7일</option>
                  <option value={14}>14일</option>
                  <option value={21}>21일</option>
                  <option value={30}>30일</option>
                </select>
              </label>
              <button
                type="submit"
                className="w-full rounded-xl bg-toss-blue text-white py-3 font-medium disabled:opacity-50"
                disabled={!projectName.trim() || !firstStageTitle.trim()}
              >
                시작하기
              </button>
            </form>
          </div>
        </section>
      )}

      {view === 'list' && (
        <>
          <section className="px-4 pb-4 pt-2 sm:px-6 lg:px-8">
            <div className="mb-3 text-center">
              <h3 className="font-semibold">나의 전체 목표 개요</h3>
              <p className="mt-1 text-xs text-toss-sub">
                목표 버튼을 누르면 아래에 상세가 열려요. 목표가 {GOALS_PER_PAGE}개를 넘으면 좌우 화살표로
                넘겨 보세요.
              </p>
              <p className="mt-2 text-xs text-slate-500">오늘 전체 달성률 {overallTodayRate}%</p>
            </div>

            {state.projects.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-sm text-toss-sub">
                아직 목표가 없어요. &quot;+ 새 목표&quot;로 추가해 보세요.
              </p>
            ) : (
              <>
                <div className="flex items-stretch gap-2">
                  {showGoalNavArrows && (
                    <button
                      type="button"
                      className="w-9 shrink-0 rounded-lg border border-toss-border bg-white text-lg font-semibold text-slate-700 disabled:opacity-40"
                      aria-label="이전 목표 페이지"
                      disabled={goalPage <= 0}
                      onClick={() => setGoalPage((p) => Math.max(0, p - 1))}
                    >
                      &lt;
                    </button>
                  )}
                  <div className="flex min-w-0 flex-1 gap-2">
                    {goalsOnPage.map((project) => {
                      const current = activeStage(project);
                      const doneToday = project.stages.some((stage) => stage.checkDates.includes(today));
                      const isSelected = project.id === selectedProjectId;
                      const rate = stageRate(current);
                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => setSelectedProjectId(project.id)}
                          className={`min-h-[3.25rem] min-w-0 flex-1 rounded-xl border px-2 py-2 text-left text-sm font-medium transition-colors ${
                            isSelected
                              ? 'border-toss-blue bg-toss-blue text-white'
                              : 'border-toss-border bg-white text-slate-800'
                          }`}
                        >
                          <span className="line-clamp-2 leading-snug">{project.name}</span>
                          <span
                            className={`mt-1 block text-[11px] font-semibold ${
                              isSelected ? 'text-white/90' : doneToday ? 'text-emerald-600' : 'text-rose-500'
                            }`}
                          >
                            오늘 {doneToday ? 'O' : 'X'} · {rate}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {showGoalNavArrows && (
                    <button
                      type="button"
                      className="w-9 shrink-0 rounded-lg border border-toss-border bg-white text-lg font-semibold text-slate-700 disabled:opacity-40"
                      aria-label="다음 목표 페이지"
                      disabled={goalPage >= goalPageMax}
                      onClick={() => setGoalPage((p) => Math.min(goalPageMax, p + 1))}
                    >
                      &gt;
                    </button>
                  )}
                </div>
                {showGoalNavArrows && (
                  <p className="mt-2 text-center text-[11px] text-toss-sub">
                    {goalPage + 1} / {goalPageMax + 1} · 한 페이지에 최대 {GOALS_PER_PAGE}개
                  </p>
                )}
              </>
            )}
          </section>

          {selectedProject && (
            <section className="space-y-4 px-4 pb-10 sm:px-6 lg:px-8">
              {(() => {
                const current = activeStage(selectedProject);
                const currentRate = stageRate(current);
                const canCheckToday = isStageWindowToday(current, today) && !current.completed && !current.needsSetup;
                const doneTodayUi = effectivelyCompletedToday(selectedProject, current, today);
                const stageTitle = current.title?.trim() || (current.needsSetup ? '다음 단계 설정' : '—');
                return (
                  <>
                    <div className="rounded-xl border border-toss-border bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold tracking-wide text-toss-blue">오늘의 흐름</p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">
                        {selectedProject.name} · {current.stageNumber}단계
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">현재 목표: {stageTitle}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">1 오늘 할 일</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">2 준비하기</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">3 결과 보기</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 rounded-xl border border-toss-border bg-white p-2 shadow-sm">
                      <button
                        type="button"
                        className={`rounded-lg px-2 py-2 text-xs font-semibold ${detailPage === 'today' ? 'bg-toss-blue text-white' : 'bg-slate-100 text-slate-600'}`}
                        onClick={() => setDetailPage('today')}
                      >
                        오늘 할 일
                      </button>
                      <button
                        type="button"
                        className={`rounded-lg px-2 py-2 text-xs font-semibold ${detailPage === 'setup' ? 'bg-toss-blue text-white' : 'bg-slate-100 text-slate-600'}`}
                        onClick={() => setDetailPage('setup')}
                      >
                        준비하기
                      </button>
                      <button
                        type="button"
                        className={`rounded-lg px-2 py-2 text-xs font-semibold ${detailPage === 'result' ? 'bg-toss-blue text-white' : 'bg-slate-100 text-slate-600'}`}
                        onClick={() => setDetailPage('result')}
                      >
                        결과 보기
                      </button>
                      <button
                        type="button"
                        className={`rounded-lg px-2 py-2 text-xs font-semibold ${detailPage === 'history' ? 'bg-toss-blue text-white' : 'bg-slate-100 text-slate-600'}`}
                        onClick={() => setDetailPage('history')}
                      >
                        전체 기록
                      </button>
                    </div>

                    {detailPage === 'today' && (
                    <div className="rounded-xl border-2 border-emerald-300 bg-white p-3 shadow-sm sm:p-4">
                      <p className="text-sm font-semibold text-emerald-700">1) 오늘 할 일</p>
                      <button
                        type="button"
                        className={`mt-2 w-full rounded-xl border-2 py-3.5 text-base font-semibold ${
                          doneTodayUi
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-emerald-300 bg-slate-100 text-slate-700'
                        } ${canCheckToday || doneTodayUi ? '' : 'border-emerald-300 opacity-60'}`}
                        onClick={() => toggleTodayOnActiveStage(selectedProject.id)}
                        disabled={!canCheckToday}
                      >
                        {doneTodayUi ? '오늘 완료했어요' : checkButtonLabel}
                      </button>
                      {!canCheckToday && !doneTodayUi && (
                        <div className="mt-2 space-y-1 text-center text-xs font-medium leading-relaxed text-red-600">
                          {current.needsSetup ? (
                            <>
                              <p>다음 단계는 설정을 마치면 내일부터 시작돼요.</p>
                              <p>내일부터 여기서 하루 체크를 이어가실 수 있어요.</p>
                            </>
                          ) : (
                            <p>다음 단계로 이동하여 내일부터 다시 오늘 완료하기 체크를 할 수 있어요.</p>
                          )}
                        </div>
                      )}
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          className="rounded-lg bg-toss-blue px-3 py-2 text-xs font-semibold text-white"
                          onClick={() => setDetailPage(current.needsSetup ? 'setup' : 'result')}
                        >
                          준비하기
                        </button>
                      </div>
                    </div>
                    )}

                    {detailPage === 'setup' && (
                    <div
                      className={`rounded-xl border-2 bg-white p-3 shadow-sm ${
                        current.needsSetup ? 'border-emerald-300' : 'border-slate-200'
                      }`}
                    >
                      <p className="text-sm font-semibold text-emerald-700">2) 준비하기</p>
                      {current.needsSetup ? (
                        <form
                          className="mt-2 space-y-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            setupActiveStage(selectedProject.id, nextStageTitle, nextStageDays);
                          }}
                        >
                          <input
                            value={nextStageTitle}
                            onChange={(event) => setNextStageTitle(event.target.value)}
                            placeholder="다음 단계 목표를 적어주세요"
                            className="w-full rounded-lg border border-toss-border px-3 py-2 bg-white outline-none placeholder:font-semibold placeholder:text-emerald-800"
                          />
                          <div className="flex gap-2 flex-wrap">
                            {suggestionTitles.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs text-slate-700"
                                onClick={() => setNextStageTitle(suggestion)}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs font-medium text-red-600">
                            안내: 지금 설정하는 다음 단계는 내일부터 시작되고, 오늘 성공한 기록은 그대로 유지돼요.
                          </p>
                          <select
                            value={nextStageDays}
                            onChange={(event) => setNextStageDays(Number(event.target.value))}
                            className="w-full rounded-lg border border-toss-border px-3 py-2 bg-white"
                          >
                            <option value={1}>1일</option>
                            <option value={3}>3일</option>
                            <option value={7}>7일</option>
                            <option value={14}>14일</option>
                            <option value={21}>21일</option>
                            <option value={30}>30일</option>
                          </select>
                          <button
                            type="submit"
                            className="w-full rounded-lg bg-toss-blue text-white py-2 font-medium disabled:opacity-50"
                            disabled={!nextStageTitle.trim()}
                          >
                            이 목표로 시작
                          </button>
                        </form>
                      ) : (
                        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                          다음 단계 설정이 완료되어 있어요. 오늘 체크를 이어서 진행해 주세요.
                        </p>
                      )}
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          className="rounded-lg bg-toss-blue px-3 py-2 text-xs font-semibold text-white"
                          onClick={() => setDetailPage('result')}
                        >
                          결과 확인
                        </button>
                      </div>
                    </div>
                    )}

                    {detailPage === 'result' && (
                    <div className="rounded-xl border border-toss-border bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-800">3) 결과 보기</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] text-slate-500">오늘 체크</p>
                          <p className={`mt-1 text-lg font-bold ${doneTodayUi ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {doneTodayUi ? '완료' : '미완료'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] text-slate-500">현재 단계 달성률</p>
                          <p className="mt-1 text-lg font-bold text-toss-blue">{currentRate}%</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div
                          className="relative h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200"
                          role="progressbar"
                          aria-valuenow={currentRate}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`현재 단계 달성률 ${currentRate}%`}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] duration-500 ease-out"
                            style={{ width: `${currentRate}%` }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-toss-blue">
                          {currentRate}%
                        </span>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white"
                          onClick={() => setDetailPage('history')}
                        >
                          전체 기록 보기
                        </button>
                      </div>
                    </div>
                    )}

                    {detailPage === 'history' && (
                    <details className="rounded-xl border border-toss-border bg-white p-4 shadow-sm" open>
                      <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                        4) 전체 기록 (프로젝트 설정/캘린더/진행기록)
                      </summary>
                      <div className="mt-3 space-y-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          {editingProjectId === selectedProject.id ? (
                            <form
                              className="space-y-2"
                              onSubmit={(event) => {
                                event.preventDefault();
                                applyProjectNameEdit(selectedProject.id);
                              }}
                            >
                              <input
                                value={editingProjectName}
                                onChange={(event) => setEditingProjectName(event.target.value)}
                                className="w-full rounded-lg border border-toss-border px-3 py-2 bg-white"
                                maxLength={30}
                                placeholder="프로젝트 이름"
                              />
                              <div className="flex gap-2">
                                <button type="submit" className="flex-1 rounded-lg bg-toss-blue text-white py-2 text-sm font-medium">
                                  이름 저장
                                </button>
                                <button
                                  type="button"
                                  className="flex-1 rounded-lg border border-slate-300 py-2 text-sm"
                                  onClick={() => setEditingProjectId(null)}
                                >
                                  취소
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm text-toss-sub">기본 기간 {selectedProject.stageDurationDays}일 · 총 {selectedProject.stages.length}단계</p>
                                <p className="mt-1 text-sm text-toss-sub">기간 기준 달성률 {selectedProjectConfiguredRate}%</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-500"
                                  onClick={() => startEditProject(selectedProject)}
                                >
                                  프로젝트명 수정
                                </button>
                                <button
                                  type="button"
                                  className="shrink-0 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600"
                                  onClick={() => removeProject(selectedProject.id)}
                                >
                                  이 목표 삭제
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <h4 className="font-semibold">성공 캘린더 (최근 30일)</h4>
                            <div className="mt-3 grid grid-cols-6 gap-1.5">
                              {calendarKeys.map((dateKey) => {
                                const foundStageNumber = selectedProjectDateStageMap.get(dateKey);
                                const isToday = dateKey === today;
                                return (
                                  <div
                                    key={dateKey}
                                    className={`h-10 rounded-md border text-[12px] text-center flex flex-col items-center justify-center ${
                                      foundStageNumber ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 text-slate-500 border-slate-200'
                                    } ${isToday ? 'ring-2 ring-toss-blue/30' : ''}`}
                                    title={`${formatDateLabel(dateKey)} ${foundStageNumber ? `${foundStageNumber}단계 성공` : '기록 없음'}`}
                                  >
                                    <span>{formatDateLabel(dateKey)}</span>
                                    <span className="text-center leading-none">{foundStageNumber ? `${foundStageNumber}단계` : '-'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <h4 className="font-semibold">진행 기록</h4>
                            <ul className="mt-3 space-y-2">
                              {selectedProject.stages.map((stage) => (
                                <li key={stage.id} className="border border-slate-200 rounded-lg p-3">
                                  <p className="text-sm font-medium">{stage.stageNumber}단계 · {stage.title || '목표 미설정'}</p>
                                  <p className="text-xs text-slate-500 mt-1">{stage.startDate} ~ {stage.endDate}</p>
                                  <p className="text-sm mt-1">달성률 {stageRate(stage)}% · 성공 {stage.checkDates.length}회</p>
                                  {stage.failed && <p className="text-xs mt-1 text-rose-600">이번 단계는 기간 내 미달성으로 종료됐어요</p>}
                                  {stage.completed && !stage.failed && <p className="text-xs mt-1 text-emerald-600">성공적으로 완료했어요</p>}
                                  {editingStageId === stage.id ? (
                                    <form
                                      className="mt-2 space-y-2"
                                      onSubmit={(event) => {
                                        event.preventDefault();
                                        applyStageEdit(selectedProject.id, stage.id);
                                      }}
                                    >
                                      <input
                                        value={editingStageTitle}
                                        onChange={(event) => setEditingStageTitle(event.target.value)}
                                        className="w-full rounded-lg border border-toss-border px-3 py-2 text-sm bg-white"
                                        placeholder="수정할 목표를 입력해 주세요"
                                      />
                                      <select
                                        value={editingStageDays}
                                        onChange={(event) => setEditingStageDays(Number(event.target.value))}
                                        className="w-full rounded-lg border border-toss-border px-3 py-2 text-sm bg-white"
                                      >
                                        <option value={1}>1일</option>
                                        <option value={3}>3일</option>
                                        <option value={7}>7일</option>
                                        <option value={14}>14일</option>
                                        <option value={21}>21일</option>
                                        <option value={30}>30일</option>
                                      </select>
                                      <div className="flex gap-2">
                                        <button type="submit" className="flex-1 rounded-lg bg-toss-blue text-white py-2 text-sm font-medium">
                                          수정 저장
                                        </button>
                                        <button
                                          type="button"
                                          className="flex-1 rounded-lg border border-slate-300 py-2 text-sm"
                                          onClick={() => setEditingStageId(null)}
                                        >
                                          취소
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <button
                                      type="button"
                                      className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                                      onClick={() => startEditStage(stage)}
                                    >
                                      단계 수정하기
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </details>
                    )}
                  </>
                );
              })()}
            </section>
          )}
        </>
      )}

      {!screenshotShotKey && (
        <BannerAd refreshKey={`${view}:${selectedProjectId ?? ''}`} />
      )}
    </main>
  );
}
