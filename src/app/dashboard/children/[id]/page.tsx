
"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, orderBy, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ArrowRight, 
  Baby, 
  User, 
  Phone, 
  Stethoscope, 
  ClipboardList, 
  Calendar,
  Loader2,
  Wallet,
  CreditCard,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Activity,
  AlertTriangle,
  History,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaymentDialog } from "@/components/billing/payment-dialog";

export default function ChildDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const [formattedDate, setFormattedDate] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const docRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, "children", id as string);
  }, [db, id]);

  const { data: child, loading } = useDoc(docRef);

  // Load Payment History for this child
  const paymentsQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(
      collection(db, "payments"), 
      where("childId", "==", id), 
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db, id]);
  const { data: payments } = useCollection(paymentsQuery);

  useEffect(() => {
    if (child?.createdAt) {
      const date = child.createdAt.seconds 
        ? new Date(child.createdAt.seconds * 1000) 
        : new Date(child.createdAt);
      setFormattedDate(date.toLocaleDateString('ar-EG'));
    }
  }, [child]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="text-center py-20 bg-white rounded-[2rem] shadow-sm m-8">
        <AlertCircle className="h-16 w-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 font-headline">عذراً، ملف الطفل غير موجود</h2>
        <Button variant="outline" className="rounded-xl h-12 px-8 mt-4" onClick={() => router.push("/dashboard/children")}>
          العودة لقائمة الأطفال
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount || 0).replace("EGP", "ج.م");
  };

  const sessionProgress = child.sessionsPurchased > 0 
    ? (child.sessionsCompleted / child.sessionsPurchased) * 100 
    : 0;

  const isLowSessions = child.remainingSessions < 3;

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      {isLowSessions && (
        <Alert variant="destructive" className="rounded-2xl border-rose-200 bg-rose-50 text-rose-800 animate-pulse">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">تنبيه: رصيد جلسات منخفض</AlertTitle>
          <AlertDescription className="text-sm">
            يتبقى لهذا الطفل {child.remainingSessions} جلسات فقط. يرجى التواصل مع ولي الأمر لتجديد الاشتراك.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 bg-white shadow-sm" onClick={() => router.back()}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-slate-800">{child.fullName}</h1>
            <div className="flex items-center gap-3">
               <Badge className="bg-primary/10 text-primary border-none rounded-lg font-bold">ملف الحالة والفوترة</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Badge variant={child.status === 'نشط' ? 'default' : 'outline'} className={`px-6 py-2 rounded-2xl text-sm font-bold shadow-sm ${
            child.status === 'نشط' ? 'bg-emerald-500 text-white border-none' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            {child.status}
          </Badge>
          <Badge className={`px-6 py-2 rounded-2xl text-sm font-bold shadow-sm ${
            child.paymentStatus === 'مدفوع' ? 'bg-blue-500 text-white border-none' : 'bg-rose-500 text-white border-none'
          }`}>
            {child.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Basic Info Column */}
        <div className="md:col-span-1 space-y-8">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b p-8 text-center">
              <div className="mx-auto bg-primary/10 p-5 rounded-[1.5rem] w-fit mb-4">
                <Baby className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-xl font-headline">{child.fullName}</CardTitle>
              <CardDescription>{child.age} سنوات • {child.gender}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ولي الأمر</p>
                    <p className="text-sm font-bold text-slate-700">{child.parentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">رقم الجوال</p>
                    <p className="text-sm font-bold text-slate-700">{child.parentPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">تاريخ التسجيل</p>
                    <p className="text-sm font-bold text-slate-700">{formattedDate || '...'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions Tracking Card */}
          <Card className={`rounded-[2rem] border-none shadow-xl shadow-slate-200/50 p-8 space-y-6 text-white ${isLowSessions ? 'bg-rose-500' : 'bg-primary'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">تتبع الجلسات</h3>
              <RefreshCcw className="h-5 w-5 opacity-60" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>التقدم في الخطة</span>
                <span>{Math.round(sessionProgress)}%</span>
              </div>
              <Progress value={sessionProgress} className="h-2 bg-white/20" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-white/10 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold opacity-60 uppercase">المنفذة</p>
                  <p className="text-xl font-bold">{child.sessionsCompleted || 0}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold opacity-60 uppercase">المتبقية</p>
                  <p className="text-xl font-bold">{child.remainingSessions || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs bg-white/10 p-3 rounded-xl border border-white/5">
                <AlertCircle className="h-4 w-4" />
                <span>الجلسة القادمة: {child.nextSessionDate || "لم تحدد بعد"}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Financial and Medical Content Column */}
        <div className="md:col-span-2 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">الملخص المالي</h3>
                    <p className="text-xs text-slate-400">حالة الدفع: {child.paymentStatus}</p>
                  </div>
                </div>
                <Button size="icon" className="rounded-xl h-10 w-10 bg-emerald-500 hover:bg-emerald-600" onClick={() => setIsPaymentOpen(true)}>
                  <Plus className="h-5 w-5 text-white" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-sm text-slate-500 font-medium">قيمة العقد الإجمالية</span>
                  <span className="font-bold text-slate-800">{formatCurrency(child.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-sm text-slate-500 font-medium">المبلغ المدفوع</span>
                  <span className="font-bold text-emerald-600">+{formatCurrency(child.amountPaid)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500 font-medium">المتبقي المطلوب</span>
                  <span className="font-bold text-rose-600">{formatCurrency(child.remainingBalance)}</span>
                </div>
                <div className="pt-4">
                   <Badge className="w-full justify-center py-2 bg-slate-50 text-slate-400 hover:bg-slate-50 border-none font-medium">
                     موعد الاستحقاق: {child.paymentDueDate || "غير محدد"}
                   </Badge>
                </div>
              </div>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8 overflow-hidden">
               <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">سجل المدفوعات</h3>
                  <p className="text-xs text-slate-400">آخر العمليات المالية</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[160px] overflow-auto pr-2 custom-scrollbar">
                {payments && payments.length > 0 ? (
                  payments.map(payment => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{payment.method}</p>
                        <p className="text-[10px] text-slate-400">{payment.date}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">+{formatCurrency(payment.amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-xs text-slate-400 italic">لا توجد مدفوعات مسجلة.</p>
                )}
              </div>
            </Card>
          </div>

          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                <Stethoscope className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold font-headline text-slate-800">التشخيص الطبي والسلوكي</h3>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-600 leading-relaxed italic">
              {child.diagnosis || "لا يوجد تشخيص مسجل حالياً."}
            </div>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold font-headline text-slate-800">تفاصيل الخطة العلاجية</h3>
            </div>
            <div className="prose prose-slate max-w-none">
              <p className="whitespace-pre-wrap text-slate-700 bg-white border border-slate-100 p-8 rounded-2xl shadow-sm min-h-[150px] leading-relaxed">
                {child.treatmentPlan || "لم يتم تحديد تفاصيل الخطة العلاجية بعد."}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <PaymentDialog 
        open={isPaymentOpen} 
        onOpenChange={setIsPaymentOpen} 
        childId={child.id} 
        childName={child.fullName} 
      />
    </div>
  );
}
