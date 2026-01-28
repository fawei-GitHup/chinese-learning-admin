"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAdminLocale } from "@/lib/admin-locale";

export function AdminEnvBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { locale } = useAdminLocale();

  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);

  useEffect(() => {
    setMounted(true);
    // Check if user has dismissed this banner before
    const wasDismissed = localStorage.getItem("admin_env_banner_dismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("admin_env_banner_dismissed", "true");
  };

  // Don't show if not mounted, dismissed, or Supabase is configured
  if (!mounted || dismissed || isSupabaseConfigured) {
    return null;
  }

  return (
    <div className="fixed top-16 left-64 right-0 z-40 px-6 pt-4">
      <div className="glass-card rounded-xl border border-warning/30 bg-warning/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/20">
            <Database className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h4 className="font-semibold text-foreground">
                {t("Supabase 未配置", "Supabase Not Configured")}
              </h4>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "当前仅显示本地 mock 数据。请在 Vercel 项目设置中添加以下环境变量以连接 Supabase：",
                "Currently showing local mock data only. Add the following environment variables in your Vercel project settings to connect to Supabase:"
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <code className="rounded bg-secondary/50 px-2 py-1 text-xs font-mono text-foreground">
                NEXT_PUBLIC_SUPABASE_URL
              </code>
              <code className="rounded bg-secondary/50 px-2 py-1 text-xs font-mono text-foreground">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>
              <code className="rounded bg-secondary/50 px-2 py-1 text-xs font-mono text-foreground">
                SUPABASE_SERVICE_ROLE_KEY
              </code>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t("关闭", "Dismiss")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
