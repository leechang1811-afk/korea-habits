import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { computeRunScore, getStrengthWeakness } from 'shared';
import type { GameType } from 'shared';
import { GAME_TYPE_LABELS } from 'shared';
import { submitRun } from '../services/api';
import { ensureUserHash } from '../store/gameStore';
import { shareToKakao, shareToX, shareToInstagram } from '../services/share';
import { recordPlay, getStreakState } from '../services/streak';
import { fireChampion, fireNewBest } from '../utils/confetti';
import type { RunSubmitResponse } from '../services/api';

const HERO_SUBTEXT_OPTIONS = [
  '한국인 중 상위권! 🏆',
  '한국인 대비 괜찮은 편! 👍',
  '한국인보다 잘했어요! 🎯',
];

// Variable reward: 랜덤 칭찬/동기 문구
const VARIABLE_PRAISE_OPTIONS = [
  '계속 도전하면 점점 상위권에 가까워져요. You got this! 🎯',
  '매일 한 번씩만 해도 실력이 쑥쑥. 내일 또 와요!',
  '한국인 상위권은 꾸준함의 결과. 오늘도 수고했어요!',
  '다음엔 더 잘할 수 있어요. 자신감을 갖고!',
  '리더보드 1위를 노려보세요. 당신도 할 수 있어요!',
];

function computeMyPerTypeSuccess(perStageResults: { game_type: string; success: boolean }[]): Record<string, { successes: number; total: number; rate: number }> {
  const acc: Record<string, { successes: number; total: number }> = {};
  for (const r of perStageResults) {
    if (!acc[r.game_type]) acc[r.game_type] = { successes: 0, total: 0 };
    acc[r.game_type].total += 1;
    if (r.success) acc[r.game_type].successes += 1;
  }
  return Object.fromEntries(
    Object.entries(acc).map(([k, v]) => [
      k,
      { ...v, rate: v.total > 0 ? Math.round((v.successes / v.total) * 100) : 0 },
    ])
  );
}

