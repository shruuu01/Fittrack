'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  Shield, Users, AlertOctagon, Activity, 
  UserCheck, ShieldCheck, Check, Sparkles 
} from 'lucide-react';

interface AdminStats {
  total_users: number;
  total_posts: number;
  pending_reports: number;
  total_workouts: number;
}

interface UserProfile {
  id: number;
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  activity_level: string;
  role: 'USER' | 'ADMIN';
  user: {
    id: number;
    username: string;
    email: string;
  };
}

interface ModerationReport {
  id: number;
  reporter_username: string;
  type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'USERS' | 'REPORTS'>('USERS');

  useEffect(() => {
    // RBAC Redirect if not admin
    if (!loading && profile && profile.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [profile, loading, router]);

  const loadAdminData = async () => {
    try {
      setIsLoadingData(true);
      const statsData = await api.getAdminStats();
      setStats(statsData);
      
      const usersData = await api.getAdminUsers();
      setUsers(usersData || []);

      const reportsData = await api.getAdminReports();
      setReports(reportsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (profile && profile.role === 'ADMIN') {
      loadAdminData();
    }
  }, [profile]);

  const handleRoleToggle = async (userId: number, currentRole: 'USER' | 'ADMIN') => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.updateUserRole(userId, nextRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: nextRole } : u));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveReport = async (reportId: number) => {
    try {
      await api.resolveReport(reportId);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'RESOLVED' } : r));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || isLoadingData) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/20">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Administrative Console</h1>
        <p className="text-sm text-slate-400 mt-1">Manage accounts, content moderation flags, and monitor fitness stats.</p>
      </div>

      {/* Stats Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Members</p>
              <h2 className="text-3xl font-black mt-2 text-slate-200">{stats.total_users}</h2>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="glass-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Flags</p>
              <h2 className="text-3xl font-black mt-2 text-rose-450">{stats.pending_reports}</h2>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertOctagon className="h-6 w-6" />
            </div>
          </div>

          <div className="glass-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Shared Posts</p>
              <h2 className="text-3xl font-black mt-2 text-slate-200">{stats.total_posts}</h2>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>

          <div className="glass-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workouts Tracked</p>
              <h2 className="text-3xl font-black mt-2 text-slate-200">{stats.total_workouts}</h2>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex space-x-4 border-b border-slate-800 pb-2">
        <button 
          onClick={() => setActiveTab('USERS')}
          className={`pb-2 text-sm font-bold transition-all ${activeTab === 'USERS' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Manage Platform Users
        </button>
        <button 
          onClick={() => setActiveTab('REPORTS')}
          className={`pb-2 text-sm font-bold transition-all ${activeTab === 'REPORTS' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Content Moderation ({reports.filter(r => r.status === 'PENDING').length})
        </button>
      </div>

      {/* Tab Contents: Users */}
      {activeTab === 'USERS' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <th className="p-4 font-bold">Username</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">Height/Weight</th>
                  <th className="p-4 font-bold">Activity Index</th>
                  <th className="p-4 font-bold">System Role</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-900/40 text-slate-300">
                    <td className="p-4 font-bold text-slate-200">{u.user?.username || u.name}</td>
                    <td className="p-4 text-slate-400">{u.user?.email}</td>
                    <td className="p-4">{u.height}cm / {u.weight}kg</td>
                    <td className="p-4 font-semibold text-slate-450">{u.activity_level.replace('_', ' ')}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRoleToggle(u.id, u.role)}
                        className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold rounded-lg transition-all"
                      >
                        {u.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Contents: Moderation */}
      {activeTab === 'REPORTS' && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">Content Claims</h3>
          <div className="divide-y divide-slate-850">
            {reports.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-500">No moderation reports found.</p>
            ) : (
              reports.map(rep => (
                <div key={rep.id} className="flex justify-between items-center py-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200">Flagged Target ID: {rep.target_id}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${rep.status === 'PENDING' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-slate-450">Reporter: <span className="font-semibold">{rep.reporter_username}</span> • Reason: {rep.reason}</p>
                    <p className="text-[10px] text-slate-500">{new Date(rep.created_at).toLocaleString()}</p>
                  </div>
                  {rep.status === 'PENDING' && (
                    <button
                      onClick={() => handleResolveReport(rep.id)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-all flex items-center"
                    >
                      <Check className="h-4 w-4 mr-1.5" /> Resolve Flag
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
