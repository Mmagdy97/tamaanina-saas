'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Mail, Heart, ShieldCheck, UserCircle, Briefcase, Baby, Sparkles, ShieldAlert, Eye, EyeOff, Info, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const demoAccounts = [
    { 
      email: 'admin@tamaanina.com', 
      password: 'Mira', 
      role: 'super_admin', 
      name: 'مدير المنصة', 
      desc: 'إدارة المنصة بالكامل والمراكز والاشتراكات.',
      icon: ShieldAlert,
      color: 'indigo'
    },
    { 
      email: 'center@tamaanina.demo', 
      password: '123', 
      role: 'center_admin', 
      name: 'مدير المركز', 
      desc: 'إدارة الأطفال والأخصائيين والجلسات داخل المركز.',
      icon: UserCircle,
      color: 'primary'
    },
    { 
      email: 'therapist@tamaanina.demo', 
      password: '123', 
      role: 'therapist', 
      name: 'الأخصائي', 
      desc: 'متابعة الحالات والأنشطة والتقارير.',
      icon: Briefcase,
      color: 'accent'
    },
    { 
      email: 'parent@tamaanina.demo', 
      password: '123', 
      role: 'parent', 
      name: 'ولي الأمر', 
      desc: 'متابعة الطفل والجلسات والتقارير.',
      icon: Baby,
      color: 'orange'
    },
  ];

  const handleLogin = async (e?: React.FormEvent, targetEmail?: string, targetPass?: string) => {
    if (e) e.preventDefault();
    
    const loginEmail = targetEmail || email;
    const loginPassword = targetPass || password;

    if (!loginEmail || !loginPassword) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال البريد الإلكتروني وكلمة المرور.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const account = demoAccounts.find(acc => acc.email === loginEmail && acc.password === loginPassword);

    if (account) {
      const mockUser = {
        uid: `mock-${account.role}`,
        email: account.email,
        displayName: account.name,
        role: account.role,
        centerId: account.role === 'super_admin' ? 'global' : 'demo-center-1'
      };
      
      localStorage.setItem('tamaanina_mock_user', JSON.stringify(mockUser));
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك مجدداً، ${account.name}`,
      });

      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 800);
    } else {
      toast({
        title: "فشل الدخول",
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleAdminAuth = () => {
    if (adminPassword === 'Mira') {
      setShowAdminDialog(false);
      handleLogin(undefined, 'admin@tamaanina.com', 'Mira');
    } else {
      toast({
        title: "خطأ في الصلاحية",
        description: "كلمة المرور غير صحيحة",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-6 sm:p-10" dir="rtl">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[650px] space-y-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="p-5 bg-primary rounded-[2rem] shadow-2xl shadow-primary/30 rotate-3 hover:rotate-0 transition-all duration-500 cursor-pointer group" onClick={() => router.push('/')}>
            <Heart className="h-12 w-12 text-white group-hover:scale-110 transition-transform" fill="white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold font-headline text-slate-900 tracking-tighter">طمأنينة</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2 justify-center">
              <Sparkles className="h-4 w-4 text-accent" /> منصة الإدارة العلاجية الآمنة
            </p>
          </div>
        </div>

        <Card className="border-none shadow-[0_30px_100px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="pt-12 pb-8 text-center space-y-2">
            <CardTitle className="text-3xl font-bold text-slate-800 font-headline">تسجيل الدخول</CardTitle>
            <CardDescription className="text-slate-500 font-medium">يرجى اختيار نوع الحساب للوصول إلى لوحة التحكم</CardDescription>
          </CardHeader>
          
          <CardContent className="px-10 pb-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {demoAccounts.map((acc) => (
                 <Button 
                  key={acc.role}
                  variant="outline" 
                  className={`flex flex-col items-start h-auto p-6 gap-3 rounded-[2rem] border-slate-100 hover:border-${acc.color === 'primary' ? 'primary/40' : acc.color + '-200'} hover:bg-${acc.color === 'primary' ? 'primary' : acc.color}-50/30 transition-all group text-right whitespace-normal relative overflow-hidden`} 
                  onClick={() => acc.role === 'super_admin' ? setShowAdminDialog(true) : handleLogin(undefined, acc.email, acc.password)}
                >
                  <div className={`p-3 bg-${acc.color === 'primary' ? 'primary/10' : acc.color + '-50'} rounded-2xl group-hover:scale-110 transition-transform`}>
                    <acc.icon className={`h-6 w-6 text-${acc.color === 'primary' ? 'primary' : acc.color + '-600'}`} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-lg font-bold text-slate-800 block">{acc.name}</span>
                    <span className="text-[11px] text-slate-400 font-medium leading-relaxed block">{acc.desc}</span>
                  </div>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
               </Button>
               ))}
            </div>

            <div className="relative pt-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white/50 px-4 text-slate-400 font-bold tracking-widest italic">نظام آمن ومشفر بالكامل</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-8">
            <p className="text-[11px] text-slate-400 text-center w-full italic">بوابة الوصول الآمن لبيانات الرعاية الصحية - حقوق الطبع محفوظة {new Date().getFullYear()}</p>
          </CardFooter>
        </Card>
      </div>

      {/* Super Admin Password Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-sm" dir="rtl">
          <DialogHeader className="text-right space-y-3">
            <div className="p-4 bg-indigo-50 rounded-2xl w-fit mx-auto md:mx-0">
              <Lock className="h-8 w-8 text-indigo-600" />
            </div>
            <DialogTitle className="text-2xl font-bold font-headline">تأكيد هوية مدير المنصة</DialogTitle>
            <DialogDescription className="text-slate-500">هذا الحساب يحتوي على صلاحيات حساسة، يرجى إدخال كلمة المرور للمتابعة.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
             <div className="space-y-2">
               <Label className="mr-1 font-bold text-slate-700">كلمة المرور</Label>
               <Input 
                type="password" 
                placeholder="••••••••" 
                className="h-12 rounded-xl text-center font-mono"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
               />
             </div>
          </div>
          <DialogFooter className="sm:justify-start gap-3">
            <Button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-lg shadow-xl shadow-indigo-100" onClick={handleAdminAuth}>
              تحقق ودخول
            </Button>
            <Button variant="ghost" className="w-full h-12 rounded-xl text-slate-400" onClick={() => setShowAdminDialog(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
