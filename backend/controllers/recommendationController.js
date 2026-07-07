const {
    getContentRecommendations,
} = require("../services/contentRecommendation");
const storageService = require("../services/storageService");

async function getContentRecommendationsController(req, res) {

    try {

        const { songId } = req.params;
        const { recentSongs = [] } = req.body;

        const recommendations =
              await getContentRecommendations(songId, recentSongs);

        const formatted = recommendations.map(rec => ({
            ...rec,
            cover_url: storageService.formatCoverUrl(rec.cover_url, req)
        }));

        res.status(200).json({
            success: true,
            recommendations: formatted
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

}

async function getUserRecommendations(req, res) {

    res.json({
        success: true,
        message: "Coming in Phase 2"
    });

}

module.exports = {
    getContentRecommendations:
        getContentRecommendationsController,

    getUserRecommendations
};