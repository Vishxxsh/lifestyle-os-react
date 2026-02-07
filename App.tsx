import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TabHome } from './components/TabHome';
import { TabHabits } from './components/TabHabits';
import { TabMeals } from './components/TabMeals';
import { TabGoals } from './components/TabGoals';
import { TabExport } from './components/TabExport';
import { Home, CheckSquare, Utensils, Target, Database, Plus, X, Bell, AlarmClock } from 'lucide-react';
import { getTodayStr } from './utils';

// Toast Component
const Toast: React.FC<{ title: string; message: string; onClose: () => void }> = ({ title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-6 right-6 z-[100] bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 transform transition-all animate-[slideIn_0.3s_ease-out]">
      <div className="p-2 bg-white/10 rounded-full shrink-0">
        <Bell size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-xs text-gray-300 mt-1">{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
};

// Full Screen Alarm Overlay
const AlarmOverlay: React.FC<{ title: string; body: string; onDismiss: () => void }> = ({ title, body, onDismiss }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-fade-in">
            <div className="animate-bounce mb-8">
                <AlarmClock size={64} className="text-red-500" />
            </div>
            <h2 className="text-3xl font-black mb-2 text-center">{title}</h2>
            <p className="text-gray-300 mb-12 text-center text-lg">{body}</p>
            <button 
                onClick={onDismiss}
                className="w-full max-w-sm py-5 bg-white text-black font-black text-xl rounded-2xl shadow-xl active:scale-95 transition-transform"
            >
                DISMISS ALARM
            </button>
        </div>
    );
};

// Component to handle background checks for notifications
// Now exposes an "Active Alarm" state to the parent
const NotificationManager: React.FC<{ 
    onNotify: (title: string, msg: string) => void,
    onAlarmStart: (title: string, msg: string) => void
    alarmDismissSignal: number // Incremented by parent to stop sound
}> = ({ onNotify, onAlarmStart, alarmDismissSignal }) => {
  const { state } = useApp();
  const lastCheckedMinute = useRef<string>("");
  const activeOscillator = useRef<OscillatorNode | null>(null);

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
        // ALARM: Aggressive loop
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        
        const duration = 30; 
        for(let i=0; i < duration; i++) {
           gain.gain.setValueAtTime(0.2, now + i);
           gain.gain.setValueAtTime(0, now + i + 0.5);
        }
        
        osc.start(now);
        osc.stop(now + duration);
        
        // Save ref to stop it later
        activeOscillator.current = osc;
      } else {
        // CHIME
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.error("Audio play failed", e);
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

      state.habits.forEach(habit => {
        let shouldNotify = false;
        let isDailyAlarm = false;

        if (habit.reminderTime === currentTime) {
          shouldNotify = true;
          isDailyAlarm = true;
          notificationTitle = `Time for ${habit.name}`;
          notificationBody = `It's ${habit.reminderTime}. Let's get it done.`;
        }

        if (!shouldNotify && habit.reminderInterval && habit.reminderInterval > 0) {
           if (currentTotalMinutes % habit.reminderInterval === 0) {
             const val = state.logs[today]?.[habit.id];
             const isDone = habit.type === 'checkbox' ? !!val : (val as number || 0) >= (habit.target || 1);
             
             if (!isDone) {
                shouldNotify = true;
                notificationTitle = `Reminder: ${habit.name}`;
                notificationBody = `Keep the streak alive!`;
             }
           }
        }

        if (shouldNotify) {
            if (isDailyAlarm) {
                alarmTriggered = true;
                // For alarms, we want to show the overlay immediately
                onAlarmStart(notificationTitle, notificationBody);
            } else {
                chimeTriggered = true;
                onNotify(notificationTitle, notificationBody);
            }
            sendNotification(notificationTitle, notificationBody);
        }
      });

      if (alarmTriggered) playSound('alarm');
      else if (chimeTriggered) playSound('chime');

      lastCheckedMinute.current = currentTime;
    };

    const interval = setInterval(checkReminders, 5000); 

    return () => clearInterval(interval);
  }, [state.habits, state.logs, onNotify, onAlarmStart]);

  const sendNotification = (title: string, body: string) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon: '/icon.png' });
      } catch (e) {
        console.error("Notification failed", e);
      }
    }
  };

  return null;
};

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'habits' | 'meals' | 'goals' | 'data'>('home');
  const { fabOnClick } = useApp();
  const [toast, setToast] = useState<{title: string, msg: string} | null>(null);
  
  // Alarm Overlay State
  const [activeAlarm, setActiveAlarm] = useState<{title: string, msg: string} | null>(null);
  const [dismissSignal, setDismissSignal] = useState(0);

  const handleDismissAlarm = () => {
      setActiveAlarm(null);
      setDismissSignal(prev => prev + 1); // Signal manager to stop sound
  };

  const renderTab = () => {
    switch(activeTab) {
      case 'home': return <TabHome />;
      case 'habits': return <TabHabits />;
      case 'meals': return <TabMeals />;
      case 'goals': return <TabGoals />;
      case 'data': return <TabExport />;
    }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
        activeTab === id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
      <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden relative flex flex-col">
      <NotificationManager 
        onNotify={(title, msg) => setToast({ title, msg })} 
        onAlarmStart={(title, msg) => setActiveAlarm({ title, msg })}
        alarmDismissSignal={dismissSignal}
      />
      
      {/* Full Screen Alarm Overlay */}
      {activeAlarm && (
          <AlarmOverlay 
            title={activeAlarm.title} 
            body={activeAlarm.msg} 
            onDismiss={handleDismissAlarm} 
          />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast 
          title={toast.title} 
          message={toast.msg} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="fade-enter-active">
           {renderTab()}
        </div>
      </main>

      {/* Global FAB */}
      {fabOnClick && (
        <button 
          onClick={fabOnClick}
          className="absolute bottom-24 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Bottom Nav */}
      <nav className="h-[80px] bg-white border-t border-gray-100 flex items-center justify-between px-2 pb-4 z-40 absolute bottom-0 w-full">
        <NavItem id="home" icon={Home} label="Home" />
        <NavItem id="habits" icon={CheckSquare} label="Habits" />
        <NavItem id="meals" icon={Utensils} label="Meals" />
        <NavItem id="goals" icon={Target} label="Goals" />
        <NavItem id="data" icon={Database} label="Vault" />
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
