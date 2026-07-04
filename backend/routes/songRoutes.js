const express = require("express");
const router = express.Router();
const { authenticateRequest } = require("../authMiddleware");

const {
    getAllSongs,
    getCreatorSongs,
    uploadCreatorSong,
    searchSongs,
    streamSong,
    toggleLikeSong,
    getListeningHistory,
    getLikedSongs,
} = require("../controllers/songController");
// const expressAuth = async (req, res, next) => {
//     try {
//         await authenticateRequest(req);
//         next();
//     } catch (error) {
//         res.status(error.statusCode || 401).json({ error: error.message });
//     }
// };
/* ==========================
   GET ALL SONGS
========================== */
const expressAuth = async (req, res, next) => {
    try {
        await authenticateRequest(req);
        next();
    } catch (error) {
        res.status(error.statusCode || 401).json({ error: error.message });
    }
};

router.get("/", getAllSongs);
router.get("/creator/me", expressAuth, getCreatorSongs);
router.post("/creator/me", expressAuth, uploadCreatorSong);
router.get("/history", expressAuth, getListeningHistory);
router.get("/liked", expressAuth, getLikedSongs);

/* ==========================
   SEARCH SONGS
========================== */
/*
Example:
GET /api/songs/search?q=thriller
*/
router.get("/search", searchSongs);

/* ==========================
   STREAM SONG
========================== */

router.get("/:id/stream", streamSong);
router.post("/:id/like", expressAuth, toggleLikeSong);

module.exports = router;