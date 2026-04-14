import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";
import { Trophy, Star, Zap, Target, Award, Crown, ChevronUp, Clock, BarChart3, Medal } from "lucide-react";

const podiumOrder = [1, 0, 2];

const getTier = (rank) => {
    if (rank <= 3) return { label: "Grandmaster", color: "from-purple-500 to-indigo-600", border: "border-purple-500/50", glow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]", icon: <Crown className="h-4 w-4" /> };
    if (rank <= 10) return { label: "Master", color: "from-amber-400 to-orange-600", border: "border-amber-400/50", glow: "shadow-[0_0_20px_rgba(251,191,36,0.2)]", icon: <Trophy className="h-4 w-4" /> };
    if (rank <= 25) return { label: "Expert", color: "from-blue-400 to-cyan-600", border: "border-blue-400/50", glow: "shadow-[0_0_15px_rgba(56,189,248,0.15)]", icon: <Zap className="h-4 w-4" /> };
    return { label: "Coder", color: "from-slate-400 to-slate-600", border: "border-white/10", glow: "", icon: <Target className="h-4 w-4" /> };
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/leaderboard")
      .then((res) => setLeaders(res.data))
      .finally(() => setLoading(false));
  }, []);

  const topThree = useMemo(() => leaders.slice(0, 3), [leaders]);

  return (
    <Layout>
      <div className="relative min-h-screen bg-gray-950 px-4 py-20 selection:bg-purple-500/30">
        {/* Background Ambient Glows */}
        <div className="pointer-events-none absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />

        <div className="container mx-auto">
            {/* Header Section */}
            <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            >
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/5 px-4 py-1.5 mb-6">
                    <Star className="h-3.5 w-3.5 text-purple-400 animate-pulse fill-purple-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">Global Hall of Fame</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black mb-6 text-white tracking-tighter italic">
                    THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400">LEADERBOARD</span>
                </h1>
                <p className="max-w-2xl mx-auto text-gray-500 font-mono text-sm uppercase tracking-widest leading-relaxed">
                    Battle for supremacy in the code arena. Ranked by total problems conquered and optimized.
                </p>
            </motion.div>

            {/* Podium Section */}
            {topThree.length > 0 && (
            <div className="mb-24 grid grid-cols-1 gap-8 md:grid-cols-3 items-end max-w-6xl mx-auto">
                {podiumOrder.map((orderIndex, visualIndex) => {
                const leader = topThree[orderIndex];
                if (!leader) return null;

                const rank = orderIndex + 1;
                const tier = getTier(rank);

                return (
                    <motion.div
                    key={leader.userId}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: visualIndex * 0.15, ease: "circOut" }}
                    className={`relative group ${rank === 1 ? "md:order-2 md:-translate-y-10" : rank === 2 ? "md:order-1" : "md:order-3"}`}
                    >
                        {/* Rank Ornament */}
                        <div className={`absolute -top-6 left-1/2 -translate-x-1/2 z-20 h-12 w-12 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg border-2 border-white/20 font-black text-white italic`}>
                            {rank}
                        </div>

                        <Card className={`relative overflow-hidden p-8 bg-gray-900/40 border-white/5 backdrop-blur-3xl transition-all duration-500 group-hover:border-purple-500/30 ${rank === 1 ? tier.glow : ""}`}>
                            {/* Accent Bar */}
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${tier.color}`} />
                            
                            <div className="text-center mt-4">
                                <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-white/5 p-1 ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all duration-500 overflow-hidden">
                                     <div className={`h-full w-full rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-4xl font-black text-white italic`}>
                                        {leader.username[0]}
                                     </div>
                                </div>
                                <h3 className="text-2xl font-black text-white truncate mb-1">{leader.username}</h3>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 border border-white/5">
                                    {tier.icon} {tier.label}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-left p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter mb-1">Solved</p>
                                        <p className="text-2xl font-black text-white italic leading-none">{leader.solvedCount || 0}</p>
                                    </div>
                                    <div className="text-left p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter mb-1">Avg Grade</p>
                                        <p className="text-2xl font-black text-purple-400 italic leading-none">{(leader.avgGrade || 0).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                );
                })}
            </div>
            )}

            {/* List Section */}
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-5xl mx-auto"
            >
                <div className="flex items-center justify-between mb-8 px-6">
                    <h2 className="text-xs font-black uppercase text-gray-500 tracking-[0.5em] flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Global Rankings
                    </h2>
                    <span className="text-[10px] font-mono text-gray-600 uppercase italic">Sorted by Problems Conquered</span>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        [1,2,3,4,5].map(i => <div key={i} className="h-20 w-full animate-pulse rounded-3xl bg-white/[0.02]" />)
                    ) : (
                        leaders.slice(3).map((leader, i) => {
                            const rank = i + 4;
                            const tier = getTier(rank);
                            return (
                                <motion.div
                                key={leader.userId || rank}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.05 }}
                                className="group relative"
                                >
                                    <Card className="flex items-center justify-between p-6 bg-gray-900/20 border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-all hover:scale-[1.01] hover:border-white/10">
                                        <div className="flex items-center gap-8">
                                            <div className="w-8 text-center font-black text-gray-700 italic text-xl">#{rank}</div>
                                            <div className="flex items-center gap-5">
                                                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white font-black italic`}>
                                                    {leader.username[0]}
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black text-white">{leader.username}</div>
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-500">{tier.label}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-12">
                                            <div className="text-right">
                                                <div className="text-[9px] font-black text-gray-600 uppercase mb-1">Solved</div>
                                                <div className="text-xl font-black text-white italic">{leader.solvedCount || 0}</div>
                                            </div>
                                            <div className="text-right w-24">
                                                <div className="text-[9px] font-black text-gray-600 uppercase mb-1">Efficiency</div>
                                                <div className="text-xl font-black text-purple-400 italic">{(leader.avgGrade || 0).toFixed(1)}%</div>
                                            </div>
                                            <div className="hidden md:block text-right w-20">
                                                <div className="text-[9px] font-black text-gray-600 uppercase mb-1">Attempts</div>
                                                <div className="text-xl font-black text-gray-400 italic">{leader.totalSubmissions}</div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </div>
      </div>
    </Layout>
  );
}

