import React, { useState } from 'react';
import { Camera, X, MapPin, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'pothole', label: 'Road & Pothole', icon: '🛣️' },
  { id: 'garbage', label: 'Waste / Garbage', icon: '🗑️' },
  { id: 'water', label: 'Water Leakage', icon: '💧' },
  { id: 'electricity', label: 'Street Light / Wire', icon: '💡' },
];

export default function ReportIssueModal({ isOpen, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [captured, setCaptured] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();

  if (!isOpen) return null;

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCaptured(true);
      setLocationError('');

      // Request location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            setLocationError('');
          },
          (error) => {
            console.error(error);
            setLocationError('Location permission is required to report an issue. Please enable GPS.');
          }
        );
      } else {
        setLocationError('Geolocation is not supported by this browser.');
      }
    }
  };

  const resetForm = () => {
    setCaptured(false);
    setImageFile(null);
    setPreviewUrl(null);
    setLocation(null);
    setLocationError('');
    setDescription('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !location) {
      setLocationError('Please capture a photo and ensure location is enabled.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      // Removed category and description as requested for this stage.
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${BACKEND_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          resetForm();
          onClose();
          window.location.reload(); // Quick way to refresh My Reports
        }, 1800);
      } else {
        const errorData = await res.json();
        setLocationError(errorData.detail || 'Failed to submit report.');
      }
    } catch (err) {
      console.error(err);
      setLocationError('Network error while submitting report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-pista-100 max-w-lg w-full rounded-3xl border border-pista-400 shadow-2xl relative my-auto overflow-hidden">

        {/* Header — DARK BOTTLE GREEN */}
        <div className="bg-bottle-900 text-white p-6 border-b border-bottle-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-bottle-800 border border-bottle-700 flex items-center justify-center text-white">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-xl text-white">Report Civic Issue</h3>
              <p className="text-xs text-pista-300 font-extrabold">AI Photo Capture & Location Routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-bottle-800 hover:bg-bottle-700 border border-bottle-700 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-bottle-800 border border-bottle-700 text-white flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-10 h-10 animate-bounce text-white" />
              </div>
              <h4 className="text-2xl font-black text-bottle-900">Report Registered!</h4>
              <p className="text-xs text-slate-700 font-semibold max-w-xs mx-auto">
                Your issue report has been logged and queued for automatic municipal department routing.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Photo Capture View Finder Placeholder */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-bottle-800 uppercase tracking-wider">
                  1. Photo Capture & Location
                </label>

                {!captured ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCapture}
                      className="hidden"
                      id="camera-input"
                    />
                    <label
                      htmlFor="camera-input"
                      className="w-full h-44 rounded-2xl border-2 border-dashed border-pista-400 bg-pista-200 hover:bg-pista-300 cursor-pointer transition flex flex-col items-center justify-center gap-3 group text-center p-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-bottle-800 text-white flex items-center justify-center group-hover:scale-110 transition shadow-md shadow-bottle-950/30 border border-bottle-700">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-bottle-900 block">Tap to Snap Photo</span>
                        <span className="text-[11px] text-bottle-600 font-extrabold">Point camera at issue (pothole, garbage, etc.)</span>
                      </div>
                    </label>
                  </>
                ) : (
                  <div className="relative w-full h-44 rounded-2xl bg-pista-200 border border-pista-400 overflow-hidden flex flex-col items-center justify-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Captured preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    ) : null}
                    <div className="text-center p-4 relative z-10 bg-white/70 rounded-xl m-2">
                      <ImageIcon className="w-8 h-8 text-bottle-800 mx-auto mb-1" />
                      <span className="text-xs text-bottle-900 font-black block">Photo Captured!</span>
                      <span className="text-[10px] text-bottle-800 font-mono block font-bold mt-1">
                        {location ? `GPS: ${location.latitude.toFixed(4)} N, ${location.longitude.toFixed(4)} E` : 'Getting GPS...'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => resetForm()}
                      className="absolute top-2 right-2 z-20 text-xs px-3 py-1 bg-bottle-800 text-white border border-bottle-700 rounded-lg hover:bg-bottle-600 font-black cursor-pointer shadow-sm"
                    >
                      Retake
                    </button>
                  </div>
                )}
                {locationError && (
                  <div className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {locationError}
                  </div>
                )}
              </div>

              {/* Category Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-bottle-800 uppercase tracking-wider">
                  2. Select Issue Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`min-h-[52px] px-3 py-3 rounded-2xl border text-left font-semibold text-xs flex items-center gap-2.5 transition cursor-pointer ${selectedCategory === cat.id
                          ? 'bg-bottle-800 border-bottle-700 text-white font-black shadow-md shadow-bottle-950/30'
                          : 'bg-white border-pista-400 text-bottle-800 hover:bg-pista-200'
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
                <label className="block text-xs font-black text-bottle-800 uppercase tracking-wider">
                  3. Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Describe issue location or details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-pista-400 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-bottle-800 min-h-[48px]"
                />
              </div>

              {/* Action Buttons — DARK BOTTLE GREEN */}
              <button
                type="submit"
                disabled={isSubmitting || !captured || !location}
                className="w-full py-4 bg-bottle-800 disabled:bg-bottle-400 hover:bg-bottle-600 text-white font-black text-base rounded-2xl transition shadow-xl shadow-bottle-950/30 flex items-center justify-center gap-2 min-h-[54px] cursor-pointer border border-bottle-700"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Sparkles className="w-5 h-5 text-white" />}
                {isSubmitting ? 'Processing...' : 'Submit Civic Report'}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
