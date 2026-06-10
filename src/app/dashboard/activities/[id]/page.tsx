
"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ArrowRight, 
  Activity, 
  Clock, 
  BarChart, 
  User, 
  Baby, 
  Info,
  CheckCircle2,
  Loader2,
  Calendar,
  Layers,
  Send,
  MessageCircle,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";

export default function ActivityDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { profile } = useUser();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isParent = profile?.role === 'Parent';

  const activityRef = useMemo(() => db && id ? doc(db, "activities", id as string) : null, [db, id]);
  const { data: activity, loading: activityLoading } = useDoc(activityRef);

  const therapistRef = useMemo(() => db && activity?.therapistId ? doc(db, "therapists", activity.therapistId) : null, [db, activity?.therapistId]);
  const childRef = useMemo(() => db && activity?.childId ? doc(db, "children", activity.childId) : null, [db, activity?.childId]);
  
  const { data: therapist } = useDoc(therapistRef);
  const { data: child } = useDoc(childRef);

  const handleFeedbackSubmit = async () => {
    if (!activityRef || !feedback.trim()) return;
    setSubmitting(true);
    try {
      await updateDoc(activityRef, {
        parentFeedback: feedback,
        parentSubmissionDate: serverTimestamp(),
        status: "مكتمل"
      });
      toast({
        title: "تم إرسال ملاحظاتك",
        description: "شكراً لك! سيتم مراجعة الملاحظات من قبل الأخصائي.",
      });
      setFeedback("");
    } catch (err) {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: activityRef.path,
        operation: "update"
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (activityLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-slate-400 font-headline">جاري تحميل تفاصيل النشاط...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center py-20 bg-white rounded-[2rem] shadow-sm m-8">
        <Activity className="h-16 w-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 font-headline">عذراً، النشاط غير موجود</h2>
        <p className="text-slate-400 mb-8 mt-2">قد يكون النشاط قد تم حذفه أو أن الرابط غير صحيح.</p>
        <Button variant="outline" className="rounded-xl h-12 px-8" onClick={() => router.push("/dashboard/activities")}>
          العودة للأنشطة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" dir="rtl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 bg-white shadow-sm hover:bg-slate-50 transition-all" onClick={() => router.back()}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-slate-800">{activity.title}</h1>
            <div className="flex items-center gap-3">
               <Badge className="bg-primary/10 text-primary border-none font-bold rounded-lg">{activity.category}</Badge>
               <span className="text-xs text-slate-400 font-medium">تم الإنشاء في {activity.createdAt?.seconds ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : 'غير متوفر'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={activity.status === 'مكتمل' ? 'default' : 'outline'} className={`px-6 py-2 rounded-2xl text-sm font-bold shadow-sm ${
            activity.status === 'جديد' ? 'bg-blue-50 text-blue-600 border-blue-200' :
            activity.status === 'قيد التنفيذ' ? 'bg-amber-50 text-amber-600 border-amber-200' :
            'bg-emerald-500 text-white border-none'
          }`}>
            {activity.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Info Sidebar */}
        <Card className="md:col-span-1 rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden h-fit">
          <CardHeader className="bg-slate-50/50 border-b p-8">
            <div className="mx-auto bg-primary/10 p-6 rounded-[1.5rem] w-fit mb-6">
              <Activity className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl font-headline text-center text-slate-800">بطاقة المعلومات</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1 text-center">
                <Clock className="h-5 w-5 text-slate-400 mx-auto" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">المدة</p>
                <p className="text-sm font-bold text-slate-700">{activity.duration} دقيقة</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1 text-center">
                <BarChart className="h-5 w-5 text-slate-400 mx-auto" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">الصعوبة</p>
                <p className="text-sm font-bold text-slate-700">{activity.difficulty}</p>
              </div>
            </div>

            <Separator className="bg-slate-100" />
            
            <div className="space-y-5">
              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => therapist?.id && router.push(`/dashboard/therapists/${therapist.id}`)}>
                <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent group-hover:text-white transition-all text-accent">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">الأخصائي</span>
                  <span className="text-sm font-bold text-slate-700">{therapist?.name || '...'}</span>
                </div>
              </div>

              {!isParent && (
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => child?.id && router.push(`/dashboard/children/${child.id}`)}>
                  <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-all text-orange-500">
                    <Baby className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">الطفل</span>
                    <span className="text-sm font-bold text-slate-700">{child?.fullName || '...'}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold font-headline text-slate-800">وصف النشاط وأهدافه</h3>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed text-slate-600 italic">
              {activity.description || "لا يوجد وصف مسجل لهذا النشاط."}
            </div>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold font-headline text-slate-800">خطوات التنفيذ</h3>
              </div>
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-white border border-slate-100 p-8 rounded-2xl shadow-sm min-h-[150px]">
                  {activity.instructions || "لا توجد تعليمات محددة مسجلة لتنفيذ هذا النشاط."}
                </p>
              </div>
            </div>
          </Card>

          {/* Parent Interaction Section */}
          {isParent && (
            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-accent/5 p-8 border border-accent/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold font-headline text-slate-800">ملاحظاتك حول أداء طفلك</h3>
              </div>
              <div className="space-y-4">
                {activity.parentFeedback ? (
                  <div className="bg-white p-6 rounded-2xl border border-accent/20 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase">
                      <Sparkles className="h-3 w-3" /> تم الإرسال في {activity.parentSubmissionDate?.seconds ? new Date(activity.parentSubmissionDate.seconds * 1000).toLocaleString('ar-EG') : '...'}
                    </div>
                    <p className="text-slate-700 italic">"{activity.parentFeedback}"</p>
                  </div>
                ) : (
                  <>
                    <Textarea 
                      placeholder="كيف كان أداء طفلك في هذا النشاط؟ هل واجه أي صعوبات؟" 
                      className="min-h-[120px] rounded-2xl border-accent/20 focus:ring-accent/20 text-right bg-white"
                      dir="rtl"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                    <Button 
                      className="w-full h-12 rounded-2xl bg-accent hover:bg-accent/90 gap-2 font-bold shadow-lg shadow-accent/20"
                      onClick={handleFeedbackSubmit}
                      disabled={submitting || !feedback.trim()}
                    >
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      إرسال الملاحظات وإتمام النشاط
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Therapist view of parent feedback */}
          {!isParent && activity.parentFeedback && (
            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-orange-50 p-8 border border-orange-100">
               <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                  <Baby className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold font-headline text-slate-800">تغذية راجعة من ولي الأمر</h3>
              </div>
              <p className="text-slate-600 bg-white p-4 rounded-xl border border-orange-200 italic">
                {activity.parentFeedback}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
