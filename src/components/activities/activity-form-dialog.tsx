
"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useCollection } from "@/firebase";
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

const formSchema = z.object({
  title: z.string().min(2, "العنوان يجب أن يكون أكثر من حرفين"),
  description: z.string().optional(),
  category: z.enum(["حركي", "لغوي", "إدراكي", "اجتماعي", "حسي"]),
  difficulty: z.enum(["سهل", "متوسط", "صعب"]),
  duration: z.coerce.number().min(1, "المدة يجب أن تكون دقيقة واحدة على الأقل"),
  instructions: z.string().optional(),
  therapistId: z.string().min(1, "يجب اختيار أخصائي مسؤول"),
  childId: z.string().min(1, "يجب اختيار طفل مسند له النشاط"),
  status: z.enum(["جديد", "قيد التنفيذ", "مكتمل"]),
});

type ActivityFormValues = z.infer<typeof formSchema>;

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: any;
}

export function ActivityFormDialog({ open, onOpenChange, activity }: ActivityFormDialogProps) {
  const db = useFirestore();
  
  const therapistsQuery = useMemo(() => db ? query(collection(db, "therapists"), orderBy("name", "asc")) : null, [db]);
  const childrenQuery = useMemo(() => db ? query(collection(db, "children"), orderBy("fullName", "asc")) : null, [db]);
  
  const { data: therapists } = useCollection(therapistsQuery);
  const { data: children } = useCollection(childrenQuery);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "إدراكي",
      difficulty: "متوسط",
      duration: 15,
      instructions: "",
      therapistId: "",
      childId: "",
      status: "جديد",
    },
  });

  useEffect(() => {
    if (activity) {
      form.reset({
        title: activity.title,
        description: activity.description || "",
        category: activity.category,
        difficulty: activity.difficulty,
        duration: activity.duration,
        instructions: activity.instructions || "",
        therapistId: activity.therapistId,
        childId: activity.childId,
        status: activity.status || "جديد",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        category: "إدراكي",
        difficulty: "متوسط",
        duration: 15,
        instructions: "",
        therapistId: "",
        childId: "",
        status: "جديد",
      });
    }
  }, [activity, form, open]);

  const onSubmit = async (values: ActivityFormValues) => {
    if (!db) return;

    if (activity) {
      const docRef = doc(db, "activities", activity.id);
      updateDoc(docRef, { ...values }).catch(async (err) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: docRef.path,
          operation: "update",
          requestResourceData: values
        }));
      });
    } else {
      const collectionRef = collection(db, "activities");
      addDoc(collectionRef, {
        ...values,
        createdAt: serverTimestamp(),
      }).catch(async (err) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: collectionRef.path,
          operation: "create",
          requestResourceData: values
        }));
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="font-headline text-2xl">{activity ? "تعديل النشاط العلاجي" : "إضافة نشاط علاجي جديد"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 text-right">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم النشاط</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: تمرين التركيز اللحظي" className="text-right" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفئة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        <SelectItem value="حركي">حركي</SelectItem>
                        <SelectItem value="لغوي">لغوي</SelectItem>
                        <SelectItem value="إدراكي">إدراكي</SelectItem>
                        <SelectItem value="اجتماعي">اجتماعي</SelectItem>
                        <SelectItem value="حسي">حسي</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مستوى الصعوبة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر المستوى" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        <SelectItem value="سهل">سهل</SelectItem>
                        <SelectItem value="متوسط">متوسط</SelectItem>
                        <SelectItem value="صعب">صعب</SelectItem>
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
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدة (دقائق)</FormLabel>
                    <FormControl>
                      <Input type="number" className="text-right" {...field} />
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
                    <FormLabel>حالة النشاط</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        <SelectItem value="جديد">جديد</SelectItem>
                        <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                        <SelectItem value="مكتمل">مكتمل</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <FormField
                control={form.control}
                name="therapistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأخصائي المسؤول</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر الأخصائي" />
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
              <FormField
                control={form.control}
                name="childId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطفل المستهدف</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر الطفل" />
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea placeholder="وصف موجز لأهداف النشاط..." className="text-right" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تعليمات التنفيذ</FormLabel>
                  <FormControl>
                    <Textarea placeholder="الخطوات العملية لتنفيذ النشاط..." className="min-h-[100px] text-right" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0 mt-6">
              <Button type="submit" className="w-full font-bold shadow-lg shadow-primary/20">
                {activity ? "تحديث النشاط" : "حفظ وإسناد النشاط"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
