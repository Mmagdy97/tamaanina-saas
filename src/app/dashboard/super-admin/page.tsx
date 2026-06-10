
"use client";

import { useMemo, useState, useEffect } from "react";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Building2, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ShieldAlert,
  CheckCircle2,
  Ban,
  Filter,
  ArrowUpRight,
  CalendarClock,
  Activity,
  Bell,
  Wallet,
  Zap,
  Clock,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CenterFormDialog } from "@/components/super-admin/center-form-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { isAfter, isBefore, addDays } from "date-fns";

const mockMonthlyData = [
  { name: 'يناير', revenue: 45000, centers: 12 },
  { name: 'فبراير', revenue: 52000, centers: 15 },
  { name: 'مارس', revenue: 48000, centers: 18 },
  { name: 'أبريل', revenue: 61000, centers: 22 },
  { name: 'مايو', revenue: 75000, centers: 28 },
  { name: 'يونيو', revenue: 89000, centers: 35 },
];

export default function SuperAdminDashboard() {
  const db = useFirestore();
  const { profile } = useUser();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // 1. استعلام جلب المراكز (يجب أن يكون دائماً في الأعلى)
  const centersQuery = useMemo(() => db ? query(collection(db, "centers"), orderBy("createdAt", "desc")) : null, [db]);
  const { data: centers, loading } = useCollection(centersQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. حساب الإحصائيات (يجب استدعاؤه قبل أي return شرطي لضمان ثبات ترتيب الـ Hooks)
  const stats = useMemo(() => {
    if (!centers) return { total: 0, active: 0, trial: 0, expired: 0, revenue: 0 };
    return centers.reduce((acc, center) => {
      acc.total++;
      if (center.status === 'Suspended') { /* معلق */ }
      else if (center.subscriptionStatus === 'Trial') acc.trial++;
      else if (center.subscriptionStatus === 'Expired') acc.expired++;
      else acc.active++;

      const price = center.plan === 'Enterprise' ? 5000 : center.plan === 'Professional' ? 1200 : 500;
      if (center.subscriptionStatus === 'Active') acc.revenue += price;
      return acc;
    }, { total: 0, active: 0, trial: 0, expired: 0, revenue: 0 });
  }, [centers]);

  const expiringSoon = useMemo(() => {
    if (!centers || !mounted) return [];
    const now = new Date();
    const sevenDays = addDays(now, 7);
    return centers.filter(c => {
      if (!c.trialEndDate) return false;
      const end = new Date(c.trialEndDate);
      return isAfter(end, now) && isBefore(end, sevenDays);
    });
  }, [centers, mounted]);

  // 3. التحقق من الصلاحية (بعد تعريف كافة الخطافات)
  if (profile?.role !== 'super_admin') {
    return null;
  }

  const toggleStatus = async (center: any) => {
    if (!db) return;
    const newStatus = center.status === 'Suspended' ? 'Active' : 'Suspended';
    try {
      await updateDoc(doc(db, "centers", center.id), { status: newStatus });
      toast({ title: "تم التحديث", description: `تم تغيير حالة ${center.name} إلى ${newStatus === 'Active' ? 'نشط' : 'معلق'}` });
    } catch (e) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("هل أنت متأكد من حذف المركز؟")) return;
    try {
      await deleteDoc(doc(db, "centers", id));
      toast({ title: "تم الحذف بنجاح" });
    } catch (e) {
      toast({ title: "فشل الحذف", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-bold font-headline text-slate-900 tracking-tight flex items-center gap-3">
            لوحة الإدارة العليا <Zap className="h-8 w-8 text-amber-500 fill-amber-500" />
          </h1>
          <p className="text-slate-500 font-medium">التحكم الكامل في كافة المراكز والاشتراكات عبر المنصة.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 h-14 px-8 rounded-2xl font-bold text-lg"
            onClick={() => { setEditingCenter(null); setIsFormOpen(true); }}
          >
            <Plus className="h-6 w-6" /> إضافة مركز جديد
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-3xl border-none shadow-xl bg-white p-5 space-y-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit"><Building2 className="h-5 w-5" /></div>
          <div><p className="text-[10px] font-bold text-slate-400">المراكز</p><p className="text-2xl font-bold">{stats.total}</p></div>
        </Card>
        <Card className="rounded-3xl border-none shadow-xl bg-white p-5 space-y-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit"><CheckCircle2 className="h-5 w-5" /></div>
          <div><p className="text-[10px] font-bold text-slate-400">نشطة</p><p className="text-2xl font-bold text-emerald-600">{stats.active}</p></div>
        </Card>
        <Card className="rounded-3xl border-none shadow-xl bg-white p-5 space-y-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit"><Clock className="h-5 w-5" /></div>
          <div><p className="text-[10px] font-bold text-slate-400">تجريبية</p><p className="text-2xl font-bold text-amber-600">{stats.trial}</p></div>
        </Card>
        <Card className="rounded-3xl border-none shadow-xl bg-white p-5 space-y-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit"><Ban className="h-5 w-5" /></div>
          <div><p className="text-[10px] font-bold text-slate-400">منتهية</p><p className="text-2xl font-bold text-rose-600">{stats.expired}</p></div>
        </Card>
        <Card className="rounded-3xl border-none shadow-xl bg-indigo-600 text-white p-5 space-y-4">
          <div className="p-3 bg-white/10 rounded-2xl w-fit"><Wallet className="h-5 w-5" /></div>
          <div><p className="text-[10px] font-bold opacity-70 uppercase">الإيرادات الشهرية</p><p className="text-2xl font-bold">{stats.revenue.toLocaleString()} ج.م</p></div>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl bg-white p-8">
          <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold font-headline flex items-center gap-2"><TrendingUp className="h-5 w-5 text-indigo-500" /> نمو الإيرادات</CardTitle>
          </CardHeader>
          <div className="h-[250px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockMonthlyData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} orientation="right" />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-full w-full" />}
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-8">
           <CardHeader className="p-0 mb-6"><CardTitle className="text-xl font-bold font-headline">تنتهي قريباً</CardTitle></CardHeader>
           <div className="space-y-4">
              {expiringSoon.map(c => (
                <div key={c.id} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex justify-between items-center">
                  <div><p className="text-xs font-bold text-slate-800">{c.name}</p><p className="text-[10px] text-rose-600">تنتهي خلال أيام</p></div>
                  <Button size="icon" variant="ghost" className="text-rose-600"><ArrowUpRight className="h-4 w-4" /></Button>
                </div>
              ))}
              {!expiringSoon.length && <p className="text-center py-10 text-sm text-slate-400 italic">لا يوجد اشتراكات تنتهي قريباً.</p>}
           </div>
        </Card>
      </div>

      <CenterFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} center={editingCenter} />
    </div>
  );
}
