import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import type { Vitals, AIHealthAnalysis } from '../types/biosensor';

export const useFirestore = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveSession = async (vitals: Vitals, aiReport: AIHealthAnalysis | null) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const user = auth.currentUser;
      
      if (!user) {
        // Handle "Guest" mode or redirect to login
        throw new Error("GUEST_MODE");
      }

      // Save to: users/{uid}/measurements
      // This structure allows you to use Firestore Security Rules to protect data
      await addDoc(collection(db, "users", user.uid, "measurements"), {
        bpm: vitals.bpm,
        hrv: vitals.hrv,
        breathingRate: vitals.breathingRate,
        confidence: vitals.confidence,
        
        // Save AI insights if they exist
        aiSummary: aiReport?.summary || null,
        aiStatus: aiReport?.status || null,
        
        // Metadata
        timestamp: serverTimestamp(),
        device: navigator.userAgent
      });

      return true; // Success
    } catch (err: any) {
      console.error("Save failed:", err);
      if (err.message === "GUEST_MODE") {
        setSaveError("Please login to save your history.");
      } else {
        setSaveError("Cloud Sync Failed. Data saved locally.");
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveSession, isSaving, saveError };
};