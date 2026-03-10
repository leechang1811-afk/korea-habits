import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  REACTION_COLORS,
  reactionTimeLimitForLevel,
  colorIntervalForLevel,
  type ReactionColor,
} from 'shared';
import { normalizeStageScore } from 'shared';

const COLOR_MAP: Record<ReactionColor, string> = {
  Red: '#EF4444',
  Blue: '#3B82F6',
  Green: '#22C55E',
  Purple: '#A855F7',
  Yellow: '#EAB308',
};

interface ReactionGameProps {
  level: number;
  onSuccess: (score: number) => void;
  onFail: () => void;
}

export default function ReactionGame({ level, onSuccess, onFail }: ReactionGameProps) {
  const [phase, setPhase] = useState<'idle' | 'instruction' | 'playing'>('idle');
  const [targetColor, setTargetColor] = useState<ReactionColor | null>(null);
  const [currentColor, setCurrentColor] = useState<ReactionColor | null>(null);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFailedRef = useRef(false);

  const timeLimit = reactionTimeLimitForLevel(level);
  const colorInterval = colorIntervalForLevel(level);

  const startGame = useCallback(() => {
    hasFailedRef.current = false;
    const target = REACTION_COLORS[Math.floor(Math.random() * REACTION_COLORS.length)]!;
    setTargetColor(target);
    setCurrentColor(REACTION_COLORS[0]!);
    setCurrentColorIndex(0);
    setPhase('instruction');
  }, []);

  useLayoutEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (phase !== 'instruction') return;
    const t = setTimeout(() => {
      setPhase('playing');
      setTimeLeft(timeLimit);
      setStartTime(Date.now());
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, timeLimit]);

  // playing 중 색상 순환
  useEffect(() => {
    if (phase !== 'playing') return;
    intervalRef.current = setInterval(() => {
      setCurrentColorIndex((prev) => {
        const next = (prev + 1) % REACTION_COLORS.length;
        setCurrentColor(REACTION_COLORS[next]!);
        return next;
      });
    }, colorInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, colorInterval]);

  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!hasFailedRef.current) {
            hasFailedRef.current = true;
            onFail();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, timeLeft, onFail]);

  const handleShapeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (phase !== 'playing' || !targetColor || !currentColor || hasFailedRef.current) return;
    if (currentColor !== targetColor) {
      hasFailedRef.current = true;
      onFail();
      return;
    }
    const elapsed = (Date.now() - startTime) / 1000;
    const rawScore = Math.max(0, 100 - elapsed * 2);
    const score = normalizeStageScore(rawScore, 100, true);
    onSuccess(score);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <AnimatePresence mode="wait">
        {(phase === 'instruction' || phase === 'playing') && targetColor && (
          <motion.div
            key="play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md text-center"
          >
            <p className="text-lg font-medium text-toss-text mb-6">
              {targetColor}를 선택하세요
            </p>
            <p className="text-toss-sub text-sm mb-4">
              색이 {targetColor}일 때 도형을 탭하세요
            </p>
            <div className="flex justify-center gap-2 mb-6">
              <span className="text-toss-sub">제한시간</span>
              <span className="font-medium text-toss-blue">{timeLeft}초</span>
            </div>
            <button
              type="button"
              onClick={handleShapeClick}
              className="w-56 h-56 mx-auto block rounded-2xl shadow-md border border-toss-border hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
              style={{
                backgroundColor: currentColor ? COLOR_MAP[currentColor] : '#E5E7EB',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
