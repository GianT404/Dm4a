import { Router } from 'express';
import { MediaController } from '../controllers/media.controller';

const router = Router();

router.get('/search', MediaController.search);
router.get('/meta', MediaController.getMeta);
router.get('/download-audio', MediaController.downloadAudio);
router.get('/download-lyrics', MediaController.downloadLyrics);

export default router;