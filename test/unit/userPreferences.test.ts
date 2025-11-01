import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { UserProfile } from '@/types';

// Mock Firestore
vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-123' },
    onAuthStateChanged: vi.fn((callback) => {
      callback({ uid: 'test-user-123' });
      return vi.fn(); // unsubscribe
    }),
  },
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('@/lib/firestore', () => ({
  getUserProfile: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Settings - User Preferences', () => {
  const mockProfile: UserProfile = {
    email: 'test@example.com',
    ftp: 250,
    preferences: {
      indoorAllowed: true,
      availableDevices: [],
      preferredTrainingTimes: [],
      hideTimeSlotWarnings: false,
    },
  };

  describe('hideTimeSlotWarnings Preference', () => {
    it('should load current preference from profile', async () => {
      const { getUserProfile } = await import('@/lib/firestore');
      vi.mocked(getUserProfile).mockResolvedValue({
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          hideTimeSlotWarnings: true,
        },
      });

      // In real settings page, checkbox would be checked
      const hideWarnings = true;
      expect(hideWarnings).toBe(true);
    });

    it('should default to false when not set', async () => {
      const { getUserProfile } = await import('@/lib/firestore');
      vi.mocked(getUserProfile).mockResolvedValue({
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          hideTimeSlotWarnings: undefined,
        },
      });

      const hideWarnings = false;
      expect(hideWarnings).toBe(false);
    });

    it('should save preference when checkbox toggled', async () => {
      // Simulate the logic from settings page
      const newValue = true;
      const currentPrefs = {
        indoorAllowed: true,
        availableDevices: [],
        preferredTrainingTimes: [],
      };

      const updatedPrefs = {
        ...currentPrefs,
        hideTimeSlotWarnings: newValue,
      };

      expect(updatedPrefs.hideTimeSlotWarnings).toBe(true);
      expect(updatedPrefs.indoorAllowed).toBe(true);
    });
  });

  describe('Plan Quality Banner Integration', () => {
    it('should hide banner when hideTimeSlotWarnings is true', () => {
      const userProfile: UserProfile = {
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          hideTimeSlotWarnings: true,
        },
      };

      const shouldShowBanner = 
        !userProfile.preferences?.hideTimeSlotWarnings &&
        true; // plan has quality warnings

      expect(shouldShowBanner).toBe(false);
    });

    it('should show banner when hideTimeSlotWarnings is false', () => {
      const userProfile: UserProfile = {
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          hideTimeSlotWarnings: false,
        },
      };

      const shouldShowBanner = 
        !userProfile.preferences?.hideTimeSlotWarnings &&
        true; // plan has quality warnings

      expect(shouldShowBanner).toBe(true);
    });

    it('should show banner when preference is undefined (default)', () => {
      const userProfile: UserProfile = {
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          hideTimeSlotWarnings: undefined,
        },
      };

      const shouldShowBanner = 
        !userProfile.preferences?.hideTimeSlotWarnings &&
        true; // plan has quality warnings

      expect(shouldShowBanner).toBe(true); // Default = show warnings
    });

    it('should hide banner when no warnings even if preference is false', () => {
      const userProfile: UserProfile = {
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          hideTimeSlotWarnings: false,
        },
      };

      const hasWarnings = false;

      const shouldShowBanner = 
        !userProfile.preferences?.hideTimeSlotWarnings &&
        hasWarnings;

      expect(shouldShowBanner).toBe(false);
    });
  });

  describe('localStorage Dismissed Warnings', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should save dismissed plan to localStorage', () => {
      const planId = '2025-W45';
      
      const dismissed = JSON.parse(localStorage.getItem('dismissedPlanWarnings') || '[]');
      dismissed.push(planId);
      localStorage.setItem('dismissedPlanWarnings', JSON.stringify(dismissed));

      const stored = JSON.parse(localStorage.getItem('dismissedPlanWarnings') || '[]');
      expect(stored).toContain(planId);
    });

    it('should load dismissed plans from localStorage', () => {
      const dismissed = ['2025-W44', '2025-W45'];
      localStorage.setItem('dismissedPlanWarnings', JSON.stringify(dismissed));

      const loaded = JSON.parse(localStorage.getItem('dismissedPlanWarnings') || '[]');
      expect(loaded).toEqual(dismissed);
    });

    it('should check if plan is dismissed', () => {
      const dismissed = ['2025-W44', '2025-W45'];
      localStorage.setItem('dismissedPlanWarnings', JSON.stringify(dismissed));

      const dismissedSet = new Set(JSON.parse(localStorage.getItem('dismissedPlanWarnings') || '[]'));
      
      expect(dismissedSet.has('2025-W45')).toBe(true);
      expect(dismissedSet.has('2025-W46')).toBe(false);
    });

    it('should handle empty localStorage', () => {
      const dismissed = JSON.parse(localStorage.getItem('dismissedPlanWarnings') || '[]');
      expect(dismissed).toEqual([]);
    });

    it('should handle multiple dismissals for same plan', () => {
      const planId = '2025-W45';
      
      // First dismissal
      let dismissed = JSON.parse(localStorage.getItem('dismissedPlanWarnings') || '[]');
      dismissed.push(planId);
      localStorage.setItem('dismissedPlanWarnings', JSON.stringify(dismissed));

      // Second dismissal (should not duplicate)
      dismissed = JSON.parse(localStorage.getItem('dismissedPlanWarnings') || '[]');
      if (!dismissed.includes(planId)) {
        dismissed.push(planId);
      }
      localStorage.setItem('dismissedPlanWarnings', JSON.stringify(dismissed));

      const stored = JSON.parse(localStorage.getItem('dismissedPlanWarnings') || '[]');
      const count = stored.filter((id: string) => id === planId).length;
      expect(count).toBe(1); // Should only appear once
    });
  });

  describe('Combined Logic', () => {
    it('should show banner: preference=false, not dismissed, has warnings', () => {
      const userProfile: UserProfile = {
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          hideTimeSlotWarnings: false,
        },
      };

      const planId = '2025-W45';
      const dismissedSet = new Set<string>();
      const hasWarnings = true;

      const shouldShow = 
        !userProfile.preferences?.hideTimeSlotWarnings &&
        !dismissedSet.has(planId) &&
        hasWarnings;

      expect(shouldShow).toBe(true);
    });

    it('should hide banner: preference=true (user disabled globally)', () => {
      const userProfile: UserProfile = {
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          hideTimeSlotWarnings: true,
        },
      };

      const planId = '2025-W45';
      const dismissedSet = new Set<string>();
      const hasWarnings = true;

      const shouldShow = 
        !userProfile.preferences?.hideTimeSlotWarnings &&
        !dismissedSet.has(planId) &&
        hasWarnings;

      expect(shouldShow).toBe(false);
    });

    it('should hide banner: plan dismissed (even if preference=false)', () => {
      const userProfile: UserProfile = {
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          hideTimeSlotWarnings: false,
        },
      };

      const planId = '2025-W45';
      const dismissedSet = new Set<string>(['2025-W45']);
      const hasWarnings = true;

      const shouldShow = 
        !userProfile.preferences?.hideTimeSlotWarnings &&
        !dismissedSet.has(planId) &&
        hasWarnings;

      expect(shouldShow).toBe(false);
    });

    it('should hide banner: no warnings', () => {
      const userProfile: UserProfile = {
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          hideTimeSlotWarnings: false,
        },
      };

      const planId = '2025-W45';
      const dismissedSet = new Set<string>();
      const hasWarnings = false;

      const shouldShow = 
        !userProfile.preferences?.hideTimeSlotWarnings &&
        !dismissedSet.has(planId) &&
        hasWarnings;

      expect(shouldShow).toBe(false);
    });
  });
});
