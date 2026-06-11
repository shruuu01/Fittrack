'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { User, Activity, Scale, Compass, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [targetWeight, setTargetWeight] = useState(70);
  const [activityLevel, setActivityLevel] = useState('SEDENTARY');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAge(profile.age || 25);
      setGender(profile.gender || 'male');
      setHeight(profile.height || 170);
      setWeight(profile.weight || 70);
      setTargetWeight(profile.target_weight || 70);
      setActivityLevel(profile.activity_level || 'SEDENTARY');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      await api.updateProfile({
        name,
        age: parseInt(age.toString()),
        gender,
        height: parseFloat(height.toString()),
        weight: parseFloat(weight.toString()),
        target_weight: parseFloat(targetWeight.toString()),
        activity_level: activityLevel
      });
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <div className="glass-panel p-6 border-white/5 bg-white/5">
        <h2 className="text-xl font-bold text-white mb-2">Biometrics & Goals</h2>
        <p className="text-xs text-gray-400">Configure your parameters to calibrate the neural recommendation engine.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel p-6 border-white/5 bg-white/5 space-y-6">
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Biometrics database updated successfully. Recalculations applied.</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/35 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fit Warrior"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Age (Years)
              </label>
              <input
                type="number"
                required
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                placeholder="26"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Gender Identity
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 bg-[#0d1222] border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                required
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value))}
                placeholder="178"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Current Weight (kg)
              </label>
              <input
                type="number"
                required
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value))}
                placeholder="78"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
              />
            </div>

            {/* Target Weight */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Target Target Weight (kg)
              </label>
              <input
                type="number"
                required
                value={targetWeight}
                onChange={(e) => setTargetWeight(parseInt(e.target.value))}
                placeholder="72"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
              />
            </div>

            {/* Activity Level */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Daily Activity Spend Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full px-4 py-3 bg-[#0d1222] border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
              >
                <option value="SEDENTARY">Sedentary (desk job, minimal workouts)</option>
                <option value="LIGHTLY_ACTIVE">Lightly Active (light exercise 1-3 days/week)</option>
                <option value="MODERATELY_ACTIVE">Moderately Active (moderate exercise 3-5 days/week)</option>
                <option value="VERY_ACTIVE">Very Active (hard exercise 6-7 days/week)</option>
              </select>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/20 active:scale-98 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Save Biometrics & Recalculate'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
