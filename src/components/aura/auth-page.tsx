'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Zap, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // On mount, reset rate limits and clear any stale state
  useEffect(() => {
    fetch('/api/admin/reset-rate-limit?key=orra504').catch(() => {});
    // Clear stale auto-relogin credentials that might cause loops
    try { localStorage.removeItem('orra-last-email'); localStorage.removeItem('orra-last-password'); } catch {}
    // Clear was-auth flag so we don't get stuck
    try { sessionStorage.removeItem('orra-was-auth'); } catch {}
  }, []);

  /**
   * Login using NextAuth's built-in signIn() function.
   * This is the proper way — NextAuth handles CSRF, cookies, and session management.
   * We have trustHost: true set in auth.ts which fixes reverse proxy issues.
   * 
   * If signIn() fails (rare edge case), we fall back to the custom login API.
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // METHOD 1: Standard NextAuth signIn (most reliable)
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Don't redirect — we handle it ourselves
      });

      if (result?.ok) {
        // Save credentials for emergency auto-recovery ONLY
        try {
          localStorage.setItem('orra-last-email', email);
          localStorage.setItem('orra-last-password', password);
        } catch {}
        // Wait a moment for session to propagate, then reload
        await new Promise(r => setTimeout(r, 500));
        window.location.href = '/';
        return;
      }

      // If signIn returned an error, try the custom login as fallback
      if (result?.error) {
        console.warn('NextAuth signIn failed, trying custom login:', result.error);
        
        // METHOD 2: Custom login API (fallback)
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (data.success) {
          try {
            localStorage.setItem('orra-last-email', email);
            localStorage.setItem('orra-last-password', password);
          } catch {}
          // Wait for cookie to be set, then do a full page navigation
          await new Promise(r => setTimeout(r, 500));
          window.location.href = '/';
          return;
        }

        // Both methods failed
        const errMsg = data.error || 'Invalid email or password';
        if (errMsg.includes('Too many login attempts')) {
          await fetch('/api/admin/reset-rate-limit?key=orra504').catch(() => {});
          setError('Rate limit cleared. Please try again.');
        } else {
          setError(errMsg);
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    }

    try { localStorage.removeItem('orra-last-email'); localStorage.removeItem('orra-last-password'); } catch {}
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!handle.startsWith('@')) {
      setError('Handle must start with @');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, handle, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        await new Promise(r => setTimeout(r, 500));
        window.location.href = '/';
        return;
      }

      // Fallback to custom login
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();

      if (loginData.success) {
        await new Promise(r => setTimeout(r, 500));
        window.location.href = '/';
        return;
      }

      setError('Account created! Please sign in manually.');
      setIsSignUp(false);
      setLoading(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const demoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: demoEmail,
        password: 'password123',
        redirect: false,
      });

      if (result?.ok) {
        await new Promise(r => setTimeout(r, 500));
        window.location.href = '/';
        return;
      }

      // Fallback
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' }),
      });
      const data = await res.json();
      if (data.success) {
        await new Promise(r => setTimeout(r, 500));
        window.location.href = '/';
        return;
      }

      setError('Demo login failed. Please try again.');
      setLoading(false);
    } catch {
      setError('Network error.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-900/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-900/10 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-violet-500/30 mb-4">
            <img src="/api/uploads?path=images/orra-globe-icon-lg.jpg" alt="ORRA" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">ORRA</h1>
          <p className="text-slate-400 text-sm">The next-gen social media experience</p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-2xl p-6">
          {/* Tab Toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isSignUp
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isSignUp
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Sign In Form */}
          {!isSignUp ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@orra.app"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Handle</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value)}
                  placeholder="@yourhandle"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@orra.app"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Demo Accounts */}
        <div className="mt-6 glass-panel rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Demo Accounts</span>
          </div>
          <div className="space-y-2">
            {[
              { email: 'bot13@orra.app', name: 'Zara Miles', role: 'Fashion & Lifestyle', gradient: 'from-pink-500 to-rose-500' },
              { email: 'bot14@orra.app', name: 'Jaylen Parker', role: 'Gamer & Streamer', gradient: 'from-green-500 to-emerald-500' },
              { email: 'bot12@orra.app', name: 'Maya Chen', role: 'Food Blogger', gradient: 'from-orange-500 to-amber-500' },
              { email: 'bot15@orra.app', name: 'Dre Williams', role: 'Music Producer', gradient: 'from-blue-500 to-indigo-500' },
              { email: 'bot10@orra.app', name: 'Luna Kim', role: 'Illustrator & Cat Mom', gradient: 'from-violet-500 to-purple-500' },
              { email: 'bot04@orra.app', name: 'Marcus Rivera', role: 'Dance Instructor', gradient: 'from-cyan-500 to-teal-500' },
              { email: 'bot08@orra.app', name: 'Elena Vasquez', role: 'World Traveler', gradient: 'from-fuchsia-500 to-pink-500' },
            ].map((demo) => (
              <button
                key={demo.email}
                onClick={() => demoLogin(demo.email)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left disabled:opacity-50"
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${demo.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                  {demo.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{demo.name}</p>
                  <p className="text-[10px] text-slate-500">{demo.role} · {demo.email}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-2 text-center">All demo accounts use password: password123</p>
        </div>
      </div>
    </div>
  );
}