export default function Result() {
  const navigate = useNavigate();
  const { lastCompletedRun, userHash, setUserHash, endRun } = useGameStore();
  const [res, setRes] = useState<RunSubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [heroSubtext] = useState(() => HERO_SUBTEXT_OPTIONS[Math.floor(Math.random() * HERO_SUBTEXT_OPTIONS.length)]!);
  const [variablePraise] = useState(() => VARIABLE_PRAISE_OPTIONS[Math.floor(Math.random() * VARIABLE_PRAISE_OPTIONS.length)]!);
  const hasFiredConfettiRef = useRef(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureUserHash().then(setUserHash);
  }, [setUserHash]);

  const submitAgain = async () => {
    if (!lastCompletedRun) return;
    setError(null);
    setLoading(true);
    try {
      const hash = userHash || (await ensureUserHash());
      const runScore = computeRunScore(lastCompletedRun.perStageResults.map((r) => ({ score: r.score })));
      const apiRes = await submitRun({
        user_hash: hash,
        run_score: runScore,
        max_level: lastCompletedRun.maxLevel,
        game_breakdown: lastCompletedRun.gameBreakdown,
        per_stage: lastCompletedRun.perStageResults.map((r) => ({
          game_type: r.game_type,
          level: r.level,
          success: r.success,
          score: r.score,
        })),
        client_time: new Date().toISOString(),
      });
      setRes(apiRes);
    } catch (e) {
      setError('연결을 확인하고 다시 시도해주세요');
      setRes({
        percentileTop: 50,
        successRatePct: null,
        successBaseN: 0,
        nextGoalHint: '데이터베이스 기반으로 1단계만 더 오르면 상위 5%가 될 수 있어요',
      });
    } finally {
      setLoading(false);
      const newStreak = recordPlay();
      setStreak(newStreak);
    }
  };

  useEffect(() => {
    if (!lastCompletedRun) {
      navigate('/', { replace: true });
      return;
    }
    submitAgain();
  }, [lastCompletedRun]);

  const handleRetry = () => {
    endRun();
    useGameStore.getState().startRun();
    navigate('/run');
  };

  const handleHome = () => {
    endRun();
    navigate('/');
  };

  if (!lastCompletedRun) return null;

  const runScore = computeRunScore(lastCompletedRun.perStageResults.map((r) => ({ score: r.score })));
  const breakdown = lastCompletedRun.gameBreakdown as Record<GameType, number>;
  const { strength, weakness, weaknessTip } = getStrengthWeakness({
    REACTION: breakdown.REACTION ?? 0,
    TAP10: breakdown.TAP10 ?? 0,
    MEMORY: breakdown.MEMORY ?? 0,
    CALCULATION: breakdown.CALCULATION ?? 0,
    PAINT: breakdown.PAINT ?? 0,
  });

  const myPerType = computeMyPerTypeSuccess(lastCompletedRun.perStageResults);
  const isNewBest = res?.me && runScore >= res.me.best_score && res.me.best_score > 0;
  const koreanAvg = res?.koreanAvgScore ?? null;
  const perTypeKorean = res?.perTypeKoreanSuccess ?? {};
  const bestScore = res?.me?.best_score ?? runScore;

  const shareData = {
    percentileTop: res?.percentileTop ?? 50,
    runScore,
    maxLevel: lastCompletedRun.maxLevel,
    isChampion: lastCompletedRun.maxLevel === 20,
  };

  const handleShareKakao = async () => {
    setShareError(null);
    try {
      await shareToKakao(shareData);
    } catch {
      setShareError('카카오톡 공유를 사용하려면 VITE_KAKAO_JS_KEY를 설정해주세요.');
    }
  };

  const handleShareX = () => {
    setShareError(null);
    shareToX(shareData);
  };

  const handleShareInstagram = async () => {
    setShareError(null);
    try {
      await shareToInstagram(shareData, shareCardRef.current);
    } catch {
      setShareError('공유 중 오류가 발생했어요.');
    }
  };

  const gameTypes = ['REACTION', 'TAP10', 'MEMORY', 'CALCULATION', 'PAINT'] as const;

  // Confetti: Champion (Lv20) or New Best
  useEffect(() => {
    if (loading || hasFiredConfettiRef.current) return;
    hasFiredConfettiRef.current = true;
    if (lastCompletedRun.maxLevel === 20) {
      setTimeout(() => fireChampion(), 400);
    } else if (isNewBest) {
      setTimeout(() => fireNewBest(), 500);
    }
  }, [loading, lastCompletedRun.maxLevel, isNewBest]);

  const [showDetail, setShowDetail] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24"
    >
      <div className="max-w-md mx-auto px-4 pt-6">
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-toss-sub text-lg">결과 분석 중...</p>
            <div className="mt-4 h-1 w-24 mx-auto bg-toss-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-toss-blue"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 🎯 Hero - 한눈에 보는 핵심 */}
            <motion.div
              ref={shareCardRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className={`rounded-3xl p-8 text-center shadow-xl ${
                lastCompletedRun.maxLevel === 20
                  ? 'bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-200'
                  : 'bg-gradient-to-br from-toss-blue to-blue-600'
              }`}
            >
              {lastCompletedRun.maxLevel === 20 && (
                <p className="text-2xl font-black text-amber-800 mb-2">🎉 Champion!</p>
              )}
              <p className={`text-5xl md:text-6xl font-black ${lastCompletedRun.maxLevel === 20 ? 'text-amber-900' : 'text-white'}`}>
                상위 {lastCompletedRun.maxLevel === 20 ? '0.1' : res?.percentileTop ?? '-'}%
              </p>
              <p className={`mt-2 text-lg font-semibold ${lastCompletedRun.maxLevel === 20 ? 'text-amber-800' : 'text-white/95'}`}>
                {runScore.toLocaleString()}점 · {lastCompletedRun.maxLevel}단계
              </p>
              {streak > 0 && (
                <p className={`mt-1 text-sm font-medium ${lastCompletedRun.maxLevel === 20 ? 'text-amber-700' : 'text-white/90'}`}>
                  🔥 {streak}일 연속!
                </p>
              )}
              {/* Share - 컴팩트 */}
              <div className="flex justify-center gap-6 mt-6">
                <button type="button" onClick={handleShareKakao} className="flex flex-col items-center gap-1 text-inherit opacity-90 hover:opacity-100" title="카카오톡">
                  <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-lg font-bold text-[#191919] shadow">K</span>
                  <span className="text-xs font-medium">카카오</span>
                </button>
                <button type="button" onClick={handleShareX} className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100" title="X">
                  <span className="w-12 h-12 rounded-full bg-black/80 flex items-center justify-center text-white shadow">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </span>
                  <span className="text-xs font-medium">X</span>
                </button>
                <button type="button" onClick={handleShareInstagram} className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100" title="인스타">
                  <span className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" /></svg>
                  </span>
                  <span className="text-xs font-medium">인스타</span>
                </button>
              </div>
              {shareError && <p className="text-red-600 text-xs mt-2 font-medium">{shareError}</p>}
            </motion.div>

            {/* 📊 한 줄 요약 */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm border border-slate-100"
            >
              <div>
                <p className="text-slate-500 text-xs mb-0.5">이번 점수</p>
                <p className="text-2xl font-bold text-toss-text">{runScore.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500 text-xs mb-0.5">내 최고</p>
                <p className="text-2xl font-bold text-toss-blue flex items-center gap-1">
                  {bestScore.toLocaleString()}
                  {isNewBest && <span className="text-[10px] bg-toss-blue text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>}
                </p>
              </div>
              {koreanAvg != null && (
                <div className="text-right">
                  <p className="text-slate-500 text-xs mb-0.5">한국 평균</p>
                  <p className={`text-lg font-bold ${runScore >= koreanAvg ? 'text-green-600' : 'text-slate-600'}`}>
                    {runScore >= koreanAvg ? '↑' : '↓'} {Math.abs(runScore - koreanAvg).toLocaleString()}점
                  </p>
                </div>
              )}
            </motion.div>

            {/* 💡 한 줄 인사이트 */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-amber-50 border border-amber-100 p-4"
            >
              <p className="text-amber-800 font-medium text-sm">💪 {strength}</p>
              {weaknessTip && (
                <p className="text-amber-700 text-xs mt-1">💡 {weaknessTip}</p>
              )}
            </motion.div>

            {/* 📈 상세 분석 (접기/펼치기) */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
              >
                <span className="font-semibold text-toss-text">상세 분석</span>
                <span className="text-toss-sub text-sm">{showDetail ? '접기 ↑' : '펼치기 ↓'}</span>
              </button>
              {showDetail && (
                <div className="px-5 pb-5 pt-0 space-y-4 border-t border-slate-100">
                  {koreanAvg != null && (
                    <div>
                      <p className="text-slate-500 text-xs mb-2">한국인 평균 vs 나</p>
                      <div className="flex gap-2 h-4 rounded-full overflow-hidden bg-slate-100">
                        <div className="bg-slate-300 rounded-full" style={{ width: `${(koreanAvg / Math.max(runScore, koreanAvg, 1)) * 100}%` }} />
                        <div className="bg-toss-blue rounded-full flex-1" />
                      </div>
                      <p className="text-slate-600 text-xs mt-1">
                        {runScore >= koreanAvg ? `평균보다 ${(runScore - koreanAvg).toLocaleString()}점 높아요 🚀` : `평균까지 ${(koreanAvg - runScore).toLocaleString()}점 남았어요`}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-500 text-xs mb-2">유형별 성공률</p>
                    <div className="space-y-2">
                      {gameTypes.map((gt) => {
                        const mine = myPerType[gt];
                        const kr = perTypeKorean[gt] ?? 50;
                        if (!mine) return null;
                        const better = mine.rate >= kr;
                        return (
                          <div key={gt} className="flex items-center gap-3">
                            <span className="text-slate-600 text-xs w-16">{GAME_TYPE_LABELS[gt]}</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${better ? 'bg-toss-blue' : 'bg-amber-400'}`} style={{ width: `${mine.rate}%` }} />
                            </div>
                            <span className={`text-xs font-medium w-8 ${better ? 'text-toss-blue' : 'text-slate-500'}`}>{mine.rate}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs pt-2 border-t border-slate-100">
                    📌 보완점: {weakness}
                  </p>
                </div>
              )}
            </motion.div>

            {/* 🎯 다음 목표 & Zeigarnik */}
            {lastCompletedRun.maxLevel < 20 && (
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="rounded-2xl bg-toss-blue/10 border border-toss-blue/20 p-4"
              >
                <p className="text-toss-blue font-semibold">
                  {lastCompletedRun.maxLevel}단계까지 왔어요!
                </p>
                <p className="text-toss-text text-sm mt-0.5">{res?.nextGoalHint}</p>
              </motion.div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-2">
              <motion.button
                onClick={handleRetry}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 rounded-2xl bg-toss-blue text-white font-bold text-lg shadow-lg shadow-toss-blue/30"
              >
                {streak > 0 ? `한 번 더! 🔥 (${streak}일)` : '한 번 더 도전!'}
              </motion.button>
              <button onClick={handleHome} className="w-full py-3 rounded-2xl text-toss-sub font-medium">
                홈으로
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-center">
            <p className="text-red-600 text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={submitAgain}
              className="mt-3 px-6 py-2 rounded-xl bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
