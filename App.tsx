import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TabHome } from './components/TabHome';
import { TabHabits } from './components/TabHabits';
import { TabMeals } from './components/TabMeals';
import { TabGoals } from './components/TabGoals';
import { TabReports } from './components/TabReports';
import { TabExport } from './components/TabExport'; 
import { SettingsModal } from './components/SettingsModal';
import { Home, CheckSquare, Utensils, Target, BarChart3, Plus, X, Bell, AlarmClock } from 'lucide-react';
import { getTodayStr } from './utils';

// Toast Component
const Toast: React.FC<{ title: string; message: string; onClose: () => void }> = ({ title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-6 right-6 z-[100] bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-4 rounded-2xl shadow-2xl flex items-start gap-3 transform transition-all animate-[slideIn_0.3s_ease-out]">
      <div className="p-2 bg-white/10 dark:bg-black/10 rounded-full shrink-0">
        <Bell size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-black">
        <X size={16} />
      </button>
    </div>
  );
};

// Full Screen Alarm Overlay
const AlarmOverlay: React.FC<{ title: string; body: string; onDismiss: () => void; onComplete?: () => void }> = ({ title, body, onDismiss, onComplete }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-fade-in">
            <div className="animate-bounce mb-8">
                <AlarmClock size={64} className="text-red-500" />
            </div>
            <h2 className="text-3xl font-black mb-2 text-center">{title}</h2>
            <p className="text-gray-300 mb-12 text-center text-lg">{body}</p>
            
            <div className="w-full max-w-sm space-y-4">
                {onComplete && (
                    <button 
                        onClick={onComplete}
                        className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xl rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <CheckSquare size={24} strokeWidth={3} />
                        I DID IT!
                    </button>
                )}
                <button 
                    onClick={onDismiss}
                    className="w-full py-5 bg-white text-black font-black text-xl rounded-2xl shadow-xl active:scale-95 transition-transform"
                >
                    STOP ALARM
                </button>
            </div>
        </div>
    );
};

// Generate a simple dynamic image for notification banner
const generateNotificationImage = (text: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 600, 300);
    gradient.addColorStop(0, '#111827'); // gray-900
    gradient.addColorStop(1, '#374151'); // gray-700
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 300);

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("LifestyleOS", 300, 100);

    ctx.fillStyle = '#60A5FA'; // blue-400
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(text, 300, 180);

    return canvas.toDataURL('image/png');
};

