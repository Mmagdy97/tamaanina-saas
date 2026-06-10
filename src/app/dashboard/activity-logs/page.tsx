
"use client";

import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, User, Clock, Info, Search, Filter, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ActivityLogsPage() {
  const db = useFirestore();
  const { centerId, profile } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  const logsQuery = useMemoFirebase(() => {
    if (!db || !centerId) return null;
    return query(
      collection(db, "centers", centerId, "activityLogs"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [db, centerId]);

  const { data: logs, loading } = useCollection(logsQuery);

  // حماية المسار: متاح فقط لمديري المراكز والمدير العام
  if (profile?.role !== 'center_admin' && profile?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <div className="p-4 bg-rose-50 rounded-full"><ShieldAlert className="h-12 w-12 text-rose-500" /></div>
        <h2 className="text-xl font-bold">غير مصرح لك بمشاهدة سجلات النظام</h2>
        <p className="text-slate-500 max-w-xs">هذه الصفحة مخصصة للمديرين فقط لمتابعة سير العمل.</p>
      </div>
    );
  }

  const filteredLogs = logs?.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes("حذف")) return "bg-rose-50 text-rose-600 border-rose-100";
    if (action.includes("إضافة") || action.includes("إنشاء")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (action.includes("تحديث") || action.includes("تعديل")) return "bg-blue-50 text-blue-600 border-blue-100";
    return "bg-slate-50 text-slate-600 border-slate-100";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold font-headline text-slate-900 tracking-tight">سجل العمليات</h1>
        <p className="text-slate-500 font-medium">متابعة كافة التغييرات والنشاطات المنفذة داخل المركز.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full max-w-md bg-white rounded-2xl px-5 py-2 border shadow-sm">
          <Search className="h-5 w-5 text-slate-400" />
          <Input 
            placeholder="ابحث عن عملية أو مستخدم..." 
            className="border-0 shadow-none focus-visible:ring-0 text-right h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
        <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><History className="h-5 w-5" /></div>
          <CardTitle className="text-xl font-bold font-headline">النشاطات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
            </div>
          ) : filteredLogs?.length === 0 ? (
            <div className="p-20 text-center text-slate-400 italic">لا توجد سجلات مطابقة للبحث.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredLogs?.map((log) => (
                <div key={log.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-100 rounded-2xl text-slate-400 group-hover:text-primary transition-all">
                      <Info className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`font-bold px-3 py-0.5 rounded-lg border-none ${getActionColor(log.action)}`}>
                          {log.action}
                        </Badge>
                        <span className="text-sm font-bold text-slate-800">{log.details}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> بواسطة: {log.userName}</span>
                        <span className="flex items-center gap-1.5" dir="ltr"><Clock className="h-3 w-3" /> {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleString('ar-EG') : '...'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
