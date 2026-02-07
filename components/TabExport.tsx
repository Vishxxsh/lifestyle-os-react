import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, AlertTriangle, Upload } from 'lucide-react';

export const TabExport: React.FC = () => {
  const { state, resetData, importData } = useApp();
  const [importStatus, setImportStatus] = useState<string>("");

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
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Data Vault</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <p className="text-sm text-gray-500">
          Your data is stored locally. Export regularly to keep it safe.
        </p>

        <div>
            <button 
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white font-bold rounded-xl active:scale-95 transition-transform"
            >
              <Download size={18} /> Download Backup
            </button>
        </div>

        <div className="border-t border-gray-100 pt-6">
             <label className="w-full flex flex-col items-center justify-center gap-2 py-4 bg-gray-50 text-gray-900 font-bold rounded-xl border border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors">
                <Upload size={18} /> 
                <span>Import Backup File</span>
                <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
             </label>
             {importStatus && <p className="text-center text-sm font-bold text-green-600 mt-2">{importStatus}</p>}
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
