
"use client";

import { useState } from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, deleteDoc, doc, limit, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  CalendarDays,
  Clock,
  User,
  Baby,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SessionFormDialog } from "@/components/sessions/session-form-dialog";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";

export default function SessionsPage() {
  const router = useRouter();
  const db = useFirestore();
  const { profile } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);

  const isParent = profile?.role === 'Parent';

  const sessionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    
    let q = collection(db, "sessions");
    
    if (isParent && profile?.linkedEntityId) {
      return query(
        q, 
        where("childId", "==", profile.linkedEntityId),
        orderBy("date", "desc"),
        limit(100)
      );
    }
    
    return query(q, orderBy("date", "desc"), limit(100));
  }, [db, isParent, profile?.linkedEntityId]);

  const { data: sessions, loading } = useCollection(sessionsQuery);
  
  const childrenQuery = useMemoFirebase(() => db ? collection(db, "children") : null, [db]);
  const therapistsQuery = useMemoFirebase(() => db ? collection(db, "therapists") : null, [db]);
  
  const { data: children } = useCollection(childrenQuery);
  const { data: therapists } = useCollection(therapistsQuery);

  const getChildName = (id: string) => children?.find(c => c.id === id)?.fullName || "جارِ التحميل...";
  const getTherapistName = (id: string) => therapists?.find(t => t.id === id)?.name || "جارِ التحميل...";

  const filtered = sessions?.filter(s => {
    const childName = getChildName(s.childId);
    return childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = (id: string) => {
    if (!db || !confirm("هل أنت متأكد من إلغاء وحذف هذه الجلسة؟")) return;
    const docRef = doc(db, "sessions", id);
    deleteDoc(docRef).catch(async (err) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: docRef.path,
        operation: "delete"
      }));
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'مجدولة': return <CalendarDays className="h-4 w-4 text-blue-500" />;
      case 'مكتملة': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'غائب': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'ملغاة': return <XCircle className="h-4 w-4 text-rose-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "px-3 py-1 rounded-full font-bold text-[10px] flex items-center gap-1.5";
    switch (status) {
      case 'مجدولة': return <Badge className={`${base} bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50`}>مجدولة</Badge>;
      case 'مكتملة': return <Badge className={`${base} bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50`}>مكتملة</Badge>;
      case 'غائب': return <Badge className={`${base} bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-50`}>غائب</Badge>;
      case 'ملغاة': return <Badge className={`${base} bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-50`}>ملغاة</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold font-headline text-slate-900 tracking-tight">جدول الجلسات</h1>
          <p className="text-slate-500">تنظيم المواعيد ومتابعة حضور الأطفال يومياً.</p>
        </div>
        {!isParent && (
          <Button 
            className="gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 px-6 rounded-2xl font-bold"
            onClick={() => {
              setEditingSession(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-5 w-5" /> حجز جلسة جديدة
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 max-w-md rounded-2xl border bg-white px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Search className="h-5 w-5 text-slate-400" />
        <Input 
          placeholder="ابحث باسم الطفل أو نوع الجلسة..." 
          className="border-0 focus-visible:ring-0 shadow-none bg-transparent h-10 text-right text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && !sessions ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-[2rem] bg-slate-50/50">
          <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">لا توجد جلسات مجدولة في هذا السجل.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered?.map((session) => (
            <Card key={session.id} className="group rounded-3xl border-none shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all bg-white overflow-hidden border-r-4 border-r-transparent hover:border-r-primary">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5 flex-1">
                  <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-2xl min-w-[80px] text-center border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {new Date(session.date).toLocaleDateString('ar-EG', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-bold text-slate-800">
                      {new Date(session.date).getDate()}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 text-right">
                    <div className="flex items-center gap-3">
                       <h3 className="font-bold text-lg text-slate-800">{getChildName(session.childId)}</h3>
                       {getStatusBadge(session.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
                       <div className="flex items-center gap-1.5">
                         <Clock className="h-4 w-4 text-primary/60" /> {session.time}
                       </div>
                       <div className="flex items-center gap-1.5">
                         <Activity className="h-4 w-4 text-accent/60" /> {session.type}
                       </div>
                       {!isParent && (
                         <div className="flex items-center gap-1.5">
                           <User className="h-4 w-4 text-slate-400" /> {getTherapistName(session.therapistId)}
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0">
                  <Button variant="outline" size="sm" className="rounded-xl h-10 px-5 gap-2 border-slate-100 hover:bg-slate-50" onClick={() => router.push(`/dashboard/sessions/${session.id}`)}>
                    <Eye className="h-4 w-4" /> عرض التفاصيل
                  </Button>
                  
                  {!isParent && (
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                          <MoreVertical className="h-5 w-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="rounded-xl p-1 w-44">
                        <DropdownMenuItem className="gap-3 rounded-lg py-2" onClick={() => {
                          setEditingSession(session);
                          setIsFormOpen(true);
                        }}>
                          <Edit className="h-4 w-4 text-accent" /> تعديل الموعد
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 rounded-lg py-2 text-rose-500 focus:bg-rose-50" onClick={() => handleDelete(session.id)}>
                          <Trash2 className="h-4 w-4" /> إلغاء الجلسة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SessionFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        session={editingSession} 
      />
    </div>
  );
}
