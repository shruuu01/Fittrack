'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  Utensils,
  Camera,
  Upload,
  Plus,
  Loader2,
  Check,
  TrendingDown,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

export default function FoodTrackerPage() {
  const { profile } = useAuth();
  
  const [foodLogs, setFoodLogs] = useState<any>({ total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState('LUNCH');

  // AI states
  const [aiMessage, setAiMessage] = useState('');
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFoodLogs = async () => {
    try {
      const data = await api.getFoodLogs();
      setFoodLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoodLogs();
  }, []);

  const handleManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !calories) return;

    setSubmitting(true);
    try {
      await api.logFood({
        food_name: foodName,
        calories: parseInt(calories),
        protein: parseFloat(protein || '0'),
        carbs: parseFloat(carbs || '0'),
        fat: parseFloat(fat || '0'),
        quantity: parseFloat(quantity),
        meal_type: mealType
      });
      
      // Clear form
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setQuantity('1');
      setAiMessage('');
      setAiConfidence(null);

      await loadFoodLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);
    setAiMessage('');
    setAiConfidence(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await api.recognizeFoodImage(formData);
      
      // Pre-fill form
      setFoodName(result.predicted_item);
      setCalories(result.calories.toString());
      setProtein(result.protein.toString());
      setCarbs(result.carbs.toString());
      setFat(result.fat.toString());
      
      setAiConfidence(result.confidence);
      setAiMessage(`AI recognized ${result.predicted_item}! Macros are pre-filled below.`);
    } catch (err) {
      console.error(err);
      setAiMessage('AI recognition failed. Please input manually.');
    } finally {
      setUploading(false);
    }
  };

  const macroData = [
    { name: 'Protein (g)', value: foodLogs.total_protein || 1, color: '#06b6d4' },
    { name: 'Carbs (g)', value: foodLogs.total_carbs || 1, color: '#8b5cf6' },
    { name: 'Fat (g)', value: foodLogs.total_fat || 1, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* Top Banner */}
      <div className="glass-panel p-6 border-white/5 bg-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Macro & Calorie Logger</h2>
          <p className="text-xs text-gray-400">Log meals manually or snap food images to count macro splits instantly.</p>
        </div>
        
        {profile && (
          <div className="flex items-center gap-6 bg-white/5 border border-white/5 px-6 py-3 rounded-2xl">
            <div className="text-center">
              <span className="text-xs text-gray-400 block font-mono">CONSUMED</span>
              <span className="text-xl font-extrabold text-cyan-400">{foodLogs.total_calories} kcal</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-center">
              <span className="text-xs text-gray-400 block font-mono">BUDGET</span>
              <span className="text-xl font-extrabold text-white">{profile.daily_calorie_goal} kcal</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Logger + AI Upload */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Scanner Widget */}
          <div className="glass-panel p-6 border-white/5 bg-white/5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold text-base text-white">AI Instant Food Scanner</h3>
            </div>
            
            <div className="border border-dashed border-white/10 hover:border-cyan-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white/5 hover:bg-white/[0.08]"
                 onClick={() => fileInputRef.current?.click()}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              
              {uploading ? (
                <div className="flex flex-col items-center py-4 space-y-3">
                  <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
                  <p className="text-xs text-cyan-400 font-semibold animate-pulse">Running Neural Food Recognition...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 space-y-2">
                  <Upload className="h-10 w-10 text-gray-400" />
                  <p className="text-xs font-bold text-white">Upload Food Snapshot</p>
                  <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed">
                    Supported signatures: pizza, salad, avocado, banana. Snap a file to predict calorie counts.
                  </p>
                </div>
              )}
            </div>

            {aiMessage && (
              <div className={`mt-4 p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                aiConfidence ? 'bg-cyan-500/10 border-cyan-500/35 text-cyan-400' : 'bg-rose-500/10 border-rose-500/35 text-rose-400'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{aiMessage}</span>
                </div>
                {aiConfidence && (
                  <span className="font-mono bg-cyan-400/20 px-2 py-0.5 rounded-full text-[10px]">
                    Conf: {Math.round(aiConfidence * 100)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Manual Log Form */}
          <div className="glass-panel p-6 border-white/5 bg-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-5 w-5 text-purple-400" />
              <h3 className="font-bold text-base text-white">Log Meal Metrics</h3>
            </div>

            <form onSubmit={handleManualLog} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Food Name
                  </label>
                  <input
                    type="text"
                    required
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="Grilled Salmon Bowl"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    required
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="450"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="35"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="12"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="18"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Servings
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="1"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Meal Slot
                    </label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full px-2 py-2.5 bg-[#0d1222] border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 text-xs"
                    >
                      <option value="BREAKFAST">Breakfast</option>
                      <option value="LUNCH">Lunch</option>
                      <option value="DINNER">Dinner</option>
                      <option value="SNACK">Snack</option>
                    </select>
                  </div>
                </div>

              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Food Instance'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Recharts Breakdown + Logs List */}
        <div className="space-y-6">
          
          {/* Recharts Pie Breakdown */}
          <div className="glass-panel p-6 border-white/5 bg-white/5">
            <h3 className="font-bold text-base text-white mb-4">Macronutrient Split</h3>
            
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}g`} contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 text-center text-[10px]">
              <div>
                <span className="text-gray-400 block font-mono">PROTEIN</span>
                <span className="font-bold text-cyan-400">{foodLogs.total_protein}g</span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono">CARBS</span>
                <span className="font-bold text-purple-400">{foodLogs.total_carbs}g</span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono">FAT</span>
                <span className="font-bold text-pink-400">{foodLogs.total_fat}g</span>
              </div>
            </div>
          </div>

          {/* Today's logged meals list */}
          <div className="glass-panel p-6 border-white/5 bg-white/5">
            <h3 className="font-bold text-base text-white mb-4">Logged Today</h3>

            {foodLogs.items.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No meals logged today</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {foodLogs.items.map((item: any) => (
                  <div key={item.id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{item.food_name}</p>
                      <p className="text-gray-400 text-[10px]">{item.meal_type} • x{item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-cyan-400">{item.calories} kcal</p>
                      <p className="text-[10px] text-gray-500">P:{item.protein} C:{item.carbs} F:{item.fat}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
