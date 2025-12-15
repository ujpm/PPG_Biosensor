import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface HistoryItem {
  id: string;
  bpm: number;
  hrv: number;
  timestamp: any; // Firestore Timestamp
  aiStatus?: string;
  dateStr: string;
}

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for Auth to initialize
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(
            collection(db, "users", user.uid, "measurements"),
            orderBy("timestamp", "desc"),
            limit(20) // Get last 20 scans
          );

          const snapshot = await getDocs(q);
          const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              bpm: d.bpm,
              hrv: d.hrv,
              timestamp: d.timestamp,
              aiStatus: d.aiStatus || 'NORMAL',
              dateStr: d.timestamp ? new Date(d.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'
            } as HistoryItem;
          });

          setHistory(data);
        } catch (error) {
          console.error("Error fetching history:", error);
        }
      } else {
        setHistory([]); // Clear data if logged out
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { history, loading };
};