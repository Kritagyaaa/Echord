const express = require("express");

const router = express.Router();

const {
    getContentRecommendations,
    getUserRecommendations
} = require("../controllers/recommendationController");

router.post("/content/:songId", getContentRecommendations);

router.get(
    "/user/:userId",
    getUserRecommendations
);

module.exports = router;