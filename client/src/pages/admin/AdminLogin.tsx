import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Lock, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const login = trpc.admin.login.useMutation({
    onSuccess: async () => {
      await utils.admin.me.invalidate();
      navigate("/admin");
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-gold" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground font-sans mt-1">Vipat E Bllokut</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setError(""); login.mutate({ password }); }}
          className="bg-card border border-border/50 rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 font-sans"
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={login.isPending || !password}
            className="w-full py-2.5 bg-gold text-navy-dark font-bold text-sm rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 font-sans"
          >
            {login.isPending ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
