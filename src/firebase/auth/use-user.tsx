
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';

// تم تحديث الأدوار لتتوافق مع متطلبات النظام المتقدم
export type UserRole = 'super_admin' | 'center_admin' | 'therapist' | 'parent';

export interface UserProfile {
  uid: string;
  role: UserRole;
  displayName?: string;
  email: string;
  centerId: string;
  linkedEntityId?: string;
}

/**
 * هوك مخصص لإدارة حالة المستخدم وصلاحياته
 * في بيئة الإنتاج، يجب التأكد من أن حقل role يأتي من Firestore
 * ولا يمكن تعديله من قبل المستخدم في localStorage
 */
export function useUser() {
  const auth = useAuth();
  const db = useFirestore();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التحقق من الجلسة التجريبية (لأغراض العرض)
    const mockSession = typeof window !== 'undefined' ? localStorage.getItem('tamaanina_mock_user') : null;
    
    if (mockSession) {
      try {
        const mockUser = JSON.parse(mockSession);
        setUser(mockUser);
        setProfile({
          uid: mockUser.uid,
          role: mockUser.role as UserRole,
          displayName: mockUser.displayName,
          email: mockUser.email,
          centerId: mockUser.centerId || (mockUser.role === 'super_admin' ? 'global' : 'demo-center-1'), 
          linkedEntityId: mockUser.linkedEntityId
        });
        setLoading(false);
        return;
      } catch (e) {
        console.error("Error parsing mock session");
      }
    }

    // الربط مع Firebase Auth الحقيقي (لبيئة الإنتاج)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // جلب البروفايل من Firestore لضمان الأمان وعدم تزوير الأدوار
          const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  return { user, profile, role: profile?.role, centerId: profile?.centerId, loading };
}
