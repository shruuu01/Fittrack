'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Sparkles, Utensils, Users, Flame } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090b11] text-gray-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow meshes */}
      <div className="glow-bg glow-primary animate-pulse-slow"></div>
      <div className="glow-bg glow-secondary animate-pulse-slow" style={{ animationDelay: '4s' }}></div>

      <div className="w-full max-w-4xl z-10 text-center flex flex-col items-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-3xl text-white shadow-xl shadow-cyan-500/25 mb-6">
          FT
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent max-w-2xl leading-tight">
          Next-Gen AI Fitness Analytics
        </h1>
        
        <p className="text-gray-400 mt-6 max-w-xl text-sm md:text-base leading-relaxed">
          FitTrack is a premium ecosystem providing automated posture corrections, real-time macro estimation from food snaps, and biometric nearest-neighbor workout recommendations.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/20 text-sm md:text-base"
          >
            Enter Dashboard Hub
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 text-white font-bold rounded-xl transition-all duration-300 text-sm md:text-base"
          >
            Register Account
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-16 text-left">
          <div className="glass-panel p-6 border border-white/5 bg-white/5">
            <Camera className="h-8 w-8 text-cyan-400 mb-4" />
            <h3 className="font-bold text-base text-white">Posture AI</h3>
            <p className="text-xs text-gray-400 mt-2">
              Realtime joint angle checking and repetition calculations via MediaPipe.
            </p>
          </div>

          <div className="glass-panel p-6 border border-white/5 bg-white/5">
            <Sparkles className="h-8 w-8 text-purple-400 mb-4" />
            <h3 className="font-bold text-base text-white">AI Engine</h3>
            <p className="text-xs text-gray-400 mt-2">
              KNN biometric planning to calibrate customized daily macro intakes.
            </p>
          </div>

          <div className="glass-panel p-6 border border-white/5 bg-white/5">
            <Utensils className="h-8 w-8 text-pink-400 mb-4" />
            <h3 className="font-bold text-base text-white">Macro Scanner</h3>
            <p className="text-xs text-gray-400 mt-2">
              Snap food items to fetch macro estimations and calorie tracking details.
            </p>
          </div>

          <div className="glass-panel p-6 border border-white/5 bg-white/5">
            <Users className="h-8 w-8 text-emerald-400 mb-4" />
            <h3 className="font-bold text-base text-white">Social Feed</h3>
            <p className="text-xs text-gray-400 mt-2">
              Connect with fellow fitness warriors. Share status updates, like, and comment.
            </p>
          </div>
        </div>

        <div className="mt-16 text-xs text-gray-500 font-mono flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-500 animate-pulse" />
          <span>Local storage mock engine active. Fully standalone.</span>
        </div>
      </div>
    </div>
  );
}
