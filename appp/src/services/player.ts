import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import MusicControl, { Command } from 'react-native-music-control';
import * as FileSystem from 'expo-file-system/legacy';
import { useMusicStore } from '../store/useMusicStore';
import { parseVTT } from '../utils/lyricsParser';

let soundObject: Audio.Sound | null = null;
let isAudioModeSetup = false;
let musicControlInitialized = false;
let isTransitioning = false;
let lastTransitionTime = 0;
let autoNextInProgress = false;

const setupAudioMode = async () => {
  if (isAudioModeSetup) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
    isAudioModeSetup = true;
    console.log('✅ Audio Mode Setup Successfully');
  } catch (e) {
    console.error('❌ Audio Setup Error', e);
  }
};

const initializeMusicControl = () => {
  if (musicControlInitialized) return;
  
  try {
    console.log('🎵 Initializing MusicControl...');
    
    MusicControl.enableBackgroundMode(true);
    
    MusicControl.enableControl('play', true);
    MusicControl.enableControl('pause', true);
    MusicControl.enableControl('nextTrack', true);
    MusicControl.enableControl('previousTrack', true);
    MusicControl.enableControl('stop', false);
    MusicControl.enableControl('seek', false);
    MusicControl.enableControl('skipForward', false);
    MusicControl.enableControl('skipBackward', false);
    MusicControl.enableControl('closeNotification', false);

    MusicControl.on(Command.play, () => {
      console.log('🎵 Lockscreen: Play pressed');
      PlayerService.togglePlay();
    });
    
    MusicControl.on(Command.pause, () => {
      console.log('⏸️ Lockscreen: Pause pressed');
      PlayerService.togglePlay();
    });
    
    MusicControl.on(Command.nextTrack, () => {
      console.log('⏭️ Lockscreen: Next pressed');
      PlayerService.playNext();
    });
    
    MusicControl.on(Command.previousTrack, () => {
      console.log('⏮️ Lockscreen: Previous pressed');
      PlayerService.playPrev();
    });
    
    musicControlInitialized = true;
    console.log('✅ MusicControl Initialized');
  } catch (e) {
    console.error('❌ MusicControl Init Error', e);
  }
};

