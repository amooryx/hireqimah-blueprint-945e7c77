import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut } from "lucide-react";
import { useImpersonation } from "@/lib/impersonation";
import { useI18n } from "@/lib/i18n";
import { getDashboardPath } from "@/lib/supabaseAuth";

const ImpersonationBanner = () => {
  const { isImpersonating, effectiveUser, realUser, exitImpersonation } = useImpersonation();
  const { t, dir } = useI18n();
  const navigate = useNavigate();

  if (!isImpersonating || !effectiveUser || !realUser) return null;

  const handleExit = () => {
    exitImpersonation();
    navigate(getDashboardPath(realUser.role));
  };

  return (
    <div
      dir={dir}
      className="sticky top-14 z-40 border-b bg-amber-500/15 backdrop-blur supports-[backdrop-filter]:bg-amber-500/15 dark:bg-amber-400/10"
      role="alert"
    >
      <div className="container flex items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-medium">
            {t("imp.viewingAs", {
              name: effectiveUser.full_name,
              role: t(`role.${effectiveUser.role}`),
            })}
          </span>
          <span className="hidden sm:inline text-muted-foreground">
            · {t("imp.realAs", { name: realUser.full_name })}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={handleExit} className="h-8 text-xs gap-1.5">
          <LogOut className="h-3.5 w-3.5" />
          {t("imp.exit")}
        </Button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
