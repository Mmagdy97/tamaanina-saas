
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, "الاسم يجب أن يكون أكثر من حرفين"),
  age: z.coerce.number().min(1, "العمر يجب أن يكون سنة على الأقل"),
  gender: z.enum(["ذكر", "أنثى"]),
  diagnosis: z.string().optional(),
  parentName: z.string().min(2, "اسم ولي الأمر مطلوب"),
  parentPhone: z.string().min(8, "رقم الهاتف غير صحيح"),
  assignedTherapistId: z.string().optional(),
  treatmentPlan: z.string().optional(),
  status: z.enum(["نشط", "قيد الانتظار", "مكتمل"]),
  monthlyPlan: z.string().optional(),
  sessionsPurchased: z.coerce.number().default(0),
  sessionPrice: z.coerce.number().default(0),
  totalAmount: z.coerce.number().default(0),
  sessionsCompleted: z.coerce.number().default(0),
  remainingSessions: z.coerce.number().default(0),
  paymentStatus: z.enum(["مدفوع", "مدفوع جزئياً", "غير مدفوع"]).default("غير مدفوع"),
  amountPaid: z.coerce.number().default(0),
  remainingBalance: z.coerce.number().default(0),
});

type ChildFormValues = z.infer<typeof formSchema>;

interface ChildFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child?: any;
}

