
"use client";

import { useMemo } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  History, 
  ArrowUpRight, 
  ArrowDownRight,
  User,
  Calendar,
  CreditCard,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

export default function BillingPage() {
  const router = useRouter();
  const db = useFirestore();

  // Load all payments
  const paymentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "payments"), orderBy("createdAt", "desc"), limit(50));
  }, [db]);
  const { data: payments, loading: paymentsLoading } = useCollection(paymentsQuery);

  // Load children with balances
  const unpaidChildrenQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "children"), where("paymentStatus", "!=", "مدفوع"), limit(20));
  }, [db]);
  const { data: unpaidChildren } = useCollection(unpaidChildrenQuery);

  // Load all children for total revenue calculation (Aggregated on client for demo)
  const allChildrenQuery = useMemoFirebase(() => db ? collection(db, "children") : null, [db]);
  const { data: allChildren } = useCollection(allChildrenQuery);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount).replace("EGP", "ج.م");
  };

  const totalRevenue = useMemo(() => {
    if (!allChildren) return 0;
    return allChildren.reduce((acc, child) => acc + (child.amountPaid || 0), 0);
  }, [allChildren]);

  const totalOutstanding = useMemo(() => {
    if (!allChildren) return 0;
    return allChildren.reduce((acc, child) => acc + (child.remainingBalance || 0), 0);
  }, [allChildren]);

  const getChildName = (id: string) => {
    return allChildren?.find(c => c.id === id)?.fullName || "جارِ التحميل...";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold font-headline text-slate-900 tracking-tight">المالية والاشتراكات</h1>
        <p className="text-slate-500">إدارة التدفق النقدي، المستحقات، وسجل دفعات أولياء الأمور.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-primary text-white p-8 overflow-hidden relative">
          <TrendingUp className="absolute -bottom-6 -left-6 h-32 w-32 opacity-10" />
          <div className="relative z-10 space-y-2">
            <p className="text-xs font-bold uppercase opacity-70 tracking-widest">إجمالي الإيرادات المحصلة</p>
            <p className="text-4xl font-bold">{totalRevenue.toLocaleString()} <span className="text-sm">ج.م</span></p>
            <div className="pt-4 flex items-center gap-2 text-xs font-medium">
              <span className="bg-white/20 px-2 py-0.5 rounded-full">+12% هذا الشهر</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">مستحقات معلقة</p>
              <p className="text-2xl font-bold text-slate-800">{totalOutstanding.toLocaleString()} ج.م</p>
            </div>
          </div>
          <Progress value={(totalRevenue / (totalRevenue + totalOutstanding)) * 100 || 0} className="h-1.5 bg-slate-100" />
          <p className="text-[10px] text-slate-400 mt-2">نسبة التحصيل: {Math.round((totalRevenue / (totalRevenue + (totalOutstanding || 1))) * 100)}%</p>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-accent text-white p-8 overflow-hidden relative">
          <CreditCard className="absolute -bottom-6 -left-6 h-32 w-32 opacity-10" />
          <div className="relative z-10 space-y-2">
            <p className="text-xs font-bold uppercase opacity-70 tracking-widest">حسابات غير مدفوعة</p>
            <p className="text-4xl font-bold">{unpaidChildren?.length || 0} <span className="text-sm">حالة</span></p>
            <Button variant="secondary" size="sm" className="w-full mt-4 h-9 font-bold" onClick={() => router.push('/dashboard/children')}>
              مراجعة الحالات
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Payments History */}
        <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
          <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <History className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl font-bold font-headline">آخر العمليات المالية</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {paymentsLoading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
              </div>
            ) : !payments?.length ? (
              <div className="p-12 text-center space-y-2 text-slate-400">
                <Wallet className="h-12 w-12 mx-auto opacity-20" />
                <p>لا توجد سجلات دفع مسجلة حتى الآن.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {payments.map(payment => (
                  <div key={payment.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                         <ArrowDownRight className="h-5 w-5" />
                       </div>
                       <div className="space-y-0.5">
                         <p className="font-bold text-slate-800">{getChildName(payment.childId)}</p>
                         <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                           <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {payment.date}</span>
                           <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {payment.method}</span>
                         </div>
                       </div>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-emerald-600">+{payment.amount} ج.م</p>
                      <p className="text-[10px] text-slate-400 italic">{payment.notes || "لا توجد ملاحظات"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unpaid Children List Sidebar */}
        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8 space-y-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                <User className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold font-headline">مستحقات معلقة</h3>
            </div>
            <div className="space-y-4">
              {unpaidChildren?.map(child => (
                <div key={child.id} className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 transition-all cursor-pointer" onClick={() => router.push(`/dashboard/children/${child.id}`)}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-bold text-slate-700 group-hover:text-primary">{child.fullName}</span>
                    <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-600 border-none">{child.paymentStatus}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">المبلغ المتبقي</span>
                    <span className="text-sm font-bold text-rose-600">{child.remainingBalance} ج.م</span>
                  </div>
                </div>
              ))}
              {!unpaidChildren?.length && <p className="text-center py-6 text-sm text-slate-400 italic">كل الحسابات مسواة حالياً.</p>}
            </div>
        </Card>
      </div>
    </div>
  );
}
