
import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { Moon, Sun, Volume2, VolumeX, Bell, Download, Upload, AlertTriangle, Smartphone, SmartphoneNfc } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { state, updateUserConfig, resetData, importData } = useApp();
    const [importStatus, setImportStatus] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    };

    const handleNuke = () => {
        if (confirm("Are you sure? This will wipe everything permanently.")) {
            resetData();
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="space-y-6">
                {/* Theme & Sound */}
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

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                        <Bell size={20} className="text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">Notifications</h4>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                System notifications are managed by your browser. Ensure permission is granted for reminders.
                            </p>
                            <button 
                                onClick={() => Notification.requestPermission()}
                                className="mt-2 text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                            >
                                Request Permission
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data Management</h3>
                    
                    <button 
                        onClick={handleExport}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl active:scale-95 transition-transform"
                    >
                        <Download size={18} /> Backup Data
                    </button>

                    <label className="w-full flex flex-col items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Upload size={18} /> 
                        <span>Import Backup</span>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept=".json" 
                            onChange={handleFileChange} 
                            className="hidden" 
                        />
                    </label>
                    {importStatus && <p className="text-center text-sm font-bold text-green-600">{importStatus}</p>}

                    <button 
                        onClick={handleNuke}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-transform mt-2"
                    >
                        <AlertTriangle size={18} /> Factory Reset
                    </button>
                </div>
            </div>
        </Modal>
    );
};
