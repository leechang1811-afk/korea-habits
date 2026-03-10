import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ensureUserHash, useGameStore } from '../store/gameStore';
import { API_BASE } from '../services/api';
import { getStreakState } from '../services/streak';

export default function MyStats() {
  const navigate = useNavigate();
  const endRun = useGameStore((s) => s.endRun);
  const [data, setData] = useState<{
    best_score: number;
    best_level: number;
    best_rank: number | null;
    latest_score: number | null;
    latest_rank: number | null;
    avg_score: number | null;
    min_score: number | null;
    percentile_top: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [streakState, setStreakState] = useState(() => getStreakState());

  useEffect(() => {
    ensureUserHash()
      .then((hash) =>
        fetch(`${API_BASE}/me/summary?user_hash=${encodeURIComponent(hash)}`)
      )
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setStreakState(getStreakState());
  }, []);

  const { count: streakCount, playedToday, canExtend } = streakState;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-toss-text mb-6">내 기록</h1>
        {loading ? (
          <p className="text-toss-sub">불러오는 중...</p>
        ) : (
          <div className="space-y-4">
            {streakCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-amber-50 border border-amber-200"
              >
                <p className="text-amber-700 text-sm font-medium">🔥 연속 도전</p>
                <p className="text-xl font-bold text-amber-700">{streakCount}일</p>
                {(canExtend || !playedToday) && streakCount > 0 && (
                  <p className="text-amber-600 text-xs mt-1">
                    {canExtend ? '오늘 도전하면 유지돼요!' : '오늘도 수고했어요!'}
                  </p>
                )}
              </motion.div>
            )}
            {data ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-toss-bg border border-toss-border">
                    <p className="text-toss-sub text-sm">평균</p>
                    <p className="text-xl font-bold text-toss-text">
                      {data.avg_score != null ? data.avg_score.toLocaleString() : '-'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-toss-bg border border-toss-blue">
                    <p className="text-toss-sub text-sm">최고</p>
                    <p className="text-xl font-bold text-toss-blue">{data.best_score?.toLocaleString() ?? 0}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-toss-bg border border-toss-border">
                    <p className="text-toss-sub text-sm">최저</p>
                    <p className="text-xl font-bold text-toss-text">
                      {data.min_score != null ? data.min_score.toLocaleString() : '-'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-toss-bg border border-toss-border">
                    <p className="text-toss-sub text-sm">최신 기록</p>
                    <p className="text-xl font-bold text-toss-text">
                      {data.latest_score != null ? data.latest_score.toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-toss-bg border border-toss-border">
                  <p className="text-toss-sub text-sm">이번 달 순위 (최고 기준)</p>
                  <p className="text-xl font-bold text-toss-text">
                    {data.best_rank != null ? `전체 #${data.best_rank}등` : '-'}
                  </p>
                </div>
                {data.latest_rank != null && (
                  <div className="p-4 rounded-2xl bg-toss-bg border border-toss-border">
                    <p className="text-toss-sub text-sm">최신 점수 등수</p>
                    <p className="text-xl font-bold text-toss-text">전체 #{data.latest_rank}등</p>
                  </div>
                )}
                {data.percentile_top != null && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <p className="text-toss-sub text-sm">전체 대비 상위</p>
                    <p className="text-xl font-bold text-amber-700">상위 {data.percentile_top}%</p>
                  </div>
                )}
                <div className="p-4 rounded-2xl bg-toss-bg border border-toss-border">
                  <p className="text-toss-sub text-sm">최고 단계</p>
                  <p className="text-xl font-bold text-toss-text">{data.best_level ?? 0} / 20</p>
                </div>
              </>
            ) : (
              <p className="text-toss-sub">기록이 없습니다. 게임을 플레이해 보세요!</p>
            )}
          </div>
        )}
        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="mt-6 w-full py-3 rounded-2xl border border-toss-border text-toss-sub"
        >
          홈으로
        </motion.button>
        <motion.button
          onClick={() => {
            endRun();
            useGameStore.getState().startRun();
            navigate('/run');
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="mt-3 w-full py-3.5 rounded-2xl bg-toss-blue text-white font-semibold"
        >
          {canExtend && streakCount > 0 ? '🔥 스트릭 지키러 가기' : '한 번 더 도전!'}
        </motion.button>
      </div>
    </div>
  );
}
