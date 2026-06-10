
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore } from "@/firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "اسم المركز مطلوب"),
  address: z.string().optional(),
  phone: z.string().optional(),
  plan: z.enum(["Starter", "Professional", "Enterprise"]),
  status: z.enum(["Active", "Suspended"]).default("Active"),
  currency: z.string().default("ج.م"),
});

type CenterFormValues = z.infer<typeof formSchema>;

interface CenterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center?: any;
}

export function CenterFormDialog({ open, onOpenChange, center }: CenterFormDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<CenterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      plan: "Starter",
      status: "Active",
      currency: "ج.م",
    },
  });

  useEffect(() => {
    if (center) {
      form.reset({
        name: center.name,
        address: center.address || "",
        phone: center.phone || "",
        plan: center.plan,
        status: center.status || "Active",
        currency: center.currency || "ج.م",
      });
    } else {
      form.reset({
        name: "", address: "", phone: "", plan: "Starter", status: "Active", currency: "ج.م"
      });
    }
  }, [center, form, open]);

  const onSubmit = async (values: CenterFormValues) => {
    if (!db) return;
    setLoading(true);

    try {
      if (center) {
        await updateDoc(doc(db, "centers", center.id), { ...values });
        toast({ title: "تم التعديل", description: "تم تحديث بيانات المركز بنجاح" });
      } else {
        await addDoc(collection(db, "centers"), {
          ...values,
          createdAt: serverTimestamp(),
        });
        toast({ title: "تمت الإضافة", description: "تم تسجيل المركز الجديد في المنصة" });
      }
      onOpenChange(false);
    } catch (e) {
      toast({ title: "خطأ", description: "فشلت العملية، يرجى المحاولة لاحقاً", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
            <Building2 className="h-6 w-6 text-indigo-600" /> {center ? "تعديل بيانات المركز" : "إضافة مركز علاج جديد"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-right py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المركز</FormLabel>
                  <FormControl><Input placeholder="مركز التفاؤل للتأهيل" className="rounded-xl h-11" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>باقة الاشتراك</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="اختر الباقة" /></SelectTrigger></FormControl>
                      <SelectContent dir="rtl">
                        <SelectItem value="Starter">Starter (بداية)</SelectItem>
                        <SelectItem value="Professional">Professional (احترافي)</SelectItem>
                        <SelectItem value="Enterprise">Enterprise (شركات)</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <FormControl><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="حالة الحساب" /></SelectTrigger></FormControl>
                      <SelectContent dir="rtl">
                        <SelectItem value="Active">نشط</SelectItem>
                        <SelectItem value="Suspended">معلق</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان</FormLabel>
                  <FormControl><Input className="rounded-xl h-11" {...field} /></FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم التواصل</FormLabel>
                  <FormControl><Input className="rounded-xl h-11" {...field} /></FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="mt-8 border-t pt-6">
              <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl shadow-lg shadow-indigo-100" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (center ? "حفظ التغييرات" : "تأكيد إضافة المركز")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
