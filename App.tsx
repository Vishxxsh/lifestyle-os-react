import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TabHome } from './components/TabHome';
import { TabHabits } from './components/TabHabits';
import { TabMeals } from './components/TabMeals';
import { TabGoals } from './components/TabGoals';
import { TabReports } from './components/TabReports';
import { SettingsModal } from './components/SettingsModal';
import { Home, CheckSquare, Utensils, Target, BarChart3, Plus, X, Bell, AlarmClock } from 'lucide-react';
import { getTodayStr, getThemeColors } from './utils';

// Toast Component
const Toast: React.FC<{ title: string; message: string; onClose: () => void }> = ({ title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-4 right-4 z-[100] glass border border-white/20 dark:border-white/10 text-gray-900 dark:text-white p-4 rounded-3xl shadow-ios-lg flex items-start gap-3 transform transition-all animate-[slideIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
      <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-full shrink-0">
        <Bell size={20} />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <h4 className="font-bold text-sm tracking-tight">{title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{message}</p>
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

// --- Background Audio Keeper (Smart Unlock Version) ---
// 1-second silent MP3
const SILENT_AUDIO_URL = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASAAAAAAAasqkxAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASAAAAAAAasqkxAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASAAAAAAAasqkxAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const BackgroundAudioKeeper: React.FC<{ onBlocked: () => void }> = ({ onBlocked }) => {
    const { state } = useApp();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const hasUnlocked = useRef(false);

    // 1. PRE-EMPTIVE UNLOCKER: Listens for the first tap anywhere to "Bless" the audio
    useEffect(() => {
        const unlockAudio = () => {
            if (audioRef.current && !hasUnlocked.current) {
                // Play and immediately pause just to get permission
                audioRef.current.play()
                    .then(() => {
                        if (!state.user.backgroundKeepAlive) {
                            audioRef.current?.pause();
                        }
                        hasUnlocked.current = true;
                    })
                    .catch(() => { /* Ignore initial failures */ });
            }
        };

        const events = ['click', 'touchstart', 'keydown'];
        events.forEach(evt => window.addEventListener(evt, unlockAudio, { capture: true, once: true }));

        return () => {
            events.forEach(evt => window.removeEventListener(evt, unlockAudio, { capture: true }));
        };
    }, [state.user.backgroundKeepAlive]);

    // 2. MAIN LOGIC: Handles the actual Focus Mode toggle
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const startPlayback = async () => {
            try {
                audio.volume = 1.0; 
                audio.loop = true;
                
                await audio.play();
                setIsBlocked(false);
                
                if ('mediaSession' in navigator) {
                    const artworkImage = generateNotificationImage("Active") || 'https://api.iconify.design/lucide:zap.svg?color=%23ffffff';
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: 'LifestyleOS',
                        artist: 'Focus Mode Active',
                        album: 'Keep-Alive Service',
                        artwork: [{ src: artworkImage, sizes: '512x512', type: 'image/png' }]
                    });

                    const noop = () => {};
                    navigator.mediaSession.setActionHandler('play', () => audio.play());
                    navigator.mediaSession.setActionHandler('pause', () => audio.play()); // FORCE RESUME
                    navigator.mediaSession.setActionHandler('stop', noop);
                    navigator.mediaSession.playbackState = 'playing';
                }
            } catch (err) {
                console.warn("Autoplay blocked:", err);
                // Only show error if we haven't managed to unlock it yet
                if (!hasUnlocked.current) {
                    setIsBlocked(true);
                    onBlocked();
                }
            }
        };

        if (state.user.backgroundKeepAlive) {
            startPlayback();
        } else {
            audio.pause();
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
        }
    }, [state.user.backgroundKeepAlive, onBlocked]);

    // 3. FALLBACK: If it was blocked, fix it on next click
    useEffect(() => {
        if (!isBlocked || !state.user.backgroundKeepAlive) return;

        const handleInteraction = () => {
            if (audioRef.current) {
                audioRef.current.play()
                    .then(() => {
                        setIsBlocked(false);
                        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
                    })
                    .catch(console.error);
            }
        };

        window.addEventListener('click', handleInteraction, { once: true });
        return () => window.removeEventListener('click', handleInteraction);
    }, [isBlocked, state.user.backgroundKeepAlive]);

    return (
        <audio 
            ref={audioRef} 
            src={SILENT_AUDIO_URL} 
            loop 
            playsInline
            style={{ 
                opacity: 0.01, 
                position: 'fixed', 
                bottom: 0, 
                left: 0, 
                pointerEvents: 'none',
                height: '1px', 
                width: '1px',
                zIndex: -1 
            }}
        />
    );
};
const NotificationManager: React.FC<{ 
    onNotify: (title: string, msg: string) => void,
    onAlarmStart: (title: string, msg: string, id?: number, type?: 'habit' | 'todo') => void
    alarmDismissSignal: number 
    onRemoteDismiss: () => void;
    onRemoteComplete: (id: number, type: 'habit' | 'todo') => void;
}> = ({ onNotify, onAlarmStart, alarmDismissSignal, onRemoteDismiss, onRemoteComplete }) => {
  const { state } = useApp();
  const lastCheckedTotalMinutes = useRef<number>(new Date().getHours() * 60 + new Date().getMinutes());
  const activeOscillator = useRef<OscillatorNode | null>(null);
  const scheduledTriggers = useRef<Set<string>>(new Set());

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

    const duration = type === 'alarm' ? alarmDuration : chimeDuration;

    if (vibrationEnabled && navigator.vibrate) {
        if (type === 'alarm') navigator.vibrate([500, 200, 500, 200, 1000]); 
        else navigator.vibrate([100, 50, 100]);
    }

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'alarm') {
        if (soundType === 'classic') {
             osc.type = 'square';
             osc.frequency.setValueAtTime(880, now);
             for(let i=0; i < duration; i += 1) {
                gain.gain.setValueAtTime(0.2, now + i);
                gain.gain.setValueAtTime(0, now + i + 0.1);
             }
        } else if (soundType === 'retro') {
             osc.type = 'sawtooth';
             for(let i=0; i < duration; i+=0.5) {
                 osc.frequency.setValueAtTime(440, now + i);
                 osc.frequency.setValueAtTime(880, now + i + 0.1);
                 gain.gain.setValueAtTime(0.15, now + i);
                 gain.gain.linearRampToValueAtTime(0, now + i + 0.5);
             }
        } else {
             osc.type = 'triangle';
             osc.frequency.setValueAtTime(880, now);
             for(let i=0; i < duration; i+=1.5) {
                 gain.gain.setValueAtTime(0, now + i);
                 gain.gain.linearRampToValueAtTime(0.3, now + i + 0.1);
                 gain.gain.linearRampToValueAtTime(0, now + i + 1.2);
             }
        }
        osc.start(now);
        osc.stop(now + duration);
        activeOscillator.current = osc;

      } else {
         osc.type = 'sine';
         osc.frequency.setValueAtTime(523.25, now); 
         if (duration <= 1) {
             osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); 
             gain.gain.setValueAtTime(0.1, now);
             gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
             osc.stop(now + 0.5);
         } else {
             osc.frequency.setValueAtTime(880, now); // A5
             const attack = 0.1;
             const release = 0.5;
             gain.gain.setValueAtTime(0, now);
             gain.gain.linearRampToValueAtTime(0.1, now + attack);
             gain.gain.setValueAtTime(0.1, now + duration - release);
             gain.gain.linearRampToValueAtTime(0, now + duration);
             osc.stop(now + duration);
         }
         osc.start(now);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const scheduleNotification = async (title: string, body: string, triggerTimestamp: number, tag: string) => {
      if ('serviceWorker' in navigator && 'showTrigger' in Notification.prototype) {
           const reg = await navigator.serviceWorker.ready;
           if (scheduledTriggers.current.has(tag)) return;
           try {
               await reg.showNotification(title, {
                   body, tag,
                   icon: "https://api.iconify.design/lucide:layout-grid.svg?color=%23111827",
                   // @ts-ignore
                   showTrigger: new TimestampTrigger(triggerTimestamp), 
                   data: { url: window.location.href }
               });
               scheduledTriggers.current.add(tag);
           } catch(e) { console.warn("TimestampTrigger failed", e); }
      }
  };

  const sendNotification = async (title: string, body: string, isAlarm: boolean, id?: number, type?: 'habit' | 'todo') => {
    if (!("Notification" in window)) return;
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== "granted") return;
    if (isDNDActive()) return;

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
        renotify: true, requireInteraction: true, silent: false,
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

  useEffect(() => {
    const checkReminders = () => {
      if (isDNDActive()) return;
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      const today = getTodayStr();

      if (currentTotalMinutes === lastCheckedTotalMinutes.current) return;

      let alarmTriggered = false;
      let chimeTriggered = false;
      let notificationTitle = "";
      let notificationBody = "";
      let alarmId: number | undefined;
      let alarmType: 'habit' | 'todo' | undefined;

      state.habits.forEach(habit => {
        let shouldNotify = false;
        let isDailyAlarm = false;

        if (habit.reminderTime) {
           const [remH, remM] = habit.reminderTime.split(':').map(Number);
           const remTotal = remH * 60 + remM;
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
                const nextIntervalMinutes = (currentStep + 1) * interval;
                const nextDate = new Date();
                nextDate.setHours(Math.floor(nextIntervalMinutes / 60)); nextDate.setMinutes(nextIntervalMinutes % 60); nextDate.setSeconds(0);
                if (nextDate.getTime() > Date.now()) scheduleNotification(notificationTitle, notificationBody, nextDate.getTime(), `interval-${habit.id}-${currentStep+1}`);
             }
           }
        }
        if (shouldNotify) {
            if (isDailyAlarm) { alarmTriggered = true; onAlarmStart(notificationTitle, notificationBody, alarmId, alarmType); }
            else { chimeTriggered = true; onNotify(notificationTitle, notificationBody); }
            sendNotification(notificationTitle, notificationBody, isDailyAlarm, alarmId, alarmType);
        }
      });

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
    const interval = setInterval(checkReminders, 5000); 
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') checkReminders(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", handleVisibilityChange); };
  }, [state.habits, state.todos, state.logs, onNotify, onAlarmStart, state.user]);
  return null;
};

