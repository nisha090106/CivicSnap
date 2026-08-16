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
    <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white max-w-lg w-full rounded-3xl border border-emerald-200 p-6 shadow-2xl relative space-y-6 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-emerald-950">Report Civic Issue</h3>
              <p className="text-xs text-emerald-700 font-medium">AI Photo Capture & Location Routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-10 h-10 animate-bounce text-emerald-800" />
            </div>
            <h4 className="text-2xl font-extrabold text-emerald-950">Report Registered!</h4>
            <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto">
              Your issue report has been logged and queued for automatic municipal department routing.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Photo Capture View Finder Placeholder */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                1. Photo Capture
              </label>
              
              {!captured ? (
                <div
                  onClick={() => setCaptured(true)}
                  className="w-full h-44 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/50 cursor-pointer transition flex flex-col items-center justify-center gap-3 group text-center p-4"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-800 text-white flex items-center justify-center group-hover:scale-110 transition shadow-md shadow-emerald-900/20">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-emerald-950 block">Tap to Snap Photo</span>
                    <span className="text-[11px] text-emerald-700 font-medium">Point camera at issue (pothole, garbage, etc.)</span>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-44 rounded-2xl bg-emerald-50/80 border border-emerald-300 overflow-hidden flex items-center justify-center">
                  <div className="text-center p-4 space-y-2">
                    <ImageIcon className="w-12 h-12 text-emerald-800 mx-auto" />
                    <span className="text-xs text-emerald-950 font-bold block">Photo Captured Successfully!</span>
                    <span className="text-[10px] text-emerald-700 font-mono block font-semibold">GPS: 19.0760 N, 72.8777 E &bull; AI Confidence 98%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCaptured(false)}
                    className="absolute top-2 right-2 text-xs px-3 py-1 bg-white text-emerald-900 border border-emerald-300 rounded-lg hover:bg-emerald-100 font-bold cursor-pointer"
                  >
                    Retake
                  </button>
                </div>
              )}
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                2. Select Issue Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-[52px] px-3 py-3 rounded-2xl border text-left font-medium text-xs flex items-center gap-2.5 transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-800 border-emerald-800 text-white font-bold shadow-md shadow-emerald-900/20'
                        : 'bg-white border-emerald-200 text-emerald-900 hover:bg-emerald-50'
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
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                3. Additional Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Describe issue location or details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-emerald-50/40 border border-emerald-200 rounded-xl text-emerald-950 placeholder-emerald-400 text-xs focus:outline-none focus:border-emerald-800 min-h-[48px]"
              />
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-base rounded-2xl transition shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 min-h-[54px] cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-white" />
              Submit Civic Report
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
