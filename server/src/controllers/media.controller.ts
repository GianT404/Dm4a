import type { Request, Response } from 'express';
import { YouTubeService } from '../services/youtube.service';

export const MediaController = {
  search: async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      const data = await YouTubeService.searchVideo(String(query));
      res.json({ success: true, data });
    } catch (e) { res.status(500).json({ error: 'Search Error' }); }
  },

  getMeta: async (req: Request, res: Response) => {
    try {
      const { id } = req.query;
      const data = await YouTubeService.getMetadata(String(id));
      res.json(data);
    } catch (e) { res.status(500).json({ error: 'Meta Error' }); }
  },

  downloadAudio: async (req: Request, res: Response) => {
    try {
      const { id } = req.query;
      const stream = YouTubeService.downloadAudioStream(String(id));
      res.setHeader('Content-Type', 'audio/mp4');
      stream.pipe(res);
    } catch (e) { res.status(500).end(); }
  },

  downloadLyrics: async (req: Request, res: Response) => {
    try {
      const { id, lang } = req.query;
      const vtt = await YouTubeService.getLyricsContent(String(id), String(lang));
      if (vtt) res.send(vtt);
      else res.status(404).send('Lyrics not found');
    } catch (e) { res.status(500).end(); }
  }
};