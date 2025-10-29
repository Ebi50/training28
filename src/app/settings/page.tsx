'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/firestore';
import type { UserProfile, TimeSlot } from '@/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleStravaConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/strava/callback`;
    const scope = 'read,activity:read_all,profile:read_all';
    
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  const handleDisconnect = async () => {
    // TODO: Implement Strava disconnect
    console.log('Disconnect Strava');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Strava Integration */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Strava Integration</h2>
            </div>
            <div className="p-6">
              {profile?.stravaConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FC4C02">
                        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Connected to Strava</p>
                      <p className="text-sm text-gray-500">Athlete ID: {profile.stravaAthleteId || 'Unknown'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 text-sm font-medium text-red-700 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Connect Strava</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Connect your Strava account to automatically sync activities and training data
                  </p>
                  <button
                    onClick={handleStravaConnect}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="white">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                    </svg>
                    Connect with Strava
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Athlete Profile */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Athlete Profile</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <input
                    type="number"
                    value={profile?.age || ''}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input
                    type="number"
                    value={profile?.weight || ''}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">FTP (watts)</label>
                  <input
                    type="number"
                    value={profile?.ftp || ''}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="250"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">LTHR (bpm)</label>
                  <input
                    type="number"
                    value={profile?.lthr || ''}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="165"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max HR (bpm)</label>
                  <input
                    type="number"
                    value={profile?.maxHr || ''}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="190"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rest HR (bpm)</label>
                  <input
                    type="number"
                    value={profile?.restHr || ''}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="50"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>

          {/* Training Preferences */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Training Preferences</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={profile?.preferences.indoorAllowed || false}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Allow indoor training
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Time Slots */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Available Time Slots</h2>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  + Add Slot
                </button>
              </div>
            </div>
            <div className="p-6">
              {profile?.preferences.preferredTrainingTimes && profile.preferences.preferredTrainingTimes.length > 0 ? (
                <div className="space-y-3">
                  {profile.preferences.preferredTrainingTimes.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-900">{DAYS[slot.day]}</span>
                        <span className="text-gray-600">{slot.startTime} - {slot.endTime}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          slot.type === 'indoor' ? 'bg-blue-100 text-blue-800' :
                          slot.type === 'outdoor' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {slot.type}
                        </span>
                      </div>
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No time slots configured yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add your available training times to generate personalized plans</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
