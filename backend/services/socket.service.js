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
  });
};

exports.emitSubmissionUpdate = (id, data) => {
  if (io) io.to(id.toString()).emit("submissionUpdate", data);
};