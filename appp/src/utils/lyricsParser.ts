// src/utils/lyricsParser.ts

export interface LyricLine {
  time: number; // Đổi từ start sang time để đồng bộ
  text: string;
}

export const parseVTT = (vttData: string): LyricLine[] => {
  const lines = vttData.split('\n');
  const lyrics: LyricLine[] = [];
  
  const timeToMs = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const secondsParts = parts[2]?.split('.') || ['0', '0'];
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(secondsParts[0], 10) || 0;
    const ms = parseInt(secondsParts[1], 10) || 0;
    return (h * 3600 + m * 60 + s) * 1000 + ms;
  };

  let currentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const times = line.split(' --> ');
      currentStart = timeToMs(times[0]);
    } else if (line && !line.startsWith('WEBVTT') && isNaN(Number(line))) {
      lyrics.push({ time: currentStart, text: line });
    }
  }
  return lyrics;
};

// 👇 THÊM HÀM NÀY ĐỂ FIX LỖI THIẾU MEMBER
export const parseLRC = (lrcData: string): LyricLine[] => {
  const lines = lrcData.split('\n');
  const lyrics: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  lines.forEach(line => {
    const match = timeRegex.exec(line);
    if (match) {
      const m = parseInt(match[1]);
      const s = parseInt(match[2]);
      const ms = parseInt(match[3].padEnd(3, '0'));
      const time = (m * 60 + s) * 1000 + ms;
      const text = line.replace(timeRegex, '').trim();
      if (text) {
        lyrics.push({ time, text });
      }
    }
  });
  return lyrics;
};