"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useCollection, useFirestore } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ArrowRight, 
  UserRound, 
  Mail, 
  Phone, 
  Award, 
  Users, 
  Calendar,
  Loader2,
  Briefcase,
  Baby
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TherapistDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();

  const therapistRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, "therapists", id as string);
  }, [db, id]);

  const { data: therapist, loading: therapistLoading } = useDoc(therapistRef);

  // Query children assigned to this therapist
  const childrenQuery = useMemo(() => {
    if (!db || !id) return null;
    return query(collection(db, "children"), where("assignedTherapistId", "==", id));
  }, [db, id]);

  const { data: assignedChildren, loading: childrenLoading } = useCollection(childrenQuery);

  if (therapistLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground italic">لم يتم العثور على ملف الأخصائي.</p>
        <Button variant="link" onClick={() => router.push("/dashboard/therapists")}>
          العودة للقائمة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4" /> العودة
        </Button>
        <Badge variant={therapist.availability === 'متاح' ? 'default' : 'secondary'} className="px-4 py-1">
          {therapist.availability}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 shadow-sm border-primary/10 h-fit">
          <CardHeader className="text-center bg-muted/30 rounded-t-lg">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              <UserRound className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline text-primary">{therapist.name}</CardTitle>
            <CardDescription className="font-medium text-accent">{therapist.specialization}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase">التواصل</p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {therapist.email}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {therapist.phone}
              </div>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase">الخبرة</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Award className="h-4 w-4 text-accent" />
                {therapist.experienceYears} سنوات في المجال
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-accent" /> النبذة المهنية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 leading-relaxed bg-accent/5 p-4 rounded-lg border border-accent/10">
                {therapist.bio || "لا توجد نبذة تعريفية مسجلة."}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" /> الحالات المسندة ({assignedChildren?.length || 0})
                </CardTitle>
                <CardDescription>قائمة الأطفال الذين يشرف عليهم هذا الأخصائي.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {childrenLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : assignedChildren && assignedChildren.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {assignedChildren.map((child: any) => (
                    <div 
                      key={child.id} 
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/children/${child.id}`)}
                    >
                      <div className="p-2 bg-primary/5 rounded-full">
                        <Baby className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{child.fullName}</p>
                        <p className="text-xs text-muted-foreground">{child.diagnosis}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground text-sm italic">لا توجد حالات مسندة حالياً.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}