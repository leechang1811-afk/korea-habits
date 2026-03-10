import {
  GAME_TYPE_LABELS,
  timeLimitForLevel,
  reactionTimeLimitForLevel,
  paintTimeLimitForLevel,
} from 'shared';
import type { GameType } from 'shared';

function getTimeLimitForGame(gameType: GameType, level: number): number {
  switch (gameType) {
    case 'REACTION':
      return reactionTimeLimitForLevel(level);
    case 'TAP10':
      return timeLimitForLevel(level);
    case 'PAINT':
      return paintTimeLimitForLevel(level);
    default:
      return timeLimitForLevel(level);
  }
}

interface StageHeaderProps {
  gameType: GameType;
  level: number;
  cumulativeScore: number;
  comboCount?: number;
}

export default function StageHeader({
  gameType,
  level,
  cumulativeScore,
  comboCount = 0,
}: StageHeaderProps) {
  const timeLimit = getTimeLimitForGame(gameType, level);
  const gameIndex = ['REACTION', 'TAP10', 'MEMORY', 'CALCULATION', 'PAINT'].indexOf(gameType) + 1;

  return (
    <header className="bg-white border-b border-toss-border">
      {/* 진행률 바 */}
      <div className="h-1 bg-toss-bg">
        <div
          className="h-full bg-toss-blue transition-all duration-500"
          style={{ width: `${(level / 20) * 100}%` }}
        />
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-toss-sub">문제유형 {gameIndex}/5</div>
          <div className="text-sm font-medium text-toss-text text-center flex-1">
            {GAME_TYPE_LABELS[gameType]}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-toss-sub">
            {level}/20단계 · 제한시간 {timeLimit}초
          </div>
          <div className="flex items-center gap-2">
            {comboCount >= 2 && (
              <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 text-xs font-bold animate-pulse border border-amber-200/60 shadow-sm">
                🔥 {comboCount}연속!
              </span>
            )}
            <span className="px-2 py-0.5 rounded-lg bg-toss-bg text-toss-blue text-xs font-medium">
              누적 점수 {cumulativeScore}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
