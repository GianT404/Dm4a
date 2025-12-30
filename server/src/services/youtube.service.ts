import ytdlp from "yt-dlp-exec";
import yts from "yt-search";
import { Innertube, UniversalCache } from "youtubei.js";
import fs from 'fs';
import path from 'path';
import ytdl from "@distube/ytdl-core";

const COOKIES_PATH = path.resolve(__dirname, '../../cookies.txt');
const hasCookies = fs.existsSync(COOKIES_PATH);

if (hasCookies) console.log('SERVER: Found cookies.txt ');
else console.warn('SERVER: No cookies found');

// Youtubei Singleton
let ytClientPromise: Promise<Innertube> | null = null;
const getClient = () => {
  if (!ytClientPromise) {
    ytClientPromise = Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      lang: 'vi', 
      location: 'VN',
      retrieve_player: false,
    });
  }
  return ytClientPromise;
};

// Helper Format Time
const formatVTTTime = (ms: number) => {
  if (isNaN(ms)) return "00:00:00.000";
  const date = new Date(ms);
  const h = date.getUTCHours().toString().padStart(2, '0');
  const m = date.getUTCMinutes().toString().padStart(2, '0');
  const s = date.getUTCSeconds().toString().padStart(2, '0');
  const msStr = date.getUTCMilliseconds().toString().padStart(3, '0');
  return `${h}:${m}:${s}.${msStr}`;
};

const getInnertubeApiKey = async (videoId: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
    return apiKeyMatch ? apiKeyMatch[1] : null;
  } catch (e) {
    console.error('[API Key Error]', e);
    return null;
  }
};

const getCaptionsViaInnertube = async (videoId: string) => {
  try {
    const apiKey = await getInnertubeApiKey(videoId);
    if (!apiKey) throw new Error('Cannot get API key');

    const response = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '19.09.37',
            androidSdkVersion: 30,
          }
        },
        videoId: videoId,
      })
    });

    const data = await response.json();
    return data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  } catch (e) {
    console.error('[Innertube Error]', e);
    return [];
  }
};

