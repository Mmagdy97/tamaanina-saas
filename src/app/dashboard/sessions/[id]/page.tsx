
"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc, updateDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  User, 
  Baby, 
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Loader2,
  Edit,
  Save,
  UserCheck,
  UserMinus,
  Clock9,
  UserX,
  FileClock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function SessionDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { profile } = useUser();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const isParent = profile?.role === 'Parent';

  const sessionRef = useMemo(() => db && id ? doc(db, "sessions", id as string) : null, [db, id]);
  const { data: session, loading: sessionLoading } = useDoc(sessionRef);

  const childRef = useMemo(() => db && session?.childId ? doc(db, "children", session.childId) : null, [db, session?.childId]);
  const therapistRef = useMemo(() => db && session?.therapistId ? doc(db, "therapists", session.therapistId) : null, [db, session?.therapistId]);
  
  const { data: child } = useDoc(childRef);
  const { data: therapist } = useDoc(therapistRef);

  // Sync notes when loaded
  useMemo(() => {
    if (session?.notes) setNotes(session.notes);
  }, [session?.notes]);

  const updateSessionStatus = async (newStatus: string) => {
    if (!db || !sessionRef || !session || !childRef) return;

    try {
      await runTransaction(db, async (transaction) => {
        const currentSessionSnap = await transaction.get(sessionRef);
        const childSnap = await transaction.get(childRef);

        if (!currentSessionSnap.exists() || !childSnap.exists()) {
          throw new Error("سجل الجلسة أو الطفل غير موجود");
        }

        const oldStatus = currentSessionSnap.data().status;
        const childData = childSnap.data();

        // 1. Update Session Status
        transaction.update(sessionRef, { status: newStatus });

        // 2. Logic for session increment/decrement on child profile
        // Logic: ONLY "مكتملة" deducts from balance. Other attendance states (حضر، غاب) are for tracking but don't finalize billing unless marked completed.
        // If moving TO "مكتملة" from anything else
        if (newStatus === "مكتملة" && oldStatus !== "مكتملة") {
          const newCompleted = (childData.sessionsCompleted || 0) + 1;
          const newRemaining = Math.max(0, (childData.sessionsPurchased || 0) - newCompleted);
          transaction.update(childRef, { 
            sessionsCompleted: newCompleted,
            remainingSessions: newRemaining,
            lastSessionDate: session.date
          });
        }
        // If moving FROM "مكتملة" back to anything else
        else if (oldStatus === "مكتملة" && newStatus !== "مكتملة") {
          const newCompleted = Math.max(0, (childData.sessionsCompleted || 0) - 1);
          const newRemaining = (childData.sessionsPurchased || 0) - newCompleted;
          transaction.update(childRef, { 
            sessionsCompleted: newCompleted,
            remainingSessions: newRemaining
          });
        }
      });

      toast({ title: "تم تحديث الحالة", description: `الحالة الجديدة: ${newStatus}` });
    } catch (err) {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: sessionRef.path,
        operation: "update"
      }));
    }
  };

  const handleSaveNotes = async () => {
    if (!sessionRef) return;
    setSaving(true);
    try {
      await updateDoc(sessionRef, { notes: notes });
      toast({ title: "تم حفظ الملاحظات", description: "تم تحديث ملاحظات الجلسة بنجاح." });
      setIsEditingNotes(false);
    } catch (err) {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: sessionRef.path,
        operation: "update"
      }));
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <div className="text-center py-20">عذراً، الجلسة غير موجودة.</div>;
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'مجدولة': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'حضر': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'غاب': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'اعتذر': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'مؤجل': return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'مكتملة': return 'bg-emerald-500 text-white border-none';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" dir="rtl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 bg-white shadow-sm" onClick={() => router.back()}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-slate-800">إدارة الحضور</h1>
            <p className="text-slate-500 font-medium">جلسة {session.type} - {session.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`px-6 py-2 rounded-2xl text-sm font-bold shadow-sm ${getStatusStyle(session.status)}`}>
            {session.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Attendance Actions Sidebar */}
        <div className="md:col-span-1 space-y-8">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b p-8 text-center">
              <div className="mx-auto bg-primary/10 p-5 rounded-3xl w-fit mb-4">
                <Calendar className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-xl font-headline">رصد الحالة</CardTitle>
              <CardDescription>تحديث حالة الجلسة وتوثيق الحضور</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {!isParent && (
                <>
                  <Button 
                    variant="outline"
                    className="w-full h-11 rounded-xl justify-start gap-3 font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => updateSessionStatus("حضر")}
                    disabled={session.status === 'حضر' || session.status === 'مكتملة'}
                  >
                    <UserCheck className="h-4 w-4" /> رصد كـ "حضر"
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-11 rounded-xl justify-start gap-3 font-bold border-rose-100 text-rose-600 hover:bg-rose-50"
                    onClick={() => updateSessionStatus("غاب")}
                    disabled={session.status === 'غاب' || session.status === 'مكتملة'}
                  >
                    <UserX className="h-4 w-4" /> رصد كـ "غاب"
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-11 rounded-xl justify-start gap-3 font-bold border-amber-100 text-amber-600 hover:bg-amber-50"
                    onClick={() => updateSessionStatus("اعتذر")}
                    disabled={session.status === 'اعتذر' || session.status === 'مكتملة'}
                  >
                    <UserMinus className="h-4 w-4" /> رصد كـ "اعتذر"
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-11 rounded-xl justify-start gap-3 font-bold border-slate-100 text-slate-600 hover:bg-slate-50"
                    onClick={() => updateSessionStatus("مؤجل")}
                    disabled={session.status === 'مؤجل' || session.status === 'مكتملة'}
                  >
                    <FileClock className="h-4 w-4" /> رصد كـ "مؤجل"
                  </Button>
                  <Separator className="my-2" />
                  <Button 
                    className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 gap-2 font-bold shadow-lg shadow-emerald-200"
                    onClick={() => updateSessionStatus("مكتملة")}
                    disabled={session.status === 'مكتملة'}
                  >
                    <CheckCircle2 className="h-5 w-5" /> إنهاء وخصم من الرصيد
                  </Button>
                </>
              )}
              {isParent && (
                <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-2">
                  <p className="text-sm text-slate-500 italic">يتم تحديث حالة الجلسة من قبل الأخصائي المسؤول.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment Data */}
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8 space-y-6">
            <h3 className="font-bold text-slate-800 border-b pb-4">بيانات الموعد</h3>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">الوقت المحدد</p>
                  <p className="text-sm font-bold text-slate-700">{session.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-4" onClick={() => router.push(`/dashboard/children/${session.childId}`)}>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-400 cursor-pointer">
                  <Baby className="h-5 w-5" />
                </div>
                <div className="cursor-pointer">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">الطفل</p>
                  <p className="text-sm font-bold text-slate-700 hover:text-primary transition-colors">{child?.fullName || '...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">الأخصائي</p>
                  <p className="text-sm font-bold text-slate-700">{therapist?.name || '...'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Notes Content */}
        <div className="md:col-span-2 space-y-8">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold font-headline text-slate-800">ملاحظات الجلسة والتقدم</h3>
              </div>
              {!isParent && !isEditingNotes && (
                <Button variant="ghost" size="sm" className="gap-2 text-primary" onClick={() => setIsEditingNotes(true)}>
                  <Edit className="h-4 w-4" /> تعديل الملاحظات
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              {isEditingNotes ? (
                <div className="space-y-4">
                  <Textarea 
                    className="min-h-[200px] rounded-2xl border-slate-200 focus:ring-primary/20 text-right leading-relaxed"
                    dir="rtl"
                    placeholder="سجل ملاحظات الجلسة، التطورات، أو أي ملاحظات سريعة هنا..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button className="rounded-xl h-11 px-8 gap-2 bg-primary shadow-lg shadow-primary/20" onClick={handleSaveNotes} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      حفظ الملاحظات
                    </Button>
                    <Button variant="ghost" className="rounded-xl h-11 px-8" onClick={() => setIsEditingNotes(false)}>إلغاء</Button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 min-h-[200px] relative">
                  {session.notes ? (
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap italic">"{session.notes}"</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-10">
                      <AlertCircle className="h-8 w-8 opacity-20" />
                      <p className="text-sm font-medium">لا توجد ملاحظات مسجلة لهذه الجلسة حتى الآن.</p>
                    </div>
                  )}
                  {session.status === 'مكتملة' && (
                    <Badge className="absolute top-4 left-4 bg-emerald-500/10 text-emerald-600 border-none">
                      سجلت الجلسة كمكتملة
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Child's Plan Reminder */}
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-slate-800 text-white p-10 overflow-hidden relative">
            <Activity className="h-40 w-40 absolute -bottom-10 -left-10 opacity-5" />
            <div className="relative z-10 space-y-6">
              <h3 className="text-2xl font-bold font-headline">الخطة العلاجية للطفل</h3>
              <p className="text-slate-300 leading-relaxed opacity-80">
                {child?.treatmentPlan || "لم يتم توثيق تفاصيل الخطة العلاجية في ملف الطفل بعد."}
              </p>
              <Separator className="bg-white/10" />
              <div className="flex items-center gap-4">
                 <Badge variant="outline" className="bg-white/5 border-white/20 text-white font-bold">الرصيد المتبقي: {child?.remainingSessions} جلسة</Badge>
                 <Button variant="link" className="text-primary-foreground hover:text-white p-0 h-auto font-bold" onClick={() => router.push(`/dashboard/children/${session.childId}`)}>
                    فتح ملف الطفل بالكامل
                 </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
