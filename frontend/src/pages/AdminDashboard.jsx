import { useEffect, useMemo, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";
import { SocketContext } from "../context/SocketContext";
import { 
  Users, Activity, TrendingUp, Monitor, Flame, 
  BarChart, Download, X, Eye, Clock, CheckCircle, AlertTriangle, Filter, Trophy
} from "lucide-react";

const statGradientMap = {
  cyan: "from-cyan-500 to-cyan-300",
  green: "from-green-500 to-green-300",
  purple: "from-purple-500 to-purple-300",
  orange: "from-orange-500 to-orange-300"
};

export default function AdminDashboard() {
  const socketContext = useContext(SocketContext);
  const socketResults = socketContext?.results || [];
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [heatmapFilter, setHeatmapFilter] = useState("total"); // 'total', 'easy', 'medium', 'hard'

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = () => {
    api.get("/analytics/admin")
      .then((res) => setData(res.data))
      .catch(err => console.error("Admin Analytics Fetch Error:", err))
      .finally(() => setLoading(false));
  };

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      { title: "Total Submissions", value: data.totalSubmissions || 0, tone: "cyan", icon: <Activity className="h-4 w-4" /> },
      { title: "Average Grade", value: (data.avgGrade || 0).toFixed(1), tone: "green", icon: <TrendingUp className="h-4 w-4" /> },
      { title: "Success Rate", value: `${(data.successRate || 0).toFixed(0)}%`, tone: "purple", icon: <Monitor className="h-4 w-4" /> },
      { title: "Active Students", value: data.activeUsers || 0, tone: "orange", icon: <Users className="h-4 w-4" /> }
    ];
  }, [data]);

  const heatmapData = useMemo(() => {
    if (!data || !data.heatmap) return [];
    const today = new Date();
    const result = [];
    const maxVal = data.maxActivity[heatmapFilter] || 1;

    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = data.heatmap[dateStr] || { total: 0, easy: 0, medium: 0, hard: 0 };
      const val = entry[heatmapFilter];
      
      let opacity = 0;
      if (val > 0) {
        opacity = Math.max(0.15, val / maxVal);
      }
      result.push({ date: dateStr, count: val, opacity });
    }
    return result;
  }, [data, heatmapFilter]);

  const handleStudentClick = async (studentId) => {
    setDetailLoading(true);
    setSelectedStudent(studentId);
    try {
      const res = await api.get(`/analytics/student/${studentId}`);
      setStudentDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data?.topStreaks) return;
    const headers = ["Rank,Name,Email,Streak\n"];
    const rows = data.topStreaks.map((u, i) => `${i + 1},${u.name},${u.email},${u.streakCount}`);
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `class_leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  const getHeatmapColor = () => {
    switch(heatmapFilter) {
      case 'easy': return 'rgba(74, 222, 128'; // Green
      case 'medium': return 'rgba(250, 204, 21'; // Yellow
      case 'hard': return 'rgba(248, 113, 113'; // Red
      default: return 'rgba(74, 222, 128'; // Total Green
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center text-gray-400 font-mono">INITIALIZING TEACHER HUB...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-hero mb-2 text-3xl font-black">Admin Command Center</h1>
          </div>
          <div className="flex gap-2 rounded-xl bg-gray-900/60 p-1.5 shadow-inner backdrop-blur-md">
            {["overview", "leaderboard"].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-6 py-2 text-sm transition-all duration-300 ${activeTab === tab ? 'bg-accent-green text-gray-950 font-black shadow-lg shadow-accent-green/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            {activeTab === "overview" ? (
              <>
                {/* Stats Grid */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {stats.map((stat, idx) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                      <Card className="p-5 border-white/5 bg-gray-900/40">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{stat.title}</span>
                          <div className={`text-${stat.tone}-400 opacity-60`}>{stat.icon}</div>
                        </div>
                        <p className="text-4xl font-black text-white">{stat.value}</p>
                        <div className="mt-4 h-1 rounded-full bg-white/5">
                          <motion.div 
                            className={`h-full rounded-full bg-gradient-to-r ${statGradientMap[stat.tone]}`} 
                            initial={{ width: 0 }} 
                            animate={{ width: '100%' }} 
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Heatmap */}
                <Card className="p-6 border-white/5 bg-gray-900/40 relative overflow-hidden">
                  <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-accent-green" /> 
                      </div>
                      <div>
                        <h2 className="font-bold text-lg">Practice Intensity Heatmap</h2>
                        <p className="text-xs text-gray-500 font-mono italic">Collective platform activity</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg bg-black/40 p-1 border border-white/5">
                        {['total', 'easy', 'medium', 'hard'].map(f => (
                          <button
                            key={f}
                            onClick={() => setHeatmapFilter(f)}
                            className={`px-3 py-1 rounded-md text-[10px] uppercase font-black transition-all ${heatmapFilter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                            {f}
                          </button>
                        ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 md:gap-[4px] min-h-[140px]">
                    {heatmapData.map((day, i) => (
                      <div
                        key={i}
                        title={`${day.date}: ${day.count} ${heatmapFilter} solves`}
                        style={{ 
                          backgroundColor: day.count > 0 ? `${getHeatmapColor()}, ${day.opacity})` : 'rgba(255, 255, 255, 0.03)'
                        }}
                        className={`h-3 w-3 rounded-sm transition-all hover:scale-150 relative z-10 cursor-crosshair ${day.count > 0 ? 'shadow-[0_0_10px_rgba(74,222,128,0.05)]' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="mt-8 flex items-center justify-between text-[10px] text-gray-500 uppercase font-black tracking-widest">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-white/5" /> Silent</div>
                      <div className="flex items-center gap-2"><div className={`h-2 w-2 rounded-full shadow-lg ${heatmapFilter === 'hard' ? 'bg-red-500' : heatmapFilter === 'medium' ? 'bg-yellow-500' : 'bg-accent-green'}`} /> Active</div>
                    </div>
                    <span>365 Day Context</span>
                  </div>
                </Card>
              </>
            ) : (
              /* Leaderboard with CSV Export */
              <Card className="overflow-hidden border-white/5 bg-gray-900/40">
                <div className="flex items-center justify-between bg-gray-800/20 p-6 border-b border-white/5">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                       <Trophy className="h-5 w-5 text-yellow-500" /> Leaderboard Ranking
                    </h2>
                    <p className="text-xs text-gray-500">Live student success streak ranking</p>
                  </div>
                  <button 
                  onClick={exportCSV}
                  className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-black text-gray-300 hover:bg-white/10 transition-all border border-white/10 active:scale-95"
                  >
                    <Download className="h-3 w-3" /> Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-white/5 uppercase tracking-widest text-[9px] text-gray-500 font-black">
                      <tr>
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4">Student Identity</th>
                        <th className="px-6 py-4">Success Streak</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.topStreaks.map((user, idx) => (
                        <tr key={user._id} className="hover:bg-white/[0.02] transition-all group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${idx === 0 ? 'bg-yellow-500 text-black shadow-xl shadow-yellow-500/20' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/5 text-gray-500'}`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-200">{user.name}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Flame className={`h-5 w-5 ${user.streakCount > 0 ? 'text-orange-500 fill-orange-500/10' : 'text-gray-800'}`} />
                              <span className={`font-black text-2xl ${user.streakCount > 0 ? 'text-orange-500' : 'text-gray-700'}`}>{user.streakCount}</span>
                              <span className="text-[10px] text-gray-500 uppercase font-black">Success Days</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                             onClick={() => handleStudentClick(user._id)}
                             className="p-3 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-accent-green hover:text-black shadow-xl"
                             >
                                <Eye className="h-4 w-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
             {/* Live Ticker */}
             <Card className="p-6 border-white/5 bg-gray-900/60 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent-green opacity-50" />
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black uppercase tracking-[0.2em] text-[10px] text-accent-green">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" /> Live Wins
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                   {socketResults.filter(r => r.status === 'success' || r.grade >= 70).slice(0, 8).map((res, i) => (
                      <motion.div 
                      key={i} 
                      initial={{ x: 30, opacity: 0 }} 
                      animate={{ x: 0, opacity: 1 }}
                      className="border-b border-white/5 pb-4 last:border-0"
                      >
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black text-accent-green uppercase border border-accent-green/30 px-1.5 rounded">Success</span>
                            <span className="text-[9px] font-mono text-gray-600">JUST NOW</span>
                         </div>
                         <div className="text-sm font-black text-white truncate">Problem #{res.problemNumber || '?'}</div>
                         <div className="text-[10px] text-gray-500 mt-0.5">Performance Score: <span className="text-accent-green font-black">{res.grade}%</span></div>
                      </motion.div>
                   ))}
                   {socketResults.length === 0 && (
                      <div className="text-center py-20">
                         <Clock className="h-8 w-8 text-gray-800 mx-auto mb-2" />
                         <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Awaiting Wins</p>
                      </div>
                   )}
                </div>
             </Card>

             {/* Distribution */}
             <Card className="p-5 border-white/5 bg-black/20">
                <h3 className="text-[10px] font-black uppercase text-gray-500 mb-6 tracking-[0.3em] flex items-center gap-2">
                   <Filter className="h-3 w-3" /> Difficulty Pulse
                </h3>
                <div className="space-y-4">
                    {['easy', 'medium', 'hard'].map(diff => (
                       <div key={diff}>
                          <div className="flex justify-between text-[11px] mb-1.5 uppercase font-black">
                            <span className="text-gray-500">{diff}</span>
                            <span className="text-white font-mono">{data.problemStats?.[diff] || 0}</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min(((data.problemStats?.[diff] || 0) / (data.totalSubmissions || 1)) * 100, 100)}%` }}
                               className={`h-full ${diff === 'easy' ? 'bg-accent-green' : diff === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`}
                             />
                          </div>
                       </div>
                    ))}
                </div>
             </Card>
          </div>
        </div>
      </section>

      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
             <motion.div 
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: 50, opacity: 0 }}
             className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-gray-950 border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden"
             >
                {/* Modal Background Decor */}
                <div className="absolute -top-24 -left-24 h-64 w-64 bg-accent-green/5 blur-[100px] rounded-full" />
                
                <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-start z-10">
                   {detailLoading ? (
                     <div className="h-20 w-64 bg-white/5 animate-pulse rounded-xl" />
                   ) : studentDetails && (
                      <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                           <Users className="h-10 w-10 text-accent-green opacity-40" />
                        </div>
                        <div>
                          <h2 className="text-4xl font-black text-white tracking-tighter">{studentDetails.student.name}</h2>
                          <p className="text-gray-500 font-mono text-sm tracking-widest">{studentDetails.student.email}</p>
                          <div className="flex gap-4 mt-3">
                             <div className="flex items-center gap-1.5 text-xs font-black text-orange-500 uppercase"><Flame className="h-3.5 w-3.5" /> {studentDetails.student.streakCount} Day Streak</div>
                             <div className="flex items-center gap-1.5 text-xs font-black text-accent-green uppercase"><CheckCircle className="h-3.5 w-3.5" /> {studentDetails.student.solvedProblems.length} Successful Solves</div>
                          </div>
                        </div>
                      </div>
                   )}
                   <button 
                   onClick={() => { setSelectedStudent(null); setStudentDetails(null); }}
                   className="p-3 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-all border border-white/5"
                   >
                     <X className="h-5 w-5" />
                   </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 z-10">
                   {detailLoading ? (
                     <div className="space-y-4">
                        {[1,2,3,4].map(i => <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded-xl" />)}
                     </div>
                   ) : studentDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div>
                        <h3 className="text-xs font-black uppercase text-gray-500 tracking-[0.3em] mb-6 flex items-center gap-2"><Trophy className="h-3 w-3" /> Mastery Inventory</h3>
                        <div className="grid grid-cols-1 gap-3">
                           {studentDetails.student.solvedProblems.length > 0 ? studentDetails.student.solvedProblems.map(p => (
                             <div key={p._id} className="flex justify-between items-center bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:bg-white/[0.05] transition-all group">
                               <div className="flex items-center gap-3">
                                  <span className="font-mono text-[10px] text-gray-600">#{p.problemNumber}</span>
                                  <span className="font-bold text-gray-200">{p.title}</span>
                               </div>
                               <Badge className="font-black text-[9px] opacity-70 group-hover:opacity-100" color={p.difficulty.toLowerCase() === 'easy' ? 'green' : p.difficulty.toLowerCase() === 'medium' ? 'orange' : 'red'}>
                                 {p.difficulty}
                               </Badge>
                             </div>
                           )) : (
                             <div className="text-center py-12 text-gray-700 italic border border-dashed border-white/5 rounded-2xl">No solved problems recorded.</div>
                           )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-black uppercase text-gray-500 tracking-[0.3em] mb-6 flex items-center gap-2"><Clock className="h-3 w-3" /> Recent Activity</h3>
                        <div className="space-y-4">
                           {studentDetails.submissions.length > 0 ? studentDetails.submissions.slice(0, 10).map(s => (
                             <div key={s._id} className="flex items-center gap-5 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center ${s.grade >= 70 ? 'bg-accent-green/10 text-accent-green shadow-[0_0_15px_rgba(74,222,128,0.1)]' : 'bg-red-500/10 text-red-500'}`}>
                                   {s.grade >= 70 ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="text-sm font-black text-white truncate">#{s.problemId?.problemNumber} {s.problemId?.title}</div>
                                   <div className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-tighter">{new Date(s.createdAt).toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                   <div className={`text-xl font-black ${s.grade >= 70 ? 'text-accent-green' : 'text-red-500'}`}>{s.grade}%</div>
                                   <div className="text-[9px] text-gray-600 uppercase font-black">Score</div>
                                </div>
                             </div>
                           )) : (
                             <div className="text-center py-12 text-gray-700 italic border border-dashed border-white/5 rounded-2xl">No submissions found.</div>
                           )}
                        </div>
                      </div>
                    </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </Layout>
  );
}
