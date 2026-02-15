
import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { 
    Moon, Sun, Volume2, VolumeX, Bell, Download, Upload, AlertTriangle, 
    Smartphone, SmartphoneNfc, Music, Clock, MoonStar, CheckCircle2, 
    AlertCircle, RefreshCw, ChevronRight, ChevronLeft, User, Database, 
    Palette, ArrowLeft, Battery, BatteryCharging
} from 'lucide-react';
import { SoundType } from '../types';
import { getThemeColors } from '../utils';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsView = 'main' | 'profile' | 'themes' | 'sounds' | 'notifications' | 'datavault';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { state, updateUserConfig, resetData, importData, recalculateXP } = useApp();
    const [currentView, setCurrentView] = useState<SettingsView>('main');
    const [importStatus, setImportStatus] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

    const theme = getThemeColors(state.user.accentColor);

    // Reset view on open
    useEffect(() => {
        if (isOpen) setCurrentView('main');
    }, [isOpen]);

    useEffect(() => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    }, [isOpen]);

    const requestPerms = async () => {
        if (!('Notification' in window)) return;
        const result = await Notification.requestPermission();
        setPermissionStatus(result);
    };

    const sendTestNotification = async () => {
        if (!('Notification' in window)) {
            alert("This device does not support notifications.");
            return;
        }

        if (Notification.permission !== 'granted') {
             const perm = await Notification.requestPermission();
             setPermissionStatus(perm);
             if (perm !== 'granted') {
                 alert("Permission denied. Please enable notifications in your browser settings.");
                 return;
             }
        }

        const title = "Test Notification";
        const body = "If you see this, your notifications are working perfectly!";
        const icon = "https://api.iconify.design/lucide:layout-grid.svg?color=%23111827";

        let swError: any = null;

        try {
            let reg: ServiceWorkerRegistration | undefined;
            if ('serviceWorker' in navigator) {
                reg = await navigator.serviceWorker.getRegistration();
                if (!reg) {
                    try {
                        reg = await navigator.serviceWorker.register('/sw.js');
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (regErr) {
                        swError = swError || regErr;
                    }
                }
            }

            if (reg) {
                await reg.showNotification(title, { body, icon, badge: icon, vibrate: [200, 100, 200] } as any);
                return;
            } 
        } catch (e) {
            swError = e;
        }
        
        try {
            new Notification(title, { body, icon });
        } catch (e) {
            alert("Notification Failed. Check permissions.");
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                const success = importData(content);
                setImportStatus(success ? "Data imported successfully!" : "Failed to import data.");
                setTimeout(() => setImportStatus(""), 3000);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `lifestyle_os_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const soundTypes: {value: SoundType, label: string}[] = [
        { value: 'modern', label: 'Modern' },
        { value: 'classic', label: 'Classic' },
        { value: 'retro', label: 'Retro' }
    ];

    const accentColors = [
        { id: 'blue', bg: 'bg-blue-500' },
        { id: 'violet', bg: 'bg-violet-500' },
        { id: 'emerald', bg: 'bg-emerald-500' },
        { id: 'red', bg: 'bg-red-500' },
        { id: 'orange', bg: 'bg-orange-500' },
        { id: 'pink', bg: 'bg-pink-500' },
        { id: 'gold', bg: 'bg-amber-500' },
        { id: 'black', bg: 'bg-gray-900 border border-gray-700' },
        { id: 'white', bg: 'bg-white border border-gray-300' },
    ];

    // Helper Components
    const MenuRow = ({ icon: Icon, label, onClick, value, isDestructive }: any) => (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isDestructive ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-md ${isDestructive ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-700'} text-inherit`}>
                    <Icon size={18} />
                </div>
                <span className="font-bold text-sm">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-xs text-gray-400 font-medium">{value}</span>}
                {!isDestructive && <ChevronRight size={16} className="text-gray-300" />}
            </div>
        </button>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 mt-6">{title}</h3>
    );

    // --- VIEWS ---

    const renderMain = () => (
        <div className="space-y-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="p-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-500">
                        {state.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white">{state.user.name}</h2>
                        <p className="text-xs text-gray-500">Lvl {state.user.level} • {state.user.xp} XP</p>
                    </div>
                </div>
                <MenuRow icon={User} label="Profile" onClick={() => setCurrentView('profile')} />
            </div>

            <SectionHeader title="Appearance" />
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <MenuRow icon={Palette} label="Themes" value={state.user.theme === 'light' ? 'Light' : 'Dark'} onClick={() => setCurrentView('themes')} />
            </div>

            <SectionHeader title="System" />
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <MenuRow icon={Volume2} label="Sound & Vibration" value={state.user.soundEnabled ? 'On' : 'Off'} onClick={() => setCurrentView('sounds')} />
                <MenuRow icon={Bell} label="Notifications" onClick={() => setCurrentView('notifications')} />
            </div>

            <SectionHeader title="Storage" />
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <MenuRow icon={Database} label="Data Vault" onClick={() => setCurrentView('datavault')} />
            </div>
            
            <div className="text-center pt-8 pb-4">
                <p className="text-[10px] text-gray-400">LifestyleOS v6.3</p>
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                    <input 
                        type="text" 
                        value={state.user.name} 
                        onChange={(e) => updateUserConfig({ name: e.target.value })}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm font-bold text-gray-900 dark:text-white outline-none"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Age</label>
                        <input 
                            type="number" 
                            value={state.user.age} 
                            onChange={(e) => updateUserConfig({ age: parseInt(e.target.value) })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm font-bold text-gray-900 dark:text-white outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (kg)</label>
                        <input 
                            type="number" 
                            value={state.user.weight} 
                            onChange={(e) => updateUserConfig({ weight: parseInt(e.target.value) })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm font-bold text-gray-900 dark:text-white outline-none"
                        />
                    </div>
                </div>
            </div>
            <p className="text-xs text-gray-400 px-4">
                These details are stored locally and used for calorie estimations.
            </p>
        </div>
    );

    const renderThemes = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button 
                    onClick={() => updateUserConfig({ theme: 'light' })}
                    className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <div className="flex items-center gap-3">
                        <Sun size={20} className="text-orange-500" />
                        <span className="font-bold text-sm text-gray-900 dark:text-white">Light Mode</span>
                    </div>
                    {state.user.theme === 'light' && <CheckCircle2 size={18} className={theme.text} />}
                </button>
                <button 
                    onClick={() => updateUserConfig({ theme: 'dark' })}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <div className="flex items-center gap-3">
                        <Moon size={20} className={theme.text} />
                        <span className="font-bold text-sm text-gray-900 dark:text-white">Dark Mode</span>
                    </div>
                    {state.user.theme === 'dark' && <CheckCircle2 size={18} className={theme.text} />}
                </button>
            </div>

            <div>
                <SectionHeader title="Accent Color" />
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex flex-wrap gap-3">
                    {accentColors.map(c => (
                        <button
                            key={c.id}
                            onClick={() => updateUserConfig({ accentColor: c.id })}
                            className={`w-10 h-10 rounded-full ${c.bg} shadow-sm flex items-center justify-center transition-transform active:scale-95 ${state.user.accentColor === c.id ? 'ring-4 ring-offset-2 ring-gray-200 dark:ring-gray-600' : ''}`}
                        >
                            {state.user.accentColor === c.id && <CheckCircle2 size={16} className={`text-white ${c.id === 'white' ? 'text-black' : ''}`} />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderSounds = () => (
        <div className="space-y-6">
             <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <button 
                    onClick={() => updateUserConfig({ soundEnabled: !state.user.soundEnabled })}
                    className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
                >
                    <span className="font-bold text-sm text-gray-900 dark:text-white">Sound Effects</span>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${state.user.soundEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${state.user.soundEnabled ? 'translate-x-4' : ''}`} />
                    </div>
                </button>
                <button 
                    onClick={() => updateUserConfig({ vibrationEnabled: !state.user.vibrationEnabled })}
                    className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
                >
                    <span className="font-bold text-sm text-gray-900 dark:text-white">Haptic Vibration</span>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${state.user.vibrationEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${state.user.vibrationEnabled ? 'translate-x-4' : ''}`} />
                    </div>
                </button>
                 <button 
                    onClick={() => updateUserConfig({ backgroundKeepAlive: !state.user.backgroundKeepAlive })}
                    className="w-full flex items-center justify-between p-4"
                >
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">Background Keep-Alive</span>
                        {state.user.backgroundKeepAlive && <BatteryCharging size={14} className="text-orange-500 animate-pulse"/>}
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${state.user.backgroundKeepAlive ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${state.user.backgroundKeepAlive ? 'translate-x-4' : ''}`} />
                    </div>
                </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 px-4">
               <strong>Background Keep-Alive:</strong> Plays silent audio loop to keep the app active 24/7 for alarms. 
               <span className="text-orange-500 font-bold ml-1">Consumes more battery.</span>
            </p>

            <SectionHeader title="Do Not Disturb" />
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-900 dark:text-white">Start</label>
                    <input 
                        type="time" 
                        value={state.user.dndStartTime || "23:00"}
                        onChange={(e) => updateUserConfig({ dndStartTime: e.target.value })}
                        className="bg-gray-100 dark:bg-gray-900 p-2 rounded-lg text-sm font-bold outline-none"
                    />
                </div>
                <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-900 dark:text-white">End</label>
                    <input 
                        type="time" 
                        value={state.user.dndEndTime || "07:00"}
                        onChange={(e) => updateUserConfig({ dndEndTime: e.target.value })}
                        className="bg-gray-100 dark:bg-gray-900 p-2 rounded-lg text-sm font-bold outline-none"
                    />
                </div>
            </div>

            <SectionHeader title="Sound Options" />
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                <div className="flex gap-2">
                    {soundTypes.map((type) => (
                        <button
                        key={type.value}
                        onClick={() => updateUserConfig({ soundType: type.value })}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            state.user.soundType === type.value 
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                            : 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400'
                        }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Alarm Length</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{state.user.alarmDuration}s</span>
                    </div>
                    <input 
                        type="range" min="5" max="60" step="5"
                        value={state.user.alarmDuration}
                        onChange={(e) => updateUserConfig({ alarmDuration: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-gray-900 dark:accent-white"
                    />
                </div>
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Alert Length</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{state.user.chimeDuration || 5}s</span>
                    </div>
                    <input 
                        type="range" min="1" max="20" step="1"
                        value={state.user.chimeDuration || 5}
                        onChange={(e) => updateUserConfig({ chimeDuration: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-gray-900 dark:accent-white"
                    />
                </div>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    {permissionStatus === 'granted' 
                        ? <CheckCircle2 size={24} className="text-green-500 shrink-0" /> 
                        : <AlertCircle size={24} className="text-orange-500 shrink-0" />
                    }
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {permissionStatus === 'granted' ? 'Active' : 'Permission Required'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {permissionStatus === 'granted' 
                                ? "Alarms and reminders will work in the background." 
                                : "Enable notifications to receive alerts."}
                        </p>
                    </div>
                </div>
                {permissionStatus !== 'granted' && (
                    <button 
                        onClick={requestPerms}
                        className={`w-full py-3 ${theme.bg} ${theme.buttonText} font-bold rounded-lg text-sm`}
                    >
                        Enable Notifications
                    </button>
                )}
            </div>

            <button 
                onClick={sendTestNotification}
                className="w-full py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold rounded-xl active:scale-95 transition-transform"
            >
                Send Test Notification
            </button>
        </div>
    );

    const renderDataVault = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <MenuRow icon={Download} label="Export Backup" onClick={handleExport} />
                <div className="relative">
                    <MenuRow icon={Upload} label="Import Backup" onClick={handleImportClick} />
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".json,application/json,text/plain" 
                        onChange={handleFileChange} 
                        className="hidden" 
                    />
                </div>
                <MenuRow icon={RefreshCw} label="Recalculate Levels" onClick={() => { if(confirm("Recalculate?")) recalculateXP(); }} />
            </div>

            {importStatus && (
                <div className={`text-center text-xs font-bold ${importStatus.includes("success") ? "text-green-500" : "text-red-500"}`}>
                    {importStatus}
                </div>
            )}

            <div className="pt-8">
                <MenuRow icon={AlertTriangle} label="Reset Everything" onClick={() => { if(confirm("Wipe all data?")) { resetData(); onClose(); }}} isDestructive />
                <p className="text-xs text-gray-400 px-4 mt-2">
                    This action cannot be undone. All logs and settings will be lost.
                </p>
            </div>
        </div>
    );

    // Header Title Logic
    const getHeader = () => {
        switch(currentView) {
            case 'main': return 'Settings';
            case 'profile': return 'Profile';
            case 'themes': return 'Themes';
            case 'sounds': return 'Sound & Vibration';
            case 'notifications': return 'Notifications';
            case 'datavault': return 'Data Vault';
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={getHeader()}
            onBack={currentView !== 'main' ? () => setCurrentView('main') : undefined}
        >
            <div className="pt-2 animate-fade-in">
                {currentView === 'main' && renderMain()}
                {currentView === 'profile' && renderProfile()}
                {currentView === 'themes' && renderThemes()}
                {currentView === 'sounds' && renderSounds()}
                {currentView === 'notifications' && renderNotifications()}
                {currentView === 'datavault' && renderDataVault()}
            </div>
        </Modal>
    );
};
