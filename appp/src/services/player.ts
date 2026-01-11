import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import MusicControl, { Command } from 'react-native-music-control';
import * as FileSystem from 'expo-file-system/legacy';
import { useMusicStore } from '../store/useMusicStore';
import { parseVTT } from '../utils/lyricsParser';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'; 

let soundObject: Audio.Sound | null = null;
let isAudioModeSetup = false;
let musicControlInitialized = false;
let isSwitchingTrack = false; 

const log = (msg: string, data?: any) => {
    if (data) console.log(`[PLAYER] ${msg}`, data);
    else console.log(`[PLAYER] ${msg}`);
};

export const initializeMusicControl = () => {
  if (musicControlInitialized) return;
  try {
    log('Init MusicControl...');
    MusicControl.enableBackgroundMode(true);
    MusicControl.enableControl('play', true);
    MusicControl.enableControl('pause', true);
    MusicControl.enableControl('nextTrack', true);
    MusicControl.enableControl('previousTrack', true);
    MusicControl.enableControl('seek', true); 
    MusicControl.enableControl('closeNotification', true);

    MusicControl.on(Command.play, () => PlayerService.togglePlay());
    MusicControl.on(Command.pause, () => PlayerService.togglePlay());
    MusicControl.on(Command.nextTrack, () => PlayerService.playNext());
    MusicControl.on(Command.previousTrack, () => PlayerService.playPrev());
    MusicControl.on(Command.seek, (pos) => PlayerService.seekTo(pos * 1000));
    
    musicControlInitialized = true;
  } catch (e) {
    console.error(' MusicControl Init Error', e);
  }
};

const setupAudioMode = async () => {
  if (isAudioModeSetup) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true, // QUAN TRỌNG
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    isAudioModeSetup = true;
  } catch (e) {
    console.error(' Audio Setup Error', e);
  }
};

