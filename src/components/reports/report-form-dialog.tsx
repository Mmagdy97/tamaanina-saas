
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  childId: z.string().min(1, "يجب اختيار طفل"),
  therapistId: z.string().min(1, "يجب اختيار أخصائي"),
  sessionDate: z.string().min(1, "يجب تحديد تاريخ الجلسة"),
  notes: z.string().min(10, "الملاحظات يجب أن تكون 10 أحرف على الأقل"),
  evaluation: z.string().min(5, "التقييم مطلوب"),
  recommendations: z.string().optional(),
  status: z.enum(["نشط", "مؤرشف"]),
});

type ReportFormValues = z.infer<typeof formSchema>;

interface ReportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: any;
}

export function ReportFormDialog({ open, onOpenChange, report }: ReportFormDialogProps) {
  const db = useFirestore();
  const { centerId, profile } = useUser();
  const [saving, setSaving] = useState(false);
  
  const therapistsQuery = useMemo(() => {
    if (!db || !centerId) return null;
    return query(collection(db, "centers", centerId, "therapists"), orderBy("name", "asc"));
  }, [db, centerId]);
  const childrenQuery = useMemo(() => {
    if (!db || !centerId) return null;
    return query(collection(db, "centers", centerId, "children"), orderBy("fullName", "asc"));
  }, [db, centerId]);
  
  const { data: therapists } = useCollection(therapistsQuery);
  const { data: children } = useCollection(childrenQuery);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      childId: "",
      therapistId: "",
      sessionDate: new Date().toISOString().split('T')[0],
      notes: "",
      evaluation: "",
      recommendations: "",
      status: "نشط",
    },
  });

  useEffect(() => {
    if (report) {
      form.reset({
        childId: report.childId,
        therapistId: report.therapistId,
        sessionDate: report.sessionDate,
        notes: report.notes,
        evaluation: report.evaluation,
        recommendations: report.recommendations || "",
        status: report.status,
      });
    } else {
      form.reset({
        childId: "",
        therapistId: "",
        sessionDate: new Date().toISOString().split('T')[0],
        notes: "",
        evaluation: "",
        recommendations: "",
        status: "نشط",
      });
    }
  }, [report, form, open]);

  const onSubmit = async (values: ReportFormValues) => {
    if (!db || !centerId) return;
    setSaving(true);

    try {
      const childName = children?.find(c => c.id === values.childId)?.fullName || "طفل";

      if (report) {
        const docRef = doc(db, "centers", centerId, "reports", report.id);
        await updateDoc(docRef, { ...values });

        // Log Activity
        await addDoc(collection(db, "centers", centerId, "activityLogs"), {
          userName: profile?.displayName || "مستخدم",
          userEmail: profile?.email || "",
          action: "تحديث تقرير تقدم",
          details: `تعديل تقرير الطفل: ${childName} لجلسة ${values.sessionDate}`,
          createdAt: serverTimestamp()
        });
      } else {
        const collectionRef = collection(db, "centers", centerId, "reports");
        await addDoc(collectionRef, {
          ...values,
          createdAt: serverTimestamp(),
        });

        // Log Activity
        await addDoc(collection(db, "centers", centerId, "activityLogs"), {
          userName: profile?.displayName || "مستخدم",
          userEmail: profile?.email || "",
          action: "إصدار تقرير جديد",
          details: `إنشاء تقرير تقدم للطفل: ${childName} لجلسة ${values.sessionDate}`,
          createdAt: serverTimestamp()
        });
      }
      onOpenChange(false);
    } catch (err) {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: `centers/${centerId}/reports`,
        operation: report ? "update" : "create",
        requestResourceData: values
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{report ? "تعديل التقرير" : "إنشاء تقرير جلسة جديد"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 text-right">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="childId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطفل</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر طفلاً" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        {children?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="therapistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأخصائي</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر أخصائياً" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        {therapists?.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sessionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الجلسة</FormLabel>
                    <FormControl>
                      <Input type="date" className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="حالة التقرير" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        <SelectItem value="نشط">نشط</SelectItem>
                        <SelectItem value="مؤرشف">مؤرشف</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات الجلسة</FormLabel>
                  <FormControl>
                    <Textarea placeholder="سجل تفاصيل ما حدث خلال الجلسة..." className="min-h-[120px] text-right" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evaluation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التقييم</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: تقدم ملحوظ في التواصل البصري" className="text-right" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التوصيات</FormLabel>
                  <FormControl>
                    <Textarea placeholder="التدريبات أو النصائح للجلسة القادمة أو لولي الأمر..." className="text-right" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="submit" className="w-full font-bold" disabled={saving}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (report ? "تحديث التقرير" : "حفظ التقرير")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
