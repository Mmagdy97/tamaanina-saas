
'use client';

import { StatsCards } from "@/components/dashboard/stats-cards";
import { GrowthChart } from "@/components/dashboard/growth-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles, Calendar, ArrowLeft, Bell, CalendarDays, Plus, Baby, UserCheck, AlertCircle, MessageSquare } from "lucide-react";
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, limit, doc } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const { profile, loading } = useUser();
  const router = useRouter();
  const db = useFirestore();

  const isAdmin = profile?.role === 'Admin';
  const isTherapist = profile?.role === 'Therapist';
  const isParent = profile?.role === 'Parent';

  // Load today's sessions
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessionsQuery = useMemoFirebase(() => {
    if (!db || isParent) return null;
    return query(
      collection(db, "sessions"), 
      where("date", "==", todayStr),
      orderBy("time", "asc"),
      limit(10)
    );
  }, [db, todayStr, isParent]);
  const { data: todaySessions } = useCollection(todaySessionsQuery);

  // Parent Specific: Child doc
  const childDocRef = useMemoFirebase(() => {
    if (!db || !isParent || !profile?.linkedEntityId) return null;
    return doc(db, "children", profile.linkedEntityId);
  }, [db, isParent, profile?.linkedEntityId]);
  const { data: childData } = useDoc(childDocRef);

  const handleSupportContact = () => {
    const whatsappLink = `https://wa.me/201005592947?text=${encodeURIComponent('مرحباً فريق دعم طمأنينة، أحتاج للمساعدة بخصوص مركزي.')}`;
    window.open(whatsappLink, '_blank');
  };

  if (loading) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000" dir="rtl">
      {/* Welcome Section with Ambient Glow */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[80px] -ml-20 -mb-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <Badge className="bg-white/10 text-white border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              {isAdmin ? 'الإدارة العليا' : isTherapist ? 'القسم السريري' : 'بوابة الوالدين'}
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold font-headline leading-[1.1]">
               {isAdmin ? 'نظرة شاملة على المركز' : isTherapist ? 'متابعة الحالات العلاجية' : `رحلة ${childData?.fullName || 'طفلك'}`}
            </h1>
            <p className="text-slate-300 max-w-2xl text-lg font-medium leading-relaxed">
              هنا تجتمع الرعاية الحانية مع البيانات الذكية لتوفير أفضل بيئة نمو للأطفال.
            </p>
          </div>
          <div className="flex gap-4">
            {!isParent && (
              <Button size="lg" className="rounded-2xl h-14 px-8 bg-white text-slate-900 hover:bg-slate-100 font-bold gap-2 shadow-2xl" onClick={() => router.push('/dashboard/sessions')}>
                <Plus className="h-5 w-5" /> حجز جلسة
              </Button>
            )}
            <Button size="lg" variant="outline" className="rounded-2xl h-14 px-8 bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold" onClick={() => router.push('/dashboard/reports')}>
              آخر التقارير
            </Button>
          </div>
        </div>
      </div>

      {(isAdmin || isTherapist) && <StatsCards />}

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-10">
          {!isParent && (
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden">
              <CardHeader className="p-10 border-b bg-slate-50/30 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold font-headline flex items-center gap-3">
                    <Calendar className="h-7 w-7 text-primary" /> جدول جلسات اليوم
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">المواعيد النشطة والمجدولة لليوم {todayStr}</CardDescription>
                </div>
                <Button variant="ghost" className="rounded-xl h-11 gap-2 text-primary font-bold hover:bg-primary/5" onClick={() => router.push('/dashboard/sessions')}>
                   عرض الجدول الكامل <ArrowLeft className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {todaySessions?.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-8 group hover:bg-slate-50/80 transition-all cursor-pointer" onClick={() => router.push(`/dashboard/sessions/${session.id}`)}>
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-primary/10 rounded-2xl text-primary font-bold text-lg min-w-[80px] text-center group-hover:scale-105 transition-transform">
                          {session.time}
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-slate-800 leading-tight">جلسة {session.type}</p>
                          <div className="flex items-center gap-2 text-slate-400 font-medium text-xs">
                             <Baby className="h-3.5 w-3.5" /> <span>اضغط لعرض ملف الطفل</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={`rounded-xl px-5 py-2 font-bold text-sm ${
                        session.status === 'مجدولة' ? 'bg-blue-50 text-blue-600 border-none' :
                        session.status === 'مكتملة' ? 'bg-emerald-50 text-emerald-600 border-none' : 'bg-rose-50 text-rose-600 border-none'
                      }`}>
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                  {!todaySessions?.length && (
                    <div className="text-center py-20 space-y-4">
                      <div className="bg-slate-50 p-6 rounded-full w-fit mx-auto">
                        <CalendarDays className="h-12 w-12 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-medium italic">لا توجد جلسات مجدولة لهذا اليوم.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isParent && childData && (
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-primary/20 bg-primary text-white p-10 relative overflow-hidden group">
                <Sparkles className="h-48 w-48 absolute -bottom-10 -left-10 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest opacity-80">
                    <Clock className="h-5 w-5" /> رصيد الجلسات المتبقي
                  </div>
                  <div className="space-y-1">
                    <p className="text-6xl font-bold">{childData.remainingSessions} <span className="text-xl opacity-60 font-headline">جلسة</span></p>
                    <p className="text-sm opacity-70">من إجمالي {childData.sessionsPurchased} جلسة في باقتكم</p>
                  </div>
                  <div className="space-y-2">
                    <Progress value={(childData.sessionsCompleted / (childData.sessionsPurchased || 1)) * 100} className="h-3 bg-white/20" />
                    <div className="flex justify-between text-[10px] font-bold opacity-60">
                      <span>{childData.sessionsCompleted} مكتملة</span>
                      <span>{childData.remainingSessions} متبقية</span>
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full font-bold h-14 rounded-2xl shadow-xl shadow-black/10" onClick={() => router.push(`/dashboard/children/${childData.id}`)}>
                    تفاصيل الاشتراك والفوترة
                  </Button>
                </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 bg-white p-10 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-accent/10 rounded-2xl text-accent">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 font-headline">الجلسة القادمة</h3>
                      <p className="text-xs text-slate-400">يسعدنا استقبالكم في الموعد</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl text-center space-y-1 border border-slate-100">
                    <p className="text-2xl font-bold text-slate-800">{childData.nextSessionDate || "سيتم التنسيق قريباً"}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">الموعد المحدد</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-14 rounded-2xl font-bold mt-6 border-slate-100" onClick={() => router.push('/dashboard/sessions')}>
                  جدولي الزمني
                </Button>
              </Card>
            </div>
          )}

          <GrowthChart />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-10">
          {isAdmin && (
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 bg-white p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 font-headline flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-rose-500" /> مستحقات معلقة
                </h3>
              </div>
              <div className="space-y-4">
                <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100/50 group hover:bg-rose-100 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/billing')}>
                   <div className="flex justify-between items-center mb-1">
                     <span className="font-bold text-slate-800">مراجعة الفواتير</span>
                     <ArrowLeft className="h-4 w-4 text-rose-500 group-hover:-translate-x-1 transition-transform" />
                   </div>
                   <p className="text-xs text-rose-600 font-medium">يوجد حالات لم يتم تسوية رصيدها بالكامل.</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 bg-white p-8">
            <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold font-headline flex items-center gap-3">
                <Bell className="h-6 w-6 text-accent" /> التنبيهات
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
               <div className="p-5 bg-slate-50 rounded-2xl border-r-4 border-r-primary group hover:bg-slate-100 transition-colors">
                 <p className="text-sm font-bold text-slate-800 leading-snug">تم تحديث الخطة العلاجية للأسبوع الحالي</p>
                 <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">منذ ساعتين</p>
               </div>
               <div className="p-5 bg-slate-50 rounded-2xl border-r-4 border-r-accent group hover:bg-slate-100 transition-colors">
                 <p className="text-sm font-bold text-slate-800 leading-snug">تقرير تقييم جديد متاح للمراجعة</p>
                 <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">منذ يوم واحد</p>
               </div>
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 bg-primary/5 p-8 border border-primary/10">
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-white rounded-2xl shadow-xl">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 font-headline">دعم طمأنينة</h4>
                <p className="text-xs text-slate-500 leading-relaxed">فريقنا متاح دائماً عبر واتساب لمساعدتك في إعداد النظام أو الاستفسار عن الاشتراكات.</p>
                <Button className="w-full rounded-xl bg-primary text-white font-bold h-11 gap-2" onClick={handleSupportContact}>
                  <MessageSquare className="h-4 w-4" /> تواصل مع الدعم الفني
                </Button>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
