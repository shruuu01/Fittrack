'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { 
  Sparkles, Award, Utensils, Dumbbell, 
  ChevronRight, Flame, Loader2, Info
} from 'lucide-react';

export default function AiRecommendPage() {
  const { user } = useAuth();
  
  const [dietPlan, setDietPlan] = useState<any | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any | null>(null);
  const [goalType, setGoalType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const data = await api.getRecommendations();
      
      // Filter out latest diet & workout recommendation
      const latestDiet = data.find((r: any) => r.type === 'DIET');
      const latestWorkout = data.find((r: any) => r.type === 'WORKOUT');

      if (latestDiet) {
        setDietPlan(JSON.parse(latestDiet.content_json));
        setGoalType(latestDiet.goal_type);
      }
      if (latestWorkout) {
        setWorkoutPlan(JSON.parse(latestWorkout.content_json));
      }
    } catch (e) {
      console.error('Failed to load recommendations', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateRecommendations();
      setDietPlan(res.diet_recommendation ? JSON.parse(res.diet_recommendation.content_json) : null);
      setWorkoutPlan(res.workout_recommendation ? JSON.parse(res.workout_recommendation.content_json) : null);
      setGoalType(res.goal_type);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/20 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI Recommendation Engine</h1>
          <p className="text-sm text-slate-400 mt-1">Personalized diet recipes and physical workout regimes compiled by machine learning.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" /> Fitting matrices...
            </>
          ) : (
            <>
              <Sparkles className="h-4.5 w-4.5 mr-2" /> Recalculate AI Blueprint
            </>
          )}
        </button>
      </div>

      {!dietPlan && !workoutPlan ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
          <Info className="h-10 w-10 text-slate-500" />
          <h3 className="text-lg font-bold">No Custom Plans Generated Yet</h3>
          <p className="text-xs text-slate-400">
            Click the generator button to cluster your profile (age, weight, target delta) and match with custom diet and workout templates.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl transition-all"
          >
            Create My Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Diet Recommendation Card */}
          {dietPlan && (
            <div className="glass-card p-6 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Dietary Program ({goalType.replace('_', ' ')})</span>
                  <h3 className="text-xl font-bold mt-1 text-slate-100">{dietPlan.title}</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Utensils className="h-6 w-6" />
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{dietPlan.description}</p>

              {/* Target Macros breakdown */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 grid grid-cols-4 gap-2 text-center text-xs">
                <div className="border-r border-slate-850">
                  <p className="text-slate-500 text-[10px] uppercase font-semibold">Calories</p>
                  <p className="font-extrabold text-sm mt-1 text-slate-100">{dietPlan.calories} kcal</p>
                </div>
                <div className="border-r border-slate-850">
                  <p className="text-emerald-400 text-[10px] uppercase font-semibold">Protein</p>
                  <p className="font-extrabold text-sm mt-1 text-slate-100">{dietPlan.protein}g</p>
                </div>
                <div className="border-r border-slate-850">
                  <p className="text-sky-400 text-[10px] uppercase font-semibold">Carbs</p>
                  <p className="font-extrabold text-sm mt-1 text-slate-100">{dietPlan.carbs}g</p>
                </div>
                <div>
                  <p className="text-yellow-500 text-[10px] uppercase font-semibold">Fats</p>
                  <p className="font-extrabold text-sm mt-1 text-slate-100">{dietPlan.fat}g</p>
                </div>
              </div>

              {/* Recommended Meals */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Meal Schedule blueprint</h4>
                <div className="space-y-3">
                  {dietPlan.meals?.map((meal: any, idx: number) => (
                    <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{meal.name}</p>
                        <p className="text-slate-450 mt-0.5">P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g</p>
                      </div>
                      <span className="font-semibold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-md">{meal.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Workout Recommendation Card */}
          {workoutPlan && (
            <div className="glass-card p-6 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Exercise Program ({goalType.replace('_', ' ')})</span>
                  <h3 className="text-xl font-bold mt-1 text-slate-100">{workoutPlan.title}</h3>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Dumbbell className="h-6 w-6" />
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{workoutPlan.description}</p>

              {/* Recommended exercises */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Workout Schedule blueprint</h4>
                <div className="space-y-3">
                  {workoutPlan.exercises?.map((exercise: any, idx: number) => (
                    <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{exercise.name}</p>
                        <p className="text-slate-450 mt-0.5">Sets: {exercise.sets} • Reps: {exercise.reps} • Rest: {exercise.rest_seconds}s</p>
                      </div>
                      <span className="font-semibold text-slate-350 bg-slate-950 px-2.5 py-1 rounded-md">{exercise.duration_mins} mins</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
