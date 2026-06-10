"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const data = [
  { month: "يناير", milestones: 2, cognitive: 45 },
  { month: "فبراير", milestones: 3, cognitive: 52 },
  { month: "مارس", milestones: 3, cognitive: 61 },
  { month: "أبريل", milestones: 5, cognitive: 68 },
  { month: "مايو", milestones: 8, cognitive: 75 },
  { month: "يونيو", milestones: 10, cognitive: 82 },
];

export function GrowthChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">متتبع النمو</CardTitle>
        <CardDescription>إجمالي الإنجازات السريرية خلال آخر 6 أشهر</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  orientation="right"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    textAlign: 'right'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="milestones"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="الإنجازات"
                />
                <Line
                  type="monotone"
                  dataKey="cognitive"
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="النمو المعرفي"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center">
              <span className="text-xs text-muted-foreground italic">جاري تحميل البيانات...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
