'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { DashboardNav } from "@/components/dashboard/nav";
import { Loader2, Heart, Bell, Search, UserCircle, AlertTriangle, CreditCard, LogOut, Sparkles, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doc } from "firebase/firestore";
import { differenceInDays, parseISO } from "date-fns";

/**
 * إعدادات حماية المسارات بناءً على الأدوار
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'super_admin': ['/dashboard/super-admin'],
  'center_admin': ['/dashboard/settings', '/dashboard/billing', '/dashboard/activity-logs', '/dashboard/therapists'],
  'therapist': ['/dashboard/children', '/dashboard/sessions', '/dashboard/attendance', '/dashboard/activities', '/dashboard/reports', '/dashboard/ai-tool'],
  'parent': ['/dashboard/children', '/dashboard/sessions', '/dashboard/activities', '/dashboard/reports'],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading: userLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  // جلب بيانات المركز للتحقق من الفترة التجريبية (للمديرين فقط)
  const centerRef = useMemo(() => 
    db && profile?.centerId && profile.centerId !== 'global' 
      ? doc(db, "centers", profile.centerId) 
      : null, 
  [db, profile?.centerId]);
  
  const { data: center, loading: centerLoading } = useDoc(centerRef);

  useEffect(() => {
    setMounted(true);
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // منطق حماية المسارات (Authorization Guard)
  const isAuthorized = useMemo(() => {
    if (!profile || !mounted) return true; // الانتظار حتى التحميل
    
    // مدير المنصة لديه وصول لكل شيء
    if (profile.role === 'super_admin') return true;

    // حماية صارمة لمسار super-admin
    if (pathname.startsWith('/dashboard/super-admin') && profile.role !== 'super_admin') {
      return false;
    }

    // منع الوصول للمسارات الإدارية للمركز إلا لمدير المركز أو مدير المنصة
    const adminRoutes = ROLE_PERMISSIONS['center_admin'];
    if (adminRoutes.some(route => pathname.startsWith(route)) && profile.role !== 'center_admin') {
      return false;
    }

    return true;
  }, [profile, pathname, mounted]);

  const trialInfo = useMemo(() => {
    if (!mounted || !center) return { isTrial: false, daysRemaining: 0, isExpired: false };
    
    const isTrial = center.subscriptionStatus === 'Trial';
    const trialEndDate = center.trialEndDate ? parseISO(center.trialEndDate) : null;
    const daysRemaining = trialEndDate ? differenceInDays(trialEndDate, new Date()) : 0;
    const isExpired = isTrial && daysRemaining < 0;
    
    return { isTrial, daysRemaining, isExpired };
  }, [mounted, center]);

  if (userLoading || (profile?.role === 'center_admin' && centerLoading) || !mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-6">
          <div className="relative inline-flex">
            <Loader2 className="h-20 w-20 animate-spin text-primary/10" />
            <Heart className="h-10 w-10 text-primary absolute inset-0 m-auto animate-pulse" fill="currentColor" />
          </div>
          <p className="text-slate-400 font-headline text-2xl animate-pulse">جاري التحقق من الهوية...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // واجهة "ليس لديك صلاحية"
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
           <div className="p-6 bg-rose-100 rounded-full w-fit mx-auto border-4 border-white shadow-xl">
             <ShieldAlert className="h-16 w-16 text-rose-600" />
           </div>
           <div className="space-y-3">
             <h1 className="text-3xl font-bold font-headline text-slate-900">عذراً، لا تمتلك الصلاحية</h1>
             <p className="text-slate-500 leading-relaxed">هذه الصفحة مخصصة لـ {pathname.includes('super-admin') ? 'مدير المنصة' : 'أدوار محددة'} فقط. يرجى التواصل مع المدير المسؤول إذا كنت تعتقد أن هذا خطأ.</p>
           </div>
           <Button className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20" onClick={() => router.push('/dashboard')}>
             العودة للرئيسية
           </Button>
        </div>
      </div>
    );
  }

  // معالجة انتهاء الفترة التجريبية
  if (trialInfo.isExpired && profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white" dir="rtl">
        <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-700">
          <div className="p-6 bg-rose-500/10 rounded-full w-fit mx-auto border border-rose-500/20">
            <AlertTriangle className="h-16 w-16 text-rose-500" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold font-headline">انتهت الفترة التجريبية</h1>
            <p className="text-slate-400 leading-relaxed">لقد استمتعت بـ 14 يوماً من ميزات طمأنينة. للاستمرار في تقديم الرعاية لأطفالك، يرجى تفعيل اشتراكك الآن.</p>
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
             <div className="flex justify-between items-center text-sm">
               <span className="text-slate-400">الباقة المختارة:</span>
               <span className="font-bold">{center?.plan}</span>
             </div>
             <Button className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-bold gap-2 text-lg" onClick={() => router.push('/dashboard/billing')}>
               <CreditCard className="h-5 w-5" /> تفعيل الاشتراك الآن
             </Button>
          </div>
          <Button variant="ghost" className="text-slate-500 hover:text-white" onClick={() => {
             localStorage.removeItem('tamaanina_mock_user');
             router.push('/login');
          }}>
            <LogOut className="h-4 w-4 ml-2" /> تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  const getRoleLabel = (role?: string) => {
    switch(role) {
      case 'super_admin': return 'مدير المنصة';
      case 'center_admin': return 'مدير المركز';
      case 'therapist': return 'الأخصائي';
      case 'parent': return 'ولي الأمر';
      default: return 'مستخدم';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/30" dir="rtl">
      {/* Sidebar */}
      <aside className="fixed right-0 top-0 z-40 hidden h-screen w-80 border-l bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-24 items-center px-10">
            <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => router.push('/dashboard')}>
              <div className="p-3 bg-primary rounded-[1.25rem] shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                <Heart className="h-7 w-7 text-white" fill="white" />
              </div>
              <h1 className="text-3xl font-bold font-headline text-slate-800 tracking-tighter">طمأنينة</h1>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            <DashboardNav role={profile?.role} />
          </div>

          <div className="p-8">
            <div className="rounded-[1.5rem] bg-slate-50 p-5 border border-slate-100 flex items-center gap-4 hover:border-primary/20 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {profile?.displayName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate leading-none mb-1.5">{profile?.displayName || 'مستخدم'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {getRoleLabel(profile?.role)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:mr-80 min-h-screen">
        <header className="sticky top-0 z-30 flex h-24 items-center justify-between border-b bg-white/80 px-10 backdrop-blur-xl">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-2xl font-headline font-bold text-slate-900 leading-none">
              أهلاً بك، {profile?.displayName?.split(' ')[0] || 'مستخدم'} 👋
            </h2>
            <p className="text-xs text-slate-400 font-medium">بوابة الوصول الآمن لبيانات الرعاية الصحية</p>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="rounded-xl h-11 w-11 bg-slate-50 hover:bg-slate-100 relative">
               <Bell className="h-5 w-5 text-slate-500" />
               <span className="absolute top-3 right-3 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
             </Button>
             <Button variant="ghost" size="icon" className="rounded-xl h-11 w-11 bg-slate-50 hover:bg-slate-100">
               <UserCircle className="h-5 w-5 text-slate-500" />
             </Button>
          </div>
        </header>
        
        <div className="p-10 max-w-7xl mx-auto space-y-10 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}