export const YouTubeService = {
  // 1. Search
  searchVideo: async (keyword: string) => {
    try {
      const r = await yts(keyword);
      return r.videos.slice(0, 10).map((v) => ({
        id: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail,
        author: v.author.name,
        duration: v.timestamp,
      }));
    } catch (e) { 
      throw new Error("Search Failed"); 
    }
  },

  // 2. Lấy Metadata & List Sub 
  getMetadata: async (videoId: string) => {
    console.log(`[Meta] 🔍 Đang soi video: ${videoId}`);

    try {
      const client = await getClient();
      const info = await client.getInfo(videoId);

      let tracks: any[] = [];

      // METHOD 1: Thử lấy từ captions trong info
      try {
        const captions = (info as any).captions;
        if (captions) {
          const captionTracks = captions.caption_tracks || [];
          tracks = captionTracks.map((t: any) => ({
            code: t.language_code || t.languageCode,
            name: t.name?.simpleText || t.name || t.language_code,
            isAuto: t.vss_id?.includes('.') || t.kind === 'asr'
          }));
          console.log(`[Meta] Tìm thấy ${tracks.length} tracks từ captions`);
        }
      } catch (e) {
        console.log(`[Meta] Không lấy được từ captions:`, e);
      }

      // METHOD 2: Nếu rỗng, thử player_response
      if (tracks.length === 0) {
        try {
          const playerResp = (info as any).player_response;
          const captionsList = playerResp?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

          tracks = captionsList.map((t: any) => ({
            code: t.languageCode,
            name: t.name?.simpleText || t.languageCode,
            isAuto: t.kind === 'asr'
          }));

          console.log(`[Meta] Tìm thấy ${tracks.length} tracks từ player_response`);
        } catch (e) {
          console.log(`[Meta] Không lấy được từ player_response:`, e);
        }
      }

      // METHOD 3: Dùng Innertube trực tiếp
      if (tracks.length === 0) {
        console.log(`[Meta]  Thử Innertube API trực tiếp...`);
        const innerTracks = await getCaptionsViaInnertube(videoId);

        tracks = innerTracks.map((t: any) => ({
          code: t.languageCode,
          name: t.name?.simpleText || t.languageCode,
          isAuto: t.kind === 'asr'
        }));

        console.log(`[Meta] ${tracks.length > 0 ? '✅' : '❌'} Innertube: ${tracks.length} tracks`);
      }

      // METHOD 4: Thử getTranscript 
      if (tracks.length === 0) {
        try {
          console.log(`[Meta]  Thử getTranscript...`);
          const transcript = await info.getTranscript();

          // Check nhiều cách có thể có data
          const hasData = (transcript as any)?.transcript_content?.body?.initial_segments
            || (transcript as any)?.actions?.[0]?.updateEngagementPanelAction;

          if (hasData) {
            console.log(`[Meta]  Tìm thấy transcript!`);
            tracks.push({
              code: 'auto',
              name: 'Auto-generated (từ getTranscript)',
              isAuto: true
            });
          }
        } catch (e: any) {
          console.log(`[Meta] ❌ getTranscript thất bại:`, e.message);
        }
      }

      if (tracks.length === 0) {
        console.log(`[Meta]  Video này KHÔNG CÓ caption!`);
      }

      return {
        id: videoId,
        title: info.basic_info.title || 'Unknown',
        tracks: tracks 
      };

    } catch (error: any) {
      console.error(`[Meta Error]`, error);
      throw new Error(`Cannot get metadata: ${error.message}`);
    }
  },

  // 3. Download Audio
downloadAudioStream: (videoId: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[Stream]  Start streaming: ${videoId}`);

    try {
        const args: any = {
            output: "-",
            format: "bestaudio[ext=m4a]/bestaudio/best", 

            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            ]
        };

        if (hasCookies) {
             args.cookies = COOKIES_PATH;
        }

        // Mở pipe stderr để debug nếu lỗi
        const subprocess = (ytdlp as any).exec(url, args, { stdio: ["ignore", "pipe", "pipe"] });

        if (subprocess.stderr) {
            subprocess.stderr.on('data', (d: any) => console.log(`[yt-dlp log]: ${d.toString()}`));
        }

        if (subprocess.stdout) return subprocess.stdout;

        throw new Error("yt-dlp failed to start stdout");

    } catch (e) {
        console.warn(`[Stream] ⚠️ yt-dlp failed, switching to fallback...`, e);

        // CÁCH 2: Fallback cuối cùng (ytdl-core)
        // Nếu yt-dlp vẫn lỗi thì dùng cái này cứu cánh
        const agent = ytdl.createAgent(hasCookies ? JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8')) : undefined);
        return ytdl(url, {
            agent,
            filter: 'audioonly',
            quality: 'lowestaudio',
            highWaterMark: 1 << 25
        });
    }
  },

  // 4. Download Lyrics 
  getLyricsContent: async (videoId: string, langCode: string) => {
    console.log(`[Lyrics] Đang tải: ${langCode} cho ${videoId}`);

    try {
      const client = await getClient();
      const info = await client.getInfo(videoId);

      // METHOD 1: Thử lấy baseUrl từ player_response
      let baseUrl: string | null = null;

      try {
        const captions = (info as any).player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

        let track = captions.find((t: any) => t.languageCode === langCode);
        if (langCode === 'auto' && !track) {
          track = captions.find((t: any) => t.kind === 'asr');
        }

        if (track?.baseUrl) {
          baseUrl = track.baseUrl;
          console.log(`[Lyrics]  Tìm thấy baseUrl từ player_response`);
        }
      } catch (e) {
        console.log(`[Lyrics]  Không lấy được baseUrl từ player_response`);
      }

      // METHOD 2: Thử từ captions
      if (!baseUrl) {
        try {
          const captionTracks = (info as any).captions?.caption_tracks || [];
          const track = captionTracks.find((t: any) => 
            t.language_code === langCode || (langCode === 'auto' && t.vss_id?.includes('.'))
          );

          if (track?.base_url) {
            baseUrl = track.base_url;
            console.log(`[Lyrics]  Tìm thấy baseUrl từ captions`);
          }
        } catch (e) {
          console.log(`[Lyrics]  Không lấy được từ captions`);
        }
      }

      // METHOD 3: Nếu có baseUrl -> Fetch VTT
      if (baseUrl) {
        const vttUrl = `${baseUrl}&fmt=vtt`;
        console.log(`[Lyrics]  Fetching: ${vttUrl.substring(0, 100)}...`);

        const response = await fetch(vttUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.youtube.com/',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });

        if (response.ok) {
          const vttContent = await response.text();
          console.log(`[Lyrics]  Tải thành công ${vttContent.length} bytes`);
          return vttContent;
        } else {
          console.log(`[Lyrics]  HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // METHOD 4: Fallback - Dùng getTranscript
      console.log(`[Lyrics]  Thử getTranscript API...`);
      const transcript = await info.getTranscript();
      const data = transcript as any;

      // Check nhiều structure có thể có
      let segments: any[] = [];

      if (data?.transcript_content?.body?.initial_segments) {
        segments = data.transcript_content.body.initial_segments;
      } else if (data?.actions?.[0]?.updateEngagementPanelAction) {
        const panel = data.actions[0].updateEngagementPanelAction;
        segments = panel?.content?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body?.transcriptSegmentListRenderer?.initialSegments || [];
      }

      if (segments.length > 0) {
        let vtt = "WEBVTT\n\n";

        segments.forEach((s: any) => {
          const start = Number(s.start_ms || s.startMs || 0);
          const end = Number(s.end_ms || s.endMs || start + 2000);
          const text = s.snippet?.text || s.snippet?.runs?.[0]?.text || '';

          if (!isNaN(start) && text) {
            vtt += `${formatVTTTime(start)} --> ${formatVTTTime(end)}\n${text}\n\n`;
          }
        });

        console.log(`[Lyrics]  Tạo VTT từ ${segments.length} segments`);
        return vtt;
      }

      console.log(`[Lyrics]  Không tìm thấy transcript data`);
      return null;

    } catch (e: any) {
      console.error(`[Lyrics Error]`, e);
      return null;
    }
  }
};
