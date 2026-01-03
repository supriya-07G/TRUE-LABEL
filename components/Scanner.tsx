import React, { useState, useRef } from 'react';
import { Camera, Upload, Search, Type, Loader2, AlertCircle } from 'lucide-react';
import { UserProfile, ScanResult } from '../types';
import { analyzeProduct } from '../services/geminiService';
import { translations } from '../translations';

interface ScannerProps {
  userProfile: UserProfile;
  onScanComplete: (result: ScanResult) => void;
  onCancel: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ userProfile, onScanComplete, onCancel }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [mode, setMode] = useState<'camera' | 'text'>('camera');
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[userProfile.language || 'en'];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    try {
      const result = await analyzeProduct(file, userProfile);
      onScanComplete(result);
    } catch (error) {
      console.error(error);
      setIsScanning(false);
      alert("Failed to analyze image. Please try again.");
    }
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;
    setIsScanning(true);
    try {
      const result = await analyzeProduct(inputText, userProfile);
      onScanComplete(result);
    } catch (error) {
      console.error(error);
      setIsScanning(false);
      alert("Failed to analyze text.");
    }
  };

  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-300 bg-brand-50">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-600 rounded-full opacity-20 animate-ping"></div>
          <div className="relative bg-white p-4 rounded-full shadow-xl">
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
          </div>
        </div>
        <h2 className="mt-6 text-xl font-serif font-bold text-brand-900">{t.analyzing}</h2>
        <p className="mt-2 text-brand-500">{t.analyzingDesc}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-bottom duration-300 bg-brand-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-brand-900">{t.scanProduct}</h2>
        <button onClick={onCancel} className="text-brand-400 hover:text-brand-700 font-medium">{t.cancel}</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-100 p-1 mb-6 flex">
        <button 
          onClick={() => setMode('camera')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'camera' ? 'bg-brand-600 text-white shadow-sm' : 'text-brand-500 hover:bg-brand-50'}`}
        >
          <Camera className="w-4 h-4 inline-block mr-2" />
          {t.camera}
        </button>
        <button 
          onClick={() => setMode('text')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'text' ? 'bg-brand-600 text-white shadow-sm' : 'text-brand-500 hover:bg-brand-50'}`}
        >
          <Type className="w-4 h-4 inline-block mr-2" />
          {t.manual}
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {mode === 'camera' ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-brand-300 rounded-2xl bg-white hover:bg-brand-50 transition-colors cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload}
            />
            <div className="p-4 bg-brand-50 rounded-full shadow-inner mb-4 group-hover:bg-brand-100 transition-colors">
              <Camera className="w-8 h-8 text-brand-600" />
            </div>
            <p className="text-brand-800 font-medium">{t.tapToPhoto}</p>
            <p className="text-brand-400 text-sm mt-1">{t.gallery}</p>
            
            <div className="mt-8 max-w-xs text-center">
              <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg flex items-center justify-center border border-amber-100">
                <AlertCircle className="w-3 h-3 mr-1" />
                {t.ensureVisible}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <textarea 
              className="w-full h-48 p-4 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none mb-4 bg-white text-brand-900 placeholder:text-brand-300"
              placeholder={t.enterText}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button 
              onClick={handleTextSubmit}
              disabled={!inputText.trim()}
              className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand-200 hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.analyzeText}
            </button>
          </div>
        )}
      </div>
      
      <p className="text-center text-xs text-brand-400 mt-6">
        {t.aiDisclaimer}
      </p>
    </div>
  );
};

export default Scanner;