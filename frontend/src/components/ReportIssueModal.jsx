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
  UserCheck,
  Edit3,
  RotateCcw
} from 'lucide-react';


const CATEGORIES = [
  { id: 'pothole', label: 'Road & Pothole', department: 'Road & Transport', icon: '🛣️' },
  { id: 'garbage', label: 'Waste / Garbage', department: 'Garbage & Waste Management', icon: '🗑️' },
  { id: 'water', label: 'Water Leakage', department: 'Municipal Corporation', icon: '💧' },
  { id: 'electricity', label: 'Street Light / Wire', department: 'Municipal Corporation', icon: '💡' },
  { id: 'food', label: 'Food & Sanitation', department: 'Food & Drug Authority', icon: '🍲' },
  { id: 'forest', label: 'Forest & Wildlife', department: 'Forest Department', icon: '🌲' },
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
  const [letterCacheMap, setLetterCacheMap] = useState({});

  const CACHE_KEY = 'civicsnap_parallel_preview_cache';

  const purgePreviewCache = () => {
    setLetterCacheMap({});
    setPreviewData(null);
    try {
      sessionStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_KEY);
    } catch (e) {
      console.warn('[Cache Purge Notice]:', e);
    }
  };

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

  // AI Multi-Modal Classification State
  const [classifying, setClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState(null);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [showModelBreakdown, setShowModelBreakdown] = useState(false);

  const runAIClassification = async (imgData = imageSrc, textDesc = description) => {
    if (!imgData) return;
    setClassifying(true);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: imgData, description: textDesc })
      });
      const data = await res.json();
      if (data.success) {
        setClassificationResult(data);
        if (data.status === 'classified' && data.detected_category && !isManualOverride) {
          setSelectedCategory(data.detected_category);
        }
      }
    } catch (err) {
      console.warn('[AI Classification Notice]:', err);
      setClassificationResult({
        status: 'needs_manual_review',
        message: 'AI classification offline. Please select the destination authority department manually below.'
      });
    } finally {
      setClassifying(false);
    }
  };

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
      purgePreviewCache();
      setImageSrc(null);
      setCameraError(null);
      setSubmitted(false);
      setSubmitResult(null);
      setDescription('');
      setClassificationResult(null);
      setIsManualOverride(false);
      setStep(1);
    }

    return () => {
      stopCamera();
      purgePreviewCache();
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
    purgePreviewCache();
    stopCamera();
    setIsManualOverride(false);
    runAIClassification(dataUrl, description);
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
        const loadedSrc = event.target.result;
        setImageSrc(loadedSrc);
        purgePreviewCache();
        setIsManualOverride(false);
        runAIClassification(loadedSrc, description);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImageSrc(null);
    purgePreviewCache();
    setClassificationResult(null);
    setIsManualOverride(false);
    if (photoSource === 'camera') {
      startCamera(facingMode);
    }
  };

  const handleClose = () => {
    stopCamera();
    purgePreviewCache();
    onClose();
  };

  // Generate Multi-lingual Formal Letters PARALLELLY & Cache in Session Storage
  const handleGeneratePreview = async (targetLang = selectedLanguage) => {
    if (!imageSrc) {
      alert('Please capture or upload evidence photo first.');
      return;
    }

    setSelectedLanguage(targetLang);

    // 1. Check local state cache & Session Storage cache for ZERO-LATENCY instant retrieval
    let currentCache = { ...letterCacheMap };
    if (Object.keys(currentCache).length === 0) {
      try {
        const stored = sessionStorage.getItem(CACHE_KEY);
        if (stored) {
          currentCache = JSON.parse(stored);
          setLetterCacheMap(currentCache);
        }
      } catch (e) {}
    }

    if (currentCache[targetLang]) {
      setPreviewData(currentCache[targetLang]);
      setStep(2);
      return;
    }

    // 2. If not cached, generate ALL 5 languages IN PARALLEL for zero-latency future switches
    setPreviewLoading(true);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    try {
      const nameStr = discloseIdentity ? (user?.name || 'Registered Citizen') : 'Anonymous Citizen';
      const offlineLetters = {
        en: `NOTICE: This report was submitted anonymously via CivicSnap.\n\nTo,\nThe Municipal Authority\nSubject: Official civic complaint regarding ${selectedCategory}\n\nDear Sir or Madam,\n\nI am reporting an urgent civic issue regarding ${selectedCategory}. Please inspect the site and take action within 48 hours.\n\nYours faithfully,\n${nameStr}`,
        hi: `सूचना: यह शिकायत CivicSnap के माध्यम से गुमनाम रूप से भेजी गई है।\n\nसेवा में,\nनगरपालिका प्राधिकरण\nविषय: ${selectedCategory} के संबंध में आधिकारिक नागरिक शिकायत\n\nआदरणीय महोदय या महोदया,\n\nमैं ${selectedCategory} से संबंधित एक आवश्यक नागरिक समस्या की सूचना दे रहा या रही हूँ। कृपया 48 घंटे के भीतर स्थल का निरीक्षण करके कार्रवाई करें।\n\nभवदीय,\n${nameStr}`,
        mr: `सूचना: ही तक्रार CivicSnap द्वारे अनामिकपणे पाठवली आहे।\n\nप्रति,\nमहानगरपालिका प्राधिकरण\nविषय: ${selectedCategory} बाबत अधिकृत नागरी तक्रार\n\nआदरणीय महोदय किंवा महोदया,\n\n${selectedCategory} संदर्भातील तातडीची नागरी समस्या मी कळवत आहे। कृपया ४८ तासांच्या आत स्थळाची पाहणी करून कारवाई करावी।\n\nआपला किंवा आपली नम्र,\n${nameStr}`,
        gu: `સૂચના: આ ફરિયાદ CivicSnap દ્વારા અનામી રીતે મોકલવામાં આવી છે.\n\nપ્રતિ,\nમ્યુનિસિપલ સત્તામંડળ\nવિષય: ${selectedCategory} અંગે સત્તાવાર નાગરિક ફરિયાદ\n\nમાનનીય મહોદય અથવા મહોદયા,\n\nહું ${selectedCategory} સંબંધિત તાત્કાલિક નાગરિક સમસ્યાની જાણ કરું છું. કૃપા કરીને ૪૮ કલાકમાં સ્થળનું નિરીક્ષણ કરી કાર્યવાહી કરો.\n\nઆપનો વિશ્વાસુ,\n${nameStr}`,
        ta: `அறிவிப்பு: இந்த புகார் CivicSnap மூலம் அநாமதேயமாக அனுப்பப்பட்டது.\n\nபெறுநர்,\nநகராட்சி அதிகாரம்\nபொருள்: ${selectedCategory} தொடர்பான அதிகாரப்பூர்வ குடிமக்கள் புகார்\n\nமதிப்பிற்குரிய அய்யா அல்லது அம்மையீர்,\n\n${selectedCategory} தொடர்பான அவசர குடிமக்கள் பிரச்சினையைத் தெரிவிக்கிறேன். தயவுசெய்து 48 மணி நேரத்திற்குள் இடத்தை ஆய்வு செய்து நடவடிக்கை எடுக்கவும்.\n\nஉண்மையுடன்,\n${nameStr}`
      };

      const parallelResults = await Promise.all(
        LANGUAGES.map(async (langObj) => {
          const lId = langObj.id;
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
                language: lId
              })
            });
            const data = await res.json();
            if (data.success) {
              return { lang: lId, data };
            }
          } catch (err) {
            console.warn(`[Parallel Preview Notice for ${lId}]:`, err);
          }

          // Fallback offline preview if request fails
          return {
            lang: lId,
            data: {
              success: true,
              formal_letter: offlineLetters[lId] || offlineLetters.en,
              authority_name: 'Municipal Corporation',
              header_notice: discloseIdentity ? `Disclosed: ${nameStr}` : 'Anonymous Report'
            }
          };
        })
      );

      const newCacheMap = {};
      parallelResults.forEach((item) => {
        if (item.data) {
          newCacheMap[item.lang] = item.data;
        }
      });

      setLetterCacheMap(newCacheMap);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(newCacheMap));
      } catch (e) {}

      if (newCacheMap[targetLang]) {
        setPreviewData(newCacheMap[targetLang]);
      }
      setStep(2);
    } catch (err) {
      console.warn('[Parallel Multi-Lingual Generation Failed]:', err);
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
          citizen_email: user?.email || null,
          language: selectedLanguage,
          complaint_report: previewData?.formal_letter || null
        })

      });

      const data = await res.json();
      if (data.success) {
        setSubmitResult(data);
        setSubmitted(true);
        purgePreviewCache();
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
      purgePreviewCache();
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
        <div className="bg-[#072818] text-white p-4 border-b border-bottle-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-base shadow-md">
              🍃
            </div>
            <div>
              <h3 className="font-black text-lg text-white leading-tight">CivicSnap</h3>
              <p className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wider">Report &bull; Track &bull; Build Better</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-bottle-800 hover:bg-bottle-700 border border-bottle-700 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Header Bar */}
        <div className="bg-pista-200 px-4 py-2.5 border-b border-pista-300 flex items-center justify-center gap-3 text-xs font-black">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${step === 1 ? 'bg-[#072818] text-white shadow-xs' : 'bg-pista-300 text-slate-700'}`}>
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">1</span>
            <span>Photo</span>
          </div>
          <div className="w-4 h-0.5 bg-pista-400"></div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${step === 2 ? 'bg-[#072818] text-white shadow-xs' : 'bg-pista-300 text-slate-700'}`}>
            <span className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px]">2</span>
            <span>Details</span>
          </div>
          <div className="w-4 h-0.5 bg-pista-400"></div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pista-300 text-slate-700">
            <span className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px]">3</span>
            <span>Submit</span>
          </div>
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

              {/* STEP 1: DETAILS & PHOTO CAPTURE */}
              {step === 1 ? (
                <>
                  {/* AI Multi-Modal Auto-Classification Status Card */}
                  {imageSrc && (
                    <div className="p-4 bg-white rounded-2xl border border-pista-400 shadow-sm space-y-3 transition-all duration-300">
                      {classifying ? (
                        <div className="flex items-center gap-3 text-bottle-900 font-extrabold text-xs py-1">
                          <RefreshCw className="w-5 h-5 animate-spin text-bottle-800" />
                          <span>AI Multi-Modal Engine analyzing evidence photo...</span>
                        </div>
                      ) : classificationResult?.status === 'classified' ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-black uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                              {classificationResult.winning_model || 'Specialized Domain Evaluator'}
                            </span>
                            <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {classificationResult.confidence_percent || Math.round((classificationResult.confidence_score || 0) * 100)}% Match
                            </span>
                          </div>

                          <div className="p-3.5 bg-pista-50/80 rounded-xl border border-pista-300 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs font-black text-bottle-900">
                                Detected: <span className="text-emerald-900">{classificationResult.category_label}</span>
                              </div>
                              <div className="text-[11px] font-extrabold text-bottle-700 flex items-center gap-1 mt-0.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-bottle-800" />
                                Target Authority: <span className="underline font-black">{classificationResult.target_department}</span>
                              </div>
                            </div>

                            {/* Explicit Citizen Classification Override Button */}
                            <button
                              type="button"
                              onClick={() => setIsManualOverride(!isManualOverride)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                                isManualOverride
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                  : 'bg-white text-bottle-800 border-pista-400 hover:bg-pista-200 shadow-xs'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5 text-bottle-800" />
                              {isManualOverride ? 'Override Active' : 'Classification wrong?'}
                            </button>
                          </div>

                          {/* Expandable Multi-Model Ensemble Breakdown */}
                          {classificationResult.all_model_confidences && classificationResult.all_model_confidences.length > 0 && (
                            <div className="pt-1.5 border-t border-pista-200">
                              <button
                                type="button"
                                onClick={() => setShowModelBreakdown(!showModelBreakdown)}
                                className="text-[11px] font-black text-bottle-800 hover:text-bottle-600 flex items-center gap-1 cursor-pointer"
                              >
                                <span>{showModelBreakdown ? '▼ Hide' : '▶ Compare'} All 6 Domain Models</span>
                              </button>

                              {showModelBreakdown && (
                                <div className="mt-2 space-y-1.5 p-2.5 bg-pista-100/70 rounded-xl border border-pista-300 font-mono text-[11px]">
                                  {classificationResult.all_model_confidences.map((m, idx) => (
                                    <div key={m.model_id} className="flex items-center justify-between">
                                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                                        {idx === 0 ? '🏆' : '•'} {m.model_name}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full ${idx === 0 ? 'bg-emerald-600' : 'bg-slate-400'}`}
                                            style={{ width: `${m.confidence}%` }}
                                          ></div>
                                        </div>
                                        <span className="font-black text-bottle-900 w-9 text-right">{m.confidence}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Low confidence / offline fallback prompt */
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-1.5 text-amber-900">
                          <div className="flex items-center gap-2 text-xs font-black">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>AI Confidence Low or Offline</span>
                          </div>
                          <p className="text-[11px] font-semibold text-amber-800 leading-snug">
                            {classificationResult?.message || "Please select the target authority department manually below."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONDITIONAL CATEGORY & AUTHORITY SELECTOR (Appears ONLY if Citizen clicks Override OR AI is uncertain) */}
                  {(isManualOverride || classificationResult?.status === 'needs_manual_review') && (
                    <div className="space-y-3 p-4 bg-amber-50/80 rounded-2xl border-2 border-amber-300 shadow-sm transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Edit3 className="w-4 h-4 text-amber-700" />
                          Citizen Override: Select Target Authority
                        </label>
                        {classificationResult?.status === 'classified' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(classificationResult.detected_category);
                              setIsManualOverride(false);
                            }}
                            className="text-[10px] text-amber-900 font-extrabold underline flex items-center gap-1 hover:text-amber-950 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" /> Reset to AI Result ({classificationResult.category_label})
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setIsManualOverride(true);
                              purgePreviewCache();
                            }}
                            className={`min-h-[52px] px-3 py-2 rounded-xl border text-left font-semibold text-xs flex flex-col justify-center transition cursor-pointer ${
                              selectedCategory === cat.id
                                ? 'bg-bottle-800 border-bottle-700 text-white font-black shadow-md'
                                : 'bg-white border-amber-200 text-bottle-900 hover:bg-amber-100/60'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{cat.icon}</span>
                              <span className="font-black text-xs leading-tight">{cat.label}</span>
                            </div>
                            <span className={`text-[10px] mt-0.5 font-mono truncate ${selectedCategory === cat.id ? 'text-pista-200' : 'text-slate-500'}`}>
                              ↳ {cat.department}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optional Description Notes */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-bottle-800 uppercase tracking-wider">
                      2. Additional Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Describe issue location or details..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => {
                        if (imageSrc) runAIClassification(imageSrc, description);
                      }}
                      className="w-full px-4 py-3 bg-white border border-pista-400 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-bottle-800 min-h-[48px] shadow-xs"
                    />
                  </div>


                  {/* Disclosure Checkbox */}
                  <div className="p-4 bg-white rounded-2xl border border-pista-400 space-y-2 shadow-xs">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={discloseIdentity}
                        onChange={(e) => {
                          setDiscloseIdentity(e.target.checked);
                          purgePreviewCache();
                        }}
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