export const PlayerService = {
  init: () => {
    setupAudioMode();
    initializeMusicControl();
  },

  playTrack: async (trackId: string, isAutoNext = false) => {
    // Giữ CPU thức dậy trong quá trình chuyển bài
    try { await activateKeepAwakeAsync(); } catch(e) {
        console.error(' KeepAwake Error', e);
    }

    if (!isAutoNext && isSwitchingTrack) {
        log(' Blocked: Spam play request');
        return;
    }

    isSwitchingTrack = true;
    const store = useMusicStore.getState();
    const track = store.playlist.find(t => t.id === trackId);

    if (!track) {
      log('Track not found');
      isSwitchingTrack = false;
      return;
    }

    // Check status
    if (track.status !== 'ready' || !track.localAudioUri) {
        log(`Track not ready. Skipping...`);
        isSwitchingTrack = false;
        if (isAutoNext) {
            log('⏭Track error -> Auto skipping next directly');
            PlayerService.playNext(true); 
        }
        return;
    }

    try {
      await setupAudioMode();
      MusicControl.updatePlayback({ state: MusicControl.STATE_BUFFERING, elapsedTime: 0 });
      MusicControl.setNowPlaying({
        title: track.title,
        artist: track.author || 'Unknown',
        artwork: (track.thumbnail && track.thumbnail.startsWith('http')) ? track.thumbnail : undefined,
        color: 0xef4444, 
        notificationIcon: 'ic_launcher',
        isPlaying: true,
      });

      // 2. Kill sound cũ
      if (soundObject) {
        try {
          await soundObject.setOnPlaybackStatusUpdate(null);
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
          soundObject = null;
        } catch (e) { }
      }

      // 3. Update Store
      store.setTrack(track);
      store.setPlayState(true);
      store.setLyrics([]);

      // 4. Load Sound mới
      log(`Loading: ${track.title}`);
      
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: track.localAudioUri },
        { shouldPlay: true, rate: 1.0, volume: 1.0 },
        (status) => {
             if (status.isLoaded) {
                store.setProgress(status.positionMillis, status.durationMillis || 0);

                if (Math.floor(status.positionMillis / 1000) !== Math.floor((status.positionMillis - 500) / 1000)) {
                    MusicControl.updatePlayback({
                        state: status.isPlaying ? MusicControl.STATE_PLAYING : MusicControl.STATE_PAUSED,
                        elapsedTime: status.positionMillis / 1000,
                        duration: (status.durationMillis || 0) / 1000,
                    });
                }
                if (status.didJustFinish) {
                    log('🏁 Finished. Calling playNext DIRECTLY.');
                    if(soundObject) soundObject.setOnPlaybackStatusUpdate(null);
                    
                    PlayerService.playNext(true);
                }
             }
        }
      );

      soundObject = newSound;
      if (status.isLoaded && !status.isPlaying) {
          log(' Force Playing...');
          await soundObject.playAsync();
      }
      
      // Load Lyrics
      if (track.localLyricsUri) {
         try {
             const vtt = await FileSystem.readAsStringAsync(track.localLyricsUri);
             store.setLyrics(parseVTT(vtt));
         } catch(e) {}
      }

      // Final Noti Update
      MusicControl.updatePlayback({
        state: MusicControl.STATE_PLAYING,
        elapsedTime: 0,
        duration: (status.isLoaded && status.durationMillis) ? status.durationMillis / 1000 : 0,
      });

      isSwitchingTrack = false;
      // Thả CPU ra để tiết kiệm pin
      deactivateKeepAwake().catch(() => {}); 

    } catch (e) {
      log(' Error playing track', e);
      isSwitchingTrack = false;
      store.setPlayState(false);
      MusicControl.updatePlayback({ state: MusicControl.STATE_PAUSED });

      if(isAutoNext) {
          log(' Error -> Retry next directly');
          PlayerService.playNext(true);
      }
    }
  },

  playNext: (isAutoNext = false) => {
    log(` playNext (Auto: ${isAutoNext})`);
    
    // Reset cờ switch để đảm bảo AutoNext luôn được phép chạy
    if (isAutoNext) isSwitchingTrack = false;

    const { playlist, currentTrack, isShuffle } = useMusicStore.getState();
    const readyTracks = playlist.filter(t => t.status === 'ready');

    if (!currentTrack || readyTracks.length === 0) {
        log(' No ready tracks');
        return;
    }

    let nextTrack;
    if (isShuffle) {
        const others = readyTracks.filter(t => t.id !== currentTrack.id);
        nextTrack = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : currentTrack;
    } else {
        const currentIdx = playlist.findIndex(t => t.id === currentTrack.id);
        
        let found = false;
        let checkIdx = (currentIdx + 1) % playlist.length;
        let loopCount = 0;

        while (!found && loopCount < playlist.length) {
            if (playlist[checkIdx].status === 'ready') {
                nextTrack = playlist[checkIdx];
                found = true;
            } else {
                checkIdx = (checkIdx + 1) % playlist.length;
                loopCount++;
            }
        }
    }

    if (nextTrack) {
        log(`Next: ${nextTrack.title}`);
        PlayerService.playTrack(nextTrack.id, isAutoNext);
    } else {
        log(' Could not find next ready track');
    }
  },

  playPrev: () => {
    log(' playPrev');
    const { playlist, currentTrack } = useMusicStore.getState();
    if (!currentTrack || playlist.length === 0) return;

    const idx = playlist.findIndex(t => t.id === currentTrack.id);
    const prevIdx = idx === 0 ? playlist.length - 1 : idx - 1;
    const prevTrack = playlist[prevIdx];

    if (prevTrack && prevTrack.status === 'ready') {
        PlayerService.playTrack(prevTrack.id);
    }
  },

  togglePlay: async () => {
    log('Toggle');
    const store = useMusicStore.getState();
    const shouldPlay = !store.isPlaying;

    if (soundObject) {
       if (shouldPlay) {
           await soundObject.playAsync();
           MusicControl.updatePlayback({ state: MusicControl.STATE_PLAYING });
       } else {
           await soundObject.pauseAsync();
           MusicControl.updatePlayback({ state: MusicControl.STATE_PAUSED });
       }
       store.setPlayState(shouldPlay);
    }
  },

  seekTo: async (millis: number) => {
      if (soundObject) {
          await soundObject.setPositionAsync(millis);
          useMusicStore.getState().setProgress(millis, useMusicStore.getState().duration);
          MusicControl.updatePlayback({ elapsedTime: millis / 1000 });
      }
  }
};