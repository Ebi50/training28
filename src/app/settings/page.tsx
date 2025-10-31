'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getUserProfile } from '@/lib/firestore';
import type { UserProfile, TimeSlot } from '@/types';
import { Info, Plus, Trash2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showLthrInfo, setShowLthrInfo] = useState(false);
  
  // Separate success states
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [slotsSuccess, setSlotsSuccess] = useState(false);
  
  // Form state
  const [birthDate, setBirthDate] = useState<string>('');
  const [weight, setWeight] = useState<number>(0);
  const [ftp, setFtp] = useState<number>(0);
  const [lthr, setLthr] = useState<number>(0);
  const [maxHr, setMaxHr] = useState<number>(0);
  const [restHr, setRestHr] = useState<number>(0);
  
  // Time slots state
  const [activeTab, setActiveTab] = useState<'standard' | 'weekly'>('standard');
  const [standardSlots, setStandardSlots] = useState<TimeSlot[]>([]);
  const [weeklyOverrides, setWeeklyOverrides] = useState<Record<string, TimeSlot[]>>({});
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = this week, 1 = next week, etc.
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newSlot, setNewSlot] = useState<TimeSlot>({
    day: 1, // Monday
    startTime: '08:00',
    endTime: '09:00',
    type: 'both'
  });
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [slotToCopyIndex, setSlotToCopyIndex] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
        
        // Populate form fields
        if (userProfile) {
          setBirthDate(userProfile.birthDate || '');
          setWeight(userProfile.weight || 0);
          setFtp(userProfile.ftp || 0);
          setLthr(userProfile.lthr || 0);
          setMaxHr(userProfile.maxHr || 0);
          setRestHr(userProfile.restHr || 0);
          
          // Load standard slots
          const standard = userProfile.preferences?.preferredTrainingTimes || [];
          setStandardSlots(standard);
          setTimeSlots(standard); // Initialize with standard
          
          // Load weekly overrides
          setWeeklyOverrides(userProfile.weeklyOverrides || {});
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    setProfileSuccess(false);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        birthDate,
        weight: weight || null,
        ftp: ftp || null,
        lthr: lthr || null,
        maxHr: maxHr || null,
        restHr: restHr || null,
      });

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTimeSlots = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    setSlotsSuccess(false);

    try {
      if (activeTab === 'standard') {
        // Save as standard template
        await updateDoc(doc(db, 'users', user.uid), {
          preferences: {
            indoorAllowed: true,
            availableDevices: [],
            preferredTrainingTimes: timeSlots,
          },
        });
        setStandardSlots(timeSlots);
      } else {
        // Save as weekly override
        const weekKey = getWeekKey(currentWeekOffset);
        const newOverrides = { ...weeklyOverrides, [weekKey]: timeSlots };
        
        await updateDoc(doc(db, 'users', user.uid), {
          weeklyOverrides: newOverrides,
        });
        setWeeklyOverrides(newOverrides);
      }

      setSlotsSuccess(true);
      setTimeout(() => setSlotsSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving time slots:', error);
      alert('Failed to save time slots. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlot = () => {
    setTimeSlots([...timeSlots, newSlot]);
    setNewSlot({
      day: 1,
      startTime: '08:00',
      endTime: '09:00',
      type: 'both'
    });
  };

  const handleDeleteSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleCopySlotToDays = (index: number, targetDays: number[]) => {
    const slotToCopy = timeSlots[index];
    const newSlots = targetDays.map(day => ({
      ...slotToCopy,
      day
    }));
    setTimeSlots([...timeSlots, ...newSlots]);
  };

  const handleOpenCopyModal = (index: number) => {
    setSlotToCopyIndex(index);
    setSelectedDays([]);
    setCopyModalOpen(true);
  };

  const handleConfirmCopy = () => {
    if (slotToCopyIndex !== null && selectedDays.length > 0) {
      handleCopySlotToDays(slotToCopyIndex, selectedDays);
      setCopyModalOpen(false);
      setSlotToCopyIndex(null);
      setSelectedDays([]);
    }
  };

  const toggleDaySelection = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleCopyWeek = () => {
    // Copy all current time slots to next week (same days)
    setTimeSlots([...timeSlots, ...timeSlots]);
  };

  const getDayName = (day: number): string => {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return days[day];
  };

  // Calendar week helpers
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getWeekKey = (offset: number): string => {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (offset * 7));
    const year = targetDate.getFullYear();
    const week = getWeekNumber(targetDate);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  };

  const getWeekDateRange = (offset: number): string => {
    const today = new Date();
    const current = new Date(today);
    current.setDate(today.getDate() + (offset * 7));
    
    // Get Monday of the week
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    
    // Get Sunday
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (d: Date) => {
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    };
    
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  const getCurrentWeekInfo = (): string => {
    const weekKey = getWeekKey(currentWeekOffset);
    const dateRange = getWeekDateRange(currentWeekOffset);
    const cwNumber = weekKey.split('-W')[1];
    return `CW ${cwNumber}: ${dateRange}`;
  };

  // Load slots based on active tab and week
  useEffect(() => {
    if (activeTab === 'standard') {
      setTimeSlots(standardSlots);
    } else {
      const weekKey = getWeekKey(currentWeekOffset);
      const overrides = weeklyOverrides[weekKey];
      setTimeSlots(overrides || standardSlots); // Use overrides or fall back to standard
    }
  }, [activeTab, currentWeekOffset, standardSlots, weeklyOverrides]);

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
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      userEmail={auth.currentUser?.email || undefined}
      onSignOut={handleSignOut}
      onHelp={() => {}}
    >
      <div className="max-w-7xl mx-auto px-8 py-8 pb-20">
        <div className="space-y-6">
          {/* Athlete Profile */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Athlete Profile</h2>
            </div>
            <div className="p-6">
              {profileSuccess && (
                <div className="mb-4 bg-success-50 dark:bg-success-900/30 border border-success dark:border-success-dark text-green-700 px-4 py-3 rounded-md text-sm">
                  ✓ Profile saved successfully!
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">Geburtsdatum</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md focus:ring-red-500 focus:border-primary dark:focus:border-primary-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight || ''}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md focus:ring-red-500 focus:border-primary dark:focus:border-primary-dark"
                    placeholder="70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">FTP (watts)</label>
                  <input
                    type="number"
                    value={ftp || ''}
                    onChange={(e) => setFtp(parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md focus:ring-red-500 focus:border-primary dark:focus:border-primary-dark"
                    placeholder="250"
                  />
                </div>
                <div className="relative">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    LTHR (bpm)
                    <button
                      type="button"
                      onClick={() => setShowLthrInfo(!showLthrInfo)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      aria-label="LTHR Information"
                    >
                      <Info size={16} />
                    </button>
                  </label>
                  <input
                    type="number"
                    value={lthr || ''}
                    onChange={(e) => setLthr(parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md focus:ring-red-500 focus:border-primary dark:focus:border-primary-dark"
                    placeholder="165"
                  />
                  
                  {showLthrInfo && (
                    <div className="absolute z-10 mt-2 p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg max-w-2xl">
                      <button
                        onClick={() => setShowLthrInfo(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-text-secondary-light dark:text-text-secondary-dark"
                        aria-label="Schließen"
                      >
                        ✕
                      </button>
                      
                      <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">Was ist LTHR?</h3>
                      <p className="text-sm text-text-primary-light dark:text-text-primary-dark mb-3">
                        LTHR steht für „Lactate Threshold Heart Rate" und bezeichnet die Herzfrequenz (Puls), 
                        bei der dein Körper beginnt, Laktat schneller zu produzieren als er es abbauen kann – 
                        also die sogenannte Laktatschwelle.
                      </p>
                      
                      <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1 text-sm">Bedeutung und Praxis</h4>
                      <p className="text-sm text-text-primary-light dark:text-text-primary-dark mb-3">
                        Die Laktatschwellenherzfrequenz (LTHR) ist ein individueller Wert und wird meist durch 
                        einen intensiven Belastungstest ermittelt: Du absolvierst einen 20-minütigen maximalen 
                        Belastungstest und misst deinen durchschnittlichen Puls – 5% davon werden abgezogen, 
                        und dieser Wert entspricht dann deinem LTHR. Alternativ beziehen einige Tests die letzten 
                        20 Minuten eines 30-Minuten-All-Out-Tests ein, da der Puls mit der Belastung verzögert ansteigt.
                      </p>
                      
                      <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1 text-sm">Anwendung im Training</h4>
                      <p className="text-sm text-text-primary-light dark:text-text-primary-dark mb-3">
                        Die LTHR hilft, präzise Trainingszonen festzulegen – sowohl zum Radfahren als auch zum Laufen. 
                        Typische Trainingszonen werden als Prozentwert der LTHR berechnet und nicht aus dem Maximalpuls 
                        abgeleitet. So kannst du dein Training effektiver steuern und gezielt konditionelle Verbesserungen 
                        erzielen.
                      </p>
                      
                      <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 text-sm">Typische Zonen (Radfahren/Laufen)</h4>
                      <div className="overflow-x-auto mb-3">
                        <table className="min-w-full text-xs border-collapse border border-border-light dark:border-border-dark">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-border-light dark:border-border-dark px-2 py-1 text-left">Zone</th>
                              <th className="border border-border-light dark:border-border-dark px-2 py-1 text-left">Prozentsatz der LTHR</th>
                              <th className="border border-border-light dark:border-border-dark px-2 py-1 text-left">Beispiel Anwendung</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">1</td>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">&lt;81% (Rad), &lt;85% (Lauf)</td>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">Regeneration, Grundlagen</td>
                            </tr>
                            <tr>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">2</td>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">81-89% (Rad), 85-89% (Lauf)</td>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">Grundlagenausdauer</td>
                            </tr>
                            <tr>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">3</td>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">90-93% (Rad), 90-94% (Lauf)</td>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">Fettstoffwechsel, längere Einheiten</td>
                            </tr>
                            <tr>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">4</td>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">94-99% (Rad), 95-99% (Lauf)</td>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">Schwellenbereich, Intensive Intervalle</td>
                            </tr>
                            <tr>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">5a-c</td>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">&gt;100% LTHR</td>
                              <td className="border border-border-light dark:border-border-dark px-2 py-1">Hochintensive Belastungen</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark italic">
                        Quelle: Trainingslehre für Ausdauersportarten
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">Max HR (bpm)</label>
                  <input
                    type="number"
                    value={maxHr || ''}
                    onChange={(e) => setMaxHr(parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md focus:ring-red-500 focus:border-primary dark:focus:border-primary-dark"
                    placeholder="190"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">Resting HR (bpm)</label>
                  <input
                    type="number"
                    value={restHr || ''}
                    onChange={(e) => setRestHr(parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md focus:ring-red-500 focus:border-primary dark:focus:border-primary-dark"
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-primary dark:bg-primary-dark text-white font-medium rounded-md hover:bg-primary-700 dark:hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>

          {/* Strava Integration Section */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow">
            <div className="px-6 py-5 border-b border-border-light dark:border-border-dark">
              <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Strava Integration</h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status & Info - Takes up 2 columns */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-4 h-4 rounded-full ${profile?.stravaConnected ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-400'}`}></div>
                    <span className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {profile?.stravaConnected ? 'Verbunden' : 'Nicht verbunden'}
                    </span>
                  </div>
                  {profile?.stravaAthleteId && (
                    <div className="mb-4 p-3 bg-bg-light dark:bg-bg-dark rounded-md border border-border-light dark:border-border-dark">
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Athlete ID</p>
                      <p className="text-base font-mono text-text-primary-light dark:text-text-primary-dark">{profile.stravaAthleteId}</p>
                    </div>
                  )}
                  <p className="text-base text-text-primary-light dark:text-text-primary-dark leading-relaxed">
                    {profile?.stravaConnected 
                      ? 'Deine Strava-Aktivitäten werden automatisch synchronisiert. Du kannst jederzeit manuell synchronisieren oder die Verbindung erneuern.'
                      : 'Verbinde dein Strava-Konto, um deine Aktivitäten automatisch zu importieren und deine Trainingspläne basierend auf echten Daten zu optimieren.'}
                  </p>
                </div>

                {/* Action Buttons - Takes up 1 column */}
                <div className="lg:col-span-1 flex flex-col justify-center">
                  {profile?.stravaConnected ? (
                    <div className="space-y-3">
                      <button
                        onClick={async () => {
                          const user = auth.currentUser;
                          if (!user) return;
                          try {
                            const response = await fetch(`/api/strava/activities?userId=${user.uid}&per_page=50`);
                            if (response.ok) {
                              alert('✓ Synchronisation erfolgreich!');
                            } else {
                              alert('❌ Synchronisation fehlgeschlagen. Bitte versuche es erneut.');
                            }
                          } catch (error) {
                            console.error('Sync error:', error);
                            alert('❌ Synchronisation fehlgeschlagen.');
                          }
                        }}
                        className="w-full px-6 py-3 bg-orange dark:bg-orange-dark text-white text-base font-medium rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
                      >
                        🔄 Jetzt synchronisieren
                      </button>
                      <button
                        onClick={() => {
                          const user = auth.currentUser;
                          if (!user) return;
                          const state = Buffer.from(user.uid).toString('base64');
                          window.location.href = `https://www.strava.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI!)}&approval_prompt=force&scope=activity:read_all,activity:write&state=${state}`;
                        }}
                        className="w-full px-6 py-3 bg-coral dark:bg-coral-dark text-white text-base font-medium rounded-lg hover:bg-coral-700 dark:hover:bg-coral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 transition-all"
                      >
                        🔗 Neu verbinden
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const user = auth.currentUser;
                        if (!user) return;
                        const state = Buffer.from(user.uid).toString('base64');
                        window.location.href = `https://www.strava.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI!)}&approval_prompt=force&scope=activity:read_all,activity:write&state=${state}`;
                      }}
                      className="w-full px-8 py-4 bg-coral dark:bg-coral-dark text-white text-lg font-semibold rounded-lg hover:bg-coral-700 dark:hover:bg-coral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 transition-all shadow-md hover:shadow-lg"
                    >
                      Mit Strava verbinden
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Time Slots Section */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Training Time Slots</h2>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Wann kannst du trainieren?</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-border-light dark:border-border-dark">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('standard')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'standard'
                      ? 'border-red-600 text-blue-600'
                      : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:text-text-primary-dark hover:border-border-light dark:border-border-dark'
                  }`}
                >
                  Standard-Woche
                </button>
                <button
                  onClick={() => setActiveTab('weekly')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'weekly'
                      ? 'border-red-600 text-blue-600'
                      : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:text-text-primary-dark hover:border-border-light dark:border-border-dark'
                  }`}
                >
                  Wochen-Planung
                </button>
              </div>
            </div>

            <div className="p-6">
              {slotsSuccess && (
                <div className="mb-4 bg-success-50 dark:bg-success-900/30 border border-success dark:border-success-dark text-green-700 px-4 py-3 rounded-md text-sm">
                  ✓ {activeTab === 'standard' ? 'Standard-Woche gespeichert!' : 'Woche gespeichert!'}
                </div>
              )}

              {/* Week Navigation (only in weekly mode) */}
              {activeTab === 'weekly' && (
                <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <button
                    onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
                    className="p-2 hover:bg-blue-100 rounded-md transition-colors"
                    aria-label="Vorherige Woche"
                  >
                    <ChevronLeft size={20} className="text-blue-600" />
                  </button>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-blue-900">{getCurrentWeekInfo()}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {currentWeekOffset === 0 ? 'Diese Woche' : currentWeekOffset > 0 ? `+${currentWeekOffset} Woche${currentWeekOffset > 1 ? 'n' : ''}` : `${currentWeekOffset} Woche${currentWeekOffset < -1 ? 'n' : ''}`}
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                    className="p-2 hover:bg-blue-100 rounded-md transition-colors"
                    aria-label="Nächste Woche"
                  >
                    <ChevronRight size={20} className="text-blue-600" />
                  </button>
                </div>
              )}
              
              {/* Add New Slot Form */}
              <div className="mb-6 p-4 bg-bg-light dark:bg-bg-dark rounded-lg border border-border-light dark:border-border-dark">
                <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">Neuen Zeitslot hinzufügen</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Tag</label>
                    <select
                      value={newSlot.day}
                      onChange={(e) => setNewSlot({...newSlot, day: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-md focus:ring-red-500 focus:border-primary dark:focus:border-primary-dark"
                    >
                      <option value={1}>Montag</option>
                      <option value={2}>Dienstag</option>
                      <option value={3}>Mittwoch</option>
                      <option value={4}>Donnerstag</option>
                      <option value={5}>Freitag</option>
                      <option value={6}>Samstag</option>
                      <option value={0}>Sonntag</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Von</label>
                    <input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-md focus:ring-red-500 focus:border-primary dark:focus:border-primary-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Bis</label>
                    <input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-md focus:ring-red-500 focus:border-primary dark:focus:border-primary-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary-light dark:text-text-primary-dark mb-1">Typ</label>
                    <select
                      value={newSlot.type}
                      onChange={(e) => setNewSlot({...newSlot, type: e.target.value as 'indoor' | 'outdoor' | 'both'})}
                      className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-md focus:ring-red-500 focus:border-primary dark:focus:border-primary-dark"
                    >
                      <option value="both">Indoor & Outdoor</option>
                      <option value="indoor">Nur Indoor</option>
                      <option value="outdoor">Nur Outdoor</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAddSlot}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary dark:bg-primary-dark text-white text-sm font-medium rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Plus size={16} />
                  Zeitslot hinzufügen
                </button>
              </div>

              {/* Time Slots List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">Deine Zeitslots</h3>
                  {timeSlots.length > 0 && (
                    <button
                      onClick={handleCopyWeek}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      <Copy size={14} />
                      Woche duplizieren
                    </button>
                  )}
                </div>
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark italic">Noch keine Zeitslots hinzugefügt.</p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {/* Group slots by day (Monday to Sunday) */}
                    {[1, 2, 3, 4, 5, 6, 0].map(dayNum => {
                      const slotsForDay = timeSlots
                        .map((slot, index) => ({ slot, originalIndex: index }))
                        .filter(({ slot }) => slot.day === dayNum)
                        .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
                      
                      if (slotsForDay.length === 0) return null;
                      
                      return (
                        <div key={dayNum} className="border-l-4 border-blue-500 pl-3">
                          <h4 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">{getDayName(dayNum)}</h4>
                          <div className="space-y-2">
                            {slotsForDay.map(({ slot, originalIndex }) => (
                              <div
                                key={originalIndex}
                                className="flex items-center justify-between p-2 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md hover:border-border-light dark:border-border-dark"
                              >
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-text-primary-light dark:text-text-primary-dark font-medium">{slot.startTime} - {slot.endTime}</span>
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {slot.type === 'both' ? 'Indoor & Outdoor' : slot.type === 'indoor' ? 'Indoor' : 'Outdoor'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenCopyModal(originalIndex)}
                                    className="text-blue-600 hover:text-blue-700 p-1"
                                    aria-label="Zeitslot kopieren"
                                  >
                                    <Copy size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSlot(originalIndex)}
                                    className="text-red-600 hover:text-red-700 p-1"
                                    aria-label="Zeitslot löschen"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Save Time Slots Button */}
              <div className="mt-6">
                <button
                  onClick={handleSaveTimeSlots}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-primary dark:bg-primary-dark text-white font-medium rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Time Slots'}
                </button>
              </div>
            </div>
          </div>

          {/* Copy Modal */}
          {copyModalOpen && slotToCopyIndex !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                  Zeitslot kopieren nach:
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                  {getDayName(timeSlots[slotToCopyIndex].day)} {timeSlots[slotToCopyIndex].startTime} - {timeSlots[slotToCopyIndex].endTime}
                </p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {[1, 2, 3, 4, 5, 6, 0].map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDaySelection(day)}
                      disabled={timeSlots[slotToCopyIndex].day === day}
                      className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                        selectedDays.includes(day)
                          ? 'bg-primary dark:bg-primary-dark text-white border-red-600'
                          : timeSlots[slotToCopyIndex].day === day
                          ? 'bg-gray-100 text-gray-400 border-border-light dark:border-border-dark cursor-not-allowed'
                          : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border-border-light dark:border-border-dark hover:border-blue-500'
                      }`}
                    >
                      {getDayName(day)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCopyModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-text-primary-light dark:text-text-primary-dark rounded-md hover:bg-gray-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleConfirmCopy}
                    disabled={selectedDays.length === 0}
                    className="flex-1 px-4 py-2 bg-primary dark:bg-primary-dark text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Kopieren
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

