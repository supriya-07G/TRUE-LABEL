import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, Share2, PhoneCall, ChevronDown, CheckCircle2, Info, BookOpen, HeartPulse, Globe, X } from 'lucide-react';
import { ScanResult, RiskLevel } from '../types';
import { translations } from '../translations';

interface ResultsViewProps {
  result: ScanResult;
  language: string;
  onBack: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, language, onBack }) => {
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const isDanger = result.riskLevel === RiskLevel.DANGER;
  const isCaution = result.riskLevel === RiskLevel.CAUTION;
  
  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    // Play alert sound if danger
    if (isDanger) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
      // Note: Auto-play policies might block this without interaction, but we attempt it.
      audio.play().catch(() => {});
    }
  }, [isDanger]);

  const handleShare = async () => {
    const text = `🚨 *True Label Safety Scan* 🚨\n\n` +
      `*Product:* ${result.productName}\n` +
      `*Result:* ${result.riskLevel} ${result.riskLevel === 'DANGER' ? '🔴' : result.riskLevel === 'CAUTION' ? '🟡' : '🟢'}\n\n` +
      `*Summary:* ${result.summary}\n\n` +
      `*Safety Note:* ${result.safetyConcerns}\n\n` +
      `Scan Date: ${new Date(result.timestamp).toLocaleDateString()}\n` +
      `--\nCheck your personalized safety profile on True Label.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `True Label: ${result.productName}`,
          text: text
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('Report copied to clipboard');
      } catch (err) {
        // Fallback or silence
        console.error('Clipboard failed', err);
      }
    }
  };

  const getHeaderColor = () => {
    if (isDanger) return 'bg-safety-danger';
    if (isCaution) return 'bg-safety-caution';
    return 'bg-brand-600'; // Semantic Green matches Brand Green
  };

  const getIcon = () => {
    if (isDanger) return <XCircle className="w-16 h-16 text-white mb-2" />;
    if (isCaution) return <AlertTriangle className="w-16 h-16 text-white mb-2" />;
    return <ShieldCheck className="w-16 h-16 text-white mb-2" />;
  };

  const getTitle = () => {
    if (isDanger) return t.doNotConsume;
    if (isCaution) return t.proceedCaution;
    return t.safeConsume;
  };

  // Determine styling for safety card based on risk
  const safetyCardStyles = isDanger 
    ? 'bg-red-50 border-red-500 text-red-800' 
    : isCaution 
      ? 'bg-amber-50 border-amber-500 text-amber-800' 
      : 'bg-blue-50 border-blue-500 text-blue-800';
  
  const safetyIconColor = isDanger ? 'text-red-800' : isCaution ? 'text-amber-800' : 'text-blue-800';
  const safetyTextColor = isDanger ? 'text-red-700' : isCaution ? 'text-amber-700' : 'text-blue-700';
  const buttonDecoration = isDanger ? 'decoration-red-300' : isCaution ? 'decoration-amber-300' : 'decoration-blue-300';

  return (
    <div className="h-full flex flex-col bg-brand-50 overflow-y-auto pb-20 animate-in slide-in-from-right duration-300">
      
      {/* Header Result Card */}
      <div className={`${getHeaderColor()} p-8 rounded-b-[2.5rem] shadow-xl text-center text-white relative transition-colors duration-500`}>
         {isDanger && (
           <div className="absolute inset-0 bg-red-800 rounded-b-[2.5rem] animate-pulse-fast opacity-50 z-0"></div>
         )}
         <div className="relative z-10 flex flex-col items-center">
            {getIcon()}
            <h1 className="text-3xl font-serif font-black tracking-wide">{getTitle()}</h1>
            <p className="mt-2 text-white/90 font-medium tracking-wide">{result.productName}</p>
         </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Summary Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100">
          <h3 className="text-brand-400 text-xs font-bold uppercase tracking-widest mb-3">{t.analysisSummary}</h3>
          <p className="text-brand-900 leading-relaxed font-medium">
            {result.summary}
          </p>
        </div>

        {/* New Usage & Directions Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100">
          <div className="flex items-start mb-4">
             <BookOpen className="w-5 h-5 text-brand-600 mr-2 mt-0.5" />
             <div>
                <h3 className="text-brand-800 font-bold font-serif mb-1">{t.usageDirections}</h3>
                <p className="text-brand-600 text-sm italic">{result.usage}</p>
             </div>
          </div>
          <div className="bg-brand-50 p-4 rounded-xl text-sm text-brand-800 leading-relaxed">
             {result.directions}
          </div>
        </div>

        <div className="space-y-3">
             {/* Banned Countries Alert */}
             {result.bannedCountries && result.bannedCountries.length > 0 && (
               <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg shadow-sm animate-pulse-fast">
                 <h4 className="font-bold text-red-900 flex items-center mb-1"><Globe className="w-4 h-4 mr-2"/> {t.bannedCountries}</h4>
                 <p className="text-sm text-red-800">
                    {t.bannedIn} <strong>{result.bannedCountries.join(', ')}</strong>
                 </p>
               </div>
             )}

             {/* Main Safety Concern Text - Always Shown */}
             <div className={`p-5 rounded-2xl border-l-4 shadow-sm ${safetyCardStyles}`}>
                 <h4 className={`font-bold flex items-center mb-2 ${safetyIconColor}`}>
                    <HeartPulse className="w-5 h-5 mr-2" />
                    {isDanger || isCaution ? t.safetyConcerns : t.safetyNotice}
                 </h4>
                 <p className={`text-sm mb-3 ${safetyTextColor}`}>
                    {result.safetyConcerns || "General Safety Tip: Always read the full label before consumption."}
                 </p>
                 <button 
                   onClick={() => setShowSafetyModal(true)}
                   className={`text-xs font-bold underline decoration-2 underline-offset-2 hover:opacity-80 ${safetyIconColor} ${buttonDecoration}`}
                 >
                   {t.viewDetails}
                 </button>
             </div>

             {result.detectedAllergens.length > 0 && (
               <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                 <h4 className="font-bold text-red-800 flex items-center"><AlertTriangle className="w-4 h-4 mr-2"/> {t.allergenDetected}</h4>
                 <p className="text-sm text-red-700 mt-1">{t.contains} {result.detectedAllergens.join(', ')}</p>
               </div>
             )}
             {result.drugInteractions.length > 0 && (
               <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                 <h4 className="font-bold text-red-800 flex items-center"><XCircle className="w-4 h-4 mr-2"/> {t.drugInteraction}</h4>
                 <p className="text-sm text-red-700 mt-1">{t.conflictsWith} {result.drugInteractions.join(', ')}</p>
               </div>
             )}
             {result.conditionConflicts.length > 0 && (
               <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
                 <h4 className="font-bold text-amber-800 flex items-center"><AlertTriangle className="w-4 h-4 mr-2"/> {t.conditionRisk}</h4>
                 <p className="text-sm text-amber-700 mt-1">{t.issuesFor} {result.conditionConflicts.join(', ')}</p>
               </div>
             )}
        </div>

        {/* Ingredients List */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-50 bg-brand-50/50">
            <h3 className="font-bold text-brand-800 font-serif">{t.ingredientBreakdown}</h3>
          </div>
          <div className="divide-y divide-brand-50">
            {result.ingredients.map((ing, idx) => (
              <div key={idx} className="p-4 px-6 flex items-start justify-between group hover:bg-brand-50 transition-colors">
                <div>
                  <p className="font-medium text-brand-800">{ing.name}</p>
                  <p className="text-xs text-brand-400 mt-1">{ing.reason}</p>
                </div>
                <div className="ml-4">
                  {ing.status === 'safe' && <CheckCircle2 className="w-5 h-5 text-brand-500" />}
                  {ing.status === 'caution' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                  {ing.status === 'danger' && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Emergency Actions if Danger */}
        {isDanger && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-brand-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom">
            <div className="flex gap-3 mb-2">
              <button 
                onClick={handleShare}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-4 rounded-xl flex items-center justify-center transition-colors active:scale-95"
              >
                <Share2 className="w-5 h-5 mr-2" />
                {t.share}
              </button>
              <button className="flex-[2] bg-red-600 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center shadow-lg shadow-red-200 active:scale-95 transition-transform">
                <PhoneCall className="w-5 h-5 mr-2" />
                {t.emergency}
              </button>
            </div>
            <p className="text-center text-xs text-brand-400 mt-2">{t.recEmergency}</p>
          </div>
        )}

        {/* Regular Actions */}
        {!isDanger && (
           <div className="grid grid-cols-2 gap-4 pt-4">
             <button onClick={onBack} className="py-3 px-4 bg-brand-100 text-brand-800 font-bold rounded-xl hover:bg-brand-200 transition-colors">
               {t.scanAnother}
             </button>
             <button 
               onClick={handleShare}
               className="py-3 px-4 bg-brand-600 text-white font-bold rounded-xl flex items-center justify-center hover:bg-brand-700 transition-colors shadow-lg shadow-brand-100"
             >
               <Share2 className="w-4 h-4 mr-2" />
               {t.shareReport}
             </button>
           </div>
        )}
        
        {/* Spacer for bottom button on mobile */}
        {isDanger && <div className="h-28"></div>}
      </div>

      {/* Safety Info Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative animate-in zoom-in-95">
             <button onClick={() => setShowSafetyModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
               <X className="w-5 h-5 text-gray-600" />
             </button>
             
             <div className="text-center mb-6 pt-2">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDanger ? 'bg-red-100' : isCaution ? 'bg-amber-100' : 'bg-blue-100'}`}>
                 <Info className={`w-8 h-8 ${isDanger ? 'text-red-600' : isCaution ? 'text-amber-600' : 'text-blue-600'}`} />
               </div>
               <h2 className="text-xl font-serif font-bold text-brand-900">{t.safetyDetails}</h2>
             </div>

             <div className="space-y-4">
               <div className={`${safetyCardStyles} p-4 rounded-xl border`}>
                 <h4 className="font-bold text-sm mb-2 uppercase tracking-wide opacity-80">{t.primaryConcern}</h4>
                 <p className="text-sm font-medium leading-relaxed">{result.safetyConcerns || "Follow standard safety guidelines."}</p>
               </div>

               {(result.detectedAllergens.length > 0 || result.drugInteractions.length > 0 || result.conditionConflicts.length > 0) ? (
                  <div className="border border-brand-100 rounded-xl p-4">
                     <h4 className="font-bold text-brand-800 text-sm mb-3">{t.specificConflicts}</h4>
                     <ul className="text-sm space-y-3 text-brand-600">
                        {result.detectedAllergens.map(a => (
                          <li key={a} className="flex items-start">
                            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded mr-2 mt-0.5">ALLERGY</span>
                            {a}
                          </li>
                        ))}
                        {result.drugInteractions.map(d => (
                          <li key={d} className="flex items-start">
                            <span className="bg-amber-100 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded mr-2 mt-0.5">INTERACTION</span>
                            {d}
                          </li>
                        ))}
                        {result.conditionConflicts.map(c => (
                          <li key={c} className="flex items-start">
                            <span className="bg-brand-100 text-brand-600 text-[10px] font-bold px-2 py-0.5 rounded mr-2 mt-0.5">CONDITION</span>
                            {c}
                          </li>
                        ))}
                     </ul>
                  </div>
               ) : (
                  <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4">
                     <h4 className="font-bold text-blue-800 text-sm mb-2">{t.noConflicts}</h4>
                     <p className="text-sm text-blue-600">{t.noConflictsDesc}</p>
                  </div>
               )}
               
               {result.bannedCountries && result.bannedCountries.length > 0 && (
                 <div className="border border-red-100 bg-red-50 rounded-xl p-4">
                    <h4 className="font-bold text-red-800 text-sm mb-2">{t.regulatoryBans}</h4>
                    <p className="text-sm text-red-700">{t.restrictedIn} {result.bannedCountries.join(', ')}</p>
                 </div>
               )}

               <div className="text-xs text-gray-400 mt-6 leading-relaxed border-t border-gray-100 pt-4">
                 <p className="font-bold mb-1">Disclaimer:</p>
                 {t.modalDisclaimer}
               </div>
             </div>

             <button onClick={() => setShowSafetyModal(false)} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl mt-6 transition-colors shadow-lg shadow-brand-100">
               {t.understood}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView;