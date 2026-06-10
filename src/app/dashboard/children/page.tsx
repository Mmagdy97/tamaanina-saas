
"use client";

import { useState, useMemo } from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, deleteDoc, doc, query, orderBy, limit, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChildFormDialog } from "@/components/children/child-form-dialog";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChildrenPage() {
  const router = useRouter();
  const db = useFirestore();
  const { centerId, profile } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<any>(null);
  const [pageSize, setPageSize] = useState(15);

  const childrenQuery = useMemoFirebase(() => {
    if (!db || !centerId) return null;
    return query(
      collection(db, "centers", centerId, "children"), 
      orderBy("fullName", "asc"),
      limit(pageSize)
    );
  }, [db, centerId, pageSize]);

  const { data: children, loading } = useCollection(childrenQuery);

  const filteredChildren = children?.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.diagnosis && c.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (!db || !centerId || !confirm("هل أنت متأكد من حذف ملف هذا الطفل؟")) return;
    
    try {
      const docRef = doc(db, "centers", centerId, "children", id);
      const snap = await getDoc(docRef);
      const childName = snap.exists() ? snap.data().fullName : "غير معروف";
      
      await deleteDoc(docRef);

      // Log Activity
      await addDoc(collection(db, "centers", centerId, "activityLogs"), {
        userName: profile?.displayName || "مستخدم",
        userEmail: profile?.email || "",
        action: "حذف ملف طفل",
        details: `إزالة ملف الطفل: ${childName}`,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: `centers/${centerId}/children/${id}`,
        operation: "delete"
      }));
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-bold font-headline text-slate-900 leading-tight">إدارة الأطفال</h1>
          <p className="text-slate-500 font-medium">سجل متكامل لمتابعة الحالات، الفوترة، والتقدم العلاجي.</p>
        </div>
        <Button 
          className="gap-2 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 h-14 px-8 rounded-2xl font-bold text-lg"
          onClick={() => {
            setEditingChild(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-6 w-6" /> إضافة طفل جديد
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100">
        <div className="flex items-center gap-3 w-full max-w-lg bg-slate-50 rounded-2xl px-5 py-3 border border-slate-100">
          <Search className="h-5 w-5 text-slate-400" />
          <input 
            placeholder="ابحث عن طفل، ولي أمر، أو تشخيص..." 
            className="flex-1 bg-transparent border-0 focus:outline-none text-sm text-right font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            {children?.length || 0} طفل مسجل في المركز
        </div>
      </div>

      <div className="rounded-[2.5rem] border-none bg-white shadow-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-b border-slate-100 h-16">
              <TableHead className="text-right pr-10 font-bold text-slate-500 text-xs uppercase tracking-widest">الاسم الكامل</TableHead>
              <TableHead className="text-right font-bold text-slate-500 text-xs uppercase tracking-widest">العمر</TableHead>
              <TableHead className="text-right font-bold text-slate-500 text-xs uppercase tracking-widest">التشخيص</TableHead>
              <TableHead className="text-right font-bold text-slate-500 text-xs uppercase tracking-widest">ولي الأمر</TableHead>
              <TableHead className="text-right font-bold text-slate-500 text-xs uppercase tracking-widest">الحالة</TableHead>
              <TableHead className="text-left pl-10 font-bold text-slate-500 text-xs uppercase tracking-widest">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="h-20"><TableCell colSpan={6}><Skeleton className="h-10 w-full rounded-xl" /></TableCell></TableRow>
              ))
            ) : filteredChildren?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 italic">لا توجد نتائج.</TableCell></TableRow>
            ) : (
              filteredChildren?.map((child) => (
                <TableRow key={child.id} className="h-20 hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="pr-10 font-bold text-primary cursor-pointer" onClick={() => router.push(`/dashboard/children/${child.id}`)}>{child.fullName}</TableCell>
                  <TableCell>{child.age} سنوات</TableCell>
                  <TableCell className="text-slate-500 text-xs truncate max-w-[150px]">{child.diagnosis || "-"}</TableCell>
                  <TableCell className="font-bold">{child.parentName}</TableCell>
                  <TableCell><Badge className="rounded-xl">{child.status}</Badge></TableCell>
                  <TableCell className="pl-10 text-left">
                     <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/children/${child.id}`)}><Eye className="h-4 w-4 text-slate-400" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ChildFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} child={editingChild} />
    </div>
  );
}
