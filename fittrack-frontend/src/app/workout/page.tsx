'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Dumbbell, Plus, Trash2, Zap, Heart, Calendar } from 'lucide-react';

interface WorkoutLog {
  id: number;
  exercise_name: string;
  category: string;
  duration_minutes: number;
  calories_burned: number;
  logged_at: string;
}

export default function WorkoutPage() {
  const { user } = useAuth();
  
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [exerciseName, setExerciseName] = useState('');
  const [category, setCategory] = useState('STRENGTH');
  const [duration, setDuration] = useState('30');
  const [caloriesBurned, setCaloriesBurned] = useState('180');
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Live MET coefficients for auto-calculation
  // Strength: ~6 kcal/min, Cardio: ~10 kcal/min, Flexibility: ~3.5 kcal/min
  const getKcalPerMin = (cat: string) => {
    if (cat === 'CARDIO') return 10;
    if (cat === 'FLEXIBILITY') return 3.5;
    return 6; // STRENGTH
  };

  useEffect(() => {
    if (autoCalculate) {
      const computed = Math.round(parseInt(duration || '0') * getKcalPerMin(category));
      setCaloriesBurned(computed.toString());
    }
  }, [category, duration, autoCalculate]);

  const fetchWorkoutLogs = async () => {
    try {
      const data = await api.getWorkoutLogs();
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkoutLogs();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.logWorkout({
        exercise_name: exerciseName,
        category: category,
        duration_minutes: parseInt(duration) || 0,
        calories_burned: parseInt(caloriesBurned) || 0,
      });
      // Reset form
      setExerciseName('');
      setDuration('30');
      fetchWorkoutLogs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLog = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/workout/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchWorkoutLogs();
    } catch (e) {
      console.error(e);
    }
  };

  const totalMinutes = logs.reduce((acc, curr) => acc + curr.duration_minutes, 0);
  const totalBurned = logs.reduce((acc, curr) => acc + curr.calories_burned, 0);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 bg-gradient-to-r from-rose-500/10 via-slate-900 to-slate-900 border-rose-500/20">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Workout Logger</h1>
        <p className="text-sm text-slate-400 mt-1">Track your strength conditioning, endurance runs, and flexibility sessions.</p>
      </div>

      {/* Stats Board */}
      {logs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Exercises Logged</p>
              <h2 className="text-3xl font-black mt-2 text-slate-100">{logs.length}</h2>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <Dumbbell className="h-6 w-6" />
            </div>
          </div>
          
          <div className="glass-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Training Duration</p>
              <h2 className="text-3xl font-black mt-2 text-slate-100">{totalMinutes} <span className="text-sm font-normal text-slate-500">mins</span></h2>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          <div className="glass-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Calories Burned</p>
              <h2 className="text-3xl font-black mt-2 text-rose-400">{totalBurned} <span className="text-sm font-normal text-slate-500">kcal</span></h2>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Heart className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* Forms and Logs split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="glass-card p-6 md:col-span-1 h-fit">
          <h3 className="text-lg font-bold mb-4">Log Exercise</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Exercise Name</label>
              <input
                type="text"
                required
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="e.g. Bench Press or Jogging"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-350 focus:outline-none"
              >
                <option value="STRENGTH">Strength Training</option>
                <option value="CARDIO">Cardio Endurance</option>
                <option value="FLEXIBILITY">Flexibility & Core</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Duration: {duration} mins</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="180" 
                step="5"
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Calories Burned (kcal)</label>
                <button
                  type="button"
                  onClick={() => setAutoCalculate(!autoCalculate)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${autoCalculate ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}
                >
                  {autoCalculate ? 'Auto Estimating' : 'Manual Edit'}
                </button>
              </div>
              <input
                type="number"
                disabled={autoCalculate}
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none disabled:opacity-70"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center shadow-lg shadow-rose-500/15"
            >
              <Plus className="h-4.5 w-4.5 mr-1" /> Log Workout
            </button>
          </form>
        </div>

        {/* Right Column: History */}
        <div className="glass-card p-6 md:col-span-2">
          <h3 className="text-lg font-bold mb-4">Workout History</h3>
          <div className="divide-y divide-slate-850">
            {logs.length === 0 ? (
              <p className="text-center py-16 text-xs text-slate-500">No workout records found. Start logging above!</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex justify-between items-center py-4 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-rose-450">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-200">{log.exercise_name}</p>
                      <p className="text-xs text-slate-500">
                        {log.category.toLowerCase()} • {log.duration_minutes} mins • <span className="text-rose-400 font-semibold">{log.calories_burned} kcal burned</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.logged_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
