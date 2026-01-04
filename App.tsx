import React, { useState, useEffect } from 'react';
import { User, Activity, ScanLine, FileClock, Settings, BookOpen, AlertCircle, Trash2, LogOut, ChevronRight, Droplet, Pill, HeartPulse, Globe, Plus, X, Edit2, Check, CheckSquare, Square, Clock, Hash, Search } from 'lucide-react';

import { UserProfile, ViewState, ScanResult, RiskLevel } from './types.ts';
import Scanner from './components/Scanner.tsx';
import ResultsView from './components/ResultsView.tsx';
import { translations } from './translations.ts';

// --- LOGO COMPONENT ---
const BrandLogo = ({ size = 'large' }: { size?: 'small' | 'large' }) => (
  <div className={`flex flex-col items-center justify-center ${size === 'small' ? 'scale-75 origin-left' : ''}`}>
    <div className="relative w-16 h-16 flex items-center justify-center">
       <div className="absolute inset-0 border-[3px] border-brand-800 rounded-full opacity-20"></div>
       <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center shadow-md">
         <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-brand-100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
           <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" className="text-brand-700 opacity-50 stroke-none" />
           <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
           <path d="M9 12l2 2 4-4" stroke="#dcfce7" />
         </svg>
       </div>
    </div>
    {size === 'large' && (
      <div className="mt-2 text-center">
        <h1 className="text-xl font-serif tracking-[0.15em] font-bold text-brand-900 uppercase">True Label</h1>
        <p className="text-[0.55rem] tracking-widest text-brand-600 uppercase">Wellness You Can Trust</p>
      </div>
    )}
  </div>
);

// --- HELPER COMPONENT: Editable List ---
const EditableList = ({ 
  title, 
  icon: Icon, 
  colorClass, 
  items, 
  onAdd, 
  onRemove,
  placeholder,
  noneSelectedText,
  filterQuery = ""
}: { 
  title: string, 
  icon: any, 
  colorClass: string, 
  items: string[], 
  onAdd: (item: string) => void, 
  onRemove: (item: string) => void,
  placeholder: string,
  noneSelectedText: string,
  filterQuery?: string
}) => {
  const [newItem, setNewItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
      setIsAdding(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg mr-3 ${colorClass.replace('text-', 'bg-').replace('600', '50').replace('500', '50')}`}>
            <Icon className={`w-5 h-5 ${colorClass}`}/>
          </div>
          <h3 className="font-bold text-brand-800">{title}</h3>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="p-2 hover:bg-brand-50 rounded-full text-brand-600">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isAdding && (
        <div className="flex gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
          <input 
            type="text" 
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-brand-200 rounded-lg text-sm outline-none focus:ring-2 ring-brand-500 bg-white text-brand-900"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <button onClick={handleAdd} className="bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
            +
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
          <div key={idx} className="group relative">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium border flex items-center pr-8 ${colorClass.includes('red') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-brand-50 text-brand-700 border-brand-100'}`}>
              {item}
              <button 
                onClick={() => onRemove(item)}
                className="absolute right-1 p-0.5 rounded-full hover:bg-black/5 text-current opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        )) : items.length > 0 ? (
          <span className="text-brand-300 italic text-sm py-1">No matches found</span>
        ) : (
          <span className="text-brand-300 italic text-sm py-1">{noneSelectedText}</span>
        )}
      </div>
    </div>
  );
};

const COMMON_CONDITIONS = [
  'Diabetes Type 1', 'Diabetes Type 2', 'Hypertension (High BP)', 
  'High Cholesterol', 'Heart Disease', 'Obesity', 'Anemia',
  'Asthma', 'COPD', 'Sleep Apnea',
  'Arthritis', 'Gout', 'Lupus', 'Psoriasis', 'Eczema', 
  'Fibromyalgia', 'Chronic Pain',
  'Acid Reflux (GERD)', 'Celiac Disease', 'Lactose Intolerance', 
  'Crohn\'s Disease', 'Ulcerative Colitis', 'IBS',
  'Kidney Disease', 'Liver Disease', 
  'Thyroid Disorder', 'PCOS', 'Endometriosis', 
  'Pregnancy', 'Breastfeeding', 'Menopause',
  'Migraine', 'Epilepsy', 'Depression', 'Anxiety', 'ADHD',
  'Glaucoma', 'Osteoporosis', 'Cancer History'
].sort();

