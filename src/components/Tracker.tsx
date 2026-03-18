import React, { useEffect, useState, useRef } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import { format, subDays } from 'date-fns';
import { Heatmap } from './Heatmap';
import { Pause, Loader2 } from 'lucide-react';

// Helper to hash email for privacy in Firestore paths
async function hashEmail(email: string) {
  const msgUint8 = new TextEncoder().encode(email.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface TrackerProps {
  email: string;
}

export function Tracker({ email }: TrackerProps) {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(true);
  const [todayDuration, setTodayDuration] = useState(0);
  const [hashedId, setHashedId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const todayString = format(new Date(), 'yyyy-MM-dd');

  // Hash the email
  useEffect(() => {
    hashEmail(email).then(setHashedId);
  }, [email]);

  // Load data from Firestore once hashed ID is ready
  useEffect(() => {
    if (!hashedId) return;

    const oneYearAgo = format(subDays(new Date(), 365), 'yyyy-MM-dd');
    const statsRef = collection(db, `users/${hashedId}/dailyStats`);
    const q = query(statsRef, where('date', '>=', oneYearAgo));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newData: Record<string, number> = {};
      snapshot.forEach((doc) => {
        const docData = doc.data();
        newData[docData.date] = docData.durationMinutes || 0;
        if (docData.date === todayString) {
          setTodayDuration(docData.durationMinutes || 0);
        }
      });
      setData(newData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hashedId, todayString]);

  // Timer logic
  useEffect(() => {
    if (!hashedId || !isTracking || loading) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const updateDuration = async () => {
      try {
        const docRef = doc(db, `users/${hashedId}/dailyStats`, todayString);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          await updateDoc(docRef, {
            durationMinutes: increment(1),
            lastActive: serverTimestamp()
          });
        } else {
          await setDoc(docRef, {
            date: todayString,
            durationMinutes: 1,
            lastActive: serverTimestamp()
          });
        }
      } catch (error) {
        console.error("Error updating duration:", error);
      }
    };

    // Update every 1 minute (60000 ms)
    timerRef.current = setInterval(updateDuration, 60000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hashedId, isTracking, loading, todayString]);

  // Handle visibility change to pause tracking when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTracking(false);
      } else {
        setIsTracking(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full bg-transparent p-2">
      <div className="flex items-center justify-between w-full mb-6">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">我的学习轨迹</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {isTracking ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                记录中
              </span>
            ) : (
              <span className="flex items-center gap-1 text-zinc-400">
                <Pause className="w-3 h-3" /> 已暂停
              </span>
            )}
          </div>
          <div className="text-sm font-medium bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
            今日: {todayDuration} 分钟
          </div>
        </div>
      </div>
      
      <Heatmap data={data} />
    </div>
  );
}
