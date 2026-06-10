
"use client";

import { useState, useMemo } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, deleteDoc, doc, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Mail, 
  Users, 
  Edit, 
  Trash2,
  Phone,
  Search,
  Eye,
  Briefcase
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TherapistFormDialog } from "@/components/therapists/therapist-form-dialog";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";

export default function TherapistsPage() {
  const router = useRouter();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState<any>(null);

  // Optimized query with memoization
  const therapistsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "therapists"), orderBy("name", "asc"), limit(24));
  }, [db]);

  const { data: therapists, loading } = useCollection(therapistsQuery);

  const filtered = therapists?.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!db || !confirm("هل أنت متأكد من حذف هذا الأخصائي؟")) return;
    
    const docRef = doc(db, "therapists", id);
    deleteDoc(docRef).catch(async (err) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: docRef.path,
        operation: "delete"
      }));
    });
  };

  const openEditForm = (therapist: any) => {
    setEditingTherapist(therapist);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">دليل الأخصائيين</h1>
          <p className="text-muted-foreground">إدارة فريق العمل وتوزيع الحالات العلاجية.</p>
        </div>
        <Button 
          className="gap-2 bg-primary hover:bg-primary/90 shadow-md"
          onClick={() => {
            setEditingTherapist(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> إضافة أخصائي جديد
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm rounded-lg border bg-card px-3 py-1 shadow-sm focus-within:ring-1 focus-within:ring-primary/30 transition-all">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="تصفية بالاسم أو التخصص..." 
          className="border-0 focus-visible:ring-0 shadow-none bg-transparent h-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && !therapists ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="bg-secondary/30 pb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <div className="pt-4 border-t flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground font-medium">لم يتم العثور على أخصائيين يطابقون بحثك.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered?.map((t) => (
            <Card key={t.id} className="overflow-hidden group hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-secondary/30 pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-primary group-hover:text-primary/80">{t.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground bg-white/50">
                      {t.specialization}
                    </Badge>
                  </div>
                  <Badge variant={t.availability === 'متاح' ? 'default' : t.availability === 'في جلسة' ? 'secondary' : 'outline'}>
                    {t.availability}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col gap-2.5 text-sm">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-primary/60" />
                    <span className="truncate">{t.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-primary/60" />
                    <span>{t.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Briefcase className="h-3.5 w-3.5 text-primary/60" />
                    <span>{t.experienceYears} سنوات خبرة مهنية</span>
                  </div>
                </div>
                
                <div className="pt-4 flex items-center justify-between border-t gap-2 mt-2">
                  <div className="flex gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                      onClick={() => openEditForm(t)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 gap-2 border-primary/20 hover:border-primary hover:bg-primary/5"
                    onClick={() => router.push(`/dashboard/therapists/${t.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5" /> عرض الملف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TherapistFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        therapist={editingTherapist} 
      />
    </div>
  );
}
