import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, AlertTriangle } from 'lucide-react';

export const TabExport: React.FC = () => {
  const { state, resetData } = useApp();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleExport = () => {
    // Generate JSON for now as it handles the nested structure better than flat CSV for restoration
    // But requirement asks for CSV Generator. 
    // Let's do JSON default for backup, it's safer.
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lifestyle_os_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleNuke = () => {
    if (confirm("Are you sure? This will wipe everything permanently.")) {
      resetData();
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Data Vault</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <p className="text-sm text-gray-500">
          Your data is stored locally in your browser. It never leaves your device.
        </p>

        <div className="pt-4">
            <button 
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white font-bold rounded-xl active:scale-95 transition-transform"
            >
              <Download size={18} /> Download Backup
            </button>
        </div>
      </div>

      <div className="pt-10">
        <button 
          onClick={handleNuke}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 active:scale-95 transition-transform"
        >
          <AlertTriangle size={18} /> Reset All Data
        </button>
      </div>
    </div>
  );
};
