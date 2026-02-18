import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TabHome } from './components/TabHome';
import { TabHabits } from './components/TabHabits';
import { TabMeals } from './components/TabMeals';
import { TabGoals } from './components/TabGoals';
import { TabReports } from './components/TabReports';
import { SettingsModal } from './components/SettingsModal';
import { Home, CheckSquare, Utensils, Target, BarChart3, Plus, X, Bell, AlarmClock, AlertTriangle } from 'lucide-react';
import { getTodayStr, getThemeColors } from './utils';

// Add type definition for global window object
declare global {
  interface Window {
    lifestyleAudio?: {
      enable: () => Promise<void>;
      disable: () => void;
      isPlaying: () => boolean;
    }
  }
}

// Toast Component
const Toast: React.FC<{ title: string; message: string; type?: 'info' | 'error'; onClose: () => void }> = ({ title, message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 left-4 right-4 z-[250] glass border ${type === 'error' ? 'border-red-500/50 bg-red-500/10' : 'border-white/20 dark:border-white/10'} text-gray-900 dark:text-white p-4 rounded-3xl shadow-ios-lg flex items-start gap-3 transform transition-all animate-[slideIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]`}>
      <div className={`p-2.5 rounded-full shrink-0 ${type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
        {type === 'error' ? <AlertTriangle size={20} /> : <Bell size={20} />}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <h4 className="font-bold text-sm tracking-tight">{title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed break-words">{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-1">
        <X size={18} />
      </button>
    </div>
  );
};

// Full Screen Alarm Overlay
const AlarmOverlay: React.FC<{ title: string; body: string; onDismiss: () => void; onComplete?: () => void }> = ({ title, body, onDismiss, onComplete }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-white animate-fade-in">
            <div className="animate-bounce mb-8 p-6 bg-red-500/20 rounded-full">
                <AlarmClock size={64} className="text-red-500" />
            </div>
            <h2 className="text-4xl font-black mb-4 text-center tracking-tight">{title}</h2>
            <p className="text-gray-300 mb-16 text-center text-xl font-medium">{body}</p>
            
            <div className="w-full max-w-sm space-y-4">
                {onComplete && (
                    <button 
                        onClick={onComplete}
                        className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg rounded-3xl shadow-glow active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <CheckSquare size={24} strokeWidth={3} />
                        I DID IT
                    </button>
                )}
                <button 
                    onClick={onDismiss}
                    className="w-full py-5 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold text-lg rounded-3xl active:scale-95 transition-transform"
                >
                    SNOOZE / STOP
                </button>
            </div>
        </div>
    );
};

// Generate a simple dynamic image for notification banner
const generateNotificationImage = (text: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#111827'); // gray-900
    gradient.addColorStop(1, '#000000'); // black
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("LifestyleOS", 256, 200);

    ctx.fillStyle = '#4ADE80'; // emerald-400
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(text, 256, 300);

    return canvas.toDataURL('image/png');
};

// --- Background Audio Keeper ---
// This component plays silent audio to keep the app alive and triggers the "Tick" for alarms
const BackgroundAudioKeeper: React.FC<{ onTick: () => void; onError: (msg: string) => void }> = ({ onTick, onError }) => {
    const { state } = useApp();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioSrc, setAudioSrc] = useState<string>("");

    // Base64 Silent MP3 - Most reliable cross-platform format for this hack
    const SILENT_MP3 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTSVMAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAAAMAADAP////////////8AAAAA//NIxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NIxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

    useEffect(() => {
        setAudioSrc(SILENT_MP3);
    }, []);
    
    useLayoutEffect(() => {
        const setupMediaSession = () => {
            if ('mediaSession' in navigator) {
                const artworkImage = generateNotificationImage("Active") || 'https://api.iconify.design/lucide:zap.svg?color=%23ffffff';

                navigator.mediaSession.metadata = new MediaMetadata({
                    title: 'LifestyleOS Active',
                    artist: 'Background Service',
                    album: 'Keep-Alive',
                    artwork: [
                        { src: artworkImage, sizes: '512x512', type: 'image/png' }
                    ]
                });

                const noop = () => {};
                navigator.mediaSession.setActionHandler('play', () => { 
                    audioRef.current?.play(); 
                    navigator.mediaSession.playbackState = 'playing';
                });
                navigator.mediaSession.setActionHandler('pause', () => { 
                    audioRef.current?.play(); // Trap pause to keep playing
                    navigator.mediaSession.playbackState = 'playing';
                });
                navigator.mediaSession.setActionHandler('stop', noop); 
                navigator.mediaSession.setActionHandler('seekbackward', noop); 
                navigator.mediaSession.setActionHandler('seekforward', noop); 
                navigator.mediaSession.setActionHandler('previoustrack', noop); 
                navigator.mediaSession.setActionHandler('nexttrack', noop); 

                navigator.mediaSession.playbackState = 'playing';
            }
        };

        window.lifestyleAudio = {
            enable: async () => {
                const audio = audioRef.current;
                if (!audio) return;
                
                try {
                    audio.currentTime = 0;
                    audio.volume = 1.0; 
                    await audio.play();
                    setupMediaSession();
                } catch (e: any) {
                    console.error("Audio Enable Error:", e);
                    // Pass specific error up to UI
                    onError(`Audio Start Failed: ${e.message || e.toString()}`);
                    throw e; // Re-throw for caller
                }
            },
            disable: () => {
                 const audio = audioRef.current;
                 if (audio) {
                     audio.pause();
                     audio.currentTime = 0;
                 }
                 if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
            },
            isPlaying: () => {
                return audioRef.current ? !audioRef.current.paused : false;
            }
        };
        return () => { window.lifestyleAudio = undefined; };
    }, [onError]);

    // AUTO-START ON INTERACTION
    // Browsers block autoplay. We must wait for the first user interaction.
    useEffect(() => {
        if (!state.user.backgroundKeepAlive) return;

        const attemptPlay = async () => {
             if (audioRef.current && audioRef.current.paused) {
                 try {
                     await window.lifestyleAudio?.enable();
                     // If success, remove listeners
                     document.removeEventListener('click', attemptPlay);
                     document.removeEventListener('touchstart', attemptPlay);
                 } catch (e) {
                     // If it fails (still blocked?), keep listener attached
                 }
             }
        };

        // Try immediately (might work if we are in a click chain)
        attemptPlay();

        // Attach listeners to "catch" the next interaction
        document.addEventListener('click', attemptPlay);
        document.addEventListener('touchstart', attemptPlay);

        return () => {
            document.removeEventListener('click', attemptPlay);
            document.removeEventListener('touchstart', attemptPlay);
        };
    }, [state.user.backgroundKeepAlive]);

    // This is the heartbeat of the app in background mode
    const handleTimeUpdate = () => {
         // Re-assert playback state
         if ('mediaSession' in navigator && navigator.mediaSession.playbackState !== 'playing') {
             navigator.mediaSession.playbackState = 'playing';
         }
         
         // Trigger the Alarm Check Tick
         onTick();

         // Loop manually if loop attribute fails
         if (audioRef.current && audioRef.current.paused && state.user.backgroundKeepAlive) {
             audioRef.current.play().catch(() => {});
         }
    };

    return (
        <audio 
            ref={audioRef} 
            src={audioSrc} 
            loop 
            playsInline
            onTimeUpdate={handleTimeUpdate}
            style={{ 
                position: 'fixed', 
                bottom: 0, 
                right: 0,
                width: '1px',
                height: '1px',
                opacity: 0.001,
                pointerEvents: 'none',
                zIndex: 9999,
                visibility: 'visible'
            }}
        />
    );
};

