'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  Sparkles,
  Camera,
  Users,
  Shield,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Flame,
  Check
} from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NavigationShell({ children }: { children: React.ReactNode }) {
  const { user, profile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Redirect to login if user session is missing
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    }
  }, [pathname, router]);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [pathname]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Skip rendering navigation shell on Auth screens
  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Food Tracker', href: '/food', icon: Utensils },
    { name: 'Workout Log', href: '/workout', icon: Dumbbell },
    { name: 'Posture AI', href: '/posture', icon: Camera },
    { name: 'AI Recommendations', href: '/ai-recommend', icon: Sparkles },
    { name: 'Social Feed', href: '/social', icon: Users },
    ...(profile?.role === 'ADMIN' ? [{ name: 'Admin Dashboard', href: '/admin', icon: Shield }] : []),
    { name: 'Profile', href: '/profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-[#090b11] text-gray-100 flex flex-col md:flex-row relative">
      {/* Background Glows */}
      <div className="glow-bg glow-primary animate-pulse-slow"></div>
      <div className="glow-bg glow-secondary animate-pulse-slow" style={{ animationDelay: '4s' }}></div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col glass-panel m-4 mr-0 p-6 z-10 shrink-0 border-r border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-cyan-500/20">
            FT
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              FitTrack
            </h1>
            <span className="text-xs text-gray-400 font-mono">v1.0.0 (AI Engine)</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          {profile && (
            <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shadow">
                {profile.name ? profile.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-white">{profile.name}</p>
                <p className="text-xs text-gray-400 truncate">{profile.role}</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-xs font-semibold border border-amber-500/20">
                <Flame className="h-3.5 w-3.5 fill-amber-500" />
                <span>{profile.streak}</span>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-sm font-medium transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 md:p-4 pb-20 md:pb-4 z-10">
        {/* Header Bar */}
        <header className="glass-panel p-4 mb-4 flex items-center justify-between mx-4 mt-4 md:mx-0 md:mt-0 border-b border-gray-800">
          <div className="flex items-center gap-3 md:hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white">
              FT
            </div>
            <h1 className="font-bold text-lg text-white">FitTrack</h1>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-lg font-bold text-white">
              {navItems.find((item) => item.href === pathname)?.name || 'FitTrack Hub'}
            </h2>
            <p className="text-xs text-gray-400">Welcome back, let's crush your goals today!</p>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Streak Indicator for Mobile */}
            {profile && (
              <div className="flex items-center gap-1 md:hidden bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-xs font-semibold border border-amber-500/20">
                <Flame className="h-3.5 w-3.5 fill-amber-500" />
                <span>{profile.streak}</span>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-white transition-all relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border border-[#090b11] animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown menu */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 glass-panel border border-white/10 shadow-2xl z-50 p-2 max-h-[400px] overflow-y-auto">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-2">
                    <span className="text-xs font-bold text-gray-400">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-center text-gray-500 py-4">No notifications yet</p>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 border ${
                            notif.is_read 
                              ? 'bg-transparent border-transparent text-gray-400' 
                              : 'bg-white/5 border-cyan-500/10 text-white font-medium'
                          }`}
                        >
                          <div className="flex-1">
                            <p>{notif.message}</p>
                            <span className="text-[10px] text-gray-500 mt-1 block">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!notif.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-cyan-400 hover:text-cyan-300 p-1 hover:bg-cyan-500/10 rounded-md shrink-0 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 md:hidden transition-all"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Dynamic page content slot */}
        <main className="flex-1 p-4 md:p-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation (Slide-out menu overlay) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#090b11]/90 backdrop-blur-md md:hidden flex flex-col p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-extrabold text-xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              FitTrack Navigation
            </h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/25 to-purple-500/10 text-cyan-300 border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-5.5 w-5.5" />
                  <span className="text-base font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/5 space-y-4">
            {profile && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white">
                  {profile.name ? profile.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{profile.name}</p>
                  <p className="text-xs text-gray-400">{profile.role}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 font-medium transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 glass-panel border-t border-white/5 flex items-center justify-around px-2 md:hidden z-30 rounded-t-2xl shadow-xl">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
