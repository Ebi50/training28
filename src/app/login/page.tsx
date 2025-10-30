'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create Firestore user profile
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: new Date().toISOString(),
          displayName: email.split('@')[0], // Use email username as displayName
          stravaConnected: false,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStravaConnect = () => {
    // Redirect to Strava OAuth
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/strava/callback`;
    const scope = 'read,activity:read_all,profile:read_all';
    
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-warm via-primary-50 to-accent-100 dark:from-bg-warm-dark dark:via-primary-900/20 dark:to-secondary-900/20">
      <div className="max-w-md w-full bg-surface-warm dark:bg-surface-warm-dark rounded-lg shadow-xl p-8 border border-border-light dark:border-border-dark">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">Adaptive Training</h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">Intelligent cycling training plans</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-surface-warm dark:bg-surface-warm-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 bg-surface-warm dark:bg-surface-warm-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark"
            />
          </div>

          {error && (
            <div className="bg-error-50 dark:bg-error-900/30 border border-error dark:border-error-dark text-error dark:text-error-dark px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-text-onDark bg-primary dark:bg-primary-dark hover:bg-primary-600 dark:hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-primary-dark disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-primary dark:text-primary-dark hover:text-primary-600 dark:hover:text-secondary-dark"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light dark:border-border-dark" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-warm dark:bg-surface-warm-dark text-text-secondary-light dark:text-text-secondary-dark">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleStravaConnect}
            className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm text-sm font-medium text-text-primary-light dark:text-text-primary-dark bg-surface-warm dark:bg-surface-warm-dark hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-primary-dark"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#FC4C02">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Connect with Strava
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-text-secondary-light dark:text-text-secondary-dark">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
