const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const protect = require("../middleware/auth.middleware");
const { asyncHandler } = require("../middleware/error.middleware");

router.get("/", protect, asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
  res.json({ success: true, notifications, unreadCount });
}));

router.put("/:id/read", protect, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { isRead: true } });
  res.json({ success: true });
}));

router.put("/read-all", protect, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ success: true });
}));

module.exports = router;
