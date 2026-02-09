
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

// Component to handle background checks for notifications
const NotificationManager: React.FC<{ 
    onNotify: (title: string, msg: string) => void,
    onAlarmStart: (title: string, msg: string, habitId?: number) => void
    alarmDismissSignal: number 
    onRemoteDismiss: () => void;
    onRemoteComplete: (habitId: number) => void;
}> = ({ onNotify, onAlarmStart, alarmDismissSignal, onRemoteDismiss, onRemoteComplete }) => {
  const { state } = useApp();
  const lastCheckedMinute = useRef<string>("");
  const activeOscillator = useRef<OscillatorNode | null>(null);

  useEffect(() => {
      return () => {
          if (activeOscillator.current) {
              try {
                activeOscillator.current.stop();
                activeOscillator.current.disconnect();
              } catch(e) {}
          }
      };
  }, []);

  // Listen for Service Worker Messages
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

  // Effect to handle dismissal signal
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

    const duration = type === 'alarm' ? alarmDuration : chimeDuration;

    // Vibration
    if (vibrationEnabled && navigator.vibrate) {
        if (type === 'alarm') {
            navigator.vibrate([500, 200, 500, 200, 1000]); 
        } else {
            const pulses = Math.max(1, Math.floor(duration / 0.5));
            const pattern = Array(pulses).fill(0).flatMap(() => [200, 300]);
            navigator.vibrate(pattern);
        }
    }

    // Audio
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
        if (soundType === 'classic') {
             osc.type = 'triangle';
             for(let i=0; i < duration; i+=1.5) {
                 osc.frequency.setValueAtTime(880, now + i);
                 gain.gain.setValueAtTime(0.2, now + i);
                 gain.gain.exponentialRampToValueAtTime(0.01, now + i + 0.4);
             }
        } else if (soundType === 'retro') {
             osc.type = 'square';
             for(let i=0; i < duration; i+=1) {
                 osc.frequency.setValueAtTime(900, now + i);
                 gain.gain.setValueAtTime(0.1, now + i);
                 gain.gain.linearRampToValueAtTime(0, now + i + 0.15);
             }
        } else {
             osc.type = 'triangle';
             for(let i=0; i < duration; i += 0.5) {
                gain.gain.setValueAtTime(0.15, now + i);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i + 0.2);
                osc.frequency.setValueAtTime(880, now + i);
             }
        }
        osc.start(now);
        osc.stop(now + duration);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const sendNotification = async (title: string, body: string, isAlarm: boolean, habitId?: number) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    // Use absolute URL from manifest for reliability
    const iconUrl = "https://api.iconify.design/lucide:layout-grid.svg?color=%23111827";

    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const options: any = {
                body: body,
                icon: iconUrl,
                badge: iconUrl,
                // Simple vibration pattern supported by most devices
                vibrate: [200, 100, 200, 100, 200, 100, 200],
                tag: isAlarm ? 'alarm-' + Date.now() : 'notification-' + Date.now(), // Unique tag to ensure it pops
                renotify: true, 
                requireInteraction: isAlarm,
                data: {
                    url: window.location.href,
                    habitId: habitId
                },
                actions: isAlarm 
                    ? [
                        { action: 'complete', title: 'Complete' },
                        { action: 'dismiss', title: 'Stop Alarm' }
                      ]
                    : [
                        { action: 'dismiss', title: 'Dismiss' }
                      ]
            };

            await registration.showNotification(title, options);
        } catch (e) {
            console.error("SW Notification failed", e);
            // Fallback
            new Notification(title, { body, icon: iconUrl });
        }
    } else {
      new Notification(title, { body, icon: iconUrl });
    }
  };

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      
      if (currentTime === lastCheckedMinute.current) return;

      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      const today = getTodayStr();

      let alarmTriggered = false;
      let chimeTriggered = false;
      let notificationTitle = "";
      let notificationBody = "";
      let alarmHabitId: number | undefined;

      state.habits.forEach(habit => {
        let shouldNotify = false;
        let isDailyAlarm = false;

        if (habit.reminderTime === currentTime) {
          shouldNotify = true;
          isDailyAlarm = true;
          notificationTitle = `Time for ${habit.name}`;
          notificationBody = `It's ${habit.reminderTime}. Let's get it done.`;
          alarmHabitId = habit.id;
        }

        if (!shouldNotify && habit.reminderInterval && habit.reminderInterval > 0) {
           if (currentTotalMinutes % habit.reminderInterval === 0) {
             const val = state.logs[today]?.[habit.id];
             const isDone = habit.type === 'checkbox' ? !!val : (val as number || 0) >= (habit.target || 1);
             
             if (!isDone) {
                shouldNotify = true;
                notificationTitle = `Reminder: ${habit.name}`;
                notificationBody = `Keep the streak alive!`;
                alarmHabitId = habit.id; 
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

      lastCheckedMinute.current = currentTime;
    };

    const interval = setInterval(checkReminders, 5000); 
    return () => clearInterval(interval);
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
