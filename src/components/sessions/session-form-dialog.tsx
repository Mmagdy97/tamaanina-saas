
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, orderBy, getDoc } from "firebase/firestore";
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
  date: z.string().min(1, "يجب تحديد التاريخ"),
  time: z.string().min(1, "يجب تحديد الوقت"),
  type: z.enum(["نطق وتخاطب", "علاج وظيفي", "علاج سلوكي", "تعديل سلوك", "تقييم"]),
  status: z.enum(["مجدولة", "حضر", "غاب", "اعتذر", "مؤجل", "مكتملة"]),
  notes: z.string().optional(),
});

type SessionFormValues = z.infer<typeof formSchema>;

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: any;
}

export function SessionFormDialog({ open, onOpenChange, session }: SessionFormDialogProps) {
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

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      childId: "",
      therapistId: "",
      date: new Date().toISOString().split('T')[0],
      time: "10:00",
      type: "نطق وتخاطب",
      status: "مجدولة",
      notes: "",
    },
  });

  useEffect(() => {
    if (session) {
      form.reset({
        childId: session.childId,
        therapistId: session.therapistId,
        date: session.date,
        time: session.time,
        type: session.type,
        status: session.status,
        notes: session.notes || "",
      });
    } else {
      form.reset({
        childId: "",
        therapistId: "",
        date: new Date().toISOString().split('T')[0],
        time: "10:00",
        type: "نطق وتخاطب",
        status: "مجدولة",
        notes: "",
      });
    }
  }, [session, form, open]);

  const onSubmit = async (values: SessionFormValues) => {
    if (!db || !centerId) return;
    setSaving(true);

    try {
      const childName = children?.find(c => c.id === values.childId)?.fullName || "طفل";

      if (session) {
        const docRef = doc(db, "centers", centerId, "sessions", session.id);
        await updateDoc(docRef, { ...values });

        // Log Activity
        await addDoc(collection(db, "centers", centerId, "activityLogs"), {
          userName: profile?.displayName || "مستخدم",
          userEmail: profile?.email || "",
          action: "تعديل موعد جلسة",
          details: `تحديث موعد جلسة للطفل: ${childName} بتاريخ ${values.date}`,
          createdAt: serverTimestamp()
        });
      } else {
        const collectionRef = collection(db, "centers", centerId, "sessions");
        await addDoc(collectionRef, {
          ...values,
          createdAt: serverTimestamp(),
        });

        // Log Activity
        await addDoc(collection(db, "centers", centerId, "activityLogs"), {
          userName: profile?.displayName || "مستخدم",
          userEmail: profile?.email || "",
          action: "جدولة جلسة جديدة",
          details: `حجز جلسة ${values.type} للطفل: ${childName} بتاريخ ${values.date}`,
          createdAt: serverTimestamp()
        });
      }
      onOpenChange(false);
    } catch (err) {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: `centers/${centerId}/sessions`,
        operation: session ? "update" : "create",
        requestResourceData: values
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="font-headline text-2xl">{session ? "تعديل الجلسة" : "جدولة جلسة جديدة"}</DialogTitle>
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
                    <FormLabel>الأخصائي المسؤول</FormLabel>
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
                name="date"
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
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوقت</FormLabel>
                    <FormControl>
                      <Input type="time" className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الجلسة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        <SelectItem value="نطق وتخاطب">نطق وتخاطب</SelectItem>
                        <SelectItem value="علاج وظيفي">علاج وظيفي</SelectItem>
                        <SelectItem value="علاج سلوكي">علاج سلوكي</SelectItem>
                        <SelectItem value="تعديل سلوك">تعديل سلوك</SelectItem>
                        <SelectItem value="تقييم">تقييم</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حالة الجلسة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        <SelectItem value="مجدولة">مجدولة</SelectItem>
                        <SelectItem value="حضر">حضر</SelectItem>
                        <SelectItem value="غاب">غاب</SelectItem>
                        <SelectItem value="اعتذر">اعتذر</SelectItem>
                        <SelectItem value="مؤجل">مؤجل</SelectItem>
                        <SelectItem value="مكتملة">مكتملة</SelectItem>
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
                  <FormLabel>ملاحظات سريعة</FormLabel>
                  <FormControl>
                    <Textarea placeholder="ملاحظات أولية عن الجلسة..." className="text-right" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full font-bold shadow-lg shadow-primary/20" disabled={saving}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (session ? "تحديث الجلسة" : "تأكيد الجدولة")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
