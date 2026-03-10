import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ensureUserHash, useGameStore } from '../store/gameStore';
import { API_BASE } from '../services/api';
import { getStreakState } from '../services/streak';
import { shareToKakao, shareToX, shareToInstagram } from '../services/share';

interface LeaderboardEntry {
  rank: number;
  score: number;
  max_level: number;
  user_hash: string;
}

interface MeSummary {
  best_score?: number;
  best_level?: number;
  best_rank?: number | null;
  latest_score?: number | null;
  latest_rank?: number | null;
  avg_score?: number | null;
  min_score?: number | null;
  percentile_top?: number | null;
  alltime_best_score?: number | null;
  alltime_min_score?: number | null;
  alltime_avg_score?: number | null;
  alltime_rank?: number | null;
  alltime_percentile_top?: number | null;
}

export default function RecordAndRank() {
  const navigate = useNavigate();
  const endRun = useGameStore((s) => s.endRun);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [meData, setMeData] = useState<MeSummary | null>(null);
  const [streakState, setStreakState] = useState(() => getStreakState());
  const [shareError, setShareError] = useState<string | null>(null);
  const [myUserHash, setMyUserHash] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureUserHash().then((hash) => setMyUserHash(hash));
  }, []);

  const loadData = async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const [lbData, summary] = await Promise.all([
        fetch(`${API_BASE}/leaderboard?scope=monthly`).then((res) => (res.ok ? res.json() : { entries: [] })),
        ensureUserHash().then((hash) =>
          fetch(`${API_BASE}/me/summary?user_hash=${encodeURIComponent(hash)}`).then((r) => (r.ok ? r.json() : null))
        ),
      ]);
      setEntries(lbData.entries ?? []);
      setMeData(summary);
    } catch {
      setFetchError('연결을 확인하고 다시 시도해주세요');
      setEntries([]);
      setMeData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setStreakState(getStreakState());
  }, []);

  const { count: streakCount, canExtend, playedToday } = streakState;
  const percentileTop = meData?.alltime_percentile_top ?? meData?.percentile_top ?? null;
  const bestScore = meData?.alltime_best_score ?? meData?.best_score ?? null;
  const minScore = meData?.alltime_min_score ?? meData?.min_score ?? null;
  const avgScore = meData?.alltime_avg_score ?? meData?.avg_score ?? null;

  const shareData = {
    percentileTop: percentileTop ?? 50,
    runScore: bestScore ?? 0,
    maxLevel: meData?.best_level ?? 0,
    isChampion: meData?.best_level === 20,
  };

  const handleShareKakao = async () => {
    if (percentileTop == null) return;
    setShareError(null);
    try {
      await shareToKakao(shareData);
    } catch {
      setShareError('카카오톡 공유를 사용하려면 VITE_KAKAO_JS_KEY를 설정해주세요.');
    }
  };

  const handleShareX = () => {
    if (percentileTop == null) return;
    setShareError(null);
    shareToX(shareData);
  };

  const handleShareInstagram = async () => {
    if (percentileTop == null) return;
    setShareError(null);
    try {
      await shareToInstagram(shareData, shareCardRef.current);
    } catch {
      setShareError('공유 중 오류가 발생했어요.');
    }
  };

  const hasMyStats =
    bestScore != null ||
    minScore != null ||
    avgScore != null ||
    meData?.alltime_rank != null ||
    percentileTop != null ||
    streakCount > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 pb-24">
      <div className="max-w-md mx-auto">
        <p className="text-toss-sub text-sm mb-2">나의 두뇌 지수</p>
        <h1 className="text-2xl font-bold text-toss-text mb-6">기록 & 순위</h1>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-toss-sub">불러오는 중...</p>
          </div>
        ) : fetchError ? (
          <div className="py-12 text-center">
            <p className="text-red-600 text-sm font-medium mb-4">{fetchError}</p>
            <button
              type="button"
              onClick={loadData}
              className="px-6 py-3 rounded-2xl bg-toss-blue text-white font-semibold hover:opacity-90 transition"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 🎯 Hero - 상위 N% + 전체 등수 */}
            {hasMyStats && (percentileTop != null || meData?.alltime_rank != null) ? (
              <motion.div
                ref={shareCardRef}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-3xl p-8 text-center bg-gradient-to-br from-toss-blue to-blue-600 shadow-xl"
              >
                <p className="text-5xl md:text-6xl font-black text-white">
                  상위 {meData?.best_level === 20 ? '0.1' : percentileTop ?? '-'}%
                </p>
                {meData?.alltime_rank != null && (
                  <p className="mt-2 text-white/95 font-semibold text-lg">전체 #{meData.alltime_rank}등</p>
                )}
                <p className="mt-1 text-white/90 text-sm">
                  {(bestScore ?? 0).toLocaleString()}점 {meData?.best_level != null && `· ${meData.best_level}단계`}
                </p>
                {streakCount > 0 && <p className="text-white/90 text-sm mt-0.5">🔥 {streakCount}일 연속</p>}
                {/* Share */}
                <div className="flex justify-center gap-6 mt-6">
                  <button type="button" onClick={handleShareKakao} className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100">
                    <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-lg font-bold text-[#191919] shadow">K</span>
                    <span className="text-xs font-medium text-white">카카오</span>
                  </button>
                  <button type="button" onClick={handleShareX} className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100">
                    <span className="w-12 h-12 rounded-full bg-black/80 flex items-center justify-center text-white shadow">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </span>
                    <span className="text-xs font-medium text-white">X</span>
                  </button>
                  <button type="button" onClick={handleShareInstagram} className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100">
                    <span className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07z" /></svg>
                    </span>
                    <span className="text-xs font-medium text-white">인스타</span>
                  </button>
                </div>
                {shareError && <p className="text-red-200 text-xs mt-2">{shareError}</p>}
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-3xl p-8 text-center bg-gradient-to-br from-slate-100 to-slate-50 border-2 border-dashed border-slate-200"
              >
                <p className="text-5xl mb-2">🏆</p>
                <p className="text-xl font-bold text-toss-text mb-1">아직 기록이 없어요</p>
                <p className="text-toss-sub text-sm">첫 도전을 해보세요!</p>
              </motion.div>
            )}

            {/* 📊 내 점수 - 4가지 한눈에 */}
            {hasMyStats && (
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100"
              >
                <p className="text-slate-500 text-xs mb-3 font-medium">내 점수</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: '최고', value: bestScore, accent: true },
                    { label: '최저', value: minScore, accent: false },
                    { label: '평균', value: avgScore, accent: false },
                    { label: '최신', value: meData?.latest_score ?? null, accent: false },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="text-center">
                      <p className="text-slate-400 text-[10px] mb-0.5">{label}</p>
                      <p className={`text-lg font-bold ${accent ? 'text-toss-blue' : 'text-toss-text'}`}>
                        {value != null ? value.toLocaleString() : '-'}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 🔥 스트릭 & 기타 */}
            {streakCount > 0 && (
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4"
              >
                <span className="text-amber-700 font-semibold">🔥 {streakCount}일 연속</span>
                <span className="text-amber-600 text-sm">{canExtend ? '오늘 유지해요!' : '수고했어요!'}</span>
              </motion.div>
            )}

            {(meData?.best_rank != null || meData?.best_level != null) && (
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex gap-3"
              >
                {meData?.best_rank != null && (
                  <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 text-center">
                    <p className="text-slate-500 text-xs mb-0.5">이번 달</p>
                    <p className="text-xl font-bold text-toss-text">#{meData.best_rank}등</p>
                  </div>
                )}
                {meData?.best_level != null && (
                  <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 text-center">
                    <p className="text-slate-500 text-xs mb-0.5">최고 단계</p>
                    <p className="text-xl font-bold text-toss-text">{meData.best_level}/20</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* 🏆 이번 달 순위 - Top5 + 나 강조 */}
            <div>
              <p className="text-slate-600 font-semibold mb-3">이번 달 순위 🏆</p>
              {entries.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">아직 순위가 없어요. 첫 도전을 해보세요!</p>
              ) : (
                <div className="space-y-2">
                  {entries.slice(0, 10).map((e) => {
                    const isMe = myUserHash != null && e.user_hash === myUserHash.slice(0, 8) + '...';
                    return (
                      <motion.div
                        key={e.rank}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: e.rank * 0.02 }}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl ${
                          isMe
                            ? 'bg-toss-blue/10 border-2 border-toss-blue shadow-md'
                            : e.rank <= 3
                              ? 'bg-amber-50 border border-amber-100'
                              : 'bg-white border border-slate-100 shadow-sm'
                        }`}
                      >
                        <span className={`font-bold w-8 ${
                          isMe ? 'text-toss-blue text-lg' : e.rank <= 3 ? 'text-amber-600 text-lg' : 'text-slate-600'
                        }`}>
                          #{e.rank}
                        </span>
                        <span className={`font-medium flex-1 ${isMe ? 'text-toss-blue font-bold' : 'text-slate-700'}`}>
                          {e.score.toLocaleString()}점 {isMe && <span className="text-toss-blue text-xs ml-1">(나)</span>}
                        </span>
                        <span className={`text-sm ${isMe ? 'text-toss-blue/80' : 'text-slate-400'}`}>Lv.{e.max_level}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-2">
              <motion.button
                onClick={() => {
                  endRun();
                  useGameStore.getState().startRun();
                  navigate('/run');
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 rounded-2xl bg-toss-blue text-white font-bold text-lg shadow-lg shadow-toss-blue/30"
              >
                {canExtend && streakCount > 0 ? '🔥 스트릭 지키기' : '나도 순위 올리기!'}
              </motion.button>
              <button onClick={() => navigate('/')} className="w-full py-3 rounded-2xl text-toss-sub font-medium">
                홈으로
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