// Component to handle background checks for notifications
const NotificationManager: React.FC<{ 
    onNotify: (title: string, msg: string) => void,
    onAlarmStart: (title: string, msg: string, habitId?: number) => void
    alarmDismissSignal: number 
    onRemoteDismiss: () => void;
    onRemoteComplete: (habitId: number) => void;
}> = ({ onNotify, onAlarmStart, alarmDismissSignal, onRemoteDismiss, onRemoteComplete }) => {
  const { state } = useApp();
  const lastCheckedTotalMinutes = useRef<number>(new Date().getHours() * 60 + new Date().getMinutes());
  const activeOscillator = useRef<OscillatorNode | null>(null);
  const scheduledTriggers = useRef<Set<string>>(new Set());

  // Handle SW Messages (Actions)
  useEffect(() => {
      const handleSWMessage = (event: MessageEvent) => {
          if (!event.data) return;
          
          if (event.data.type === 'DISMISS_ALARM') {
              onRemoteDismiss();
          } 
          else if (event.data.type === 'COMPLETE_HABIT') {
              if (event.data.habitId) {
                  onRemoteComplete(parseInt(event.data.habitId));
              }
          }
      };

      if ('serviceWorker' in navigator) {
          navigator.serviceWorker.addEventListener('message', handleSWMessage);
      }

      return () => {
          if ('serviceWorker' in navigator) {
              navigator.serviceWorker.removeEventListener('message', handleSWMessage);
          }
      };
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
        if (type === 'alarm') {
            navigator.vibrate([500, 200, 500, 200, 1000]); 
        } else {
            // Heartbeat pattern for chime
            navigator.vibrate([100, 50, 100]);
        }
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
      
      // Sound Synthesis Logic (Same as before)
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
         // Short Chime
         osc.type = 'sine';
         osc.frequency.setValueAtTime(523.25, now); // C5
         osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6
         gain.gain.setValueAtTime(0.1, now);
         gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
         osc.start(now);
         osc.stop(now + 0.5);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const scheduleNotification = async (title: string, body: string, triggerTimestamp: number, tag: string) => {
      // Experimental: Timestamp Trigger for Background Delivery
      // This is the only way to get true background notifications on Android PWA without a server.
      if ('serviceWorker' in navigator && 'showTrigger' in Notification.prototype) {
           const reg = await navigator.serviceWorker.ready;
           // Check if we already scheduled this tag to avoid spamming the scheduler
           if (scheduledTriggers.current.has(tag)) return;

           try {
               await reg.showNotification(title, {
                   body,
                   tag,
                   icon: "https://api.iconify.design/lucide:layout-grid.svg?color=%23111827",
                   // @ts-ignore - Experimental API
                   showTrigger: new TimestampTrigger(triggerTimestamp), 
                   data: { url: window.location.href }
               });
               scheduledTriggers.current.add(tag);
               console.log(`Scheduled background notification for ${new Date(triggerTimestamp).toLocaleTimeString()}`);
           } catch(e) {
               console.warn("TimestampTrigger failed", e);
           }
      }
  };

  const sendNotification = async (title: string, body: string, isAlarm: boolean, habitId?: number) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== "granted") return;
    if (isDNDActive()) return;

    const iconUrl = "https://api.iconify.design/lucide:layout-grid.svg?color=%23111827";
    const imageUrl = generateNotificationImage(title);

    // Actions
    const actions: any[] = [];
    if (isAlarm || habitId) {
        actions.push({ action: 'complete', title: '✅ Complete' });
        actions.push({ action: 'dismiss', title: 'Stop' });
    } else {
        actions.push({ action: 'dismiss', title: 'Dismiss' });
    }

    const options: any = {
        body,
        icon: iconUrl,
        badge: iconUrl, // Small icon for status bar
        image: imageUrl, // Large Banner Image
        vibrate: [500, 250, 500, 250], // Heartbeat
        tag: isAlarm ? 'alarm-' + Date.now() : 'notification-' + (habitId || 'general'),
        renotify: true, // Alert even if replacing old notification
        requireInteraction: true, // Keeps it on screen until user interacts
        silent: false,
        data: {
            url: window.location.href,
            habitId: habitId
        },
        actions: actions
    };

    if ('serviceWorker' in navigator) {
        try {
            let reg = await navigator.serviceWorker.getRegistration();
            if (!reg) reg = await navigator.serviceWorker.ready;
            if (reg) {
                await reg.showNotification(title, options);
                return;
            }
        } catch (e) {
            console.warn("SW notify failed", e);
        }
    }
    
    try {
        new Notification(title, options);
    } catch (e) {
        console.error("Fallback notify failed", e);
        onNotify("Notification Error", "Could not display notification.");
    }
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

     if (startTotal < endTotal) {
         return currentMinutes >= startTotal && currentMinutes < endTotal;
     } else {
         return currentMinutes >= startTotal || currentMinutes < endTotal;
     }
  };

  useEffect(() => {
    const checkReminders = () => {
      if (isDNDActive()) return;

      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      const today = getTodayStr();

      // If just loaded (lastChecked == current), skip firing immediately
      // unless we want to process missed events. For simplicity, we skip exact matches.
      if (currentTotalMinutes === lastCheckedTotalMinutes.current) return;

      let alarmTriggered = false;
      let chimeTriggered = false;
      let notificationTitle = "";
      let notificationBody = "";
      let alarmHabitId: number | undefined;

      state.habits.forEach(habit => {
        let shouldNotify = false;
        let isDailyAlarm = false;

        // 1. Daily Alarm (Fixed Time)
        if (habit.reminderTime) {
           const [remH, remM] = habit.reminderTime.split(':').map(Number);
           const remTotal = remH * 60 + remM;
           if (remTotal > lastCheckedTotalMinutes.current && remTotal <= currentTotalMinutes) {
               shouldNotify = true;
               isDailyAlarm = true;
               notificationTitle = `Time for ${habit.name}`;
               notificationBody = `It's ${habit.reminderTime}. Let's get it done.`;
               alarmHabitId = habit.id;
           }
        }

        // 2. Interval Logic (Periodic)
        if (!shouldNotify && habit.reminderInterval && habit.reminderInterval > 0) {
           const interval = habit.reminderInterval;
           const lastStep = Math.floor(lastCheckedTotalMinutes.current / interval);
           const currentStep = Math.floor(currentTotalMinutes / interval);
           
           if (currentStep > lastStep) {
             const val = state.logs[today]?.[habit.id];
             const isDone = habit.type === 'checkbox' ? !!val : (val as number || 0) >= (habit.target || 1);
             
             if (!isDone) {
                shouldNotify = true;
                notificationTitle = `Reminder: ${habit.name}`;
                notificationBody = `Keep the streak alive!`;
                alarmHabitId = habit.id; 
                
                // Try to schedule the NEXT one immediately for background resilience
                // Calculate next interval time
                const nextIntervalMinutes = (currentStep + 1) * interval;
                const nextDate = new Date();
                nextDate.setHours(Math.floor(nextIntervalMinutes / 60));
                nextDate.setMinutes(nextIntervalMinutes % 60);
                nextDate.setSeconds(0);
                if (nextDate.getTime() > Date.now()) {
                    scheduleNotification(notificationTitle, notificationBody, nextDate.getTime(), `interval-${habit.id}-${currentStep+1}`);
                }
             }
           }
        }

        if (shouldNotify) {
            if (isDailyAlarm) {
                alarmTriggered = true;
                onAlarmStart(notificationTitle, notificationBody, alarmHabitId);
            } else {
                chimeTriggered = true;
                onNotify(notificationTitle, notificationBody);
            }
            sendNotification(notificationTitle, notificationBody, isDailyAlarm, alarmHabitId);
        }
      });

      if (alarmTriggered) playSound('alarm');
      else if (chimeTriggered) playSound('chime');

      lastCheckedTotalMinutes.current = currentTotalMinutes;
    };

    const interval = setInterval(checkReminders, 5000); 

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            checkReminders();
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.habits, state.logs, onNotify, onAlarmStart, state.user]);

  return null;
};

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'habits' | 'meals' | 'goals' | 'reports'>('home');
  const { state, fabOnClick, toggleHabit } = useApp();
  const [toast, setToast] = useState<{title: string, msg: string} | null>(null);
  
  const [activeAlarm, setActiveAlarm] = useState<{title: string, msg: string, habitId?: number} | null>(null);
  const [dismissSignal, setDismissSignal] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (state.user.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.user.theme]);

  const handleNotify = useCallback((title: string, msg: string) => setToast({ title, msg }), []);
  const handleAlarmStart = useCallback((title: string, msg: string, habitId?: number) => setActiveAlarm({ title, msg, habitId }), []);

  const handleDismissAlarm = useCallback(() => {
      setActiveAlarm(null);
      setDismissSignal(prev => prev + 1); 
  }, []);

  const handleCompleteAlarm = useCallback(() => {
      if (activeAlarm?.habitId) {
          toggleHabit(activeAlarm.habitId, getTodayStr());
          setToast({ title: "Awesome!", msg: "Habit completed. Keep it up!" });
      }
      handleDismissAlarm();
  }, [activeAlarm, toggleHabit, handleDismissAlarm]);

  const handleRemoteComplete = useCallback((habitId: number) => {
      toggleHabit(habitId, getTodayStr());
      setToast({ title: "Awesome!", msg: "Marked done via notification." });
      handleDismissAlarm();
  }, [toggleHabit, handleDismissAlarm]);

  const openSettings = () => setIsSettingsOpen(true);

  const renderTab = () => {
    switch(activeTab) {
      case 'home': return <TabHome onOpenSettings={openSettings} />;
      case 'habits': return <TabHabits onOpenSettings={openSettings} />;
      case 'meals': return <TabMeals onOpenSettings={openSettings} />;
      case 'goals': return <TabGoals onOpenSettings={openSettings} />;
      case 'reports': return <TabReports onOpenSettings={openSettings} />;
    }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
        activeTab === id 
          ? 'text-gray-900 dark:text-white' 
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
      }`}
    >
      <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
      <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 dark:bg-gray-950 dark:text-gray-100 shadow-2xl overflow-hidden relative flex flex-col transition-colors duration-300">
      <NotificationManager 
        onNotify={handleNotify} 
        onAlarmStart={handleAlarmStart}
        alarmDismissSignal={dismissSignal}
        onRemoteDismiss={handleDismissAlarm}
        onRemoteComplete={handleRemoteComplete}
      />
      
      {activeAlarm && (
          <AlarmOverlay 
            title={activeAlarm.title} 
            body={activeAlarm.msg} 
            onDismiss={handleDismissAlarm}
            onComplete={activeAlarm.habitId ? handleCompleteAlarm : undefined}
          />
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {toast && (
        <Toast 
          title={toast.title} 
          message={toast.msg} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <main className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="fade-enter-active">
           {renderTab()}
        </div>
      </main>

      {fabOnClick && (
        <button 
          onClick={fabOnClick}
          className="absolute bottom-24 right-6 w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
        >
          <Plus size={28} />
        </button>
      )}

      <nav className="h-[80px] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between px-2 pb-4 z-40 absolute bottom-0 w-full transition-colors duration-300">
        <NavItem id="home" icon={Home} label="Home" />
        <NavItem id="habits" icon={CheckSquare} label="Habits" />
        <NavItem id="meals" icon={Utensils} label="Meals" />
        <NavItem id="goals" icon={Target} label="Goals" />
        <NavItem id="reports" icon={BarChart3} label="Reports" />
      </nav>
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