const Onboarding = ({ onComplete }: { onComplete: (profile: UserProfile) => void }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({
    conditions: [],
    allergies: [],
    medications: [],
    language: 'en',
    gender: ''
  });

  const t = translations[data.language || 'en'];
  const [noAllergies, setNoAllergies] = useState(false);
  const [noMeds, setNoMeds] = useState(false);
  const [medInput, setMedInput] = useState({ name: '', dosage: '', freq: '' });
  
  // Local state for raw allergy text to prevent jumpy formatting with commas/spaces
  const [allergyText, setAllergyText] = useState('');

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else {
      onComplete({
        id: Date.now().toString(),
        onboardingCompleted: true,
        name: data.name || 'User',
        age: data.age || 30,
        gender: data.gender || 'Other',
        weight: data.weight || 70,
        conditions: data.conditions || [],
        allergies: noAllergies ? [] : (data.allergies || []),
        medications: noMeds ? [] : (data.medications || []),
        language: data.language as any
      });
    }
  };

  const toggleCondition = (condition: string) => {
    if (condition === 'None') {
       setData({...data, conditions: []});
    } else {
       const current = data.conditions || [];
       const isSelected = current.includes(condition);
       const newConditions = isSelected ? current.filter(c => c !== condition) : [...current, condition];
       setData({...data, conditions: newConditions});
    }
  };

  const addMedication = () => {
    if (!medInput.name.trim()) return;
    let entry = medInput.name.trim();
    if (medInput.dosage.trim()) entry += ` (${medInput.dosage.trim()})`;
    if (medInput.freq.trim()) entry += ` - ${medInput.freq.trim()}`;
    const currentMeds = data.medications || [];
    setData({...data, medications: [...currentMeds, entry]});
    setMedInput({ name: '', dosage: '', freq: '' });
    setNoMeds(false);
  };

  const removeMedication = (index: number) => {
    const currentMeds = data.medications || [];
    setData({...data, medications: currentMeds.filter((_, i) => i !== index)});
  };

  return (
    <div className="p-6 h-full flex flex-col justify-center bg-brand-50">
      <div className="mb-8 flex flex-col items-center">
        <BrandLogo />
        <div className="h-1.5 w-32 bg-brand-200 rounded-full overflow-hidden mt-6">
          <div className="h-full bg-brand-600 transition-all duration-300" style={{ width: `${step * 25}%` }}></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right">
            <h2 className="text-2xl font-serif font-bold text-brand-900">{t.basicInfo}</h2>
            <div>
              <label className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-1 block">{t.languageSelect}</label>
              <select className="w-full p-4 bg-white rounded-xl border border-brand-100 outline-none focus:ring-2 ring-brand-500 text-brand-900 appearance-none" value={data.language} onChange={e => setData({...data, language: e.target.value as any})}>
                <option value="en">English</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="hi">Hindi (हिंदी)</option>
              </select>
            </div>
            <input type="text" placeholder={t.fullName} className="w-full p-4 bg-white rounded-xl border border-brand-100 focus:ring-2 ring-brand-500 outline-none text-brand-900 placeholder:text-brand-300" onChange={e => setData({...data, name: e.target.value})} value={data.name || ''} />
            <div className="grid grid-cols-2 gap-4">
               <input type="number" placeholder={t.age} className="w-full p-4 bg-white rounded-xl border border-brand-100 outline-none focus:ring-2 ring-brand-500 text-brand-900 placeholder:text-brand-300" onChange={e => setData({...data, age: parseInt(e.target.value)})} value={data.age || ''} />
               <input type="number" placeholder={t.weight} className="w-full p-4 bg-white rounded-xl border border-brand-100 outline-none focus:ring-2 ring-brand-500 text-brand-900 placeholder:text-brand-300" onChange={e => setData({...data, weight: parseInt(e.target.value)})} value={data.weight || ''} />
            </div>
            <div>
              <label className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-1 block">{t.gender}</label>
              <select 
                className="w-full p-4 bg-white rounded-xl border border-brand-100 outline-none focus:ring-2 ring-brand-500 text-brand-900 appearance-none" 
                value={data.gender || ''} 
                onChange={e => setData({...data, gender: e.target.value})}
              >
                <option value="" disabled>{t.gender}</option>
                <option value="Male">{t.male}</option>
                <option value="Female">{t.female}</option>
                <option value="Other">{t.other}</option>
              </select>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right pb-4">
            <h2 className="text-2xl font-serif font-bold text-brand-900">{t.healthProfile}</h2>
            <p className="text-brand-600 text-sm">{t.chronicConditionsDesc}</p>
            <label className={`flex items-center p-4 rounded-xl border transition-colors ${data.conditions?.length === 0 ? 'border-brand-500 bg-brand-100' : 'border-brand-100 bg-white'}`}>
                <input type="checkbox" className="w-5 h-5 text-brand-600 accent-brand-600" checked={data.conditions?.length === 0} onChange={() => toggleCondition('None')} />
                <span className="ml-3 font-medium text-brand-800">{t.noneHealthy}</span>
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-1">
              {COMMON_CONDITIONS.map(c => (
                <label key={c} className={`flex items-center p-3 rounded-lg border transition-colors ${data.conditions?.includes(c) ? 'border-brand-500 bg-brand-100' : 'border-brand-100 bg-white'}`}>
                  <input type="checkbox" className="w-4 h-4 text-brand-600 accent-brand-600" checked={data.conditions?.includes(c)} onChange={() => toggleCondition(c)} />
                  <span className="ml-3 text-sm font-medium text-brand-800">{c}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right">
            <div>
              <h2 className="text-2xl font-serif font-bold text-brand-900 mb-2">{t.medications}</h2>
               <div className="flex items-center mb-4" onClick={() => { setNoMeds(!noMeds); if(!noMeds) setData({...data, medications: []}); }}>
                 {noMeds ? <CheckSquare className="w-5 h-5 text-brand-600 mr-2" /> : <Square className="w-5 h-5 text-brand-300 mr-2" />}
                 <span className="text-sm font-medium text-brand-700">{t.noMeds}</span>
              </div>
              {!noMeds && (
                <div className="bg-white p-4 rounded-xl border border-brand-100 shadow-sm mb-4">
                  <div className="space-y-3">
                    <input type="text" placeholder={t.medNamePlaceholder} className="w-full p-3 bg-brand-50 rounded-lg border border-brand-100 outline-none focus:ring-2 ring-brand-500 text-sm" value={medInput.name} onChange={e => setMedInput({...medInput, name: e.target.value})} />
                    <div className="flex gap-2">
                       <input type="text" placeholder={t.dosagePlaceholder} className="w-full p-3 bg-brand-50 rounded-lg border border-brand-100 outline-none focus:ring-2 ring-brand-500 text-sm" value={medInput.dosage} onChange={e => setMedInput({...medInput, dosage: e.target.value})} />
                       <input type="text" placeholder={t.freqPlaceholder} className="w-full p-3 bg-brand-50 rounded-lg border border-brand-100 outline-none focus:ring-2 ring-brand-500 text-sm" value={medInput.freq} onChange={e => setMedInput({...medInput, freq: e.target.value})} />
                    </div>
                    <button onClick={addMedication} disabled={!medInput.name} className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center">
                      <Plus className="w-4 h-4 mr-2" /> {t.addMedication}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-brand-900 mb-2">{t.allergies}</h2>
              <textarea 
                placeholder={t.allergiesPlaceholder} 
                disabled={noAllergies} 
                className={`w-full p-4 bg-white rounded-xl border outline-none focus:ring-2 ring-brand-500 h-24 text-brand-900 transition-opacity ${noAllergies ? 'opacity-50' : 'border-brand-100'}`} 
                value={allergyText} 
                onChange={e => {
                  const val = e.target.value;
                  setAllergyText(val);
                  // Update parent data silently as a structured array
                  setData({
                    ...data, 
                    allergies: val.split(',').map(s => s.trim()).filter(Boolean)
                  });
                }} 
              />
            </div>
          </div>
        )}
        {step === 4 && (
           <div className="space-y-4 animate-in slide-in-from-right text-center">
             <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-brand-200"><Activity className="w-10 h-10 text-brand-600" /></div>
             <h2 className="text-3xl font-serif font-bold text-brand-900">{t.allSet}</h2>
             <p className="text-brand-600">{t.profileReady}</p>
           </div>
        )}
      </div>
      <button onClick={handleNext} className="w-full bg-brand-600 text-white font-bold tracking-wide py-4 rounded-xl mt-6 shadow-lg hover:bg-brand-700 transition-colors">
        {step === 4 ? t.startScanning : t.nextStep}
      </button>
    </div>
  );
};

const MedicalCabinet = ({ profile, onUpdateProfile }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void }) => {
  const t = translations[profile.language];
  const [search, setSearch] = useState("");
  
  const handleAddItem = (category: 'medications' | 'allergies' | 'conditions', item: string) => {
    const list = profile[category] || [];
    if (!list.includes(item)) {
       onUpdateProfile({ ...profile, [category]: [...list, item] });
    }
  };

  const handleRemoveItem = (category: 'medications' | 'allergies' | 'conditions', item: string) => {
    const list = profile[category] || [];
    onUpdateProfile({ ...profile, [category]: list.filter(i => i !== item) });
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in pb-24">
      <h2 className="text-2xl font-serif font-bold text-brand-900 mb-2">{t.myCabinet}</h2>
      
      {/* Search Bar with White Background */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-brand-400" />
        <input 
          type="text" 
          placeholder="Search cabinet..." 
          className="w-full bg-white border border-brand-100 rounded-2xl py-3.5 pl-12 pr-4 text-brand-900 outline-none focus:ring-2 ring-brand-500 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <EditableList 
        title={t.medications} 
        icon={Pill} 
        colorClass="text-blue-500" 
        items={profile.medications}
        onAdd={(item) => handleAddItem('medications', item)}
        onRemove={(item) => handleRemoveItem('medications', item)}
        placeholder={t.medNamePlaceholder}
        noneSelectedText={t.noneSelected}
        filterQuery={search}
      />

      <EditableList 
        title={t.allergies} 
        icon={AlertCircle} 
        colorClass="text-red-500" 
        items={profile.allergies}
        onAdd={(item) => handleAddItem('allergies', item)}
        onRemove={(item) => handleRemoveItem('allergies', item)}
        placeholder={t.allergiesPlaceholder}
        noneSelectedText={t.noneSelected}
        filterQuery={search}
      />

      <EditableList 
        title="Chronic Conditions" 
        icon={HeartPulse} 
        colorClass="text-brand-600" 
        items={profile.conditions}
        onAdd={(item) => handleAddItem('conditions', item)}
        onRemove={(item) => handleRemoveItem('conditions', item)}
        placeholder="Add condition..."
        noneSelectedText={t.noneSelected}
        filterQuery={search}
      />
    </div>
  );
};

const History = ({ scans, onView, language }: { scans: ScanResult[], onView: (r: ScanResult) => void, language: string }) => {
  const t = translations[language as keyof typeof translations] || translations.en;
  return (
    <div className="p-6 pb-24 animate-in fade-in">
      <h2 className="text-2xl font-serif font-bold text-brand-900 mb-6">{t.history}</h2>
      {scans.length === 0 ? (
        <div className="text-center py-20 text-brand-300">
          <FileClock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t.noScans}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scans.slice().reverse().map(scan => (
            <div key={scan.id} onClick={() => onView(scan)} className="bg-white p-4 rounded-xl border border-brand-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-brand-50 transition-colors">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-4 ${scan.riskLevel === 'DANGER' ? 'bg-safety-danger' : scan.riskLevel === 'CAUTION' ? 'bg-safety-caution' : 'bg-safety-safe'}`}></div>
                <div>
                  <h4 className="font-bold text-brand-900">{scan.productName}</h4>
                  <p className="text-xs text-brand-400">{new Date(scan.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-brand-200" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Education = ({ language }: { language: string }) => {
  const t = translations[language as keyof typeof translations] || translations.en;
  return (
    <div className="p-6 pb-24 animate-in fade-in">
      <h2 className="text-2xl font-serif font-bold text-brand-900 mb-6">{t.safetyQuiz}</h2>
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 rounded-2xl text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-500 rounded-full opacity-20"></div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className="text-[10px] tracking-widest font-bold bg-white/20 px-2 py-1 rounded text-white">{t.dailyTip}</span>
          <BookOpen className="w-5 h-5 text-brand-100"/>
        </div>
        <p className="font-medium text-lg mb-2 relative z-10 font-serif">"Grapefruit juice can interact with statins and affect how they work."</p>
      </div>
      <h3 className="font-bold text-brand-800 mb-4">{t.earnBadges}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-brand-100 flex flex-col items-center text-center cursor-pointer hover:bg-brand-50 transition-colors">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2 text-2xl">💊</div>
          <p className="font-bold text-sm text-brand-700">{t.medMaster}</p>
          <div className="w-full bg-brand-50 h-1.5 rounded-full mt-2"><div className="w-2/3 bg-amber-400 h-full rounded-full"></div></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-brand-100 flex flex-col items-center text-center cursor-pointer hover:bg-brand-50 transition-colors">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 text-2xl">🥗</div>
          <p className="font-bold text-sm text-brand-700">{t.foodSafety}</p>
          <div className="w-full bg-brand-50 h-1.5 rounded-full mt-2"><div className="w-1/3 bg-green-500 h-full rounded-full"></div></div>
        </div>
      </div>
    </div>
  );
};

const SettingsView = ({ profile, onUpdateProfile, onReset }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onReset: () => void }) => {
  const t = translations[profile.language];
  return (
    <div className="p-6 pb-24 animate-in fade-in">
      <h2 className="text-2xl font-serif font-bold text-brand-900 mb-6">{t.settings}</h2>
      <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-brand-50 flex justify-between items-center">
          <span className="text-brand-600 flex items-center"><Globe className="w-4 h-4 mr-2"/> {t.language}</span>
          <select className="bg-brand-50 text-brand-900 font-bold uppercase text-sm p-2 rounded-lg border-none outline-none focus:ring-1 ring-brand-300" value={profile.language} onChange={(e) => onUpdateProfile({...profile, language: e.target.value as any})}>
            <option value="en">English</option>
            <option value="te">Telugu</option>
            <option value="hi">Hindi</option>
          </select>
        </div>
        <div className="p-4 border-b border-brand-50 flex justify-between items-center">
          <span className="text-brand-600">{t.version}</span>
          <span className="text-brand-400">1.1.0</span>
        </div>
      </div>
      <button onClick={onReset} className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors">
        <Trash2 className="w-5 h-5 mr-2" /> {t.resetData}
      </button>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState<ViewState>('ONBOARDING');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('truelabel_profile');
    const savedHistory = localStorage.getItem('truelabel_history');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setView('DASHBOARD');
    }
    if (savedHistory) {
      setScanHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('truelabel_profile', JSON.stringify(newProfile));
    setView('DASHBOARD');
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('truelabel_profile', JSON.stringify(newProfile));
  };

  const handleScanComplete = (result: ScanResult) => {
    setCurrentResult(result);
    const newHistory = [...scanHistory, result];
    setScanHistory(newHistory);
    localStorage.setItem('truelabel_history', JSON.stringify(newHistory));
    setView('RESULTS');
  };

  const handleReset = () => {
    const currentLang = profile?.language || 'en';
    const t = translations[currentLang as keyof typeof translations] || translations.en;
    if (window.confirm(t.confirmReset)) {
      // Clear all local storage related to this app
      localStorage.removeItem('truelabel_profile');
      localStorage.removeItem('truelabel_history');
      localStorage.clear();
      
      // Clear in-memory state
      setProfile(null);
      setScanHistory([]);
      setView('ONBOARDING');
      
      // Force a full page reload to guarantee a clean state across all components/timers
      window.location.reload();
    }
  };

  if (!profile && view === 'ONBOARDING') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }
  
  const currentLang = profile?.language || 'en';
  const t = translations[currentLang as keyof typeof translations] || translations.en;

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-brand-50 relative shadow-2xl overflow-hidden flex flex-col font-sans text-brand-900">
      <div className="flex-1 overflow-y-auto relative">
        {view === 'DASHBOARD' && profile && (
          <div className="p-6 animate-in fade-in pb-24">
             <header className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-xl font-serif font-bold text-brand-900">{t.hello}, {profile.name}</h1>
                   <p className="text-sm text-brand-500">{t.staySafe}</p>
                </div>
                <div onClick={() => setView('SETTINGS')} className="bg-white p-2 rounded-full shadow-sm border border-brand-100 cursor-pointer hover:bg-brand-50"><Settings className="w-5 h-5 text-brand-600" /></div>
             </header>
             <div onClick={() => setView('SCANNER')} className="bg-brand-600 rounded-3xl p-8 text-white shadow-xl shadow-brand-200 mb-8 cursor-pointer transform transition hover:scale-[1.02] active:scale-95 relative overflow-hidden group">
                <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm"><ScanLine className="w-8 h-8 text-white" /></div>
                <h2 className="text-2xl font-serif font-bold mb-2 tracking-wide">{t.scanProduct}</h2>
                <p className="text-brand-100 text-sm">{t.scanDesc}</p>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setView('CABINET')} className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                   <div className="bg-brand-100 w-10 h-10 rounded-full flex items-center justify-center mb-3"><Droplet className="w-5 h-5 text-brand-600" /></div>
                   <h3 className="font-bold text-brand-800">{t.myCabinet}</h3>
                   <p className="text-xs text-brand-400">{profile.medications.length} {t.medsCount}</p>
                </div>
                <div onClick={() => setView('HISTORY')} className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                   <div className="bg-amber-100 w-10 h-10 rounded-full flex items-center justify-center mb-3"><FileClock className="w-5 h-5 text-amber-600" /></div>
                   <h3 className="font-bold text-brand-800">{t.history}</h3>
                   <p className="text-xs text-brand-400">{scanHistory.length} {t.scansCount}</p>
                </div>
             </div>
             <div onClick={() => setView('EDUCATION')} className="mt-4 bg-brand-50 border border-brand-100 p-5 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-brand-100 transition-colors">
                <div className="flex items-center">
                   <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center mr-3"><BookOpen className="w-4 h-4 text-brand-700" /></div>
                   <div><h3 className="font-bold text-brand-900">{t.safetyQuiz}</h3><p className="text-xs text-brand-500">{t.learnEarn}</p></div>
                </div>
                <ChevronRight className="w-5 h-5 text-brand-300" />
             </div>
          </div>
        )}
        {view === 'SCANNER' && profile && <Scanner userProfile={profile} onScanComplete={handleScanComplete} onCancel={() => setView('DASHBOARD')} />}
        {view === 'RESULTS' && currentResult && <ResultsView result={currentResult} language={currentLang} onBack={() => setView('DASHBOARD')} />}
        {view === 'CABINET' && profile && <MedicalCabinet profile={profile} onUpdateProfile={handleUpdateProfile} />}
        {view === 'HISTORY' && <History scans={scanHistory} language={currentLang} onView={(r) => { setCurrentResult(r); setView('RESULTS'); }} />}
        {view === 'EDUCATION' && <Education language={currentLang} />}
        {view === 'SETTINGS' && profile && <SettingsView profile={profile} onUpdateProfile={handleUpdateProfile} onReset={handleReset} />}
      </div>
      {view !== 'SCANNER' && view !== 'ONBOARDING' && view !== 'RESULTS' && (
        <nav className="bg-white border-t border-brand-100 flex justify-around py-4 pb-6 absolute bottom-0 w-full z-10 shadow-sm">
           <button onClick={() => setView('DASHBOARD')} className={`flex flex-col items-center transition-colors ${view === 'DASHBOARD' ? 'text-brand-600' : 'text-brand-300'}`}>
             <User className="w-6 h-6" />
             <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{t.home}</span>
           </button>
           <button onClick={() => setView('SCANNER')} className="flex flex-col items-center -mt-8">
             <div className="bg-brand-600 p-4 rounded-full shadow-lg border-4 border-brand-50 transition-transform active:scale-95"><ScanLine className="w-6 h-6 text-white" /></div>
           </button>
           <button onClick={() => setView('CABINET')} className={`flex flex-col items-center transition-colors ${view === 'CABINET' ? 'text-brand-600' : 'text-brand-300'}`}>
             <Activity className="w-6 h-6" />
             <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{t.health}</span>
           </button>
        </nav>
      )}
    </div>
  );
};

export default App;