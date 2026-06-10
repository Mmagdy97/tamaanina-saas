
"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  FileText, 
  Calendar, 
  UserRound, 
  MessageSquare,
  Lightbulb,
  Printer,
  Loader2,
  Building2,
  MapPin,
  Phone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ReportDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();

  const reportRef = useMemo(() => db && id ? doc(db, "reports", id as string) : null, [db, id]);
  const { data: report, loading } = useDoc(reportRef);

  const centerSettingsRef = useMemo(() => db ? doc(db, "settings", "center") : null, [db]);
  const { data: center } = useDoc(centerSettingsRef);

  const childRef = useMemo(() => db && report?.childId ? doc(db, "children", report.childId) : null, [db, report?.childId]);
  const therapistRef = useMemo(() => db && report?.therapistId ? doc(db, "therapists", report.therapistId) : null, [db, report?.therapistId]);
  
  const { data: child } = useDoc(childRef);
  const { data: therapist } = useDoc(therapistRef);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12" dir="rtl">
        <p className="text-muted-foreground italic">لم يتم العثور على التقرير.</p>
        <Button variant="link" onClick={() => router.push("/dashboard/reports")}>
          العودة لقائمة التقارير
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4" /> العودة
        </Button>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> طباعة التقرير
          </Button>
          <Badge variant={report.status === 'نشط' ? 'default' : 'secondary'} className="px-4 py-1">
            {report.status}
          </Badge>
        </div>
      </div>

      {/* Header with Center Branding - Displayed only on Print/Detail */}
      <div className="bg-white p-8 border-b flex justify-between items-center rounded-t-[2rem] shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline text-primary">{center?.name || "مركز طمأنينة"}</h1>
          <div className="flex flex-col text-xs text-slate-400 space-y-1 mt-2">
            <span className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {center?.address || "عنوان المركز"}</span>
            <span className="flex items-center gap-2"><Phone className="h-3 w-3" /> {center?.phone || "رقم التواصل"}</span>
            {center?.taxNumber && <span className="flex items-center gap-2 font-bold">الرقم الضريبي: {center.taxNumber}</span>}
          </div>
        </div>
        <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center">
           <Building2 className="h-10 w-10 text-primary" />
        </div>
      </div>

      <Card className="shadow-lg border-primary/10 overflow-hidden print:shadow-none print:border-0 rounded-b-[2rem] rounded-t-none border-t-0">
        <CardHeader className="bg-slate-50 border-b p-8 text-right">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary uppercase tracking-widest text-[10px] font-bold justify-end">
                تقرير جلسة علاجية <FileText className="h-4 w-4" />
              </div>
              <CardTitle className="text-3xl font-headline text-slate-800">{child?.fullName || 'جارِ التحميل...'}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-slate-500 justify-end font-medium">
                <div className="flex items-center gap-1">
                  <UserRound className="h-4 w-4 text-primary" /> {therapist?.name || 'الأخصائي المسؤول'}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-primary" /> {report.sessionDate}
                </div>
              </div>
            </div>
            <div className="hidden md:block bg-primary/10 p-6 rounded-2xl border border-primary/20 text-center min-w-[150px]">
              <div className="text-[10px] uppercase font-bold text-primary mb-1">التقييم العام</div>
              <div className="text-xl font-bold text-primary">{report.evaluation}</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-10 text-right bg-white">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold justify-end">
                ملاحظات الجلسة <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed text-slate-700 whitespace-pre-wrap min-h-[150px] italic">
                {report.notes}
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2 text-slate-800 font-bold justify-end">
                التوصيات والخطوات القادمة <Lightbulb className="h-5 w-5 text-accent" />
              </div>
              <div className="bg-accent/5 p-6 rounded-2xl border border-accent/10 leading-relaxed text-slate-700 whitespace-pre-wrap min-h-[150px] italic">
                {report.recommendations || "لا توجد توصيات إضافية مسجلة لهذه الجلسة."}
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
             <div className="space-y-1 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-tighter text-[9px]">حالة التقرير</p>
              <p className="font-bold text-slate-700">{report.status}</p>
            </div>
            <div className="space-y-1 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-tighter text-[9px]">تاريخ التوثيق</p>
              <p className="font-bold text-slate-700">{report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : 'غير متوفر'}</p>
            </div>
            <div className="space-y-1 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-tighter text-[9px]">التشخيص المسجل</p>
              <p className="font-bold text-slate-700">{child?.diagnosis || "غير متوفر"}</p>
            </div>
          </div>

          <div className="pt-20 mt-10 border-t flex justify-between items-end opacity-60 text-[10px] font-bold text-slate-400">
            <div className="text-right">
              ختم وتوقيع الأخصائي<br /><br /><br />
              ..........................
            </div>
            <div className="text-left">
               نظام طمأنينة لإدارة مراكز علاج الأطفال<br />
               تم الإنشاء في {new Date().toLocaleDateString('ar-EG')}
            </div>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .max-w-5xl { max-width: 100% !important; margin: 0 !important; }
          .rounded-[2rem] { border-radius: 0 !important; }
          .shadow-lg { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
