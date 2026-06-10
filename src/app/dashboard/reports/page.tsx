
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
  Calendar,
  FileText,
  Loader2,
  AlertTriangle,
  Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportFormDialog } from "@/components/reports/report-form-dialog";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
  const router = useRouter();
  const db = useFirestore();
  const { profile } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);

  const isParent = profile?.role === 'Parent';

  const reportsQuery = useMemoFirebase(() => {
    if (!db) return null;
    
    let q = collection(db, "reports");
    
    // Parent sees only their child's reports
    if (isParent && profile?.linkedEntityId) {
      return query(
        q, 
        where("childId", "==", profile.linkedEntityId),
        orderBy("createdAt", "desc"),
        limit(50)
      );
    }
    
    return query(q, orderBy("createdAt", "desc"), limit(50));
  }, [db, isParent, profile?.linkedEntityId]);

  const { data: reports, loading } = useCollection(reportsQuery);
  
  const childrenCollectionQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "children");
  }, [db]);
  const { data: children } = useCollection(childrenCollectionQuery);

  const getChildInfo = (id: string) => {
    return children?.find(c => c.id === id);
  };

  const filtered = reports?.filter(r => {
    const child = getChildInfo(r.childId);
    return child?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.evaluation.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    if (!db || !confirm("هل أنت متأكد من حذف هذا التقرير؟")) return;
    const docRef = doc(db, "reports", id);
    deleteDoc(docRef).catch(async (err) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: docRef.path,
        operation: "delete"
      }));
    });
  };

  const openEditForm = (report: any) => {
    setEditingReport(report);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{isParent ? 'تقارير طفلي' : 'تقارير الجلسات'}</h1>
          <p className="text-muted-foreground">
            {isParent ? 'متابعة سجل التقدم والتقييمات الخاصة بطفلك.' : 'توثيق ومتابعة تقدم الأطفال في الجلسات العلاجية.'}
          </p>
        </div>
        {!isParent && (
          <Button 
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={() => {
              setEditingReport(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> إنشاء تقرير جديد
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 max-w-sm rounded-lg border bg-card px-3 py-1 shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="ابحث باسم الطفل أو التقييم..." 
          className="border-0 focus-visible:ring-0 shadow-none bg-transparent h-9 text-right"
          dir="rtl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && !reports ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground font-medium">لا توجد تقارير مطابقة للبحث.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered?.map((report) => {
            const child = getChildInfo(report.childId);
            const isLowSessions = child && child.remainingSessions < 3;

            return (
              <Card key={report.id} className={`group hover:border-primary/50 transition-all border-r-4 ${isLowSessions ? 'border-r-rose-500 bg-rose-50/10' : 'border-r-primary/20'}`}>
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-full shrink-0 ${isLowSessions ? 'bg-rose-100 text-rose-600' : 'bg-primary/10 text-primary'}`}>
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-primary">{child?.fullName || "جارِ التحميل..."}</h3>
                        <Badge variant={report.status === 'نشط' ? 'default' : 'secondary'} className="text-[10px]">
                          {report.status}
                        </Badge>
                        {isLowSessions && !isParent && (
                          <Badge variant="destructive" className="text-[10px] gap-1 px-2 py-0.5 animate-pulse">
                            <AlertTriangle className="h-3 w-3" /> رصيد منخفض: {child?.remainingSessions} جلسات
                          </Badge>
                        )}
                        {isParent && (
                          <Badge variant="outline" className="text-[10px] text-accent font-bold">
                            تاريخ الجلسة: {report.sessionDate}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {report.sessionDate}
                        </div>
                        <div className="flex items-center gap-1 font-medium text-accent">
                          <Search className="h-3.5 w-3.5" />
                          التقييم: {report.evaluation}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/dashboard/reports/${report.id}`)}>
                      <Eye className="h-4 w-4" /> عرض {isParent && 'وتحميل'}
                    </Button>
                    {!isParent && (
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem className="gap-2" onClick={() => openEditForm(report)}>
                            <Edit className="h-4 w-4" /> تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(report.id)}>
                            <Trash2 className="h-4 w-4" /> حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ReportFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        report={editingReport} 
      />
    </div>
  );
}
