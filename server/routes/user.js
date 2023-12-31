const express = require("express");
const {
  verifyTokenAndAuth,
  verifyTokenAndAdmin,
} = require("../middleware/verifyToken");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");

// USER UPDATE
router.put("/:id", verifyTokenAndAuth, async (req, res) => {
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// USER DELETE

router.delete("/:id", verifyTokenAndAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted");
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// GET USER

router.get("/find/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// GET ALL USER

router.get("/", verifyTokenAndAdmin, async (req, res) => {
  const query = req.query.new;

  try {
    const users = query
      ? await User.find({ username: { $ne: "admin" } }).sort({
          _id: -1,
        }) /* .limit(5) */
      : await User.find({ username: { $ne: "admin" } });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// GET USER STATS

router.get("/stats", verifyTokenAndAdmin, async (req, res) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));
  try {
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
