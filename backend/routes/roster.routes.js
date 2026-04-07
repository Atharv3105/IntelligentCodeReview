const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/roster.controller");
const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

// All roster routes require teacher or admin
router.use(auth);
router.use(requireRole("teacher", "admin"));

router.post(  "/",          ctrl.createRoster);
router.get(   "/",          ctrl.listRosters);
router.get(   "/:id",       ctrl.getRoster);
router.put(   "/:id",       ctrl.updateRoster);
router.delete("/:id",       ctrl.deleteRoster);
router.post(  "/:id/link",  ctrl.linkRoster);

module.exports = router;
