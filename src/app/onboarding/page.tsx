
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Heart, 
  Building2, 
  CreditCard, 
  UserCircle, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  Loader2,
  ShieldCheck,
  MessageSquare
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, title: "هوية المركز", icon: Building2 },
  { id: 2, title: "اختيار الباقة", icon: CreditCard },
  { id: 3, title: "حساب المدير", icon: UserCircle },
  { id: 4, title: "جاهز للانطلاق", icon: Sparkles },
];

export default function OnboardingPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    centerName: "",
    address: "",
    phone: "",
    plan: "Starter",
    adminName: "",
    adminEmail: "",
    adminPassword: ""
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleComplete = async () => {
    if (!db) return;
    setLoading(true);

    try {
      const batch = writeBatch(db);
      const centerId = `center-${Math.random().toString(36).substr(2, 9)}`;
      const centerRef = doc(db, "centers", centerId);

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      batch.set(centerRef, {
        name: formData.centerName,
        address: formData.address,
        phone: formData.phone,
        plan: formData.plan,
        subscriptionStatus: "Trial",
        trialEndDate: trialEndDate.toISOString(),
        status: "Active",
        createdAt: serverTimestamp(),
        currency: "ج.م"
      });

      const adminId = `user-${Math.random().toString(36).substr(2, 9)}`;
      const userRef = doc(db, "users", adminId);
      batch.set(userRef, {
        displayName: formData.adminName,
        email: formData.adminEmail,
        role: "Admin",
        centerId: centerId,
        createdAt: serverTimestamp()
      });

      await batch.commit();

      const mockUser = {
        uid: adminId,
        email: formData.adminEmail,
        displayName: formData.adminName,
        role: "Admin",
        centerId: centerId
      };
      localStorage.setItem('tamaanina_mock_user', JSON.stringify(mockUser));

      toast({
        title: "تم إعداد مركزك بنجاح!",
        description: "بدأت الآن فترة تجريبية مجانية لمدة 14 يوماً.",
      });

      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: "فشلت عملية التهيئة، يرجى المحاولة لاحقاً.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-10" dir="rtl">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl space-y-10 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-primary rounded-2xl shadow-xl shadow-primary/20">
            <Heart className="h-10 w-10 text-white" fill="white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold font-headline text-slate-900">مرحباً بك في طمأنينة</h1>
            <p className="text-slate-500 font-medium">ابدأ تجربتك المجانية لمدة 14 يوماً الآن</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex justify-between px-2">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                  currentStep >= step.id ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  currentStep >= step.id ? 'text-primary' : 'text-slate-300'
                }`}>{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={(currentStep / 4) * 100} className="h-2" />
        </div>

        {/* Wizard Content */}
        <Card className="border-none shadow-[0_30px_100px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardContent className="p-10 sm:p-12">
            
            {/* Step 1: Center Details */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="space-y-2 mb-8">
                  <h2 className="text-2xl font-bold font-headline">معلومات المركز العلاجي</h2>
                  <p className="text-sm text-slate-400">أدخل البيانات الأساسية لمنشأتك للبدء.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold mr-1">اسم المركز / العيادة</Label>
                    <Input 
                      placeholder="مركز الأمل للتأهيل" 
                      className="h-12 rounded-xl"
                      value={formData.centerName}
                      onChange={(e) => updateFormData('centerName', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold mr-1">رقم هاتف التواصل للمركز</Label>
                      <Input 
                        placeholder="01XXXXXXXXX" 
                        className="h-12 rounded-xl"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold mr-1">العنوان (المدينة)</Label>
                      <Input 
                        placeholder="القاهرة، مصر" 
                        className="h-12 rounded-xl"
                        value={formData.address}
                        onChange={(e) => updateFormData('address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Plan Selection */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="space-y-2 mb-8">
                  <h2 className="text-2xl font-bold font-headline">اختر الباقة للتجربة</h2>
                  <p className="text-sm text-slate-400">ستحصل على كافة ميزات الباقة المختار لمدة 14 يوماً مجاناً.</p>
                </div>
                <RadioGroup 
                  defaultValue={formData.plan} 
                  onValueChange={(v) => updateFormData('plan', v)}
                  className="grid gap-4"
                >
                  {[
                    { id: 'Starter', name: 'البداية (Starter)', desc: 'حتى 10 أطفال و2 أخصائيين', price: '500 ج.م' },
                    { id: 'Professional', name: 'الاحترافية (Pro)', desc: 'حتى 50 طفلاً و10 أخصائيين', price: '1,200 ج.م', popular: true },
                    { id: 'Enterprise', name: 'الشركات (Enterprise)', desc: 'أطفال وأخصائيين غير محدود', price: 'حسب الطلب' },
                  ].map((p) => (
                    <Label 
                      key={p.id}
                      className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.plan === p.id ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value={p.id} id={p.id} className="sr-only" />
                        <div className="space-y-1">
                          <p className="font-bold text-lg flex items-center gap-2">
                            {p.name}
                            {p.popular && <span className="bg-primary/10 text-primary text-[8px] px-2 py-0.5 rounded-full">الأكثر طلباً</span>}
                          </p>
                          <p className="text-xs text-slate-400">{p.desc}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-primary">{p.price}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 3: Admin Account */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="space-y-2 mb-8">
                  <h2 className="text-2xl font-bold font-headline">بيانات حساب المدير</h2>
                  <p className="text-sm text-slate-400">هذا الحساب سيمتلك الصلاحيات الكاملة لإدارة المركز.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold mr-1">اسم المدير الكامل</Label>
                    <Input 
                      placeholder="أ/ أحمد محمد" 
                      className="h-12 rounded-xl"
                      value={formData.adminName}
                      onChange={(e) => updateFormData('adminName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold mr-1">البريد الإلكتروني المهني</Label>
                    <Input 
                      type="email" 
                      placeholder="admin@center.com" 
                      className="h-12 rounded-xl text-left"
                      dir="ltr"
                      value={formData.adminEmail}
                      onChange={(e) => updateFormData('adminEmail', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold mr-1">كلمة المرور</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-12 rounded-xl text-left"
                      dir="ltr"
                      value={formData.adminPassword}
                      onChange={(e) => updateFormData('adminPassword', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Final Summary */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 text-center">
                <div className="mx-auto p-6 bg-emerald-50 text-emerald-500 rounded-full w-fit">
                   <ShieldCheck className="h-16 w-16" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold font-headline text-slate-900">أنت على وشك الانطلاق!</h2>
                  <p className="text-slate-400">ستبدأ فترة تجريبية مجانية لمركز "{formData.centerName}" على باقة {formData.plan}.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-right">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المركز</p>
                    <p className="text-sm font-bold text-slate-700">{formData.centerName}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المدة</p>
                    <p className="text-sm font-bold text-slate-700">14 يوماً مجاناً</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed italic">بالنقر على "بدء التجربة"، أنت توافق على شروط الخدمة وسياسة الخصوصية.</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-12">
              {currentStep > 1 && (
                <Button 
                  variant="outline" 
                  className="flex-1 h-14 rounded-2xl font-bold gap-2"
                  onClick={prevStep}
                  disabled={loading}
                >
                  <ArrowRight className="h-5 w-5" /> السابق
                </Button>
              )}
              {currentStep < 4 ? (
                <Button 
                  className="flex-[2] h-14 rounded-2xl font-bold gap-2 shadow-2xl shadow-primary/30"
                  onClick={nextStep}
                  disabled={!formData.centerName && currentStep === 1}
                >
                  متابعة <ArrowLeft className="h-5 w-5" />
                </Button>
              ) : (
                <Button 
                  className="flex-[2] h-14 rounded-2xl font-bold gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-2xl shadow-emerald-500/20"
                  onClick={handleComplete}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                  تأكيد وبدء التجربة
                </Button>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Help Link */}
        <div className="text-center flex flex-col items-center gap-4">
          <Button variant="link" className="text-slate-400 hover:text-primary font-bold" onClick={() => router.push('/login')}>
            لديك حساب بالفعل؟ سجل دخولك
          </Button>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/50 px-4 py-2 rounded-full border">
             <MessageSquare className="h-3 w-3 text-green-500" /> هل تواجه مشكلة؟ 
             <a href="https://wa.me/201005592947" className="text-primary hover:underline">تحدث معنا عبر واتساب</a>
          </div>
        </div>
      </div>
    </div>
  );
}
