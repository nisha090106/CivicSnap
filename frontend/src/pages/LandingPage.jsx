import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
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

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [authRole, setAuthRole] = useState('citizen');

  const openAuth = (tab = 'login', role = 'citizen') => {
    setAuthTab(tab);
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-emerald-50/40 text-slate-900 font-sans selection:bg-emerald-200">
      
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-emerald-100 px-4 sm:px-8 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-2xl font-bold shadow-inner">
              📸
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-emerald-950 block leading-tight">
                CivicSnap
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-widest block">
                AI Civic Issue Reporting
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => openAuth('login')}
              className="px-4 sm:px-5 py-2.5 rounded-xl border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => openAuth('signup')}
              className="px-4 sm:px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm transition shadow-md shadow-emerald-900/20 cursor-pointer"
            >
              Sign Up
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative px-4 sm:px-8 pt-12 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300 text-xs font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-800" />
              <span>AI-Powered Municipal Action</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-emerald-950 tracking-tight leading-[1.1]">
              Snap a Photo. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900">
                Fix Your City.
              </span>
            </h1>

            <p className="text-slate-700 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              CivicSnap automatically detects potholes, accumulated garbage, broken streetlights, and water leakage from a photo, routing complaints directly to official municipal departments.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => openAuth('signup')}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-base rounded-2xl transition shadow-xl shadow-emerald-900/25 flex items-center justify-center gap-3 cursor-pointer group"
              >
                <Camera className="w-6 h-6 text-white" />
                <span>Report an Issue Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => openAuth('login', 'authority')}
                className="w-full sm:w-auto px-6 py-4 bg-emerald-100 hover:bg-emerald-200/80 border border-emerald-300 text-emerald-900 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-800" />
                <span>Municipal Officer Login</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-emerald-200/60 text-left max-w-lg mx-auto lg:mx-0">
              <div>
                <span className="text-2xl font-black text-emerald-950">1-Tap</span>
                <p className="text-xs text-slate-600 font-semibold">Photo Reporting</p>
              </div>
              <div>
                <span className="text-2xl font-black text-emerald-950">98%</span>
                <p className="text-xs text-slate-600 font-semibold">AI Categorization</p>
              </div>
              <div>
                <span className="text-2xl font-black text-emerald-950">7</span>
                <p className="text-xs text-slate-600 font-semibold">Civic Departments</p>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Feature Showcase Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-2xl space-y-6 relative overflow-hidden">
              
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Live AI Classification</span>
                </div>
                <span className="text-[10px] px-2.5 py-1 bg-emerald-100 text-emerald-900 font-mono font-bold rounded-lg border border-emerald-300">
                  GPS Active
                </span>
              </div>

              {/* Photo Preview Simulation */}
              <div className="relative rounded-2xl bg-emerald-50 border border-emerald-200 h-52 overflow-hidden flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-lg">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-emerald-950 block">Pothole Detected & Categorized</span>
                  <span className="text-[11px] text-emerald-800 font-medium">Auto-routed to: Road & Transport Department</span>
                </div>
              </div>

              {/* Workflow Status Pills */}
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <span className="text-slate-700 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800" /> Image Verification
                  </span>
                  <span className="font-bold text-emerald-900">Passed</span>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <span className="text-slate-700 font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-800" /> Department Assignment
                  </span>
                  <span className="font-bold text-emerald-900">Road & Transport</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="bg-emerald-100/40 border-y border-emerald-200/80 py-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">Simple 4-Step Process</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">How CivicSnap Works</h2>
            <p className="text-slate-700 text-sm font-medium">From photo capture to department resolution tracking in 4 seamless steps.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-md">
                1
              </div>
              <h3 className="font-extrabold text-lg text-emerald-950">Snap Issue Photo</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                Take a quick photo of potholes, trash dumps, water leaks, or broken streetlights directly on your smartphone.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-md">
                2
              </div>
              <h3 className="font-extrabold text-lg text-emerald-950">AI Categorizes</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                Computer vision models automatically analyze the image, classify the severity, and pin GPS coordinates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-md">
                3
              </div>
              <h3 className="font-extrabold text-lg text-emerald-950">Routed to Department</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                The complaint is automatically dispatched to the relevant municipal authority (Roads, Waste, Water, etc.).
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-md">
                4
              </div>
              <h3 className="font-extrabold text-lg text-emerald-950">Track Live on Map</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                Follow real-time status updates on the interactive community map until field officers resolve the problem.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. CIVIC CATEGORIES HIGHLIGHT */}
      <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-emerald-950">Supported Issue Categories</h2>
          <p className="text-slate-700 text-xs sm:text-sm font-medium">Automatic classification across all major municipal departments.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-emerald-200 text-center space-y-2 shadow-xs">
            <span className="text-3xl">🛣️</span>
            <h4 className="font-extrabold text-sm text-emerald-950">Roads & Potholes</h4>
            <p className="text-[11px] text-slate-500 font-medium">Road & Transport Dept</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-emerald-200 text-center space-y-2 shadow-xs">
            <span className="text-3xl">🗑️</span>
            <h4 className="font-extrabold text-sm text-emerald-950">Garbage & Waste</h4>
            <p className="text-[11px] text-slate-500 font-medium">Waste Management Dept</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-emerald-200 text-center space-y-2 shadow-xs">
            <span className="text-3xl">💧</span>
            <h4 className="font-extrabold text-sm text-emerald-950">Water Leakage</h4>
            <p className="text-[11px] text-slate-500 font-medium">Water Supply Authority</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-emerald-200 text-center space-y-2 shadow-xs">
            <span className="text-3xl">💡</span>
            <h4 className="font-extrabold text-sm text-emerald-950">Street Lights</h4>
            <p className="text-[11px] text-slate-500 font-medium">Electricity & Wiring</p>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-emerald-950 text-emerald-100 py-12 px-4 sm:px-8 border-t border-emerald-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl">
              📸
            </div>
            <span className="text-xl font-extrabold text-white">CivicSnap</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-emerald-300 font-medium">
            <button onClick={() => openAuth('login', 'citizen')} className="hover:text-white transition">Citizen Login</button>
            <button onClick={() => openAuth('login', 'authority')} className="hover:text-white transition">Municipal Officer Portal</button>
            <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
          </div>

          <p className="text-xs text-emerald-500">
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
