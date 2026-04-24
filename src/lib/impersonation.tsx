import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AuthUser, AppRole } from "@/lib/supabaseAuth";

const STORAGE_KEY = "hq_impersonation_v1";

interface ImpersonationData {
  userId: string;
  role: AppRole;
  fullName: string;
  email: string;
  avatarUrl?: string;
  startedAt: number;
  realUserId: string; // safety pin: only valid if real user matches
}

function readStored(): ImpersonationData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ImpersonationData;
  } catch {
    return null;
  }
}

function writeStored(data: ImpersonationData | null) {
  if (data) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  else sessionStorage.removeItem(STORAGE_KEY);
}

interface ImpersonationCtx {
  realUser: AuthUser | null;
  effectiveUser: AuthUser | null;
  isImpersonating: boolean;
  impersonatedRole: AppRole | null;
  startImpersonation: (target: { userId: string; role: AppRole; fullName: string; email: string; avatarUrl?: string }) => Promise<void>;
  exitImpersonation: () => void;
}

const Ctx = createContext<ImpersonationCtx | null>(null);

interface ProviderProps {
  realUser: AuthUser | null;
  children: ReactNode;
}

export const ImpersonationProvider = ({ realUser, children }: ProviderProps) => {
  const [data, setData] = useState<ImpersonationData | null>(() => readStored());

  // Clear impersonation if real user changes / logs out / mismatch
  useEffect(() => {
    if (!data) return;
    if (!realUser) {
      writeStored(null);
      setData(null);
      return;
    }
    // Only admin can impersonate; if real user isn't admin, clear
    if (realUser.role !== "admin" || realUser.id !== data.realUserId) {
      writeStored(null);
      setData(null);
    }
  }, [realUser, data]);

  const startImpersonation = useCallback(
    async (target: { userId: string; role: AppRole; fullName: string; email: string; avatarUrl?: string }) => {
      if (!realUser || realUser.role !== "admin") {
        throw new Error("Only admins can impersonate");
      }
      const next: ImpersonationData = {
        userId: target.userId,
        role: target.role,
        fullName: target.fullName,
        email: target.email,
        avatarUrl: target.avatarUrl,
        startedAt: Date.now(),
        realUserId: realUser.id,
      };
      writeStored(next);
      setData(next);
      // Audit log (non-blocking)
      try {
        await supabase.from("audit_logs").insert({
          user_id: realUser.id,
          action: "impersonation_start",
          resource_type: "user",
          resource_id: target.userId,
          details: { target_role: target.role, target_email: target.email },
        });
      } catch { /* non-blocking */ }
    },
    [realUser]
  );

  const exitImpersonation = useCallback(() => {
    if (data && realUser) {
      try {
        supabase.from("audit_logs").insert({
          user_id: realUser.id,
          action: "impersonation_end",
          resource_type: "user",
          resource_id: data.userId,
          details: { duration_ms: Date.now() - data.startedAt },
        });
      } catch { /* non-blocking */ }
    }
    writeStored(null);
    setData(null);
  }, [data, realUser]);

  const effectiveUser: AuthUser | null = data
    ? {
        id: data.userId,
        email: data.email,
        full_name: data.fullName,
        role: data.role,
        avatar_url: data.avatarUrl,
      }
    : realUser;

  return (
    <Ctx.Provider
      value={{
        realUser,
        effectiveUser,
        isImpersonating: !!data,
        impersonatedRole: data?.role ?? null,
        startImpersonation,
        exitImpersonation,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useImpersonation = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useImpersonation must be used within ImpersonationProvider");
  return ctx;
};
