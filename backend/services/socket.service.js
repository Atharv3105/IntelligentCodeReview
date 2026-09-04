let io;

const jwt = require("jsonwebtoken");

exports.initialize = (serverIO) => {
  io = serverIO;

  // middleware to authenticate incoming socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("joinSubmission", (submissionId) => {
      socket.join(submissionId);
    });
    socket.on("interview.join", (sessionId) => {
      socket.join(`interview:${sessionId}`);
    });
  });
};

// Interview events are intentionally emitted by the server after it has
// persisted the underlying state. The browser only renders these events; it
// never becomes the authority for an interview session.
exports.emitInterviewEvent = (sessionId, event, data = {}) => {
  if (io) io.to(`interview:${sessionId}`).emit(event, { sessionId, ...data, timestamp: new Date().toISOString() });
};

exports.emitSubmissionUpdate = (id, data) => {
  if (io) io.to(id.toString()).emit("submissionUpdate", data);
};

exports.emitGlobalWin = (data) => {
  if (io) io.emit("liveWin", data);
};
