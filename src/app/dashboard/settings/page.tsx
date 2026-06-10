
"use client";

import { useEffect, useState, useMemo } from "react";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Save, Loader2, MapPin, Phone, Hash, Clock, Timer, BadgeInfo, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(2, "اسم المركز مطلوب"),
  logoUrl: z.string().optional(),
  address: z.string().min(5, "العنوان مطلوب"),
  phone: z.string().min(8, "رقم الهاتف مطلوب"),
  taxNumber: z.string().optional(),
  workingHours: z.string().optional(),
  sessionDuration: z.coerce.number().min(15).default(45),
  plan: z.enum(["Starter", "Professional", "Enterprise"]).default("Starter"),
});

type SettingsFormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const db = useFirestore();
  const { profile, centerId } = useUser();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const settingsRef = useMemo(() => db && centerId ? doc(db, "centers", centerId) : null, [db, centerId]);
  const { data: settings, loading } = useDoc(settingsRef);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      address: "",
      phone: "",
      taxNumber: "",
      workingHours: "9:00 AM - 9:00 PM",
      sessionDuration: 45,
      plan: "Starter",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name || "",
        logoUrl: settings.logoUrl || "",
        address: settings.address || "",
        phone: settings.phone || "",
        taxNumber: settings.taxNumber || "",
        workingHours: settings.workingHours || "9:00 AM - 9:00 PM",
        sessionDuration: settings.sessionDuration || 45,
        plan: settings.plan || "Starter",
      });
    }
  }, [settings, form]);

  const onSubmit = async (values: SettingsFormValues) => {
    if (profile?.role !== 'Admin') {
      toast({ title: "عذراً", description: "فقط مدير النظام يمكنه تعديل هذه الإعدادات", variant: "destructive" });
      return;
    }

    if (!settingsRef) return;

    setSaving(true);
    try {
      await setDoc(settingsRef, {
        ...values,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast({ title: "تم الحفظ", description: "تم تحديث إعدادات المركز بنجاح" });
    } catch (err) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء حفظ الإعدادات", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getPlanLimits = (plan: string) => {
    switch (plan) {
      case 'Starter': return { children: 10, therapists: 2 };
      case 'Professional': return { children: 50, therapists: 10 };
      case 'Enterprise': return { children: 'غير محدود', therapists: 'غير محدود' };
      default: return { children: 10, therapists: 2 };
    }
  };

  const limits = getPlanLimits(settings?.plan || 'Starter');

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold font-headline text-slate-900 tracking-tight">إعدادات المركز</h1>
          <p className="text-slate-500">إدارة بيانات المنشأة وخطة الاشتراك الحالية.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border">
          <Badge variant="outline" className="px-4 py-1.5 rounded-xl border-primary/20 text-primary font-bold">
            الباقة الحالية: {settings?.plan || 'Starter'}
          </Badge>
          <Button variant="ghost" size="sm" className="text-[10px] font-bold text-slate-400">ترقية الباقة</Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
         {/* Limits Info Sidebar */}
         <Card className="md:col-span-1 rounded-[2rem] border-none shadow-xl bg-slate-900 text-white p-8 overflow-hidden relative h-fit">
            <ShieldCheck className="absolute -bottom-6 -left-6 h-32 w-32 opacity-10" />
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-bold font-headline">حدود الاستخدام</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/10 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[10px] font-bold uppercase opacity-50">عدد الأطفال</p>
                  <p className="text-2xl font-bold">{limits.children}</p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[10px] font-bold uppercase opacity-50">عدد الأخصائيين</p>
                  <p className="text-2xl font-bold">{limits.therapists}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">تعتمد هذه الحدود على باقة الاشتراك المفعلة حالياً لمركزكم.</p>
            </div>
         </Card>

         <div className="md:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card className="rounded-[2rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="flex items-center gap-2 text-xl font-headline">
                      <Building2 className="h-5 w-5 text-primary" /> المعلومات العامة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    {loading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </div>
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم المركز</FormLabel>
                              <FormControl>
                                <Input placeholder="مركز طمأنينة" className="rounded-xl h-11" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>العنوان التفصيلي</FormLabel>
                              <FormControl>
                                <Input className="rounded-xl h-11" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>رقم الهاتف</FormLabel>
                                <FormControl>
                                  <Input className="rounded-xl h-11" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="taxNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>الرقم الضريبي</FormLabel>
                                <FormControl>
                                  <Input className="rounded-xl h-11" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="flex items-center gap-2 text-xl font-headline">
                      <BadgeInfo className="h-5 w-5 text-accent" /> تفاصيل التشغيل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="workingHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ساعات العمل</FormLabel>
                            <FormControl>
                              <Input className="rounded-xl h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sessionDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>مدة الجلسة (دقيقة)</FormLabel>
                            <FormControl>
                              <Input type="number" className="rounded-xl h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    className="h-14 px-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 font-bold gap-2 text-lg"
                    disabled={saving || loading}
                  >
                    {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                    حفظ وتحديث البيانات
                  </Button>
                </div>
              </form>
            </Form>
         </div>
      </div>
    </div>
  );
}
