/* frontend/src/pages/ProblemList.jsx */
import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { 
  Search, Filter, CheckCircle, ChevronRight, Hash, Bookmark 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COLLECTIONS = ["Blind 75", "Neetcode 150", "Striver SDE Sheet", "Top 100 Liked"];
const TOP_CATEGORIES = [
  'All', 'Dynamic Programming', 'Tree', 'Graph', 'Linked List', 
  'String', 'Array', 'Hash Table', 'Sorting', 'Binary Search', 
  'Math', 'Greedy', 'Two Pointers', 'Recursion', 'Backtracking'
];

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [totalProblems, setTotalProblems] = useState(0);
  const observer = useRef();
  const isFetchingRef = useRef(false);
  const sentinelRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    // Reset when filters change
    setProblems([]);
    setPage(1);
    setHasMore(true);
  }, [selectedDifficulty, selectedCollections, selectedCategory]);

  useEffect(() => {
    fetchProblems(page);
  }, [page, selectedDifficulty, selectedCollections, selectedCategory]);

  const fetchProblems = async (pageNum) => {
    if (isFetchingRef.current) return;
    
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }
    isFetchingRef.current = true;

    try {
      const query = new URLSearchParams();
      if (selectedDifficulty !== "All") query.append("difficulty", selectedDifficulty);
      if (selectedCategory !== "All") query.append("concept", selectedCategory);
      selectedCollections.forEach(c => query.append("collections", c));
      query.append("page", pageNum);
      query.append("limit", 50);
      
      const res = await api.get(`/problems?${query.toString()}`);
      const newProblems = res.data.problems || [];
      
      setProblems(prev => pageNum === 1 ? newProblems : [...prev, ...newProblems]);
      setTotalProblems(res.data.pagination?.total || 0);
      setHasMore(newProblems.length > 0 && pageNum < (res.data.pagination?.pages || 1));
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
      isFetchingRef.current = false;
    }
  };

  const toggleCollection = (col) => {
    setSelectedCollections(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const filteredProblems = useMemo(() => {
    return problems.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(p.problemNumber).includes(searchTerm)
    );
  }, [problems, searchTerm]);

  useEffect(() => {
    if (loading || !hasMore || isFetchingMore) return;

    const observerInstance = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingRef.current) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 0.1, rootMargin: '100px' });

    if (sentinelRef.current) {
      observerInstance.observe(sentinelRef.current);
    }

    return () => {
      if (observerInstance) observerInstance.disconnect();
    };
  }, [loading, hasMore, isFetchingMore, filteredProblems.length]);

  return (
    <Layout>
      <section className="section-padding py-12">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tighter text-white">Problem Library</h1>
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">
              {loading ? "Discovering Challenges..." : `Browse ${totalProblems} Curated Problems`}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {COLLECTIONS.map(col => (
              <button
                key={col}
                onClick={() => toggleCollection(col)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  selectedCollections.includes(col) 
                  ? 'bg-accent-green text-black border-accent-green' 
                  : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Filter */}
        <div className="mb-8">
          <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar scroll-smooth">
            {TOP_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-xl text-xs font-black transition-all border ${
                  selectedCategory === cat
                    ? 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30'
                    : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10 hover:text-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Difficulty Toggle */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-accent-green" />
            <input 
              type="text"
              placeholder="Search by ID or Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-accent-green/30"
            />
          </div>
          <div className="flex gap-2 bg-gray-900/40 p-1.5 rounded-2xl border border-white/5">
            {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-5 py-2 text-xs font-black rounded-xl transition-all ${
                  selectedDifficulty === diff 
                  ? 'bg-white/10 text-white shadow-lg' 
                  : 'text-gray-500 hover:text-white'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Problem List */}
        <div className="grid grid-cols-1 gap-3">
          {loading ? (
            <div className="py-20 text-center font-mono opacity-20 animate-pulse tracking-widest uppercase">SYNCING DATABANK...</div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredProblems.map((prob, idx) => (
                <motion.div 
                  key={prob._id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.01 }}
                >
                  <Card 
                    onClick={() => navigate(`/problem/${prob._id}`)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 cursor-pointer hover:bg-white/[0.03] border-white/5 transition-all active:scale-[0.99] relative overflow-hidden"
                  >
                    <div className="flex items-center gap-6 z-10">
                      <div className="font-mono text-accent-green/60 text-xs w-10 text-center bg-white/5 py-1 rounded">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-100 group-hover:text-accent-green transition-colors">
                          <span className="text-gray-600 mr-2 text-sm font-mono opacity-50">#{prob.problemNumber}</span>
                          {prob.title}
                        </h3>
                        <div className="flex gap-3 mt-1.5">
                          {prob.collections?.map(c => (
                            <span key={c} className="text-[10px] text-accent-cyan font-black uppercase tracking-tighter">{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-4 sm:mt-0 z-10">
                      <Badge className="font-black" color={prob.difficulty.toLowerCase() === 'easy' ? 'green' : prob.difficulty.toLowerCase() === 'medium' ? 'orange' : 'red'}>
                        {prob.difficulty}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-gray-700 group-hover:text-white transition-all group-hover:translate-x-1" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Sentinel for Infinite Scroll */}
        {hasMore && !loading && (
          <div 
            id="scroll-sentinel"
            className="py-12 flex justify-center"
            ref={sentinelRef}
          >
            {isFetchingMore && (
              <div className="flex flex-col items-center gap-2">
                <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-full w-full bg-accent-green"
                  />
                </div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Loading Next Batch</span>
              </div>
            )}
          </div>
        )}

        {!hasMore && problems.length > 0 && !loading && (
          <div className="py-12 text-center text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">
            You have reached the end of the library
          </div>
        )}
      </section>
    </Layout>
  );
}
