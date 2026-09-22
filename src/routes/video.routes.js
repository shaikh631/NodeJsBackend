import { Router } from "express";
import { VerifyJWT } from "../middlewares/auth.middleware.js";
import {
    commentOnVideo,
    deleteWatchHistory,
    getPlaylistVideos,
    getUserPlaylists,
    getWatchHistory,
    likeVideoOrComment,
    playlistVideoAdd,
    removeVideoFromPlaylist
} from "../controllers/video.controller.js";

const router = Router();

router.use(VerifyJWT);

router.route('/watch-history')
    .get(getWatchHistory)
    .delete(deleteWatchHistory);

router.route('/:videoId/comments').post(commentOnVideo);

router.route('/videos/:videoId/like').post(likeVideoOrComment);
router.route('/comments/:commentId/like').post(likeVideoOrComment);

router.route('/playlists').get(getUserPlaylists);
router.route('/playlists/:playlistId/videos').get(getPlaylistVideos);
router.route('/playlists/:playlistId/videos/:videoId')
    .post(playlistVideoAdd)
    .delete(removeVideoFromPlaylist);

export default router;