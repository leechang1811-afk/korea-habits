import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ensureUserHash, useGameStore } from '../store/gameStore';
import { API_BASE } from '../services/api';

interface LeaderboardEntry {
  rank: number;
  score: number;
  max_level: number;
  user_hash: string;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const endRun = useGameStore((s) => s.endRun);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [meData, setMeData] = useState<{
    alltime_best_score?: number | null;
    alltime_min_score?: number | null;
    alltime_avg_score?: number | null;
    alltime_rank?: number | null;
    alltime_percentile_top?: number | null;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/leaderboard?scope=monthly`).then((res) => (res.ok ? res.json() : { entries: [] })),
      ensureUserHash().then((hash) =>
        fetch(`${API_BASE}/me/summary?user_hash=${encodeURIComponent(hash)}`).then((r) => (r.ok ? r.json() : null))
      ),
    ])
      .then(([lbData, summary]) => {
        setEntries(lbData.entries ?? []);
        setMeData(summary);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const hasMyStats =
    meData?.alltime_best_score != null ||
    meData?.alltime_min_score != null ||
    meData?.alltime_avg_score != null ||
    meData?.alltime_rank != null ||
    meData?.alltime_percentile_top != null;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-toss-text mb-2">리더보드</h1>
        <p className="text-toss-sub text-sm mb-6">
          이번 달 순위 · 1등을 이겨보세요! 🏆
        </p>
        {hasMyStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 space-y-4"
          >
            <div className="p-4 rounded-2xl bg-toss-bg border border-toss-border">
              <p className="text-toss-sub text-sm font-medium mb-3">내 점수</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-toss-sub text-xs mb-0.5">최고</p>
                  <p className="text-lg font-bold text-toss-blue">
                    {meData?.alltime_best_score != null ? meData.alltime_best_score.toLocaleString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-toss-sub text-xs mb-0.5">최저</p>
                  <p className="text-lg font-bold text-toss-text">
                    {meData?.alltime_min_score != null ? meData.alltime_min_score.toLocaleString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-toss-sub text-xs mb-0.5">평균</p>
                  <p className="text-lg font-bold text-toss-text">
                    {meData?.alltime_avg_score != null ? meData.alltime_avg_score.toLocaleString() : '-'}
                  </p>
                </div>
              </div>
            </div>
            {(meData?.alltime_rank != null || meData?.alltime_percentile_top != null) && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
                <p className="text-toss-sub text-sm font-medium mb-2">전체 데이터 대비</p>
                <div className="flex flex-wrap gap-4">
                  {meData?.alltime_percentile_top != null && (
                    <span className="text-amber-700 font-bold">상위 {meData.alltime_percentile_top}%</span>
                  )}
                  {meData?.alltime_rank != null && (
                    <span className="text-amber-700 font-bold">전체 #{meData.alltime_rank}등</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
        {loading ? (
          <p className="text-toss-sub">불러오는 중...</p>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <motion.div
                key={e.rank}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: e.rank * 0.03 }}
                className={`flex items-center justify-between p-4 rounded-2xl border ${
                  e.rank <= 3 ? 'bg-amber-50 border-amber-200' : 'bg-toss-bg border-toss-border'
                }`}
              >
                <span className={`font-bold ${e.rank <= 3 ? 'text-amber-600' : 'text-toss-text'}`}>
                  #{e.rank}
                </span>
                <span className="text-toss-sub">{e.score.toLocaleString()}점</span>
                <span className="text-toss-sub text-sm">Lv.{e.max_level}</span>
              </motion.div>
            ))}
          </div>
        )}
        <motion.button
          onClick={() => {
            endRun();
            useGameStore.getState().startRun();
            navigate('/run');
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="mt-6 w-full py-3.5 rounded-2xl bg-toss-blue text-white font-semibold"
        >
          나도 순위 올리기!
        </motion.button>
        <button
          onClick={() => navigate('/')}
          className="mt-3 w-full py-3 rounded-2xl border border-toss-border text-toss-sub"
        >
          홈으로
        </button>
      </div>
    </div>
  );
}
