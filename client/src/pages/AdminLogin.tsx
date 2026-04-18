import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "./ModeSelection";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (pw: string) => {
      const API_BASE = ("__PORT_5000__" as string).startsWith("__") ? "" : "__PORT_5000__";
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) throw new Error("wrong");
      return res.json();
    },
    onSuccess: () => {
      // Store password in module-level variable (not localStorage — blocked in iframe)
      setAdminPassword(password);
      navigate("/admin-dash");
    },
    onError: () => setError("Senha incorreta."),
  });

  function handleSubmit() {
    if (!password.trim()) { setError("Digite a senha de admin."); return; }
    setError("");
    loginMutation.mutate(password);
  }

  return (
    <div className="min-h-screen bg-background" data-testid="screen-admin-login">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <Logo />
        <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Voltar
        </button>
      </header>

      <main className="max-w-sm mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Painel Admin</h1>
          <p className="text-sm text-muted-foreground">Acesso restrito. Visualize e gerencie todos os grupos e avaliações.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <Label htmlFor="admin-pw" className="text-sm font-medium mb-2 block">Senha de administrador</Label>
            <Input
              id="admin-pw"
              data-testid="input-admin-password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loginMutation.isPending || !password}
            data-testid="btn-admin-login"
          >
            {loginMutation.isPending ? "Verificando..." : "Entrar →"}
          </Button>
        </div>
      </main>
    </div>
  );
}

// Module-level admin password store (survives navigation, not persisted to storage)
let _adminPassword = "";
export function setAdminPassword(pw: string) { _adminPassword = pw; }
export function getAdminPassword() { return _adminPassword; }
