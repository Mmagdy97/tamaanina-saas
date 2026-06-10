
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, doc, serverTimestamp, runTransaction } from "firebase/firestore";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const formSchema = z.object({
  amount: z.coerce.number().min(1, "المبلغ يجب أن يكون أكبر من صفر"),
  date: z.string().min(1, "التاريخ مطلوب"),
  method: z.enum(["نقدي", "تحويل بنكي", "بطاقة مدى", "أخرى"]),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof formSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  childName: string;
}

export function PaymentDialog({ open, onOpenChange, childId, childName }: PaymentDialogProps) {
  const db = useFirestore();
  const { centerId, profile } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      method: "نقدي",
      notes: "",
    },
  });

  const onSubmit = async (values: PaymentFormValues) => {
    if (!db || !childId || !centerId) return;
    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const childRef = doc(db, "centers", centerId, "children", childId);
        const childSnap = await transaction.get(childRef);
        
        if (!childSnap.exists()) throw new Error("الملف غير موجود");

        const childData = childSnap.data();
        const newAmountPaid = (childData.amountPaid || 0) + values.amount;
        const totalAmount = childData.totalAmount || 0;
        const newBalance = totalAmount - newAmountPaid;
        
        let newStatus = "مدفوع جزئياً";
        if (newBalance <= 0) newStatus = "مدفوع";
        if (newAmountPaid <= 0) newStatus = "غير مدفوع";

        // 1. Create Payment record
        const paymentRef = collection(db, "centers", centerId, "payments");
        const newPaymentDocRef = doc(paymentRef);
        transaction.set(newPaymentDocRef, {
          ...values,
          childId,
          createdAt: serverTimestamp(),
        });

        // 2. Update Child totals
        transaction.update(childRef, {
          amountPaid: newAmountPaid,
          remainingBalance: Math.max(0, newBalance),
          paymentStatus: newStatus
        });

        // 3. Log Activity
        const logRef = doc(collection(db, "centers", centerId, "activityLogs"));
        transaction.set(logRef, {
          userName: profile?.displayName || "مستخدم",
          userEmail: profile?.email || "",
          action: "استلام دفعة مالية",
          details: `تحصيل مبلغ ${values.amount} ج.م من حساب الطفل: ${childName}`,
          createdAt: serverTimestamp()
        });
      });

      toast({ title: "تم تسجيل الدفعة", description: `تمت إضافة ${values.amount} ج.م لحساب ${childName}` });
      form.reset();
      onOpenChange(false);
    } catch (err) {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: `centers/${centerId}/payments`,
        operation: "write",
        requestResourceData: values
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
            <CreditCard className="h-6 w-6 text-primary" /> تسجيل دفعة جديدة
          </DialogTitle>
        </DialogHeader>
        <div className="bg-slate-50 p-4 rounded-xl text-sm mb-4 border border-slate-100">
           تأكيد استلام مبلغ مالي للطفل: <span className="font-bold text-primary">{childName}</span>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-right">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المبلغ (ج.م)</FormLabel>
                  <FormControl>
                    <Input type="number" className="text-right text-lg font-bold h-12" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الدفع</FormLabel>
                    <FormControl>
                      <Input type="date" className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>طريقة الدفع</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر الطريقة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        <SelectItem value="نقدي">نقدي</SelectItem>
                        <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                        <SelectItem value="بطاقة مدى">بطاقة مدى</SelectItem>
                        <SelectItem value="أخرى">أخرى</SelectItem>
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
                  <FormLabel>ملاحظات إضافية</FormLabel>
                  <FormControl>
                    <Textarea placeholder="رقم العملية، اسم المحول..." className="text-right h-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full h-12 font-bold bg-primary shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "تأكيد واستلام المبلغ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
