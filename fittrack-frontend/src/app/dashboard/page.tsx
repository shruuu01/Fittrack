'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  Flame,
  Utensils,
  Dumbbell,
  Droplet,
  TrendingUp,
  Plus,
  Scale,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import Link from 'next/link';

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth();
  
  const [foodData, setFoodData] = useState<any>({ total_calories: 0, items: [] });
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [postureLogs, setPostureLogs] = useState<any[]>([]);
  const [waterIntake, setWaterIntake] = useState(1200); // ml
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const food = await api.getFoodLogs();
      setFoodData(food);
      const wkts = await api.getWorkoutLogs();
      setWorkouts(wkts);
      const post = await api.getPostureHistory();
      setPostureLogs(post);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAddWater = () => {
    setWaterIntake((prev) => Math.min(prev + 250, 4000));
    // Trigger notification if water goal reached
    if (profile && waterIntake + 250 >= profile.daily_water_goal) {
      // Handled locally or in notifications
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 mt-4 text-xs font-mono">Initializing Fitness Modules...</p>
      </div>
    );
  }

  // Calculate percentages
  const caloriePercent = Math.min(Math.round((foodData.total_calories / profile.daily_calorie_goal) * 100), 100);
  const waterPercent = Math.min(Math.round((waterIntake / profile.daily_water_goal) * 100), 100);
  
  const totalBurned = workouts.reduce((acc, curr) => acc + curr.calories_burned, 0);

  // Mock data for graphs
  const weeklyCalorieData = [
    { day: 'Mon', Consumed: 1800, Burned: 400 },
    { day: 'Tue', Consumed: 2100, Burned: 350 },
    { day: 'Wed', Consumed: 1950, Burned: 500 },
    { day: 'Thu', Consumed: 1700, Burned: 450 },
    { day: 'Fri', Consumed: 2200, Burned: 600 },
    { day: 'Sat', Consumed: 2050, Burned: 300 },
    { day: 'Sun', Consumed: foodData.total_calories, Burned: totalBurned }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* Top Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Calorie Ring Panel */}
        <div className="glass-panel p-6 flex items-center justify-between border-white/5 bg-white/5 relative overflow-hidden">
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Calorie Target</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-white">{foodData.total_calories}</span>
              <span className="text-xs text-gray-400">/ {profile.daily_calorie_goal} kcal</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Remaining: {Math.max(0, profile.daily_calorie_goal - foodData.total_calories)} kcal</p>
          </div>
          
          <div className="relative h-20 w-20 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="34" className="stroke-white/5 fill-transparent" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" className="stroke-cyan-400 fill-transparent transition-all duration-500" strokeWidth="6"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - caloriePercent / 100)} />
            </svg>
            <span className="absolute text-xs font-bold text-cyan-400">{caloriePercent}%</span>
          </div>
        </div>

        {/* Water Intake Tracker */}
        <div className="glass-panel p-6 flex items-center justify-between border-white/5 bg-white/5">
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Hydration Goal</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-white">{waterIntake}</span>
              <span className="text-xs text-gray-400">/ {profile.daily_water_goal} ml</span>
            </div>
            <button
              onClick={handleAddWater}
              className="mt-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors bg-cyan-400/10 px-2.5 py-1 rounded-lg border border-cyan-400/20 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log +250ml</span>
            </button>
          </div>
          
          <div className="relative h-20 w-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="34" className="stroke-white/5 fill-transparent" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" className="stroke-purple-400 fill-transparent transition-all duration-500" strokeWidth="6"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - waterPercent / 100)} />
            </svg>
            <span className="absolute text-xs font-bold text-purple-400">{waterPercent}%</span>
          </div>
        </div>

        {/* Dynamic Biometrics Indicator */}
        <div className="glass-panel p-6 flex flex-col justify-between border-white/5 bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Weight Goal</span>
            <Scale className="h-5 w-5 text-pink-400" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">{profile.weight}</span>
              <span className="text-xs text-gray-400">kg (Target: {profile.target_weight} kg)</span>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="bg-pink-500 h-full transition-all" style={{ width: `${Math.min(100, Math.max(10, Math.round((profile.target_weight / profile.weight) * 100)))}%` }}></div>
          </div>
        </div>

      </div>

      {/* Analytics Chart Block */}
      <div className="glass-panel p-6 border-white/5 bg-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-base text-white">Daily Calorie Trends</h3>
            <p className="text-xs text-gray-400">Comparing calories logged vs calories burned</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-cyan-400"></span>
              <span className="text-gray-300">Consumed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-purple-400"></span>
              <span className="text-gray-300">Burned</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyCalorieData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCons" cx="0" cy="0" r="1" gradientTransform="translate(0, 0) scale(1, 1)">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBurn" cx="0" cy="0" r="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#4b5563" fontSize={10} tickLine={false} />
              <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#f3f4f6' }} />
              <Area type="monotone" dataKey="Consumed" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorCons)" />
              <Area type="monotone" dataKey="Burned" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorBurn)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Workout Activity Log */}
        <div className="glass-panel p-6 border-white/5 bg-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white">Recent Workouts</h3>
              <Link href="/workout" className="text-xs text-cyan-400 hover:underline flex items-center gap-0.5">
                <span>View all</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            
            {workouts.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No workouts logged yet</p>
            ) : (
              <div className="space-y-3">
                {workouts.slice(0, 3).map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                        W
                      </div>
                      <div>
                        <p className="font-semibold text-white">{w.exercise_name}</p>
                        <p className="text-gray-400 text-[10px] uppercase font-mono">{w.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">+{w.calories_burned} kcal</p>
                      <p className="text-gray-500 text-[10px]">{w.duration_minutes} mins</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/workout"
            className="w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium rounded-xl text-xs text-center transition-colors block"
          >
            Log New Workout
          </Link>
        </div>

        {/* Posture Check Status */}
        <div className="glass-panel p-6 border-white/5 bg-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white">AI Posture Checks</h3>
              <Link href="/posture" className="text-xs text-cyan-400 hover:underline flex items-center gap-0.5">
                <span>Open camera</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {postureLogs.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No posture sessions analyzed yet</p>
            ) : (
              <div className="space-y-3">
                {postureLogs.slice(0, 3).map((p) => (
                  <div key={p.id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{p.exercise_type} Check</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.accuracy_score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        Score: {p.accuracy_score}%
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{p.feedback_summary}</p>
                    <span className="text-[10px] text-gray-500 block font-mono">
                      Logged {new Date(p.created_at).toLocaleDateString()} at {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/posture"
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-medium rounded-xl text-xs text-center shadow shadow-cyan-500/20 transition-all block"
          >
            Start Realtime Form Check
          </Link>
        </div>

      </div>
    </div>
  );
}
