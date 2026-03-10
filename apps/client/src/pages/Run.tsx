import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fireSuccess, fireCombo } from '../utils/confetti';
import {
  useGameStore,
  ensureUserHash,
} from '../store/gameStore';
import StageHeader from '../components/StageHeader';
import ReactionGame from '../games/ReactionGame';
import Tap10Game from '../games/Tap10Game';
import MemoryGame from '../games/MemoryGame';
import CalcGame from '../games/CalcGame';
import PaintGame from '../games/PaintGame';
import FailOverlay from './FailOverlay';
import PassOverlay from '../components/PassOverlay';

export default function Run() {
  const navigate = useNavigate();
  const {
    run,
    startRun,
    nextLevel,
    triggerFail,
    useRevive,
    confirmGameOver,
    getCurrentGameType,
    getCumulativeScore,
    getComboCount,
    setUserHash,
  } = useGameStore();
  const lastCompletedRun = useGameStore((s) => s.lastCompletedRun);

  useEffect(() => {
    ensureUserHash().then(setUserHash);
  }, [setUserHash]);

  // 게임 종료 직후: result-gate로 이동. 새 게임 시작 시: startRun (홈→시작 시 리다이렉트 방지)
  useLayoutEffect(() => {
    if (!run && lastCompletedRun) {
      navigate('/result-gate', { replace: true });
      return;
    }
    if (!run && !lastCompletedRun) {
      startRun();
    }
  }, [run, lastCompletedRun, navigate, startRun]);

  const gameType = getCurrentGameType();
  const cumulativeScore = getCumulativeScore();
  const level = run?.level ?? 1;
  const showFailOverlay = run?.failed ?? false;
  const [showDifficultyUpgrade, setShowDifficultyUpgrade] = useState(false);
  const [showUpperLevelMsg, setShowUpperLevelMsg] = useState(false);
  const [showPassOverlay, setShowPassOverlay] = useState(false);
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const hasShownUpgradeRef = useRef(false);
  const hasShownUpperLevelRef = useRef(false);

  useEffect(() => {
    if (level === 9 && !hasShownUpgradeRef.current) {
      hasShownUpgradeRef.current = true;
      setShowDifficultyUpgrade(true);
      const t = setTimeout(() => setShowDifficultyUpgrade(false), 2000);
      return () => clearTimeout(t);
    }
  }, [level]);

  useEffect(() => {
    if (level === 15 && !hasShownUpperLevelRef.current) {
      hasShownUpperLevelRef.current = true;
      setShowUpperLevelMsg(true);
      const t = setTimeout(() => setShowUpperLevelMsg(false), 2000);
      return () => clearTimeout(t);
    }
  }, [level]);

  const handleSuccess = (score: number) => {
    const gt = getCurrentGameType();
    if (!gt || !run) return;
    setPendingScore(score);
    setShowPassOverlay(true);
    const combo = getComboCount();
    if (combo >= 1) {
      fireCombo(combo + 1, level);
    } else {
      fireSuccess(level);
    }
  };

  const handlePassComplete = () => {
    const score = pendingScore;
    setShowPassOverlay(false);
    setPendingScore(null);
    if (score === null) return;
    const gt = getCurrentGameType();
    const r = useGameStore.getState().run;
    if (!gt || !r) return;
    const effectiveLevel = r.isRevivedLevel ? Math.max(1, r.level - 1) : r.level;
    nextLevel({
      game_type: gt,
      level: effectiveLevel,
      success: true,
      score,
    });
    const nextRun = useGameStore.getState().run;
    if (nextRun && nextRun.level > 20) {
      useGameStore.getState().confirmGameOver();
      requestAnimationFrame(() => {
        navigate('/result-gate', { replace: true });
      });
    }
  };

  const handleFail = () => {
    triggerFail();
  };

  const handleRevive = async () => {
    const { adsService } = await import('../services/ads');
    const shown = await adsService.showRewarded('revive');
    if (shown) {
      useRevive();
    } else {
      confirmGameOver();
      navigate('/result-gate');
    }
  };

  const handleGameOver = () => {
    confirmGameOver();
    navigate('/result-gate');
  };

  if (!run) {
    if (lastCompletedRun) return null;
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-toss-sub">준비 중...</p>
      </div>
    );
  }

  const GameComponent = () => {
    if (!gameType) return null;
    const common = { level, onSuccess: handleSuccess, onFail: handleFail };
    switch (gameType) {
      case 'REACTION':
        return <ReactionGame {...common} />;
      case 'TAP10':
        return <Tap10Game {...common} />;
      case 'MEMORY':
        return <MemoryGame {...common} />;
      case 'CALCULATION':
        return <CalcGame {...common} />;
      case 'PAINT':
        return <PaintGame {...common} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      <StageHeader
        gameType={gameType!}
        level={level}
        cumulativeScore={cumulativeScore}
        comboCount={getComboCount()}
      />
      {showDifficultyUpgrade ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 12 }}
            className="text-4xl mb-4"
          >
            🎯
          </motion.span>
          <p className="text-xl font-bold text-toss-text mb-2">
            난이도 업그레이드!
          </p>
          <p className="text-toss-sub">
            여기까지 오신 분들만의 특별한 구간이에요
          </p>
        </motion.div>
      ) : showUpperLevelMsg ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 12 }}
            className="text-4xl mb-4"
          >
            🚀
          </motion.span>
          <p className="text-xl font-bold text-toss-blue mb-2">
            상위 레벨 구간
          </p>
          <p className="text-toss-text font-medium">
            집중! 여기가 진짜 실력 갈림길
          </p>
        </motion.div>
      ) : showPassOverlay ? (
        <div className="min-h-[60vh]" />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${gameType ?? 'loading'}-${level}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GameComponent />
          </motion.div>
        </AnimatePresence>
      )}

      {showPassOverlay && pendingScore !== null && run && (
        <PassOverlay
          passedLevel={level}
          perStageResults={run.perStageResults.map((r) => ({ score: r.score }))}
          pendingScore={pendingScore}
          comboCount={getComboCount() + 1}
          onComplete={handlePassComplete}
        />
      )}

      {showFailOverlay && (
        <FailOverlay
          canRevive={!run.usedRevive}
          failedLevel={level}
          maxLevel={20}
          onRevive={handleRevive}
          onExit={handleGameOver}
        />
      )}
    </div>
  );
}
