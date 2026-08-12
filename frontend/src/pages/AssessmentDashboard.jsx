import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export default function AssessmentDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/assessments/active")
      .then((res) => setAssessments(res.data.assessments || res.data || []))
      .catch((err) => console.error("Failed to fetch assessments:", err))
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
    return <div className="py-20 text-center text-xs text-slate-400">Loading scheduled assessments...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Assessment Center</h1>
        <p className="text-xs text-slate-500 mt-1">View and participate in scheduled exams and timed assessments.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assessments.length > 0 ? (
          assessments.map((test) => {
            const status = getStatus(test.startTime, test.endTime);
            return (
              <Card key={test.id} className="p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={status === "active" ? "success" : status === "upcoming" ? "warning" : "neutral"}>
                      {status.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-400">#{test.id.slice(-6)}</span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">{test.title}</h2>
                  <p className="text-xs text-slate-500 line-clamp-2">{test.description}</p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Ends: {new Date(test.endTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{test.duration} Minutes • {test.type} Format</span>
                    </div>
                  </div>
                </div>

                <div>
                  {test.myAttempt ? (
                    <Button disabled variant="outline" className="w-full text-xs">
                      {test.myAttempt.status === "submitted" && test.myAttempt.grade > 0
                        ? `GRADED: ${test.myAttempt.grade}%`
                        : "SUBMITTED / PENDING REVIEW"}
                    </Button>
                  ) : status === "active" ? (
                    <Link to={`/assessment/${test.id}`} className="block w-full">
                      <Button variant="primary" className="w-full">
                        ENTER TEST ROOM
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled variant="ghost" className="w-full text-xs">
                      {status === "upcoming" ? "AWAITING START TIME" : "TEST EXPIRED"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full p-12 text-center text-xs text-slate-400">
            No active or scheduled assessments found.
          </Card>
        )}
      </div>
    </div>
  );
}
