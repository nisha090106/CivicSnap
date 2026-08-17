import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
import IntroLoader from '../components/IntroLoader';
import { 
  Camera, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Bot, 
  FileCheck2, 
  Building2,
  PhoneCall
} from 'lucide-react';
import FAQAccordion from '../components/FAQAccordion';

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [authRole, setAuthRole] = useState('citizen');
  const [heroMinHeight, setHeroMinHeight] = useState('calc(100vh - 76px)');

  const openAuth = (tab = 'login', role = 'citizen') => {
    setAuthTab(tab);
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    const update = () => {
      const header = document.querySelector('header');
      const h = header ? header.offsetHeight : 76;
      setHeroMinHeight(`calc(100vh - ${h}px)`);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Listen to global openAuth events so Navbar can dispatch without prop drilling
  useEffect(() => {
    const handler = (e) => {
      const d = e?.detail || {};
      const tab = d.tab || 'login';
      const role = d.role || 'citizen';
      openAuth(tab, role);
    };
    window.addEventListener('civicsnap:openAuth', handler);
    return () => window.removeEventListener('civicsnap:openAuth', handler);
  }, []);

  return (
    <div className="min-h-screen bg-pista-200 text-slate-900 font-sans selection:bg-pista-300">
      <IntroLoader duration={2000} />
      
      <Navbar />

      {/* 2. HERO SECTION */}
      <section style={{ minHeight: heroMinHeight }} className="relative px-4 sm:px-8 pt-12 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-bottle-900 text-pista-100 rounded-full border border-bottle-700 text-xs font-extrabold shadow-xs">
              <Sparkles className="w-4 h-4 text-pista-300" />
              <span>AI-Powered Municipal Action</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-bottle-900 tracking-tight leading-[1.06] lg:leading-[1.04]">
              Snap a Photo. <br />
              <span className="text-bottle-800">
                Fix Your City.
              </span>
            </h1>

            <p className="text-slate-800 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed lg:leading-8 font-semibold">
              CivicSnap automatically detects potholes, accumulated garbage, broken streetlights, and water leakage from a photo, routing complaints directly to official municipal departments.
            </p>

            {/* Action CTAs — Dark Green Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => openAuth('signup')}
                className="w-full sm:w-auto px-8 py-4 lg:px-8 lg:py-4 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-base lg:text-base rounded-2xl transition shadow-xl shadow-bottle-950/30 flex items-center justify-center gap-3 cursor-pointer group border border-bottle-700 whitespace-nowrap"
              >
                <Camera className="w-6 h-6 text-white" />
                <span>Report an Issue Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => openAuth('login', 'authority')}
                className="w-full sm:w-auto px-6 py-4 lg:px-6 lg:py-4 bg-bottle-900 hover:bg-bottle-800 border border-bottle-700 text-white font-black text-sm lg:text-base rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md whitespace-nowrap"
              >
                <ShieldCheck className="w-5 h-5 text-pista-300" />
                <span>Municipal Officer Login</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-pista-400/80 text-left max-w-lg mx-auto lg:mx-0">
              <div>
                <span className="text-2xl lg:text-3xl font-black text-bottle-800">1-Tap</span>
                <p className="text-xs lg:text-sm text-slate-700 font-bold">Photo Reporting</p>
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-black text-bottle-800">98%</span>
                <p className="text-xs lg:text-sm text-slate-700 font-bold">AI Categorization</p>
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-black text-bottle-800">7</span>
                <p className="text-xs lg:text-sm text-slate-700 font-bold">Civic Departments</p>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Feature Showcase Card */}
          <div className="lg:col-span-5">
            <div className="bg-pista-100 rounded-3xl p-6 sm:p-8 border border-pista-400 shadow-xl space-y-6 relative overflow-hidden">
              
              <div className="flex items-center justify-between border-b border-pista-300 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-bottle-800"></div>
                  <span className="text-xs lg:text-sm font-black text-bottle-800 uppercase tracking-wider">Live AI Classification</span>
                </div>
                <span className="text-[10px] px-2.5 py-1 bg-bottle-900 text-pista-100 font-mono font-extrabold rounded-lg border border-bottle-800">
                  GPS Active
                </span>
              </div>

              {/* Photo Preview Simulation */}
              <div className="relative rounded-2xl bg-pista-200 border border-pista-400 h-52 overflow-hidden flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-bottle-800 text-white flex items-center justify-center shadow-lg">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-black text-bottle-800 block">Pothole Detected & Categorized</span>
                  <span className="text-[11px] text-bottle-600 font-extrabold">Auto-routed to: Road & Transport Department</span>
                </div>
              </div>

              {/* Workflow Status Pills */}
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white border border-pista-300 rounded-xl flex items-center justify-between shadow-xs">
                  <span className="text-slate-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-bottle-800" /> Image Verification
                  </span>
                  <span className="font-black text-bottle-800">Passed</span>
                </div>

                <div className="p-3 bg-white border border-pista-300 rounded-xl flex items-center justify-between shadow-xs">
                  <span className="text-slate-800 font-bold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-bottle-800" /> Department Assignment
                  </span>
                  <span className="font-black text-bottle-800">Road & Transport</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-pista-300/60 border-y border-pista-400 py-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-bottle-800">Simple 4-Step Process</span>
            <h2 className="text-3xl sm:text-4xl font-black text-bottle-900 tracking-tight">How CivicSnap Works</h2>
            <p className="text-slate-800 text-sm font-semibold">From photo capture to department resolution tracking in 4 seamless steps.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-pista-100 rounded-3xl p-6 border border-pista-400 shadow-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-bottle-800 text-white flex items-center justify-center font-black text-xl shadow-md">
                1
              </div>
              <h3 className="font-black text-lg text-bottle-800">Snap Issue Photo</h3>
              <p className="text-slate-700 text-xs leading-relaxed font-semibold">
                Take a quick photo of potholes, trash dumps, water leaks, or broken streetlights directly on your smartphone.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-pista-100 rounded-3xl p-6 border border-pista-400 shadow-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-bottle-800 text-white flex items-center justify-center font-black text-xl shadow-md">
                2
              </div>
              <h3 className="font-black text-lg text-bottle-800">AI Categorizes</h3>
              <p className="text-slate-700 text-xs leading-relaxed font-semibold">
                Computer vision models automatically analyze the image, classify the severity, and pin GPS coordinates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-pista-100 rounded-3xl p-6 border border-pista-400 shadow-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-bottle-800 text-white flex items-center justify-center font-black text-xl shadow-md">
                3
              </div>
              <h3 className="font-black text-lg text-bottle-800">Routed to Department</h3>
              <p className="text-slate-700 text-xs leading-relaxed font-semibold">
                The complaint is automatically dispatched to the relevant municipal authority (Roads, Waste, Water, etc.).
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-pista-100 rounded-3xl p-6 border border-pista-400 shadow-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-bottle-800 text-white flex items-center justify-center font-black text-xl shadow-md">
                4
              </div>
              <h3 className="font-black text-lg text-bottle-800">Track Live on Map</h3>
              <p className="text-slate-700 text-xs leading-relaxed font-semibold">
                Follow real-time status updates on the interactive community map until field officers resolve the problem.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. CIVIC CATEGORIES HIGHLIGHT */}
      <section id="features" className="py-16 px-4 sm:px-8 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-bottle-900">Supported Issue Categories</h2>
          <p className="text-slate-800 text-xs sm:text-sm font-semibold">Automatic classification across all major municipal departments.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-pista-100 p-6 rounded-2xl border border-pista-400 text-center space-y-2 shadow-xs">
            <span className="text-3xl">🛣️</span>
            <h4 className="font-black text-sm text-bottle-800">Roads & Potholes</h4>
            <p className="text-[11px] text-slate-700 font-bold">Road & Transport Dept</p>
          </div>

          <div className="bg-pista-100 p-6 rounded-2xl border border-pista-400 text-center space-y-2 shadow-xs">
            <span className="text-3xl">🗑️</span>
            <h4 className="font-black text-sm text-bottle-800">Garbage & Waste</h4>
            <p className="text-[11px] text-slate-700 font-bold">Waste Management Dept</p>
          </div>

          <div className="bg-pista-100 p-6 rounded-2xl border border-pista-400 text-center space-y-2 shadow-xs">
            <span className="text-3xl">💧</span>
            <h4 className="font-black text-sm text-bottle-800">Water Leakage</h4>
            <p className="text-[11px] text-slate-700 font-bold">Water Supply Authority</p>
          </div>

          <div className="bg-pista-100 p-6 rounded-2xl border border-pista-400 text-center space-y-2 shadow-xs">
            <span className="text-3xl">💡</span>
            <h4 className="font-black text-sm text-bottle-800">Street Lights</h4>
            <p className="text-[11px] text-slate-700 font-bold">Electricity & Wiring</p>
          </div>
        </div>
      </section>

      {/* 5. FAQ Accordion — placed below features and above footer */}
      <FAQAccordion
        items={[
          {
            question: 'What is CivicSnap and how does it work?',
            answer: (
              <>
                CivicSnap is an AI-powered civic issue reporting app — snap a photo of a problem, and our computer vision models automatically detect and classify the issue (pothole, garbage, streetlight, etc.). Complaints are routed to the correct municipal department and tracked until resolution.
              </>
            )
          },
          {
            question: 'How do I report a civic issue (pothole, streetlight, garbage, etc.)?',
            answer: (
              <>
                Open the app and take a clear photo of the issue (or upload one). Provide an optional description and confirm the location. Submit and the system will automatically assign it to the relevant department — no paperwork required.
              </>
            )
          },
          {
            question: 'Do I need an account to report an issue?',
            answer: (
              <>
                You can report issues anonymously via the quick-report flow, but creating an account lets you track status, receive updates, and interact with municipal responses.
              </>
            )
          },
          {
            question: 'How long does resolution take and how do I track status?',
            answer: (
              <>
                Resolution times vary by department and issue severity. After submission, you can track live status on the community map and receive updates in your account until field officers mark the issue resolved.
              </>
            )
          },
          {
            question: 'Is my location and personal data kept private?',
            answer: (
              <>
                CivicSnap follows privacy-friendly defaults: only the location and details you provide are shared with the responsible municipal department. We do not publish your personal contact details without consent. See the privacy policy for full details.
              </>
            )
          },
          {
            question: 'Can I interact directly with municipality administrators?',
            answer: (
              <>
                Yes — when you create an account and comment on a report, municipal officers can reply through the platform. For formal escalations, use the provided contact channels in the officer responses.
              </>
            )
          }
        ]}
        className="py-12"
      />

      {/* 5. FOOTER */}
      <footer className="bg-bottle-900 text-pista-100 py-12 px-4 sm:px-8 border-t border-bottle-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-bottle-800 text-white flex items-center justify-center font-bold text-xl">
              📸
            </div>
            <span className="text-xl font-black text-white">CivicSnap</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-pista-300 font-extrabold">
            <button onClick={() => openAuth('login', 'citizen')} className="hover:text-white transition cursor-pointer">Citizen Login</button>
            <button onClick={() => openAuth('login', 'authority')} className="hover:text-white transition cursor-pointer">Municipal Officer Portal</button>
            <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
          </div>

          <p className="text-xs text-pista-400 font-semibold">
            &copy; 2026 CivicSnap. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Auth Modal Trigger */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authTab}
        initialRole={authRole}
      />

    </div>
  );
}
