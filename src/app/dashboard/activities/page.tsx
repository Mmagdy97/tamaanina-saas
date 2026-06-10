
"use client";

import { useState } from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, deleteDoc, doc, limit, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  BarChart,
  Activity as ActivityIcon,
  Loader2,
  Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActivityFormDialog } from "@/components/activities/activity-form-dialog";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActivitiesPage() {
  const router = useRouter();
  const db = useFirestore();
  const { profile } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);

  const isParent = profile?.role === 'Parent';

  const activitiesQuery = useMemoFirebase(() => {
    if (!db) return null;
    
    let q = collection(db, "activities");
    
    // Parent sees only their child's activities
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

  const { data: activities, loading } = useCollection(activitiesQuery);

  const filtered = activities?.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (!db || !confirm("هل أنت متأكد من حذف هذا النشاط؟")) return;
    const docRef = doc(db, "activities", id);
    deleteDoc(docRef).catch(async (err) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: docRef.path,
        operation: "delete"
      }));
    });
  };

  const openEditForm = (activity: any) => {
    setEditingActivity(activity);
    setIsFormOpen(true);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'سهل': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'متوسط': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'صعب': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'جديد': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">جديد</Badge>;
      case 'قيد التنفيذ': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100">قيد التنفيذ</Badge>;
      case 'مكتمل': return <Badge variant="default" className="bg-emerald-500 text-white">مكتمل</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold font-headline text-slate-900 tracking-tight">
            {isParent ? 'أنشطة طفلي' : 'الأنشطة العلاجية'}
          </h1>
          <p className="text-slate-500">
            {isParent ? 'تمارين وأنشطة منزلية لتعزيز مهارات طفلك.' : 'تصميم وتكليف المهام لتعزيز مهارات الطفل اليومية.'}
          </p>
        </div>
        {!isParent && (
          <Button 
            className="gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 px-6 rounded-2xl font-bold"
            onClick={() => {
              setEditingActivity(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-5 w-5" /> إضافة نشاط جديد
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 max-w-md rounded-2xl border bg-white px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Search className="h-5 w-5 text-slate-400" />
        <Input 
          placeholder="ابحث عن نشاط باسمه أو فئته..." 
          className="border-0 focus-visible:ring-0 shadow-none bg-transparent h-10 text-right text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && !activities ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-[2rem]" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-[2rem] bg-slate-50/50">
          <div className="bg-white p-4 rounded-full w-fit mx-auto mb-4 shadow-sm">
            <ActivityIcon className="h-10 w-10 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">لا توجد أنشطة مسجلة حالياً.</p>
          <p className="text-slate-400 text-sm mt-1">ابدأ بإضافة نشاطك الأول لمتابعة تقدم الأطفال.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered?.map((activity) => (
            <Card key={activity.id} className="group rounded-[2rem] border-none shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white overflow-hidden">
              <CardHeader className="pb-4 text-right">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="secondary" className="px-3 py-1 rounded-xl bg-slate-100 text-slate-600 font-bold border-none">
                    {activity.category}
                  </Badge>
                  {!isParent && (
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
                          <MoreVertical className="h-5 w-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="rounded-xl p-1 w-44">
                        <DropdownMenuItem className="gap-3 rounded-lg py-2" onClick={() => router.push(`/dashboard/activities/${activity.id}`)}>
                          <Eye className="h-4 w-4 text-primary" /> عرض النشاط
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 rounded-lg py-2" onClick={() => openEditForm(activity)}>
                          <Edit className="h-4 w-4 text-accent" /> تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 rounded-lg py-2 text-rose-500 focus:bg-rose-50" onClick={() => handleDelete(activity.id)}>
                          <Trash2 className="h-4 w-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {isParent && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100" onClick={() => router.push(`/dashboard/activities/${activity.id}`)}>
                      <Eye className="h-5 w-5 text-slate-400" />
                    </Button>
                  )}
                </div>
                <CardTitle className="text-2xl font-headline text-slate-800 leading-tight">
                  {activity.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 mt-2 leading-relaxed text-slate-500">
                  {activity.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                <div className="flex flex-wrap gap-4 text-xs font-bold justify-end">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-500">
                    <Clock className="h-4 w-4" /> {activity.duration} دقيقة
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${getDifficultyColor(activity.difficulty)}`}>
                    <BarChart className="h-4 w-4" /> {activity.difficulty}
                  </div>
                </div>
                <div className="pt-5 border-t border-slate-50 flex justify-between items-center">
                   {getStatusBadge(activity.status)}
                   <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto font-bold text-primary hover:no-underline group" 
                    onClick={() => router.push(`/dashboard/activities/${activity.id}`)}
                   >
                    {isParent ? 'ابدأ النشاط' : 'التفاصيل'} <Plus className="h-3 w-3 mr-1 transition-transform group-hover:rotate-90" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isParent && (
        <ActivityFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          activity={editingActivity} 
        />
      )}
    </div>
  );
}
