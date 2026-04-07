import api from "./api";

// ── Exam API helpers ────────────────────────────────────────────────────────
export const examAPI = {
  // Teacher/Admin
  list:           (params)       => api.get("/exams", { params }),
  create:         (data)         => api.post("/exams", data),
  get:            (id)           => api.get(`/exams/${id}`),
  update:         (id, data)     => api.put(`/exams/${id}`, data),
  remove:         (id)           => api.delete(`/exams/${id}`),
  publish:        (id, status)   => api.put(`/exams/${id}/publish`, { status }),
  getResults:     (id)           => api.get(`/exams/${id}/results`),
  getStudentResult: (id, sid)    => api.get(`/exams/${id}/results/${sid}`),
  exportPDF:      (id)           => api.get(`/exams/${id}/export/pdf`, { responseType: "blob" }),

  // Student
  available:      ()             => api.get("/exams/available"),
  startAttempt:   (id)           => api.post(`/exams/${id}/attempt/start`),
  getMyAttempt:   (id)           => api.get(`/exams/${id}/attempt/me`),
  logEvent:       (id, event)    => api.post(`/exams/${id}/attempt/event`, { event }),
  submit:         (id, data)     => api.post(`/exams/${id}/attempt/submit`, data),

  // All
  leaderboard:    (id, limit)    => api.get(`/exams/${id}/leaderboard`, { params: { limit } })
};

// ── Roster API helpers ──────────────────────────────────────────────────────
export const rosterAPI = {
  list:   ()         => api.get("/roster"),
  create: (data)     => api.post("/roster", data),
  get:    (id)       => api.get(`/roster/${id}`),
  update: (id, data) => api.put(`/roster/${id}`, data),
  remove: (id)       => api.delete(`/roster/${id}`),
  link:   (id)       => api.post(`/roster/${id}/link`)
};

export default api;
