import React, { useState } from 'react';
import { Camera, X, MapPin, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = [
  { id: 'pothole', label: 'Road & Pothole', icon: '🛣️' },
  { id: 'garbage', label: 'Waste / Garbage', icon: '🗑️' },
  { id: 'water', label: 'Water Leakage', icon: '💧' },
  { id: 'electricity', label: 'Street Light / Wire', icon: '💡' },
];

export default function ReportIssueModal({ isOpen, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [captured, setCaptured] = useState(false);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setCaptured(false);
      setDescription('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card max-w-lg w-full rounded-3xl border border-slate-800 p-6 shadow-2xl relative space-y-6 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-white">Report Civic Issue</h3>
              <p className="text-xs text-slate-400">AI Photo Capture & Location Routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h4 className="text-2xl font-bold text-white">Report Registered!</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Your issue report has been logged and queued for automatic municipal department routing.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Photo Capture View Finder Placeholder */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Photo Capture
              </label>
              
              {!captured ? (
                <div
                  onClick={() => setCaptured(true)}
                  className="w-full h-44 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer transition flex flex-col items-center justify-center gap-3 group text-center p-4"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition shadow-lg shadow-emerald-500/20">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-emerald-300 block">Tap to Snap Photo</span>
                    <span className="text-[11px] text-slate-400">Point camera at issue (pothole, garbage, etc.)</span>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-44 rounded-2xl bg-slate-900 border border-emerald-500/50 overflow-hidden flex items-center justify-center">
                  <div className="text-center p-4 space-y-2">
                    <ImageIcon className="w-12 h-12 text-emerald-400 mx-auto" />
                    <span className="text-xs text-emerald-300 font-semibold block">Photo Captured Successfully!</span>
                    <span className="text-[10px] text-slate-500 font-mono block">GPS: 19.0760 N, 72.8777 E &bull; AI Confidence 98%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCaptured(false)}
                    className="absolute top-2 right-2 text-xs px-2.5 py-1 bg-slate-950/80 text-slate-300 border border-slate-700 rounded-lg hover:text-white"
                  >
                    Retake
                  </button>
                </div>
              )}
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Select Issue Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-[52px] px-3 py-3 rounded-2xl border text-left font-medium text-xs flex items-center gap-2.5 transition ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold shadow-md shadow-emerald-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Description */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Additional Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Describe issue location or details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 min-h-[48px]"
              />
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-base rounded-2xl transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 min-h-[54px]"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              Submit Civic Report
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