// --- Notification & Sound Manager ---
const NotificationManager: React.FC<{ 
    tick: number, // Signal from audio loop
    onNotify: (title: string, msg: string) => void,
    onAlarmStart: (title: string, msg: string, id?: number, type?: 'habit' | 'todo') => void
    alarmDismissSignal: number 
    onRemoteDismiss: () => void;
    onRemoteComplete: (id: number, type: 'habit' | 'todo') => void;
}> = ({ tick, onNotify, onAlarmStart, alarmDismissSignal, onRemoteDismiss, onRemoteComplete }) => {
  const { state } = useApp();
  const lastCheckedTotalMinutes = useRef<number>(new Date().getHours() * 60 + new Date().getMinutes());
  const activeOscillator = useRef<OscillatorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context on first interaction
  useEffect(() => {
      const initAudio = () => {
          if (!audioContextRef.current) {
              const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContext) {
                  audioContextRef.current = new AudioContext();
              }
          }
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
              audioContextRef.current.resume();
          }
      };
      document.addEventListener('click', initAudio, { once: true });
      document.addEventListener('touchstart', initAudio, { once: true });
      return () => {
          document.removeEventListener('click', initAudio);
          document.removeEventListener('touchstart', initAudio);
      };
  }, []);

  // Handle SW Messages
  useEffect(() => {
      const handleSWMessage = (event: MessageEvent) => {
          if (!event.data) return;
          if (event.data.type === 'DISMISS_ALARM') onRemoteDismiss();
          else if (event.data.type === 'COMPLETE_HABIT' && event.data.habitId) onRemoteComplete(parseInt(event.data.habitId), 'habit');
          else if (event.data.type === 'COMPLETE_TODO' && event.data.todoId) onRemoteComplete(parseInt(event.data.todoId), 'todo');
      };

      if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => { if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('message', handleSWMessage); };
  }, [onRemoteDismiss, onRemoteComplete]);

  // Stop sound on dismiss
  useEffect(() => {
      if (activeOscillator.current) {
          try {
              activeOscillator.current.stop();
              activeOscillator.current.disconnect();
          } catch (e) { /* ignore */ }
          activeOscillator.current = null;
      }
  }, [alarmDismissSignal]);

  const playSound = (type: 'alarm' | 'chime') => {
    const { soundEnabled, vibrationEnabled, alarmDuration, chimeDuration, soundType } = state.user;
    if (soundEnabled === false) return;
    if (isDNDActive()) return;

    if (vibrationEnabled && navigator.vibrate) {
        if (type === 'alarm') navigator.vibrate([500, 200, 500, 200, 1000]); 
        else navigator.vibrate([100, 50, 100]);
    }

    try {
      if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) audioContextRef.current = new AudioContext();
      }
      
      const ctx = audioContextRef.current;
      if (!ctx) return;
      
      // Ensure context is running
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const duration = type === 'alarm' ? alarmDuration : chimeDuration;

      if (type === 'alarm') {
        if (soundType === 'classic') {
             // Classic Digital Alarm Clock (Beep-Beep-Beep)
             osc.type = 'square';
             osc.frequency.setValueAtTime(880, now); // A5
             
             // Pulse Volume
             const beepLen = 0.15;
             const pauseLen = 0.1;
             
             // Initial Gain
             gain.gain.setValueAtTime(0, now);

             for(let i=0; i < duration; i += 1) { // 1 second loop
                // Beep 1
                gain.gain.setValueAtTime(0.3, now + i);
                gain.gain.setValueAtTime(0, now + i + beepLen);
                // Beep 2
                gain.gain.setValueAtTime(0.3, now + i + beepLen + pauseLen);
                gain.gain.setValueAtTime(0, now + i + (beepLen*2) + pauseLen);
                // Beep 3
                gain.gain.setValueAtTime(0.3, now + i + (beepLen*2) + (pauseLen*2));
                gain.gain.setValueAtTime(0, now + i + (beepLen*3) + (pauseLen*2));
             }

        } else if (soundType === 'retro') {
             // 8-bit Arpeggio
             osc.type = 'sawtooth';
             for(let i=0; i < duration; i+=0.4) {
                 osc.frequency.setValueAtTime(220, now + i);
                 osc.frequency.setValueAtTime(440, now + i + 0.1);
                 osc.frequency.setValueAtTime(880, now + i + 0.2);
                 osc.frequency.setValueAtTime(1760, now + i + 0.3);
                 
                 gain.gain.setValueAtTime(0.1, now + i);
                 gain.gain.linearRampToValueAtTime(0.05, now + i + 0.3);
                 gain.gain.setValueAtTime(0, now + i + 0.4);
             }
        } else {
             // Modern: Smooth Sine Pulses
             osc.type = 'sine';
             for(let i=0; i < duration; i+=2) {
                 // High-Low-High gentle sequence
                 osc.frequency.setValueAtTime(880, now + i);
                 gain.gain.setValueAtTime(0, now + i);
                 gain.gain.linearRampToValueAtTime(0.5, now + i + 0.1);
                 gain.gain.linearRampToValueAtTime(0, now + i + 0.8);
                 
                 osc.frequency.setValueAtTime(1100, now + i + 0.9);
                 gain.gain.linearRampToValueAtTime(0.5, now + i + 1.0);
                 gain.gain.linearRampToValueAtTime(0, now + i + 1.8);
             }
        }
        
        osc.start(now);
        osc.stop(now + duration);
        activeOscillator.current = osc;

      } else {
         // Notification Chime
         osc.type = 'sine';
         osc.frequency.setValueAtTime(523.25, now); // C5
         
         gain.gain.setValueAtTime(0, now);
         gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
         
         osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // Slide to C6
         gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
         
         osc.start(now);
         osc.stop(now + 0.5);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const sendNotification = async (title: string, body: string, isAlarm: boolean, id?: number, type?: 'habit' | 'todo') => {
    if (!("Notification" in window)) return;
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== "granted") return;
    if (isDNDActive()) return;

    // Wake Lock Attempt (Experimental)
    if ('wakeLock' in navigator && isAlarm) {
        try { await (navigator as any).wakeLock.request('screen'); } catch(e){}
    }

    const iconUrl = "https://api.iconify.design/lucide:layout-grid.svg?color=%23111827";
    const imageUrl = generateNotificationImage(title);
    const actions: any[] = [];
    if (isAlarm || id) {
        actions.push({ action: 'complete', title: '✅ Complete' });
        actions.push({ action: 'dismiss', title: 'Stop' });
    } else {
        actions.push({ action: 'dismiss', title: 'Dismiss' });
    }
    const options: any = {
        body, icon: iconUrl, badge: iconUrl, image: imageUrl,
        vibrate: [500, 250, 500, 250],
        tag: isAlarm ? 'alarm-' + Date.now() : 'notification-' + (id || 'general'),
        renotify: true, 
        requireInteraction: true, // Key for waking/keeping screen on
        silent: false,
        data: { url: window.location.href, habitId: type === 'habit' ? id : undefined, todoId: type === 'todo' ? id : undefined },
        actions: actions
    };
    if ('serviceWorker' in navigator) {
        try {
            let reg = await navigator.serviceWorker.getRegistration();
            if (!reg) reg = await navigator.serviceWorker.ready;
            if (reg) { await reg.showNotification(title, options); return; }
        } catch (e) { console.warn("SW notify failed", e); }
    }
    try { new Notification(title, options); } catch (e) { onNotify("Notification Error", "Could not display notification."); }
  };

  const isDNDActive = () => {
     const { dndStartTime, dndEndTime } = state.user;
     if (!dndStartTime || !dndEndTime) return false;
     const now = new Date();
     const currentMinutes = now.getHours() * 60 + now.getMinutes();
     const [startH, startM] = dndStartTime.split(':').map(Number);
     const [endH, endM] = dndEndTime.split(':').map(Number);
     const startTotal = startH * 60 + startM;
     const endTotal = endH * 60 + endM;
     if (startTotal < endTotal) return currentMinutes >= startTotal && currentMinutes < endTotal;
     else return currentMinutes >= startTotal || currentMinutes < endTotal;
  };

  // CHECK REMINDERS (Triggered by Audio Tick or Interval)
  useEffect(() => {
      const check = () => {
          if (isDNDActive()) return;
          const now = new Date();
          const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
          
          // Avoid duplicate checks within the same minute
          if (currentTotalMinutes === lastCheckedTotalMinutes.current) return;
          
          const today = getTodayStr();
          let alarmTriggered = false;
          let chimeTriggered = false;
          let notificationTitle = "";
          let notificationBody = "";
          let alarmId: number | undefined;
          let alarmType: 'habit' | 'todo' | undefined;

          // HABITS
          state.habits.forEach(habit => {
            let shouldNotify = false;
            let isDailyAlarm = false;

            if (habit.reminderTime) {
               const [remH, remM] = habit.reminderTime.split(':').map(Number);
               const remTotal = remH * 60 + remM;
               // Robust window check: Did we cross the time boundary since last check?
               if (remTotal > lastCheckedTotalMinutes.current && remTotal <= currentTotalMinutes) {
                   shouldNotify = true; isDailyAlarm = true;
                   notificationTitle = `Time for ${habit.name}`; notificationBody = `It's ${habit.reminderTime}. Let's get it done.`;
                   alarmId = habit.id; alarmType = 'habit';
               }
            }
            if (!shouldNotify && habit.reminderInterval && habit.reminderInterval > 0) {
               const interval = habit.reminderInterval;
               const lastStep = Math.floor(lastCheckedTotalMinutes.current / interval);
               const currentStep = Math.floor(currentTotalMinutes / interval);
               if (currentStep > lastStep) {
                 const val = state.logs[today]?.[habit.id];
                 const isDone = habit.type === 'checkbox' ? !!val : (val as number || 0) >= (habit.target || 1);
                 if (!isDone) {
                    shouldNotify = true; notificationTitle = `Reminder: ${habit.name}`; notificationBody = `Keep the streak alive!`;
                    alarmId = habit.id; alarmType = 'habit';
                 }
               }
            }
            if (shouldNotify) {
                if (isDailyAlarm) { alarmTriggered = true; onAlarmStart(notificationTitle, notificationBody, alarmId, alarmType); }
                else { chimeTriggered = true; onNotify(notificationTitle, notificationBody); }
                sendNotification(notificationTitle, notificationBody, isDailyAlarm, alarmId, alarmType);
            }
          });

          // TODOS
          state.todos.forEach(todo => {
              if (todo.done) return;
              let shouldNotify = false; let isDailyAlarm = false;
              if (todo.reminderTime) {
                  const [tH, tM] = todo.reminderTime.split(':').map(Number);
                  const tTotal = tH * 60 + tM;
                  if (tTotal > lastCheckedTotalMinutes.current && tTotal <= currentTotalMinutes) {
                      shouldNotify = true; isDailyAlarm = true;
                      notificationTitle = "Mission Alert"; notificationBody = todo.text;
                      alarmId = todo.id; alarmType = 'todo';
                  }
              }
              if (!shouldNotify && todo.reminderInterval && todo.reminderInterval > 0) {
                   const interval = todo.reminderInterval;
                   const lastStep = Math.floor(lastCheckedTotalMinutes.current / interval);
                   const currentStep = Math.floor(currentTotalMinutes / interval);
                   if (currentStep > lastStep) {
                       shouldNotify = true; notificationTitle = "Mission Reminder"; notificationBody = `Still pending: ${todo.text}`;
                       alarmId = todo.id; alarmType = 'todo';
                   }
              }
              if (shouldNotify) {
                  if (isDailyAlarm) { alarmTriggered = true; onAlarmStart(notificationTitle, notificationBody, alarmId, alarmType); }
                  else { chimeTriggered = true; onNotify(notificationTitle, notificationBody); }
                  sendNotification(notificationTitle, notificationBody, isDailyAlarm, alarmId, alarmType);
              }
          });

          if (alarmTriggered) playSound('alarm');
          else if (chimeTriggered) playSound('chime');
          
          lastCheckedTotalMinutes.current = currentTotalMinutes;
      };

      check();
  }, [tick, state.habits, state.todos, state.logs, state.user]); // Dependencies include 'tick'

  return null;
};

