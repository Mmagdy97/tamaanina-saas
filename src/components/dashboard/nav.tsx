"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Baby, 
  UserRound, 
  Settings, 
  LogOut,
  Sparkles,
  Activity,
  FileText,
  CalendarDays,
  Wallet,
  ShieldCheck,
  CalendarCheck,
  Globe,
  History
} from "lucide-react";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { UserRole } from "@/firebase/auth/use-user";

interface DashboardNavProps {
  role?: UserRole;
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    localStorage.removeItem('tamaanina_mock_user');
    try {
      await signOut(auth);
    } catch (e) {}
    
    router.push('/login');
    router.refresh();
  };

  /**
   * تعريف المسارات المسموح بها لكل دور
   * تم تحويل الأدوار إلى snake_case للتناسق
   */
  const navItems = [
    { name: "مدير المنصة", href: "/dashboard/super-admin", icon: Globe, roles: ['super_admin'] },
    { name: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard, roles: ['super_admin', 'center_admin', 'therapist', 'parent'] },
    { name: "إدارة الأطفال", href: "/dashboard/children", icon: Baby, roles: ['center_admin', 'therapist', 'parent'] },
    { name: "جدول الجلسات", href: "/dashboard/sessions", icon: CalendarDays, roles: ['center_admin', 'therapist', 'parent'] },
    { name: "الحضور والغياب", href: "/dashboard/attendance", icon: CalendarCheck, roles: ['center_admin', 'therapist'] },
    { name: "المالية والفوترة", href: "/dashboard/billing", icon: Wallet, roles: ['center_admin'] },
    { name: "فريق العمل", href: "/dashboard/therapists", icon: UserRound, roles: ['center_admin'] },
    { name: "الأنشطة العلاجية", href: "/dashboard/activities", icon: Activity, roles: ['center_admin', 'therapist', 'parent'] },
    { name: "تقارير التقدم", href: "/dashboard/reports", icon: FileText, roles: ['center_admin', 'therapist', 'parent'] },
    { name: "سجل العمليات", href: "/dashboard/activity-logs", icon: History, roles: ['center_admin'] },
    { name: "مساعد الذكاء الاصطناعي", href: "/dashboard/ai-tool", icon: Sparkles, roles: ['center_admin', 'therapist'] },
  ];

  const filteredItems = navItems.filter(item => 
    !role || item.roles.includes(role)
  );

  return (
    <div className="flex h-full flex-col gap-10">
      <div className="space-y-2">
        <p className="px-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4 opacity-70">القائمة الرئيسية</p>
        <nav className="space-y-1.5">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300 group relative",
                  isActive 
                    ? "bg-primary text-white shadow-2xl shadow-primary/30 font-bold translate-x-[-4px]" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-all duration-300", isActive ? "text-white scale-110" : "text-slate-300 group-hover:text-primary group-hover:scale-110")} />
                <span className="text-[15px]">{item.name}</span>
                {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-white rounded-l-full" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-2 pb-4">
        {role && role !== 'super_admin' && role === 'center_admin' && (
          <>
            <p className="px-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4 opacity-70">مركز التحكم</p>
            <div className="space-y-1">
              <Link
                href="/dashboard/settings"
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300 text-slate-500 hover:bg-slate-50 hover:text-primary group",
                  pathname === "/dashboard/settings" && "bg-slate-100 text-primary font-bold"
                )}
              >
                <Settings className="h-5 w-5 text-slate-300 group-hover:text-primary" />
                <span className="text-[15px]">إعدادات المركز</span>
              </Link>
            </div>
          </>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-slate-500 transition-all duration-300 hover:bg-rose-50 hover:text-rose-600 group"
        >
          <LogOut className="h-5 w-5 text-slate-300 group-hover:text-rose-600 group-hover:translate-x-1 transition-transform" />
          <span className="text-[15px]">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
