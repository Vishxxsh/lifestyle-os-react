
import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { Moon, Sun, Volume2, VolumeX, Bell, Download, Upload, AlertTriangle, Smartphone, SmartphoneNfc, Music, Clock, MoonStar, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { SoundType } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { state, updateUserConfig, resetData, importData, recalculateXP } = useApp();
    const [importStatus, setImportStatus] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

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
            // Try getting existing registration first (Fastest/Most Reliable)
            let reg: ServiceWorkerRegistration | undefined;
            
            if ('serviceWorker' in navigator) {
                try {
                    reg = await navigator.serviceWorker.getRegistration();
                } catch(e) {
                    console.warn("Could not get registration directly", e);
                    swError = e;
                }

                // If no registration found, try waiting for ready (Initial load case)
                if (!reg) {
                    try {
                        const swPromise = navigator.serviceWorker.ready;
                        const timeoutPromise = new Promise<never>((_, reject) => 
                            setTimeout(() => reject(new Error("SW Ready Timeout (2s)")), 2000)
                        );
                        reg = await Promise.race([swPromise, timeoutPromise]) as ServiceWorkerRegistration;
                    } catch(e) {
                        console.warn("SW Ready timed out", e);
                        swError = swError || e;
                    }
                }
            }

            if (reg) {
                await reg.showNotification(title, {
                    body,
                    icon,
                    badge: icon,
                    vibrate: [200, 100, 200]
                } as any);
                return;
            } else if (!swError) {
                swError = new Error("No Service Worker Registration found.");
            }
        } catch (e) {
            console.warn("SW notification failed, trying fallback:", e);
            swError = e;
        }
        
        // Fallback to standard Notification API (Likely to fail on Android if SW failed, but worth a shot)
        try {
            new Notification(title, { body, icon });
        } catch (e) {
            console.error("Standard notification failed", e);
            const err1 = swError instanceof Error ? swError.message : String(swError);
            const err2 = e instanceof Error ? e.message : String(e);
            alert(`Notification Failed.\n\nSW Error: ${err1}\n\nFallback Error: ${err2}\n\nCommon Fixes:\n1. Check 'Do Not Disturb'\n2. Allow Notifications in Browser Settings\n3. Check Battery Saver`);
        }
    };

    const toggleTheme = () => {
        updateUserConfig({ theme: state.user.theme === 'light' ? 'dark' : 'light' });
    };

    const toggleSound = () => {
        updateUserConfig({ soundEnabled: !state.user.soundEnabled });
    };

    const toggleVibration = () => {
        updateUserConfig({ vibrationEnabled: !state.user.vibrationEnabled });
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
        
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const handleRecalculate = () => {
        if (confirm("Recalculate total XP based on current habit values?")) {
            recalculateXP();
            alert("XP Recalculated Successfully.");
        }
    };

    const handleNuke = () => {
        if (confirm("Are you sure? This will wipe everything permanently.")) {
            resetData();
            onClose();
        }
    };

    const soundTypes: {value: SoundType, label: string}[] = [
        { value: 'modern', label: 'Modern (Soft)' },
        { value: 'classic', label: 'Classic (Digital)' },
        { value: 'retro', label: 'Retro (8-Bit)' }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="space-y-6">
                {/* Theme & Preferences */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Preferences</h3>
                    
                    <button 
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {state.user.theme === 'light' ? <Sun size={20} className="text-orange-500"/> : <Moon size={20} className="text-blue-500"/>}
                            <span className="font-bold text-gray-900 dark:text-white">App Theme</span>
                        </div>
                        <span className="text-sm font-bold text-gray-400 uppercase">{state.user.theme}</span>
                    </button>

                    <button 
                        onClick={toggleSound}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {state.user.soundEnabled ? <Volume2 size={20} className="text-emerald-500"/> : <VolumeX size={20} className="text-red-500"/>}
                            <span className="font-bold text-gray-900 dark:text-white">Sound Effects</span>
                        </div>
                        <span className={`text-sm font-bold uppercase ${state.user.soundEnabled ? 'text-emerald-500' : 'text-red-500'}`}>
                            {state.user.soundEnabled ? 'On' : 'Off'}
                        </span>
                    </button>

                    <button 
                        onClick={toggleVibration}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {state.user.vibrationEnabled ? <Smartphone size={20} className="text-emerald-500"/> : <SmartphoneNfc size={20} className="text-red-500"/>}
                            <span className="font-bold text-gray-900 dark:text-white">Vibrations</span>
                        </div>
                        <span className={`text-sm font-bold uppercase ${state.user.vibrationEnabled ? 'text-emerald-500' : 'text-red-500'}`}>
                            {state.user.vibrationEnabled ? 'On' : 'Off'}
                        </span>
                    </button>
                </div>

                {/* Do Not Disturb */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <MoonStar size={14} /> Do Not Disturb
                     </h3>
                     <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-4">
                         <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-gray-900 dark:text-white">Start Time</label>
                            <input 
                                type="time" 
                                value={state.user.dndStartTime || "23:00"}
                                onChange={(e) => updateUserConfig({ dndStartTime: e.target.value })}
                                className="bg-white dark:bg-gray-700 p-2 rounded-lg text-sm font-bold outline-none"
                            />
                         </div>
                         <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-gray-900 dark:text-white">End Time</label>
                            <input 
                                type="time" 
                                value={state.user.dndEndTime || "07:00"}
                                onChange={(e) => updateUserConfig({ dndEndTime: e.target.value })}
                                className="bg-white dark:bg-gray-700 p-2 rounded-lg text-sm font-bold outline-none"
                            />
                         </div>
                         <p className="text-[10px] text-gray-400">
                             Notifications and alarms will be silenced between these times.
                         </p>
                     </div>
                </div>

                {/* Audio Customization */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Music size={14} /> Sound & Alerts
                     </h3>

                     {/* Sound Type */}
                     <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-2">
                         <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Alert Sound Style</label>
                         <div className="flex gap-2">
                             {soundTypes.map((type) => (
                                 <button
                                    key={type.value}
                                    onClick={() => updateUserConfig({ soundType: type.value })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                        state.user.soundType === type.value 
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                                        : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                 >
                                     {type.label.split(' ')[0]}
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* Durations */}
                     <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-4">
                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                                    <Clock size={12} /> Alarm Duration
                                </label>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{state.user.alarmDuration}s</span>
                            </div>
                            <input 
                                type="range" 
                                min="5" max="60" step="5"
                                value={state.user.alarmDuration}
                                onChange={(e) => updateUserConfig({ alarmDuration: parseInt(e.target.value) })}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-900 dark:accent-white"
                            />
                         </div>

                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                                    <Bell size={12} /> Chime Duration
                                </label>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{state.user.chimeDuration}s</span>
                            </div>
                            <input 
                                type="range" 
                                min="2" max="20" step="1"
                                value={state.user.chimeDuration}
                                onChange={(e) => updateUserConfig({ chimeDuration: parseInt(e.target.value) })}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-900 dark:accent-white"
                            />
                         </div>
                     </div>
                </div>

                {/* Permissions Info & Test */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex flex-col gap-3 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        {permissionStatus === 'granted' 
                            ? <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" /> 
                            : <AlertCircle size={20} className="text-orange-500 shrink-0 mt-0.5" />
                        }
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                {permissionStatus === 'granted' ? 'Notifications Active' : 'Notifications Required'}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {permissionStatus === 'granted' 
                                    ? "Alarms and reminders will work even when the app is in the background." 
                                    : "Please enable notifications to receive alarms and habit reminders."}
                            </p>
                        </div>
                    </div>
                    {permissionStatus !== 'granted' && (
                        <button 
                            onClick={requestPerms}
                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-xs"
                        >
                            Enable Notifications
                        </button>
                    )}
                    <button 
                        onClick={sendTestNotification}
                        className="w-full py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Test Notification
                    </button>
                </div>

                {/* Data Management */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data Vault</h3>
                     
                     <div className="grid grid-cols-2 gap-3">
                         <button 
                             onClick={handleExport}
                             className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                         >
                             <Download size={20} className="text-gray-700 dark:text-gray-300" />
                             <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Backup</span>
                         </button>

                         <label className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer relative overflow-hidden">
                             <Upload size={20} className="text-gray-700 dark:text-gray-300" />
                             <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Restore</span>
                             <input 
                                 ref={fileInputRef}
                                 type="file" 
                                 accept=".json" 
                                 onChange={handleFileChange} 
                                 className="absolute inset-0 opacity-0 cursor-pointer" 
                             />
                         </label>
                     </div>
                     
                     {importStatus && (
                        <div className={`text-center text-xs font-bold ${importStatus.includes("success") ? "text-emerald-500" : "text-red-500"}`}>
                            {importStatus}
                        </div>
                     )}

                     <button 
                         onClick={handleRecalculate}
                         className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl flex items-center justify-center gap-2 text-xs"
                     >
                         <RefreshCw size={14} /> Recalculate Levels
                     </button>

                     <button 
                         onClick={handleNuke}
                         className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 text-xs hover:bg-red-100 dark:hover:bg-red-900/30"
                     >
                         <AlertTriangle size={14} /> Reset All Data
                     </button>
                </div>

                <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-400">
                        Lifestyle OS v6.0 • Local Storage Only
                    </p>
                </div>
            </div>
        </Modal>
    );
};