export const PlayerService = {
  playTrack: async (trackId: string, isAutoNext = false) => {
    const now = Date.now();
    
    if (!isAutoNext && isTransitioning && (now - lastTransitionTime) < 500) {
      console.log('⚠️ Already transitioning, skipping...');
      return;
    }
    
    if (!isAutoNext) {
      isTransitioning = true;
      lastTransitionTime = now;
    }
    
    const store = useMusicStore.getState();
    const track = store.playlist.find(t => t.id === trackId);

    if (!track) {
      console.error('❌ Track not found:', trackId);
      isTransitioning = false;
      autoNextInProgress = false;
      return;
    }

    console.log('🎵 Playing Track:', track.title, isAutoNext ? '(auto)' : '(manual)');

    try {
      setupAudioMode().catch(e => console.error('Setup audio mode error:', e));
      initializeMusicControl();

      // ============================================================
      // 🛡️ STEP 1: UPDATE NOTIFICATION FIRST - KEEP IT ALIVE
      // ============================================================
      
      console.log('📢 Updating notification...');
      
      // ✅ Force re-enable background mode
      MusicControl.enableBackgroundMode(true);
      
      // ✅ Update notification immediately
      MusicControl.setNowPlaying({
        title: track.title,
        artist: track.author || 'Unknown',
        artwork: (track.thumbnail && track.thumbnail.startsWith('http')) ? track.thumbnail : undefined,
        duration: 0,
        elapsedTime: 0,
        notificationIcon: 'ic_launcher',
        isPlaying: true,
        color: 0x1DB954,
      });
      
      // ✅ CRITICAL: Always set PLAYING state to prevent dismissal
      MusicControl.updatePlayback({
        state: MusicControl.STATE_PLAYING,
        elapsedTime: 0,
        speed: 1,
      });

      // ============================================================
      // 🚀 STEP 2: UPDATE STORE
      // ============================================================
      store.setTrack(track);
      store.setPlayState(true);
      store.setLyrics([]);

      // ============================================================
      // 🎵 STEP 3: LOAD NEW AUDIO
      // ============================================================
      
      if (!track.localAudioUri) {
        throw new Error('Audio URI is missing');
      }

      console.log('📁 Checking file:', track.localAudioUri);
      const fileInfo = await FileSystem.getInfoAsync(track.localAudioUri);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }

      console.log('✅ File exists:', fileInfo.size, 'bytes');
      
      // ✅ Request Audio Focus
      MusicControl.handleAudioInterruptions(true);

      // ✅ Load new audio with shouldPlay = TRUE
      console.log('🎵 Loading new audio with shouldPlay=true...');
      const { sound: newSound, status: loadStatus } = await Audio.Sound.createAsync(
        { uri: track.localAudioUri },
        { 
          shouldPlay: true, // ✅ TRUE - Start immediately
          progressUpdateIntervalMillis: 500,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        null,
        false
      );

      console.log('✅ New sound created');
      
      if (!loadStatus.isLoaded) {
        await newSound.unloadAsync();
        throw new Error('Sound failed to load');
      }
      
      // ✅ Wait for it to actually start playing (max 2 seconds)
      let playAttempts = 0;
      let isPlaying = loadStatus.isPlaying;
      
      while (!isPlaying && playAttempts < 10) {
        console.log(`⏳ Waiting for playback... attempt ${playAttempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const currentStatus = await newSound.getStatusAsync();
        if (!currentStatus.isLoaded) {
          throw new Error('Sound unloaded during wait');
        }
        
        isPlaying = currentStatus.isPlaying;
        playAttempts++;
        
        // ✅ Try to force play if not playing yet
        if (!isPlaying && playAttempts % 3 === 0) {
          console.log('🔄 Force play attempt...');
          try {
            await newSound.playAsync();
          } catch (e) {
            console.log('⚠️ Force play failed:', e);
          }
        }
      }
      
      // ✅ Check if playing
      const checkStatus = await newSound.getStatusAsync();
      if (!checkStatus.isLoaded || !checkStatus.isPlaying) {
        console.error('❌ New sound not playing:', {
          isLoaded: checkStatus.isLoaded,
          isPlaying: checkStatus.isLoaded ? checkStatus.isPlaying : 'N/A',
        });
        await newSound.unloadAsync();
        throw new Error('Failed to start new sound');
      }
      
      console.log('✅ New sound is playing!');
      
      // ============================================================
      // 🔄 STEP 4: SWITCH TO NEW SOUND (UNLOAD OLD)
      // ============================================================
      
      // ✅ NOW safe to unload old sound (new one is already playing)
      if (soundObject) {
        try {
          const oldStatus = await soundObject.getStatusAsync();
          if (oldStatus.isLoaded) {
            await soundObject.setOnPlaybackStatusUpdate(null);
            await soundObject.stopAsync();
          }
          await soundObject.unloadAsync();
          console.log('✅ Old sound unloaded');
        } catch (e) {
          console.error('⚠️ Old sound unload warning:', e);
        }
      }
      
      // ✅ Switch reference
      soundObject = newSound;

      // ============================================================
      // ⚡ STEP 5: LOAD LYRICS
      // ============================================================
      if (track.localLyricsUri) {
        FileSystem.getInfoAsync(track.localLyricsUri)
          .then(info => {
            if (info.exists && track.localLyricsUri) {
              return FileSystem.readAsStringAsync(track.localLyricsUri);
            }
            return null;
          })
          .then(vtt => {
            if (vtt) {
              store.setLyrics(parseVTT(vtt));
              console.log('✅ Lyrics loaded');
            }
          })
          .catch(e => console.error('❌ Lyrics Error:', e));
      }

      // ============================================================
      // 📊 STEP 6: GET FINAL STATUS & UPDATE NOTIFICATION
      // ============================================================
      
      const finalStatus = await soundObject.getStatusAsync();
      
      if (!finalStatus.isLoaded) {
        throw new Error('Final status not loaded');
      }

      const finalDuration = finalStatus.durationMillis || 0;
      
      console.log('✅ Final Status:', {
        isPlaying: finalStatus.isPlaying,
        duration: finalDuration,
        position: finalStatus.positionMillis,
      });

      // ✅ Update notification with final info
      MusicControl.updatePlayback({
        state: MusicControl.STATE_PLAYING,
        elapsedTime: 0,
        duration: finalDuration / 1000,
        speed: 1,
      });

      MusicControl.setNowPlaying({
        title: track.title,
        artist: track.author || 'Unknown',
        artwork: (track.thumbnail && track.thumbnail.startsWith('http')) ? track.thumbnail : undefined,
        duration: finalDuration / 1000,
        elapsedTime: 0,
        notificationIcon: 'ic_launcher',
        isPlaying: true,
        color: 0x1DB954,
      });

      // ============================================================
      // 📊 STEP 7: SETUP PLAYBACK LISTENER
      // ============================================================
      soundObject.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          store.setProgress(status.positionMillis, status.durationMillis || 0);
          
          // Update notification every 1s
          if (Math.floor(status.positionMillis / 1000) !== Math.floor((status.positionMillis - 500) / 1000)) {
            MusicControl.updatePlayback({
              state: status.isPlaying ? MusicControl.STATE_PLAYING : MusicControl.STATE_PAUSED,
              elapsedTime: status.positionMillis / 1000,
              duration: (status.durationMillis || 0) / 1000,
              speed: 1,
            });
          }
          
          // ✅ Auto-next
          if (status.didJustFinish && !autoNextInProgress) {
            console.log("✅ Track finished");
            autoNextInProgress = true;
            
            Promise.resolve().then(() => {
              PlayerService.playNext(true);
            });
          }
        } else if (status.error) {
          console.error('❌ Playback Error:', status.error);
          autoNextInProgress = true;
          Promise.resolve().then(() => {
            PlayerService.playNext(true);
          });
        }
      });

      console.log('🎉 Playback started successfully!');
      
      isTransitioning = false;
      autoNextInProgress = false;

    } catch (e) {
      console.error('❌ Play Error:', e);
      store.setPlayState(false);
      isTransitioning = false;
      autoNextInProgress = false;
      
      // Auto skip on error
      Promise.resolve().then(() => {
        console.log('⏭️ Auto-skipping due to error...');
        PlayerService.playNext(true);
      });
      
      MusicControl.updatePlayback({ 
        state: MusicControl.STATE_PAUSED, 
        elapsedTime: 0 
      });
    }
  },

  playPrev: async () => {
    console.log('⏮️ PlayPrev called');
    const store = useMusicStore.getState();
    store.playPrev(); 
    const newTrack = useMusicStore.getState().currentTrack;
    if (newTrack) {
      console.log('⏮️ Previous track:', newTrack.title);
      await PlayerService.playTrack(newTrack.id, false);
    } else {
      console.log('⚠️ No previous track');
    }
  },

  playNext: async (isAutoNext = false) => {
    console.log('⏭️ PlayNext called', isAutoNext ? '(auto)' : '(manual)');
    
    const { playlist, currentTrack, isShuffle } = useMusicStore.getState();
    
    if (!currentTrack || playlist.length === 0) {
      console.log('⚠️ No track or empty playlist');
      autoNextInProgress = false;
      return;
    }

    let nextTrack;
    if (isShuffle) {
      let remainingTracks = playlist.filter(t => t.id !== currentTrack.id);
      nextTrack = remainingTracks.length === 0 
        ? currentTrack 
        : remainingTracks[Math.floor(Math.random() * remainingTracks.length)];
    } else {
      const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
      const nextIndex = (currentIndex + 1) % playlist.length;
      nextTrack = playlist[nextIndex];
    }

    if (nextTrack) {
      console.log("▶️ Next track:", nextTrack.title);
      useMusicStore.getState().setTrack(nextTrack);
      await PlayerService.playTrack(nextTrack.id, isAutoNext);
    } else {
      console.log('⚠️ No next track');
      autoNextInProgress = false;
    }
  },

  togglePlay: async () => {
    console.log('🎵 Toggle Play');
    
    const now = Date.now();
    if (isTransitioning && (now - lastTransitionTime) < 300) {
      console.log('⚠️ Cannot toggle while transitioning');
      return;
    }
    
    const store = useMusicStore.getState();
    const newPlayState = !store.isPlaying;
    
    console.log(`${newPlayState ? '▶️' : '⏸️'} Toggle:`, newPlayState);
    
    store.setPlayState(newPlayState);

    if (soundObject) {
      try {
        const status = await soundObject.getStatusAsync();
        
        if (status.isLoaded) {
          if (newPlayState) {
            await soundObject.playAsync();
            MusicControl.updatePlayback({ 
              state: MusicControl.STATE_PLAYING, 
              elapsedTime: status.positionMillis / 1000,
              speed: 1,
            });
            console.log('✅ Resumed');
          } else {
            await soundObject.pauseAsync();
            MusicControl.updatePlayback({ 
              state: MusicControl.STATE_PAUSED, 
              elapsedTime: status.positionMillis / 1000,
              speed: 0,
            });
            console.log('✅ Paused');
          }
        } else {
          console.error('⚠️ Sound not loaded');
          store.setPlayState(!newPlayState);
        }
      } catch (e) {
        console.error('❌ Toggle Error:', e);
        store.setPlayState(!newPlayState);
      }
    } else {
      console.error('⚠️ No sound object');
      store.setPlayState(!newPlayState);
    }
  },

  seekTo: async (ms: number) => {
    console.log('⏩ Seeking to:', ms);
    if (soundObject) {
      try {
        const store = useMusicStore.getState();
        store.setProgress(ms, store.duration); 
        
        await soundObject.setPositionAsync(ms);
        
        MusicControl.updatePlayback({
          state: store.isPlaying ? MusicControl.STATE_PLAYING : MusicControl.STATE_PAUSED,
          elapsedTime: ms / 1000
        });
        
        console.log('✅ Seek completed');
      } catch (e) {
        console.error('❌ Seek Error:', e);
      }
    }
  },

  stop: async () => {
    console.log('⏹️ Stopping');
    const store = useMusicStore.getState();
    store.setPlayState(false);
    
    try {
      if (soundObject) {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
        soundObject = null;
        console.log('✅ Stopped');
      }
      MusicControl.resetNowPlaying();
    } catch (e) { 
      console.error('❌ Stop Error', e); 
    }
  }
};