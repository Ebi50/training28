import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface UseAutoLogoutOptions {
  timeoutMinutes: number; // 0 = nie, 5, 10, etc.
  onLogout?: () => void;
}

export function useAutoLogout({ timeoutMinutes, onLogout }: UseAutoLogoutOptions) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      if (onLogout) {
        onLogout();
      }
      router.push('/login?timeout=true');
    } catch (error) {
      console.error('Auto-logout error:', error);
    }
  }, [router, onLogout]);

  const resetTimer = useCallback(() => {
    // Wenn timeout auf 0 (nie), dann kein Timer
    if (timeoutMinutes === 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timer
    const timeoutMs = timeoutMinutes * 60 * 1000;
    lastActivityRef.current = Date.now();
    
    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  }, [timeoutMinutes, logout]);

  useEffect(() => {
    // Events die Aktivität signalisieren
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    // Initial timer setzen
    resetTimer();

    // Event listeners hinzufügen
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);

  return { resetTimer };
}
