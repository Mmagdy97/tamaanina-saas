
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useUser, useDoc, useCollection } from "@/firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp, query } from "firebase/firestore";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون أكثر من حرفين"),
  specialization: z.string().min(2, "التخصص مطلوب"),
  experienceYears: z.coerce.number().min(0, "سنوات الخبرة يجب أن تكون 0 أو أكثر"),
  phone: z.string().min(8, "رقم الهاتف غير صحيح"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  availability: z.enum(["متاح", "في جلسة", "غير متصل"]),
  bio: z.string().optional(),
});

type TherapistFormValues = z.infer<typeof formSchema>;

interface TherapistFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  therapist?: any;
}

export function TherapistFormDialog({ open, onOpenChange, therapist }: TherapistFormDialogProps) {
  const db = useFirestore();
  const { centerId } = useUser();
  const [saving, setSaving] = useState(false);

  const therapistsQuery = useMemo(() => {
    if (!db || !centerId) return null;
    return collection(db, "centers", centerId, "therapists");
  }, [db, centerId]);
  const { data: therapists } = useCollection(therapistsQuery);

  const centerRef = useMemo(() => db && centerId ? doc(db, "centers", centerId) : null, [db, centerId]);
  const { data: centerData } = useDoc(centerRef);

  const form = useForm<TherapistFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", specialization: "", experienceYears: 0, phone: "", email: "", availability: "متاح", bio: "",
    },
  });

  useEffect(() => {
    if (therapist) {
      form.reset(therapist);
    } else {
      form.reset({ name: "", specialization: "", experienceYears: 0, phone: "", email: "", availability: "متاح", bio: "" });
    }
  }, [therapist, form, open]);

  const getTherapistLimit = (plan: string) => {
    if (plan === 'Starter') return 2;
    if (plan === 'Professional') return 10;
    return 999999;
  };

  const isLimitReached = !therapist && therapists && centerData && therapists.length >= getTherapistLimit(centerData.plan);

  const onSubmit = async (values: TherapistFormValues) => {
    if (!db || !centerId || isLimitReached) return;
    setSaving(true);

    try {
      if (therapist) {
        const docRef = doc(db, "centers", centerId, "therapists", therapist.id);
        await updateDoc(docRef, { ...values });
      } else {
        const collectionRef = collection(db, "centers", centerId, "therapists");
        await addDoc(collectionRef, { ...values, createdAt: serverTimestamp() });
      }
      onOpenChange(false);
    } catch (err) {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: `centers/${centerId}/therapists`,
        operation: therapist ? "update" : "create"
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-2xl font-headline">{therapist ? "تعديل بيانات الأخصائي" : "إضافة أخصائي جديد"}</DialogTitle>
        </DialogHeader>

        {isLimitReached && (
          <Alert variant="destructive" className="rounded-2xl bg-rose-50 border-rose-100 mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-bold">تنبيه: تم الوصول للحد الأقصى</AlertTitle>
            <AlertDescription className="text-xs">
              باقة "{centerData?.plan}" تسمح بحد أقصى {getTherapistLimit(centerData?.plan)} أخصائيين فقط.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 text-right">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="specialization" render={({ field }) => (
                <FormItem><FormLabel>التخصص</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="experienceYears" render={({ field }) => (
                <FormItem><FormLabel>سنوات الخبرة</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="availability" render={({ field }) => (
                <FormItem>
                  <FormLabel>الحالة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger></FormControl>
                    <SelectContent dir="rtl">
                      <SelectItem value="متاح">متاح</SelectItem>
                      <SelectItem value="في جلسة">في جلسة</SelectItem>
                      <SelectItem value="غير متصل">غير متصل</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem><FormLabel>نبذة تعريفية</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full sm:w-auto font-bold px-10 h-12" disabled={isLimitReached || saving}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (therapist ? "تحديث البيانات" : "إضافة الأخصائي")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
