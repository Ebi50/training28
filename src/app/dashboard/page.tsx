'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/types';
import UserTutorial from '@/components/UserTutorial';
import DashboardLayout from '@/components/DashboardLayout';
import { useAutoLogout } from '@/hooks/useAutoLogout';

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [stravaMessage, setStravaMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-logout functionality
  useAutoLogout({
    timeoutMinutes: profile?.autoLogoutMinutes || 10, // Default 10 min
    onLogout: () => {
      console.log('Auto-logout triggered due to inactivity');
    }
  });

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
        
        // Show tutorial for new users (no FTP set = new user)
        if (!userProfile?.ftp) {
          setShowTutorial(true);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Check for Strava OAuth callback messages
  useEffect(() => {
    const stravaConnected = searchParams.get('strava_connected');
    const stravaError = searchParams.get('strava_error');

    if (stravaConnected === 'true') {
      setStravaMessage('✓ Strava erfolgreich verbunden!');
      // Reload profile to get updated Strava status
      if (auth.currentUser) {
        getUserProfile(auth.currentUser.uid).then(setProfile);
      }
    } else if (stravaError) {
      setStravaMessage(`❌ Strava Fehler: ${stravaError}`);
    }

    // Clear message after 5 seconds
    if (stravaConnected || stravaError) {
      setTimeout(() => setStravaMessage(null), 5000);
    }
  }, [searchParams]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      userEmail={auth.currentUser?.email || undefined}
      onSignOut={handleSignOut}
      onHelp={() => setShowTutorial(true)}
    >
      {/* Tutorial Modal */}
      {showTutorial && (
        <UserTutorial
          onClose={() => setShowTutorial(false)}
          onComplete={() => {
            setShowTutorial(false);
          }}
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Strava Status Message */}
        {stravaMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            stravaMessage.includes('✓') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {stravaMessage}
          </div>
        )}

        {!profile?.stravaConnected ? (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="#FC4C02">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  🚀 Connect Your Strava Account
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  Unlock the full power of adaptive training! Connect Strava to automatically sync your rides and get personalized plans.
                </p>
                
                {/* Benefits */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Auto-sync activities
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Better predictions
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Real-time fitness tracking
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    No manual entry
                  </div>
                </div>

                {/* How it works */}
                <details className="mt-4 text-xs text-gray-600">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                    📖 How does it work? (Click to expand)
                  </summary>
                  <div className="mt-2 pl-4 space-y-2">
                    <p>
                      <strong>Step 1:</strong> Click the button below
                    </p>
                    <p>
                      <strong>Step 2:</strong> You'll be redirected to Strava.com
                    </p>
                    <p>
                      <strong>Step 3:</strong> Log in and click "Authorize"
                    </p>
                    <p>
                      <strong>Step 4:</strong> Done! You'll be redirected back automatically
                    </p>
                    <p className="text-green-600 font-medium">
                      ✓ You don't need to create any API account - just use your regular Strava login!
                    </p>
                    <p className="text-gray-500">
                      <strong>Safe & Secure:</strong> We only read your activities, never post or modify anything. 
                      You can disconnect anytime in Settings.
                    </p>
                  </div>
                </details>

                <button
                  onClick={() => {
                    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
                    const redirectUri = `${window.location.origin}/api/auth/strava/callback`;
                    const scope = 'read,activity:read_all,profile:read_all';
                    const userId = auth.currentUser?.uid || '';
                    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${userId}&approval_prompt=auto`;
                  }}
                  className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                  Connect Strava Now
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current Form (TSB)</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Fitness (CTL)</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Week</p>
                <p className="text-2xl font-semibold text-gray-900">-- hrs</p>
              </div>
            </div>
          </div>
        </div>

        {/* This Week's Plan */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">This Week's Training Plan</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2">No training plan generated yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Connect Strava and configure your settings to get started
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="mt-2">No activities found</p>
              <p className="text-sm text-gray-400 mt-1">
                Your Strava activities will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
