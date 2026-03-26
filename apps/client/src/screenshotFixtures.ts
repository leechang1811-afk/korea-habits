/**
 * Store / App-in-Toss 636×1048 캡처용 (?shot=…) — DEV 또는 VITE_SCREENSHOT=1 일 때만 동작
 */

export function screenshotModeEnabled(): boolean {
  return Boolean(import.meta.env.DEV || import.meta.env.VITE_SCREENSHOT === '1');
}

type StageF = {
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

type ProjectF = {
  id: string;
  name: string;
  createdAt: string;
  stageDurationDays: number;
  stages: StageF[];
};

export type ScreenshotBootstrap = {
  state: { projects: ProjectF[] };
  view: 'create' | 'list';
  selectedProjectId: string | null;
  /** 마운트 후 한 번 띄울 축하 문구(캡처용) */
  celebrationMessage?: string;
};

function isoToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const today = isoToday();

function addDaysKey(dateKey: string, days: number): string {
  const [y, mo, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (mo || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

const FIXTURES: Record<string, ScreenshotBootstrap> = {
  'home-empty': {
    state: { projects: [] },
    view: 'list',
    selectedProjectId: null,
  },
  'project-list': {
    state: {
      projects: [
        {
          id: 'shot-p1',
          name: '아침 루틴',
          createdAt: new Date().toISOString(),
          stageDurationDays: 7,
          stages: [
            {
              id: 'shot-p1-s1',
              stageNumber: 1,
              title: '물 2L 마시기',
              startDate: addDaysKey(today, -5),
              endDate: addDaysKey(today, 1),
              checkDates: [addDaysKey(today, -2), addDaysKey(today, -1), today],
              completed: false,
              needsSetup: false,
              failed: false,
            },
          ],
        },
        {
          id: 'shot-p2',
          name: '저녁 독서',
          createdAt: new Date().toISOString(),
          stageDurationDays: 7,
          stages: [
            {
              id: 'shot-p2-s1',
              stageNumber: 1,
              title: '10분 독서',
              startDate: addDaysKey(today, -3),
              endDate: addDaysKey(today, 3),
              checkDates: [addDaysKey(today, -1)],
              completed: false,
              needsSetup: false,
              failed: false,
            },
          ],
        },
        {
          id: 'shot-p3',
          name: '걷기',
          createdAt: new Date().toISOString(),
          stageDurationDays: 14,
          stages: [
            {
              id: 'shot-p3-s1',
              stageNumber: 1,
              title: '15분 걷기',
              startDate: addDaysKey(today, -10),
              endDate: addDaysKey(today, 4),
              checkDates: [],
              completed: false,
              needsSetup: false,
              failed: false,
            },
          ],
        },
      ],
    },
    view: 'list',
    selectedProjectId: 'shot-p1',
  },
  'project-detail': {
    state: {
      projects: [
        {
          id: 'shot-d1',
          name: '점심 루틴',
          createdAt: new Date().toISOString(),
          stageDurationDays: 7,
          stages: [
            {
              id: 'shot-d1-s1',
              stageNumber: 1,
              title: '영어 단어 10개',
              startDate: addDaysKey(today, -2),
              endDate: addDaysKey(today, 4),
              checkDates: [addDaysKey(today, -1), today],
              completed: false,
              needsSetup: false,
              failed: false,
            },
          ],
        },
        {
          id: 'shot-d2',
          name: '스트레칭',
          createdAt: new Date().toISOString(),
          stageDurationDays: 7,
          stages: [
            {
              id: 'shot-d2-s1',
              stageNumber: 1,
              title: '5분 스트레칭',
              startDate: today,
              endDate: addDaysKey(today, 6),
              checkDates: [],
              completed: false,
              needsSetup: false,
              failed: false,
            },
          ],
        },
      ],
    },
    view: 'list',
    selectedProjectId: 'shot-d1',
  },
  celebration: {
    state: {
      projects: [
        {
          id: 'shot-c1',
          name: '습관 챌린지',
          createdAt: new Date().toISOString(),
          stageDurationDays: 7,
          stages: [
            {
              id: 'shot-c1-s1',
              stageNumber: 1,
              title: '미션 완료',
              startDate: addDaysKey(today, -6),
              endDate: today,
              checkDates: [today],
              completed: false,
              needsSetup: false,
              failed: false,
            },
          ],
        },
      ],
    },
    view: 'list',
    selectedProjectId: 'shot-c1',
    celebrationMessage: '2단계 완주, 정말 멋져요.\n꾸준함이 빛났어요.\n앞으로도 화이팅!',
  },
  'next-stage-setup': {
    state: {
      projects: [
        {
          id: 'shot-n1',
          name: '테스트2',
          createdAt: new Date().toISOString(),
          stageDurationDays: 7,
          stages: [
            {
              id: 'shot-n1-s1',
              stageNumber: 1,
              title: '첫 단계',
              startDate: addDaysKey(today, -7),
              endDate: addDaysKey(today, -1),
              checkDates: [addDaysKey(today, -3), addDaysKey(today, -1)],
              completed: true,
              needsSetup: false,
              failed: false,
            },
            {
              id: 'shot-n1-s2',
              stageNumber: 2,
              title: '',
              startDate: today,
              endDate: today,
              checkDates: [],
              completed: false,
              needsSetup: true,
              failed: false,
            },
          ],
        },
      ],
    },
    view: 'list',
    selectedProjectId: 'shot-n1',
  },
};

export function getScreenshotBootstrap(shot: string | null): ScreenshotBootstrap | null {
  if (!shot || !FIXTURES[shot]) return null;
  return FIXTURES[shot];
}

export function readScreenshotInit(): { shot: string; bootstrap: ScreenshotBootstrap } | null {
  if (typeof window === 'undefined' || !screenshotModeEnabled()) return null;
  const shot = new URLSearchParams(window.location.search).get('shot');
  const bootstrap = getScreenshotBootstrap(shot);
  if (!shot || !bootstrap) return null;
  return { shot, bootstrap };
}

export const SCREENSHOT_CAPTURES: { shot: string; filename: string }[] = [
  { shot: 'home-empty', filename: 'screenshot-01-home-empty-636x1048.png' },
  { shot: 'project-list', filename: 'screenshot-02-project-list-636x1048.png' },
  { shot: 'project-detail', filename: 'screenshot-03-project-detail-636x1048.png' },
  { shot: 'celebration', filename: 'screenshot-04-celebration-636x1048.png' },
  { shot: 'next-stage-setup', filename: 'screenshot-05-next-stage-setup-636x1048.png' },
];
