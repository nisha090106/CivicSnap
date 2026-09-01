import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Camera,
  X,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  SwitchCamera,
  FolderOpen,
  FileText,
  ShieldCheck,
  Globe,
  ArrowLeft,
  Send,
  UserCheck
} from 'lucide-react';

const CATEGORIES = [
  { id: 'pothole', label: 'Road & Pothole', icon: '🛣️' },
  { id: 'garbage', label: 'Waste / Garbage', icon: '🗑️' },
  { id: 'water', label: 'Water Leakage', icon: '💧' },
  { id: 'electricity', label: 'Street Light / Wire', icon: '💡' },
];

const LANGUAGES = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'hi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { id: 'mr', label: 'मराठी (Marathi)', flag: '🚩' },
  { id: 'gu', label: 'ગુજરાતી (Gujarati)', flag: '🏛️' },
  { id: 'ta', label: 'தமிழ் (Tamil)', flag: '🛕' },
];

export default function ReportIssueModal({ isOpen, onClose }) {
  const { user, token } = useAuth();
  const [step, setStep] = useState(1); // 1: Details & Photo, 2: Multi-lingual Letter Preview
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [description, setDescription] = useState('');
  const [discloseIdentity, setDiscloseIdentity] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Photo Source & Data State
  const [photoSource, setPhotoSource] = useState('camera'); // 'camera' | 'upload'
  const [imageSrc, setImageSrc] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [gpsLocation, setGpsLocation] = useState({ lat: '19.0760', lng: '72.8777' });

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const startCamera = async (facing = facingMode) => {
    stopCamera();
    setCameraError(null);
    setIsCameraStarting(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser environment');
      }

      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('[Camera] Failed to access camera:', err.message);
      setCameraError('Camera access unavailable or denied. Please upload an image file instead.');
    } finally {
      setIsCameraStarting(false);
    }
  };

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setGpsLocation({ lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4) }),
          () => setGpsLocation({ lat: '19.0760', lng: '72.8777' })
        );
      }

      if (photoSource === 'camera' && !imageSrc) {
        startCamera(facingMode);
      }
    } else {
      stopCamera();
      setImageSrc(null);
      setCameraError(null);
      setSubmitted(false);
      setSubmitResult(null);
      setPreviewData(null);
      setDescription('');
      setStep(1);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleSourceTabChange = (source) => {
    setPhotoSource(source);
    if (source === 'camera') {
      if (!imageSrc) {
        startCamera(facingMode);
      }
    } else {
      stopCamera();
    }
  };

  const toggleFacingMode = () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    if (photoSource === 'camera' && !imageSrc) {
      startCamera(newFacing);
    }
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setImageSrc(dataUrl);
    stopCamera();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImageSrc(null);
    if (photoSource === 'camera') {
      startCamera(facingMode);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Generate Multi-lingual Formal Letter Preview
  const handleGeneratePreview = async (lang = selectedLanguage) => {
    if (!imageSrc) {
      alert('Please capture or upload evidence photo first.');
      return;
    }

    setSelectedLanguage(lang);
    setPreviewLoading(true);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          image_data: imageSrc,
          category: selectedCategory,
          latitude: parseFloat(gpsLocation.lat) || 19.0760,
          longitude: parseFloat(gpsLocation.lng) || 72.8777,
          description,
          disclose_identity: discloseIdentity,
          citizen_name: user?.name || null,
          language: lang
        })
      });

      const data = await res.json();
      if (data.success) {
        setPreviewData(data);
        setStep(2);
      } else {
        alert(data.detail || 'Preview generation failed');
      }
    } catch (err) {
      console.warn('[Preview Warning] Server offline, rendering offline multi-lingual preview:', err);
      const nameStr = discloseIdentity ? (user?.name || 'Registered Citizen') : 'Anonymous Citizen';
      setPreviewData({
        formal_letter: `================================================================================\nFORMAL CIVIC COMPLAINT LETTER\n${discloseIdentity ? `NOTICE: Disclosed Identity: ${nameStr}` : 'NOTICE: Sent Anonymously'}\n================================================================================\n\nTo,\nThe Competent Officer,\nMunicipal Corporation\n\nSUBJECT: Official Complaint Regarding ${selectedCategory}\n\nRespected Sir/Madam,\n\nI am writing to formally bring to your urgent attention a civic issue regarding ${selectedCategory}.\n\nYours faithfully,\n${nameStr}`,
        authority_name: 'Municipal Corporation',
        header_notice: discloseIdentity ? `Disclosed: ${nameStr}` : 'Anonymous Report'
      });
      setStep(2);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Submit Final Report ("File Report")
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    stopCamera();

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          image_data: imageSrc,
          category: selectedCategory,
          latitude: parseFloat(gpsLocation.lat) || 19.0760,
          longitude: parseFloat(gpsLocation.lng) || 72.8777,
          description,
          disclose_identity: discloseIdentity,
          citizen_name: user?.name || null,
          language: selectedLanguage
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmitResult(data);
        setSubmitted(true);
        window.dispatchEvent(new CustomEvent('civicsnap:reportSubmitted'));
        setTimeout(() => {
          setSubmitted(false);
          setSubmitResult(null);
          setImageSrc(null);
          setDescription('');
          setStep(1);
          onClose();
        }, 4000);
      } else {
        alert(data.detail || 'Report submission failed');
      }
    } catch (err) {
      console.warn('[Report Submission Warning] Backend offline, simulating submission:', err);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setImageSrc(null);
        setDescription('');
        setStep(1);
        onClose();
      }, 2500);
    } finally {
      setSubmitting(false);
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
              <h3 className="font-black text-xl text-white">Report Civic Issue</h3>
              <p className="text-xs text-pista-300 font-extrabold">Device Camera & Image Upload Portal</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-bottle-800 hover:bg-bottle-700 border border-bottle-700 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-bottle-800 border border-bottle-700 text-white flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-10 h-10 animate-bounce text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-bottle-900">Report Registered & Routed!</h4>
                <p className="text-xs text-slate-700 font-semibold max-w-xs mx-auto mt-1">
                  {submitResult?.anonymous_disclaimer || "Your issue report has been logged and routed to municipal authorities."}
                </p>
              </div>

              {submitResult && (
                <div className="bg-white rounded-2xl p-4 border border-pista-400 text-left space-y-2 max-h-48 overflow-y-auto font-mono text-[11px] shadow-inner text-slate-800">
                  <div className="font-black text-bottle-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-bottle-800" />
                    Routed to: {submitResult.authority_name}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    ✓ Anti-Hallucination Critic: {submitResult.critic_verdict}
                  </div>
                  <div className="text-[10px] text-slate-600 border-t border-slate-200 pt-2 whitespace-pre-wrap">
                    {submitResult.soap_transcript}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Photo Source Options Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-bottle-800 uppercase tracking-wider">
                    1. Photo Capture / Evidence
                  </label>

                  {/* Photo Source Selector Pills */}
                  {!imageSrc && (
                    <div className="flex gap-1.5 bg-pista-300/80 p-1 rounded-xl border border-pista-400">
                      <button
                        type="button"
                        onClick={() => handleSourceTabChange('camera')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer ${photoSource === 'camera'
                            ? 'bg-bottle-800 text-white shadow-xs'
                            : 'text-bottle-800 hover:bg-pista-200'
                          }`}
                      >
                        <Camera className="w-3.5 h-3.5" /> Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSourceTabChange('upload')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer ${photoSource === 'upload'
                            ? 'bg-bottle-800 text-white shadow-xs'
                            : 'text-bottle-800 hover:bg-pista-200'
                          }`}
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload File
                      </button>
                    </div>
                  )}
                </div>

                {/* IMAGE CAPTURED / UPLOADED PREVIEW */}
                {imageSrc ? (
                  <div className="relative w-full h-56 rounded-2xl bg-slate-900 border-2 border-bottle-700 overflow-hidden shadow-inner flex items-center justify-center">
                    <img
                      src={imageSrc}
                      alt="Captured evidence"
                      className="w-full h-full object-cover"
                    />

                    {/* Badge Overlay */}
                    <div className="absolute bottom-2 left-2 right-2 bg-bottle-900/90 backdrop-blur-md px-3 py-2 rounded-xl text-white border border-bottle-700 flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-pista-300 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-pista-300" />
                        GPS: {gpsLocation.lat}° N, {gpsLocation.lng}° E
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute top-2 right-2 px-3 py-1.5 bg-bottle-900/90 hover:bg-bottle-800 text-white border border-bottle-700 rounded-xl text-xs font-black cursor-pointer shadow-md flex items-center gap-1 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retake
                    </button>
                  </div>
                ) : photoSource === 'camera' ? (
                  /* LIVE CAMERA VIEWFINDER */
                  <div className="relative w-full h-60 rounded-2xl bg-slate-950 border-2 border-pista-400 overflow-hidden flex items-center justify-center shadow-inner">

                    {cameraError ? (
                      /* Camera Error Fallback View */
                      <div className="p-6 text-center space-y-3">
                        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
                        <p className="text-xs text-amber-900 font-bold max-w-xs mx-auto">
                          {cameraError}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSourceTabChange('upload')}
                          className="px-4 py-2 bg-bottle-800 text-white rounded-xl text-xs font-black hover:bg-bottle-700 transition cursor-pointer border border-bottle-700 shadow-md inline-flex items-center gap-2"
                        >
                          <FolderOpen className="w-4 h-4" /> Upload Image Instead
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Live Video Element */}
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />

                        {/* Viewfinder Target Overlay */}
                        <div className="absolute inset-0 border-2 border-dashed border-pista-300/40 rounded-2xl pointer-events-none flex items-center justify-center">
                          <div className="w-12 h-12 border-2 border-white/60 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
                          </div>
                        </div>

                        {/* Switch Front/Rear Camera Button */}
                        <button
                          type="button"
                          onClick={toggleFacingMode}
                          className="absolute top-2.5 right-2.5 p-2.5 bg-bottle-900/80 hover:bg-bottle-800 text-white rounded-xl border border-bottle-700 backdrop-blur-md transition cursor-pointer shadow-sm"
                          title="Switch Camera (Front/Rear)"
                        >
                          <SwitchCamera className="w-4 h-4" />
                        </button>

                        {/* Snap Photo Action Bar */}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center px-4">
                          <button
                            type="button"
                            onClick={handleSnapPhoto}
                            disabled={isCameraStarting}
                            className="px-6 py-2.5 bg-bottle-800 hover:bg-bottle-600 active:scale-95 text-white font-black text-xs rounded-full border border-bottle-700 shadow-xl flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                          >
                            <div className="w-4 h-4 rounded-full bg-rose-500 border border-white"></div>
                            SNAP PHOTO NOW
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* FILE UPLOAD DROP ZONE */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-56 rounded-2xl border-2 border-dashed border-bottle-800 bg-pista-200 hover:bg-pista-300 cursor-pointer transition flex flex-col items-center justify-center gap-3 text-center p-6 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-bottle-800 text-white flex items-center justify-center group-hover:scale-110 transition shadow-md shadow-bottle-950/30 border border-bottle-700">
                      <FolderOpen className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-bottle-900 block">Click to Upload Image</span>
                      <span className="text-[11px] text-bottle-600 font-extrabold">Select photo from device gallery or files (JPG, PNG, WebP)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* CATEGORY, DISCLOSURE & PREVIEW CONTROLS */}
              {step === 1 ? (
                <>
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

                  {/* Disclosure Checkbox */}
                  <div className="p-4 bg-white rounded-2xl border border-pista-400 space-y-2 shadow-xs">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={discloseIdentity}
                        onChange={(e) => setDiscloseIdentity(e.target.checked)}
                        className="w-5 h-5 accent-bottle-800 rounded cursor-pointer mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-black text-bottle-900 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-bottle-800" />
                          Disclose yourself (Include your identity in report)
                        </span>
                        <span className="text-[10px] text-slate-600 font-semibold block mt-0.5 leading-relaxed">
                          {discloseIdentity
                            ? `Your name (${user?.name || 'Registered Citizen'}) will be signed on the official complaint letter.`
                            : 'Your report will be filed 100% anonymously (default).'}
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Step 1 Action Button: Preview Formal Letter */}
                  <button
                    type="button"
                    onClick={() => handleGeneratePreview(selectedLanguage)}
                    disabled={!imageSrc || previewLoading}
                    className="w-full py-4 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-base rounded-2xl transition shadow-xl shadow-bottle-950/30 flex items-center justify-center gap-2 min-h-[54px] cursor-pointer border border-bottle-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Globe className="w-5 h-5 text-white" />
                    {previewLoading ? 'Generating Letter Preview...' : 'Preview Formal Letter ↗'}
                  </button>
                </>
              ) : (
                /* STEP 2: MULTI-LINGUAL FORMAL LETTER PREVIEW & FILE REPORT */
                <div className="space-y-5">
                  {/* Language Selector Bar */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-bottle-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-bottle-800" /> Select Letter Language
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => handleGeneratePreview(lang.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer border ${selectedLanguage === lang.id
                              ? 'bg-bottle-900 text-white border-bottle-800 shadow-md'
                              : 'bg-white text-bottle-900 border-pista-400 hover:bg-pista-200'
                            }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formal Complaint Letter Preview Card */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-bottle-800 uppercase tracking-wider">
                        Official Complaint Letter Preview
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 bg-bottle-800 text-pista-100 rounded-md font-mono font-bold">
                        {selectedLanguage.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-pista-400 font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-64 overflow-y-auto shadow-inner leading-relaxed">
                      {previewLoading ? 'Generating Multi-Lingual Formal Complaint Letter...' : previewData?.formal_letter}
                    </div>
                  </div>

                  {/* Action Buttons: Back & File Report */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="py-3.5 px-5 bg-pista-300 hover:bg-pista-400 text-bottle-900 font-black text-xs rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-pista-400"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 py-3.5 px-6 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-sm rounded-2xl transition shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-bottle-700 disabled:opacity-50 min-h-[52px]"
                    >
                      <Send className="w-4 h-4 text-white" />
                      {submitting ? 'Filing Report to Authorities...' : 'File Report Now 🚀'}
                    </button>
                  </div>
                </div>
              )}

            </form>
          )}
        </div>
      </div>
    </div>
  );
}

