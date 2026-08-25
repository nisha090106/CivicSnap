import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, MapPin, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon, Loader2, Upload, Focus, Milestone, Trash2, Pill, Trees, Building2, Building, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'Road & Transport', label: 'Road & Transport', icon: Milestone },
  { value: 'Garbage & Waste Management', label: 'Garbage & Waste Management', icon: Trash2 },
  { value: 'Food & Drug Authority', label: 'Food & Drug Authority', icon: Pill },
  { value: 'Forest Department', label: 'Forest Department', icon: Trees },
  { value: 'Municipal Corporation', label: 'Municipal Corporation', icon: Building2 },
  { value: 'Nagar Panchayat', label: 'Nagar Panchayat', icon: Building },
  { value: 'Gram Panchayat', label: 'Gram Panchayat', icon: Home }
];

export default function ReportIssueModal({ isOpen, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].value);
  const [captured, setCaptured] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Live Camera state
  const [liveStream, setLiveStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { token } = useAuth();

  useEffect(() => {
    if (isOpen) {
      resetForm();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  // Bind the stream to the video element safely
  useEffect(() => {
    if (cameraActive && liveStream && videoRef.current) {
      videoRef.current.srcObject = liveStream;
    }
  }, [cameraActive, liveStream]);

  const startCamera = async () => {
    setLocationError('');
    setCameraActive(true);
    setLiveStream(null);

    const streamPromise = (async () => {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch (err1) {
        if (err1.name === 'NotAllowedError') throw err1;
        return await navigator.mediaDevices.getUserMedia({ video: true });
      }
    })();

    let streamTimeout;
    const timeoutPromise = new Promise((_, reject) => {
      streamTimeout = setTimeout(() => reject(new Error('TIMEOUT')), 6000);
    });

    try {
      const stream = await Promise.race([streamPromise, timeoutPromise]);
      clearTimeout(streamTimeout);
      setLiveStream(stream);
    } catch (err) {
      clearTimeout(streamTimeout);
      setCameraActive(false);
      if (err.name === 'NotAllowedError') {
        setLocationError('Camera access was denied — please allow camera permission in your browser, or upload a photo instead.');
      } else if (err.name === 'NotFoundError') {
        setLocationError('No camera found on your device — please upload a photo instead.');
      } else if (err.message === 'TIMEOUT') {
        setLocationError('Camera took too long to start — please upload a photo instead.');
      } else {
        console.error("Camera error:", err);
        setLocationError("Couldn't access camera — please upload a photo instead.");
      }
    }
  };

  const stopCamera = () => {
    if (liveStream) {
      liveStream.getTracks().forEach(track => track.stop());
      setLiveStream(null);
    }
    setCameraActive(false);
  };

  const requestLocation = () => {
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
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          setImageFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          setCaptured(true);
          setLocationError('');
          stopCamera();
          requestLocation();
        }
      }, 'image/jpeg');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCaptured(true);
      setLocationError('');
      stopCamera();
      requestLocation();
    }
  };

  const resetForm = () => {
    setCaptured(false);
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setLocation(null);
    setLocationError('');
    setDescription('');
    stopCamera();
    setSelectedCategory(CATEGORIES[0].value);
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
      formData.append('department', selectedCategory);
      if (description) formData.append('description', description);

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
          window.location.reload();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-pista-100 max-w-lg w-full rounded-md border border-pista-400 shadow-2xl relative my-auto overflow-hidden">

        {/* Header */}
        <div className="bg-bottle-900 text-white p-6 border-b border-bottle-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-bottle-800 border border-bottle-700 flex items-center justify-center text-white">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-xl text-white">Help Fix Your Authority</h3>
              <p className="text-xs text-pista-300 font-bold">Snap a photo and we'll handle the rest.</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
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
              <h4 className="text-2xl font-black text-bottle-900">Thank you!</h4>
              <p className="text-xs text-slate-700 font-semibold max-w-xs mx-auto">
                Your report helps keep our community safe and clean. We've sent it to the right department.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Photo Area */}
              <div className="space-y-3">
                {!captured ? (
                  <div className="flex flex-col gap-3">
                    {cameraActive ? (
                      <div className="relative w-full h-56 rounded-md bg-black overflow-hidden shadow-inner flex flex-col justify-end">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {!liveStream && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                            <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                            <span className="text-white text-xs font-bold">Starting camera...</span>
                          </div>
                        )}
                        {liveStream && (
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="relative z-10 mx-auto mb-4 w-14 h-14 bg-white/30 border-2 border-white rounded-full flex items-center justify-center hover:bg-white/50 transition cursor-pointer"
                          >
                            <div className="w-10 h-10 bg-white rounded-full"></div>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="absolute top-3 right-3 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="w-full h-36 rounded-md border border-bottle-700 bg-bottle-800 hover:bg-bottle-700 text-white transition flex flex-col items-center justify-center gap-2 shadow-lg cursor-pointer"
                        >
                          <Camera className="w-8 h-8 flex-shrink-0" />
                          <span className="font-black text-sm">Take a Photo</span>
                        </button>
                        <div className="text-center mt-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="fallback-upload"
                          />
                          <label
                            htmlFor="fallback-upload"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-bottle-800 hover:text-bottle-600 transition cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Or choose from gallery
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-52 rounded-md bg-pista-200 border border-pista-400 overflow-hidden flex flex-col items-center justify-center group shadow-inner">
                    {previewUrl && (
                      <img src={previewUrl} alt="Captured preview" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 bg-white text-bottle-900 rounded-xl font-black text-sm flex items-center gap-2 shadow-xl hover:bg-pista-100 transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4" /> Retake Photo
                      </button>
                    </div>
                    {!location && !locationError && (
                      <div className="absolute top-4 left-4 right-4 text-center z-10 bg-white/90 shadow-md backdrop-blur-sm p-3 rounded-xl border border-pista-300 flex items-center justify-center gap-2 text-xs font-bold text-bottle-900">
                        <MapPin className="w-4 h-4 animate-bounce text-bottle-800" />
                        Pinpointing your location...
                      </div>
                    )}
                  </div>
                )}

                {locationError && (
                  <div className="text-xs text-rose-700 font-bold bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {locationError}
                  </div>
                )}

                {location && !locationError && captured && (
                  <div className="text-[11px] font-semibold text-bottle-800 flex items-center justify-center gap-1.5 mt-2 bg-pista-200/50 p-2 rounded-lg border border-pista-300">
                    <MapPin className="w-3 h-3" />
                    Location found: {location.latitude.toFixed(4)} N, {location.longitude.toFixed(4)} E
                  </div>
                )}
              </div>

              {/* Category Selector */}
              <div className="space-y-3 pt-2">
                <label className="block text-[13px] font-black text-bottle-900">
                  What kind of issue is this?
                </label>
                <div className="relative">
                  <div
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full px-4 py-3.5 bg-white border border-pista-400 rounded-xl text-bottle-900 font-bold text-sm focus:outline-none focus:border-bottle-800 focus:ring-2 focus:ring-bottle-800/10 cursor-pointer shadow-sm flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      {CATEGORIES.find(c => c.value === selectedCategory) && React.createElement(CATEGORIES.find(c => c.value === selectedCategory).icon, { className: "w-5 h-5 text-bottle-800" })}
                      <span>{CATEGORIES.find(c => c.value === selectedCategory)?.label}</span>
                    </div>
                    <svg className={`w-5 h-5 text-bottle-800 transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                  {dropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-pista-400 rounded-xl shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
                      {CATEGORIES.map((cat) => (
                        <div
                          key={cat.value}
                          onClick={() => { setSelectedCategory(cat.value); setDropdownOpen(false); }}
                          className="px-4 py-3 hover:bg-pista-100 flex items-center gap-3 cursor-pointer text-sm font-bold text-bottle-900 transition"
                        >
                          {React.createElement(cat.icon, { className: "w-5 h-5 text-bottle-800" })}
                          {cat.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Description */}
              <div className="space-y-3 pt-2">
                <label className="block text-[13px] font-black text-bottle-900">
                  Anything else we should know? <span className="text-slate-500 font-medium">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="E.g., It's near the main entrance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-pista-400 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-bottle-800 focus:ring-2 focus:ring-bottle-800/10 min-h-[48px] transition"
                />
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={isSubmitting || !captured || !location}
                className="w-full mt-4 py-4 bg-bottle-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:border-slate-300 disabled:shadow-none hover:bg-bottle-600 text-white font-black text-base rounded-md transition shadow-xl shadow-bottle-950/30 flex items-center justify-center gap-2 cursor-pointer border border-bottle-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Send to Authority
                  </>
                )}
              </button>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
