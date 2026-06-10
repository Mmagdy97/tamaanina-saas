
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Heart, 
  CheckCircle2, 
  Users, 
  CalendarDays, 
  Wallet, 
  FileText, 
  Sparkles, 
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Activity,
  Phone,
  LayoutDashboard,
  Baby
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  const { user } = useUser();
  const router = useRouter();

  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image');
  const dashboardImg = PlaceHolderImages.find(img => img.id === 'feature-dashboard');
  const parentImg = PlaceHolderImages.find(img => img.id === 'feature-parent');
  const reportsImg = PlaceHolderImages.find(img => img.id === 'feature-reports');

  const whatsappNumber = "01005592947";
  const generalWhatsappLink = `https://wa.me/201005592947?text=${encodeURIComponent('مرحباً، أرغب في معرفة المزيد عن نظام طمأنينة لإدارة مراكز التخاطب والعلاج.')}`;
  const pricingWhatsappLink = `https://wa.me/201005592947?text=${encodeURIComponent('مرحباً، أرغب في معرفة المزيد عن نظام طمأنينة.')}`;

  const handleWhatsApp = (link = generalWhatsappLink) => {
    window.open(link, '_blank');
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <Heart className="h-6 w-6 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold font-headline text-slate-800 tracking-tighter">طمأنينة</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">المميزات</a>
            <a href="#parent-portal" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">بوابة الوالدين</a>
            <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">الأسعار</a>
            <a href="#contact" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">اتصل بنا</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Button onClick={() => router.push('/dashboard')} className="rounded-xl font-bold">لوحة التحكم</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/login')} className="hidden sm:flex font-bold text-slate-600">تسجيل الدخول</Button>
                <Button onClick={() => router.push('/login')} className="rounded-xl font-bold shadow-lg shadow-primary/20 px-6">ابدأ الآن</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-4 w-4" /> نظام الإدارة المتكامل لمراكز ذوي الاحتياجات الخاصة
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold font-headline leading-[1.1] tracking-tight">
              رعاية حانية، <span className="text-primary">إدارة ذكية</span> لنمو أطفالكم
            </h1>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed font-medium">
              نظام "طمأنينة" هو شريككم الرقمي لإدارة المراكز العلاجية. نوفر للأخصائيين الأدوات الذكية، ولأولياء الأمور نافذة شفافة لمتابعة تقدم أطفالهم لحظة بلحظة.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/30 gap-2" onClick={() => router.push('/login')}>
                احصل على تجربة مجانية <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold border-slate-200 gap-2" onClick={() => handleWhatsApp()}>
                <MessageSquare className="h-5 w-5 text-green-500" /> اطلب عرضاً توضيحياً
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4 text-slate-400">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> <span className="text-sm font-bold">دعم فني 24/7 عبر واتساب</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> <span className="text-sm font-bold">خصوصية تامة للبيانات</span></div>
            </div>
          </div>
          <div className="relative animate-in fade-in zoom-in duration-1000">
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full -z-10" />
            <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50 border-8 border-white">
              <Image 
                src={heroImage?.imageUrl || ''} 
                alt="Tamaanina Hero" 
                width={1200} 
                height={800} 
                className="object-cover"
                data-ai-hint="child therapy center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold font-headline text-slate-900">كل ما يحتاجه مركزك في مكان واحد</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">صممنا "طمأنينة" ليغطي كافة الجوانب التشغيلية والعلاجية والمالية لمركزك.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "إدارة الجلسات", desc: "جدولة ذكية للمواعيد وتتبع الحضور والغياب لحظياً.", icon: CalendarDays, color: "blue" },
              { title: "ملفات المرضى", desc: "سجل طبي وسلوكي متكامل لكل طفل مع تتبع الخطط العلاجية.", icon: Baby, color: "emerald" },
              { title: "الفوترة والاشتراكات", desc: "إدارة الدفعات، الباقات، والمستحقات بالجنيه المصري.", icon: Wallet, color: "amber" },
              { title: "التقارير الذكية", desc: "إنشاء تقارير تقدم دورية احترافية قابلة للطباعة.", icon: FileText, color: "indigo" },
              { title: "بوابة أولياء الأمور", desc: "نافذة خاصة للأهالي لمتابعة التمارين والنتائج.", icon: Users, color: "rose" },
              { title: "الذكاء الاصطناعي", desc: "تحليل ملاحظات الجلسات وتحويلها لملخصات حانية للأهل.", icon: Sparkles, color: "purple" },
              { title: "إدارة الأنشطة", desc: "تكليف الأطفال بمهام منزلية وتعزيز المهارات يومياً.", icon: Activity, color: "teal" },
              { title: "خصوصية وأمان", desc: "تشفير كامل للبيانات السريرية والشخصية.", icon: ShieldCheck, color: "slate" },
            ].map((f, i) => (
              <Card key={i} className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-all duration-300">
                <CardContent className="p-8 space-y-4">
                  <div className={`p-4 rounded-2xl bg-${f.color}-50 text-${f.color}-600 w-fit`}>
                    <f.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Parent Portal Deep Dive */}
      <section id="parent-portal" className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative order-2 lg:order-1">
             <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full -z-10" />
             <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50 border-8 border-white rotate-2">
              <Image 
                src={parentImg?.imageUrl || ''} 
                alt="Parent Portal" 
                width={800} 
                height={600} 
                className="object-cover"
                data-ai-hint="parent mobile app"
              />
            </div>
          </div>
          <div className="space-y-8 order-1 lg:order-2 text-right">
            <h2 className="text-4xl font-bold font-headline text-slate-900 leading-tight">بوابة أولياء الأمور: <br/><span className="text-accent">طمأنينة في قلوب الأهالي</span></h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              ندرك أن ولي الأمر هو الشريك الأهم في العملية العلاجية. لذا وفرنا لهم بوابة خاصة تمنحهم الراحة وتشركهم في نجاح طفلهم.
            </p>
            <div className="space-y-4">
              {[
                "متابعة رصيد الجلسات المتبقي وتنبيهات التجديد.",
                "عرض التقارير الدورية فور صدورها من الأخصائي.",
                "استلام تمارين منزلية وتوثيق أداء الطفل بالصور والملاحظات.",
                "معرفة موعد الجلسة القادمة وتفاصيل الخطة العلاجية."
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 justify-start">
                  <div className="p-1 bg-accent/10 rounded-full"><CheckCircle2 className="h-5 w-5 text-accent" /></div>
                  <span className="text-slate-700 font-bold">{text}</span>
                </div>
              ))}
            </div>
            <Button size="lg" className="h-14 px-10 rounded-2xl bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20 font-bold" onClick={() => handleWhatsApp()}>
              اكتشف ميزات الأهالي عبر واتساب
            </Button>
          </div>
        </div>
      </section>

      {/* Reports and Tracking */}
      <section className="py-24 px-6 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 text-right">
            <h2 className="text-4xl font-bold font-headline text-slate-900">تقارير احترافية <br/><span className="text-primary">مبنية على البيانات</span></h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              وداعاً للأوراق والملفات المبعثرة. نظام طمأنينة يحول كل ملاحظة إلى بيانات قابلة للتحليل، ويصدر تقارير طبية وسلوكية بضغطة زر.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white rounded-3xl shadow-lg shadow-slate-200/50 space-y-2 border-r-4 border-r-primary">
                 <h4 className="font-bold text-slate-800">رسوم بيانية للنمو</h4>
                 <p className="text-xs text-slate-400">تتبع تطور المهارات الحركية واللغوية بوضوح.</p>
              </div>
              <div className="p-6 bg-white rounded-3xl shadow-lg shadow-slate-200/50 space-y-2 border-r-4 border-r-accent">
                 <h4 className="font-bold text-slate-800">قوالب جاهزة</h4>
                 <p className="text-xs text-slate-400">تقارير تقييم، متابعة دورية، وملخصات نهائية.</p>
              </div>
            </div>
            <Button size="lg" className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold" onClick={() => handleWhatsApp()}>
              تصفح نماذج التقارير
            </Button>
          </div>
          <div className="relative">
             <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full -z-10" />
             <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50 border-8 border-white -rotate-2">
              <Image 
                src={reportsImg?.imageUrl || ''} 
                alt="Reports Dashboard" 
                width={800} 
                height={600} 
                className="object-cover"
                data-ai-hint="medical data analytics"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-4 mb-16">
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
            🔥 أسعار الإطلاق لفترة محدودة
          </Badge>
          <h2 className="text-4xl font-bold font-headline text-slate-900">باقات تناسب نمو مركزك</h2>
          <p className="text-slate-500">اختر الخطة التي تمنحك أفضل الأدوات لخدمة أطفالك.</p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { 
              name: "الباقة الأساسية", 
              price: "499", 
              features: ["حتى 30 طفل", "حتى 5 أخصائيين", "إدارة الجلسات", "إدارة الحالات", "التقارير الأساسية", "الدعم الفني"], 
              cta: "ابدأ الآن", 
              primary: false, 
              link: "/login" 
            },
            { 
              name: "الباقة الاحترافية", 
              price: "999", 
              features: ["حتى 100 طفل", "أخصائيون غير محدودين", "إدارة الجلسات والحالات", "التقارير المتقدمة", "بوابة أولياء الأمور", "إدارة الفواتير", "تنبيهات الجلسات", "مساعد الذكاء الاصطناعي"], 
              cta: "الأكثر طلباً", 
              primary: true, 
              link: "/login",
              badge: "الأكثر شعبية"
            },
            { 
              name: "باقة المراكز الكبرى", 
              price: "تواصل معنا", 
              features: ["عدد أطفال غير محدود", "عدة فروع", "حسابات متعددة للإدارة", "تخصيص كامل للنظام", "تدريب فريق العمل", "دعم فني مخصص", "إعداد وتشغيل كامل"], 
              cta: "احجز عرضاً تجريبياً", 
              primary: false, 
              link: 'whatsapp' 
            },
          ].map((plan, i) => (
            <Card key={i} className={`rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-8 transition-all duration-300 relative ${plan.primary ? 'bg-primary text-white shadow-2xl shadow-primary/40 scale-105 border-none' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
              {plan.badge && (
                <Badge className="absolute -top-3 bg-accent text-white px-4 py-1 rounded-full text-[10px] font-bold">
                  {plan.badge}
                </Badge>
              )}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-headline">{plan.name}</h3>
                <div className="text-3xl font-bold">
                  {plan.price !== 'تواصل معنا' ? (
                    <>
                      {plan.price} <span className="text-sm font-medium ml-1">جنيه / شهر</span>
                    </>
                  ) : (
                    plan.price
                  )}
                </div>
              </div>
              <div className="w-full h-px bg-current opacity-10" />
              <div className="space-y-4 flex-1">
                {plan.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.primary ? 'text-white' : 'text-primary'}`} />
                    <span className="text-right">{f}</span>
                  </div>
                ))}
              </div>
              <Button 
                size="lg" 
                className={`w-full rounded-2xl font-bold h-14 ${plan.primary ? 'bg-white text-primary hover:bg-slate-100' : 'bg-primary text-white'}`} 
                onClick={() => plan.link === 'whatsapp' ? handleWhatsApp(pricingWhatsappLink) : router.push(plan.link)}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 blur-[150px] rounded-full -mb-48 -mr-48" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="space-y-8">
            <h2 className="text-5xl font-bold font-headline leading-tight text-white">هل أنت مستعد <br/><span className="text-primary">لتحويل مركزك؟</span></h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              فريق "طمأنينة" موجود دائماً للإجابة على استفساراتكم عبر واتساب. نحن نؤمن بأن التواصل المباشر هو أسرع طريق لنجاح مركزكم.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => handleWhatsApp()}>
                <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all"><MessageSquare className="h-6 w-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">تواصل مباشر فوري</p>
                  <p className="text-2xl font-bold" dir="ltr">{whatsappNumber}</p>
                </div>
              </div>
            </div>
            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm space-y-4">
              <h4 className="text-xl font-bold font-headline text-primary">لماذا تختارنا؟</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> دعم فني مخصص لكل عميل.</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> تدريب كامل لفريق عملكم على النظام.</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> إمكانية طلب ميزات مخصصة لمركزكم.</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-1000 delay-300">
            <div className="text-center space-y-2">
              <div className="mx-auto p-6 bg-green-500/20 rounded-full w-fit border border-green-500/30">
                <MessageSquare className="h-16 w-16 text-green-500 fill-green-500/20" />
              </div>
              <h3 className="text-3xl font-bold font-headline mt-4">ابدأ المحادثة الآن</h3>
              <p className="text-slate-400">احصل على تسعير مخصص وعرض مباشر للمميزات.</p>
            </div>
            <Button 
              size="lg" 
              className="h-20 px-12 rounded-[2.5rem] bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-2xl gap-4 shadow-[0_20px_50px_rgba(37,211,102,0.3)] w-full max-w-md group overflow-hidden relative" 
              onClick={() => handleWhatsApp()}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Phone className="h-8 w-8 relative z-10" fill="white" />
              <span className="relative z-10">تواصل عبر واتساب</span>
            </Button>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">متاحون للرد من 9 صباحاً وحتى 11 مساءً</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold font-headline text-slate-800 tracking-tighter">طمأنينة</span>
          </div>
          <p className="text-sm text-slate-400 font-medium">© {new Date().getFullYear()} طمأنينة لإدارة مراكز رعاية الأطفال. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-6">
             <span className="text-sm text-slate-500 font-bold" dir="ltr">{whatsappNumber}</span>
             <a href="#" className="text-sm text-slate-400 hover:text-primary transition-colors font-medium">سياسة الخصوصية</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
