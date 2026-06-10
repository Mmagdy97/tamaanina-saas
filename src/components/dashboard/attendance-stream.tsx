"use client";

import { useEffect, useState } from "react";
import { Therapist, mockTherapists } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle, UserCircle2 } from "lucide-react";

const availabilityLabels: Record<Therapist['availability'], string> = {
  'Available': 'متاح',
  'In Session': 'في جلسة',
  'Offline': 'غير متصل'
};

export function AttendanceStream() {
  const [therapists, setTherapists] = useState<Therapist[]>(mockTherapists);

  useEffect(() => {
    const interval = setInterval(() => {
      setTherapists((prev) => {
        return prev.map((t) => {
          if (Math.random() > 0.8) {
            const statuses: Therapist['availability'][] = ['Available', 'In Session', 'Offline'];
            return { ...t, availability: statuses[Math.floor(Math.random() * statuses.length)] };
          }
          return t;
        });
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 h-full overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b px-6 py-6">
        <CardTitle className="text-lg font-headline font-bold flex items-center justify-between">
          <span>فريق العمل المباشر</span>
          <div className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {therapists.map((therapist) => (
            <div key={therapist.id} className="flex items-center justify-between group p-3 -m-3 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <UserCircle2 className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-700 group-hover:text-primary transition-colors">
                    {therapist.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {therapist.specialization}
                  </span>
                </div>
              </div>
              <Badge 
                variant="outline"
                className={`text-[10px] px-2 py-1 flex items-center gap-1.5 border-none shadow-none font-bold ${
                  therapist.availability === 'Available' ? 'bg-emerald-50 text-emerald-700' : 
                  therapist.availability === 'In Session' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Circle className={`h-1.5 w-1.5 fill-current`} />
                {availabilityLabels[therapist.availability]}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}