const TAB_ORDER = ['home', 'habits', 'meals', 'goals', 'reports'] as const;

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'habits' | 'meals' | 'goals' | 'reports'>('home');
  const activeIndex = TAB_ORDER.indexOf(activeTab);

  const { state, fabOnClick, toggleHabit, toggleTodo } = useApp();
  const [toast, setToast] = useState<{title: string, msg: string} | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<{title: string, msg: string, id?: number, type?: 'habit' | 'todo'} | null>(null);
  const [dismissSignal, setDismissSignal] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  const handleNotify = useCallback((title: string, msg: string) => setToast({ title, msg }), []);
  
  // Handler for when audio is blocked by browser policy
  const handleAudioBlocked = useCallback(() => {
      setToast({ 
          title: "Background Mode Paused", 
          msg: "Tap anywhere to activate background alarms." 
      });
  }, []);

  const handleAlarmStart = useCallback((title: string, msg: string, id?: number, type?: 'habit' | 'todo') => setActiveAlarm({ title, msg, id, type }), []);
  const handleDismissAlarm = useCallback(() => { setActiveAlarm(null); setDismissSignal(prev => prev + 1); }, []);
  const handleCompleteAlarm = useCallback(() => {
      if (activeAlarm?.id) {
          if (activeAlarm.type === 'habit') toggleHabit(activeAlarm.id, getTodayStr());
          else if (activeAlarm.type === 'todo') toggleTodo(activeAlarm.id);
          setToast({ title: "Awesome!", msg: "Completed. Keep it up!" });
      }
      handleDismissAlarm();
  }, [activeAlarm, toggleHabit, toggleTodo, handleDismissAlarm]);

  const handleRemoteComplete = useCallback((id: number, type: 'habit' | 'todo') => {
      if (type === 'habit') toggleHabit(id, getTodayStr());
      else if (type === 'todo') toggleTodo(id);
      setToast({ title: "Awesome!", msg: "Marked done via notification." });
      handleDismissAlarm();
  }, [toggleHabit, toggleTodo, handleDismissAlarm]);

  const triggerHaptic = () => {
      if (navigator.vibrate && state.user.vibrationEnabled) navigator.vibrate(10);
  };

  const switchTab = (tab: typeof activeTab) => {
      setActiveTab(tab);
      triggerHaptic();
      // Reset drag just in case
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

    // Determine intent on first significant move
    if (!isScrollLocked.current && !isSwiping) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            // Vertical scroll dominant - Lock swipe
            isScrollLocked.current = true;
            return;
        } else if (Math.abs(deltaX) > 10) {
            // Horizontal swipe dominant
            setIsSwiping(true);
        }
    }

    if (isSwiping) {
        // Prevent browser back/forward gestures if handled
        if (e.cancelable) e.preventDefault(); 
        
        // Add resistance at edges
        if ((activeIndex === 0 && deltaX > 0) || (activeIndex === TAB_ORDER.length - 1 && deltaX < 0)) {
            setDragOffset(deltaX * 0.3); // High resistance
        } else {
            setDragOffset(deltaX);
        }
    }
  };

  const onTouchEnd = () => {
    if (!touchStart) return;

    if (isSwiping) {
        const threshold = window.innerWidth * 0.25; // Swipe 25% of screen to trigger
        
        if (dragOffset > threshold && activeIndex > 0) {
            // Swipe Right -> Prev Tab
            switchTab(TAB_ORDER[activeIndex - 1]);
        } else if (dragOffset < -threshold && activeIndex < TAB_ORDER.length - 1) {
            // Swipe Left -> Next Tab
            switchTab(TAB_ORDER[activeIndex + 1]);
        }
        // If not threshold met, or edge case, it snaps back because dragOffset resets to 0
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
      <BackgroundAudioKeeper onBlocked={handleAudioBlocked} />
      <NotificationManager 
        onNotify={handleNotify} onAlarmStart={handleAlarmStart} alarmDismissSignal={dismissSignal}
        onRemoteDismiss={handleDismissAlarm} onRemoteComplete={handleRemoteComplete}
      />
      
      {activeAlarm && (
          <AlarmOverlay title={activeAlarm.title} body={activeAlarm.msg} onDismiss={handleDismissAlarm} onComplete={activeAlarm.id ? handleCompleteAlarm : undefined} />
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {toast && <Toast title={toast.title} message={toast.msg} onClose={() => setToast(null)} />}
      
      {/* 
        CAROUSEL CONTAINER 
        We use CSS Transform to slide the entire track.
        Touch listeners are on this main container.
      */}
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
             {/* 
                Each tab is 20% of the 500% container (which is 100vw). 
                Each tab handles its own vertical scrolling.
             */}
            <div className="w-[20%] h-full overflow-y-auto no-scrollbar p-4 sm:p-6 pb-28">
                <TabHome onOpenSettings={openSettings} />
            </div>
            <div className="w-[20%] h-full overflow-y-auto no-scrollbar p-4 sm:p-6 pb-28">
                <TabHabits onOpenSettings={openSettings} />
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

      {/* Floating Glass Navigation */}
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