const TAB_ORDER = ['home', 'habits', 'meals', 'goals', 'reports'] as const;

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'habits' | 'meals' | 'goals' | 'reports'>('home');
  const activeIndex = TAB_ORDER.indexOf(activeTab);

  const { state, fabOnClick, toggleHabit, toggleTodo } = useApp();
  const [toast, setToast] = useState<{title: string, msg: string, type: 'info' | 'error'} | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<{title: string, msg: string, id?: number, type?: 'habit' | 'todo'} | null>(null);
  const [dismissSignal, setDismissSignal] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Audio Tick State
  const [audioTick, setAudioTick] = useState(0);

  // --- NEW SWIPE LOGIC ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  
  // To detect vertical scroll vs swipe
  const isScrollLocked = useRef(false); 
  
  // Get theme
  const theme = getThemeColors(state.user.accentColor);

  useEffect(() => {
    if (state.user.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state.user.theme]);

  const handleNotify = useCallback((title: string, msg: string) => setToast({ title, msg, type: 'info' }), []);
  const handleAudioError = useCallback((msg: string) => setToast({ title: "Background Audio Error", msg, type: 'error' }), []);

  // Callback passed to BackgroundAudioKeeper to signal a tick
  const handleAudioTick = useCallback(() => {
      setAudioTick(t => t + 1);
  }, []);

  const handleAlarmStart = useCallback((title: string, msg: string, id?: number, type?: 'habit' | 'todo') => setActiveAlarm({ title, msg, id, type }), []);
  const handleDismissAlarm = useCallback(() => { setActiveAlarm(null); setDismissSignal(prev => prev + 1); }, []);
  const handleCompleteAlarm = useCallback(() => {
      if (activeAlarm?.id) {
          if (activeAlarm.type === 'habit') toggleHabit(activeAlarm.id, getTodayStr());
          else if (activeAlarm.type === 'todo') toggleTodo(activeAlarm.id);
          setToast({ title: "Awesome!", msg: "Completed. Keep it up!", type: 'info' });
      }
      handleDismissAlarm();
  }, [activeAlarm, toggleHabit, toggleTodo, handleDismissAlarm]);

  const handleRemoteComplete = useCallback((id: number, type: 'habit' | 'todo') => {
      if (type === 'habit') toggleHabit(id, getTodayStr());
      else if (type === 'todo') toggleTodo(id);
      setToast({ title: "Awesome!", msg: "Marked done via notification.", type: 'info' });
      handleDismissAlarm();
  }, [toggleHabit, toggleTodo, handleDismissAlarm]);

  const triggerHaptic = () => {
      if (navigator.vibrate && state.user.vibrationEnabled) navigator.vibrate(10);
  };

  const switchTab = (tab: typeof activeTab) => {
      setActiveTab(tab);
      triggerHaptic();
      setDragOffset(0);
  };

  const openSettings = () => setIsSettingsOpen(true);

  // --- TOUCH HANDLERS ---
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    isScrollLocked.current = false;
    setIsSwiping(false);
    setDragOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStart.x;
    const deltaY = currentY - touchStart.y;

    if (!isScrollLocked.current && !isSwiping) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            isScrollLocked.current = true;
            return;
        } else if (Math.abs(deltaX) > 10) {
            setIsSwiping(true);
        }
    }

    if (isSwiping) {
        if (e.cancelable) e.preventDefault(); 
        if ((activeIndex === 0 && deltaX > 0) || (activeIndex === TAB_ORDER.length - 1 && deltaX < 0)) {
            setDragOffset(deltaX * 0.3);
        } else {
            setDragOffset(deltaX);
        }
    }
  };

  const onTouchEnd = () => {
    if (!touchStart) return;

    if (isSwiping) {
        const threshold = window.innerWidth * 0.25; 
        
        if (dragOffset > threshold && activeIndex > 0) {
            switchTab(TAB_ORDER[activeIndex - 1]);
        } else if (dragOffset < -threshold && activeIndex < TAB_ORDER.length - 1) {
            switchTab(TAB_ORDER[activeIndex + 1]);
        }
    }
    
    setDragOffset(0);
    setIsSwiping(false);
    setTouchStart(null);
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button 
      onClick={() => switchTab(id)}
      className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 group`}
    >
      <div className={`transition-all duration-300 ${activeTab === id ? `${theme.text} scale-110` : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300'}`}>
          <Icon size={26} strokeWidth={activeTab === id ? 2.5 : 2} />
      </div>
    </button>
  );

  return (
    <div className="mx-auto h-[100dvh] bg-[#F2F2F7] dark:bg-black overflow-hidden relative flex flex-col transition-colors duration-500">
      {/* Background Audio tick passed to Notification Manager */}
      <BackgroundAudioKeeper onTick={handleAudioTick} onError={handleAudioError} />
      <NotificationManager 
        tick={audioTick}
        onNotify={handleNotify} onAlarmStart={handleAlarmStart} alarmDismissSignal={dismissSignal}
        onRemoteDismiss={handleDismissAlarm} onRemoteComplete={handleRemoteComplete}
      />
      
      {activeAlarm && (
          <AlarmOverlay title={activeAlarm.title} body={activeAlarm.msg} onDismiss={handleDismissAlarm} onComplete={activeAlarm.id ? handleCompleteAlarm : undefined} />
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {toast && <Toast title={toast.title} message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <main 
        className="flex-1 w-full h-full relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
            className="flex w-[500%] h-full will-change-transform"
            style={{
                transform: `translateX(calc(-${activeIndex * 20}% + ${dragOffset}px))`,
                transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
        >
            <div className="w-[20%] h-full overflow-y-auto no-scrollbar p-4 sm:p-6 pb-28">
                <TabHome onOpenSettings={openSettings} />
            </div>
            <div className="w-[20%] h-full overflow-y-auto no-scrollbar p-4 sm:p-6 pb-28">
                {/* Passed isActive prop so FAB only shows here */}
                <TabHabits onOpenSettings={openSettings} isActive={activeTab === 'habits'} />
            </div>
            <div className="w-[20%] h-full overflow-y-auto no-scrollbar p-4 sm:p-6 pb-28">
                <TabMeals onOpenSettings={openSettings} />
            </div>
            <div className="w-[20%] h-full overflow-y-auto no-scrollbar p-4 sm:p-6 pb-28">
                <TabGoals onOpenSettings={openSettings} />
            </div>
            <div className="w-[20%] h-full overflow-y-auto no-scrollbar p-4 sm:p-6 pb-28">
                <TabReports onOpenSettings={openSettings} />
            </div>
        </div>
      </main>

      {/* Renders FAB only if active tab (Habits) requests it */}
      {fabOnClick && (
        <div className="fixed bottom-28 right-6 max-w-md mx-auto w-full pointer-events-none flex justify-end z-40">
            <button 
            onClick={fabOnClick}
            className={`pointer-events-auto w-16 h-16 ${theme.bg} ${theme.buttonText} rounded-[2rem] shadow-glow flex items-center justify-center hover:scale-105 active:scale-90 transition-all duration-300`}
            style={{ marginRight: 'calc(max(0px, (100vw - 28rem) / 2))' }}
            >
            <Plus size={32} strokeWidth={2.5} />
            </button>
        </div>
      )}

      <div className="fixed bottom-8 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <nav className="pointer-events-auto w-full max-w-[22rem] h-[72px] glass border border-white/40 dark:border-white/10 rounded-[2.5rem] shadow-ios-lg flex items-center justify-between px-6">
            <NavItem id="home" icon={Home} label="Home" />
            <NavItem id="habits" icon={CheckSquare} label="Habits" />
            <NavItem id="meals" icon={Utensils} label="Meals" />
            <NavItem id="goals" icon={Target} label="Goals" />
            <NavItem id="reports" icon={BarChart3} label="Reports" />
          </nav>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;