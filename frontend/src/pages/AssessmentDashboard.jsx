import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Clock, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AssessmentDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/assessments/active")
      .then(res => setAssessments(res.data))
      .catch(err => console.error("Failed to fetch assessments:", err))
      .finally(() => setLoading(false));
  }, []);

  const getStatus = (start, end) => {
    const now = new Date();
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (now < startTime) return "upcoming";
    if (now > endTime) return "expired";
    return "active";
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center font-mono text-gray-500">
          LOADING ASSESSMENTS...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding">
        <div className="mb-12">
          <h1 className="text-hero mb-2 text-3xl font-black">Assessment Center</h1>
          <p className="text-gray-500">View and participate in scheduled tests.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assessments.length > 0 ? assessments.map((test, idx) => {
            const status = getStatus(test.startTime, test.endTime);
            return (
              <motion.div
                key={test._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`overflow-hidden border-white/5 bg-gray-900/40 p-0 ${status === 'active' ? 'ring-1 ring-accent-green/30' : ''}`}>
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className={
                          status === 'active' ? 'border-accent-green text-accent-green' : 
                          status === 'upcoming' ? 'border-yellow-500 text-yellow-500' : 'border-gray-600 text-gray-600'
                        }
                      >
                        {status.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-mono text-gray-500">#{test._id.slice(-6)}</span>
                    </div>

                    <h2 className="mb-2 text-xl font-bold text-white">{test.title}</h2>
                    <p className="mb-6 line-clamp-2 text-sm text-gray-500">{test.description}</p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>Ends: {new Date(test.endTime).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <BookOpen className="h-4 w-4" />
                        <span>{test.duration} Minutes • {test.type} Format</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] p-4">
                    {test.myAttempt ? (
                      <div className="flex flex-col gap-2">
                        <Button disabled className="w-full bg-accent-green/20 text-accent-green border border-accent-green/30 font-black uppercase text-[10px]">
                          {test.myAttempt.status === 'Submitted' && test.myAttempt.grade > 0 
                            ? `GRADED: ${test.myAttempt.grade}%` 
                            : 'SUBMITTED / PENDING REVIEW'}
                        </Button>
                      </div>
                    ) : status === 'active' ? (
                      <Link to={`/assessment/${test._id}`}>
                        <Button className="w-full bg-accent-green font-black text-gray-950 hover:bg-green-400">
                          ENTER TEST ROOM
                        </Button>
                      </Link>
                    ) : (
                      <Button disabled className="w-full bg-gray-800 text-gray-500">
                        {status === 'upcoming' ? 'AWAITING START TIME' : 'TEST EXPIRED'}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          }) : (
            <div className="col-span-full rounded-2xl border border-dashed border-white/5 py-20 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-700" />
              <p className="text-gray-500">No active or upcoming assessments found.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
