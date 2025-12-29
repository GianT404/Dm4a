export interface LyricLine {
  start: number;
  end: number;
  text: string;
}

export const parseVTT = (vttData: string): LyricLine[] => {
  const lines = vttData.split('\n');
  const lyrics: LyricLine[] = [];
  
  const timeToMs = (timeStr: string) => {
    if(!timeStr) return 0;
    const parts = timeStr.split(':');
    const secondsParts = parts[2]?.split('.') || ['0', '0'];
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(secondsParts[0], 10) || 0;
    const ms = parseInt(secondsParts[1], 10) || 0;
    return (h * 3600 + m * 60 + s) * 1000 + ms;
  };

  let currentStart = 0;
  let currentEnd = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const times = line.split(' --> ');
      currentStart = timeToMs(times[0]);
      currentEnd = timeToMs(times[1]);
    } else if (line && !line.startsWith('WEBVTT') && isNaN(Number(line))) {
      lyrics.push({ start: currentStart, end: currentEnd, text: line });
    }
  }
  return lyrics;
};