export function ChildFormDialog({ open, onOpenChange, child }: ChildFormDialogProps) {
  const db = useFirestore();
  const { centerId, profile } = useUser();
  const [saving, setSaving] = useState(false);
  
  const therapistsQuery = useMemo(() => {
    if (!db || !centerId) return null;
    return query(collection(db, "centers", centerId, "therapists"), orderBy("name", "asc"));
  }, [db, centerId]);
  const { data: therapists } = useCollection(therapistsQuery);

  const childrenQuery = useMemo(() => {
    if (!db || !centerId) return null;
    return collection(db, "centers", centerId, "children");
  }, [db, centerId]);
  const { data: children } = useCollection(childrenQuery);

  const centerRef = useMemo(() => db && centerId ? doc(db, "centers", centerId) : null, [db, centerId]);
  const { data: centerData } = useDoc(centerRef);

  const form = useForm<ChildFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "", age: 0, gender: "ذكر", diagnosis: "", parentName: "", parentPhone: "",
      assignedTherapistId: "", treatmentPlan: "", status: "نشط",
      sessionsPurchased: 0, sessionPrice: 0, totalAmount: 0,
      sessionsCompleted: 0, remainingSessions: 0, paymentStatus: "غير مدفوع",
      amountPaid: 0, remainingBalance: 0,
    },
  });

  useEffect(() => {
    if (child) {
      form.reset({
        ...child,
        diagnosis: child.diagnosis || "",
        assignedTherapistId: child.assignedTherapistId || "",
        treatmentPlan: child.treatmentPlan || "",
      });
    } else {
      form.reset({
        fullName: "", age: 0, gender: "ذكر", diagnosis: "", parentName: "", parentPhone: "",
        assignedTherapistId: "", treatmentPlan: "", status: "نشط",
        sessionsPurchased: 0, sessionPrice: 0, totalAmount: 0,
        sessionsCompleted: 0, remainingSessions: 0, paymentStatus: "غير مدفوع",
        amountPaid: 0, remainingBalance: 0,
      });
    }
  }, [child, form, open]);

  const getChildLimit = (plan: string) => {
    if (plan === 'Starter') return 10;
    if (plan === 'Professional') return 50;
    return 999999;
  };

  const isLimitReached = !child && children && centerData && children.length >= getChildLimit(centerData.plan);

  const sessionsPurchased = form.watch("sessionsPurchased");
  const sessionPrice = form.watch("sessionPrice");
  const amountPaid = form.watch("amountPaid");
  const sessionsCompleted = form.watch("sessionsCompleted");

  useEffect(() => {
    const total = sessionsPurchased * sessionPrice;
    const balance = total - amountPaid;
    const remainingSess = Math.max(0, sessionsPurchased - sessionsCompleted);
    form.setValue("totalAmount", total);
    form.setValue("remainingBalance", balance);
    form.setValue("remainingSessions", remainingSess);
  }, [sessionsPurchased, sessionPrice, amountPaid, sessionsCompleted, form]);

  const onSubmit = async (values: ChildFormValues) => {
    if (!db || !centerId || isLimitReached) return;
    setSaving(true);

    try {
      if (child) {
        const docRef = doc(db, "centers", centerId, "children", child.id);
        await updateDoc(docRef, { ...values });
        
        // Log Activity
        await addDoc(collection(db, "centers", centerId, "activityLogs"), {
          userName: profile?.displayName || "مستخدم",
          userEmail: profile?.email || "",
          action: "تعديل ملف طفل",
          details: `تحديث بيانات الطفل: ${values.fullName}`,
          createdAt: serverTimestamp()
        });
      } else {
        const collectionRef = collection(db, "centers", centerId, "children");
        await addDoc(collectionRef, { ...values, createdAt: serverTimestamp() });
        
        // Log Activity
        await addDoc(collection(db, "centers", centerId, "activityLogs"), {
          userName: profile?.displayName || "مستخدم",
          userEmail: profile?.email || "",
          action: "إضافة طفل جديد",
          details: `تسجيل طفل جديد باسم: ${values.fullName}`,
          createdAt: serverTimestamp()
        });
      }
      onOpenChange(false);
    } catch (err) {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: `centers/${centerId}/children`,
        operation: child ? "update" : "create",
        requestResourceData: values
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-2xl font-headline">{child ? "تعديل بيانات الطفل" : "إضافة طفل جديد"}</DialogTitle>
        </DialogHeader>
        
        {isLimitReached && (
          <Alert variant="destructive" className="rounded-2xl bg-rose-50 border-rose-100 mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-bold">تنبيه: تم الوصول للحد الأقصى</AlertTitle>
            <AlertDescription className="text-xs">
              لقد استهلكت الحد الأقصى من الأطفال المسموح به في باقة "{centerData?.plan}". يرجى ترقية الاشتراك لإضافة المزيد.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
                <TabsTrigger value="billing">الاشتراك والفوترة</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl><Input placeholder="أحمد محمد" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel>العمر</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الجنس</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="اختر الجنس" /></SelectTrigger></FormControl>
                        <SelectContent dir="rtl"><SelectItem value="ذكر">ذكر</SelectItem><SelectItem value="أنثى">أنثى</SelectItem></SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة الملف</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger></FormControl>
                        <SelectContent dir="rtl">
                          <SelectItem value="نشط">نشط</SelectItem>
                          <SelectItem value="قيد الانتظار">قيد الانتظار</SelectItem>
                          <SelectItem value="مكتمل">مكتمل</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <FormField control={form.control} name="parentName" render={({ field }) => (
                    <FormItem><FormLabel>ولي الأمر</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="parentPhone" render={({ field }) => (
                    <FormItem><FormLabel>رقم التواصل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="assignedTherapistId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأخصائي المسؤول</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر أخصائياً" /></SelectTrigger></FormControl>
                      <SelectContent dir="rtl">
                        {therapists?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="treatmentPlan" render={({ field }) => (
                  <FormItem><FormLabel>الخطة العلاجية</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="sessionsPurchased" render={({ field }) => (
                    <FormItem><FormLabel>الجلسات المشتراة</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="sessionPrice" render={({ field }) => (
                    <FormItem><FormLabel>سعر الجلسة</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="bg-muted/30 p-4 rounded-xl flex justify-between">
                   <div className="space-y-1"><p className="text-xs text-muted-foreground">الإجمالي</p><p className="text-xl font-bold">{form.watch("totalAmount")} ج.م</p></div>
                   <div className="space-y-1"><p className="text-xs text-muted-foreground">المتبقي</p><p className="text-xl font-bold text-rose-600">{form.watch("remainingBalance")} ج.م</p></div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="border-t pt-4">
              <Button type="submit" className="w-full sm:w-auto font-bold px-10 h-12" disabled={isLimitReached || saving}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (child ? "حفظ التغييرات" : "إضافة الطفل")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
