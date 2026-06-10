"use client";

import { useState } from "react";
import { generateSessionSummary } from "@/ai/flows/generate-session-summary";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Send, Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AIToolPage() {
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    try {
      const result = await generateSessionSummary({ sessionNotes: notes });
      setSummary(result.summary);
    } catch (err) {
      toast({
        title: "فشل الإنشاء",
        description: "حدث خطأ أثناء إنشاء الملخص. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          أداة تحليل الذكاء الاصطناعي <Sparkles className="h-6 w-6 text-accent" />
        </h1>
        <p className="text-muted-foreground">تحويل الملاحظات السريرية إلى ملخصات حانية لأولياء الأمور.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">الملاحظات السريرية</CardTitle>
            <CardDescription>الصق ملاحظات الجلسة التفصيلية هنا.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="مثال: أظهر المريض زيادة بنسبة 15% في وقت الاستجابة اللفظية. لوحظت حساسية حسية تجاه الإضاءة الفلورية. أكمل بنجاح وحدتين من تمارين المهارات الحركية الدقيقة..." 
              className="min-h-[300px] resize-none text-right"
              dir="rtl"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button 
              className="w-full gap-2 bg-primary hover:bg-primary/90" 
              onClick={handleGenerate}
              disabled={loading || !notes.trim()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              إنشاء ملخص لولي الأمر
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-accent font-semibold">الملخص الحاني</CardTitle>
            <CardDescription>محتوى تم إنشاؤه بواسطة الذكاء الاصطناعي وجاهز للإرسال.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-4 animate-in fade-in duration-700">
                <div className="bg-white p-4 rounded-lg border text-sm leading-relaxed text-slate-700 min-h-[300px] whitespace-pre-wrap text-right" dir="rtl">
                  {summary}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full gap-2 border-accent text-accent hover:bg-accent hover:text-white"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "تم النسخ!" : "نسخ إلى الحافظة"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[350px] text-center space-y-4 p-8 border-2 border-dashed rounded-lg border-muted">
                <div className="p-4 bg-muted rounded-full">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">لا يوجد ملخص بعد</p>
                  <p className="text-xs text-muted-foreground/60 max-w-[200px]">قم بإنشاء ملخص لرؤية كيف يحول الذكاء الاصطناعي ملاحظاتك السريرية إلى شيء دافئ ومشجع.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
