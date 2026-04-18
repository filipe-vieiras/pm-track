import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "./ModeSelection";
import type { Group } from "@shared/schema";

export default function EvaluatorLogin() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (t: string) => {
      const res = await apiRequest("POST", "/api/groups/evaluator-login", {
        evaluatorToken: t.trim().toUpperCase(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Token inválido");
      }
      return res.json() as Promise<Group>;
    },
    onSuccess: (group) => {
      navigate(`/evaluator/${group.id}`);
    },
    onError: (err: Error) => {
      setError(err.message || "Token de avaliador inválido. Verifique o email recebido ao criar o grupo.");
    },
  });

  function handleSubmit() {
    if (!token.trim()) { setError("Digite o token de avaliador."); return; }
    setError("");
    loginMutation.mutate(token);
  }

  return (
    <div className="min-h-screen bg-background" data-testid="screen-evaluator-login">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <Logo />
        <button
          onClick={() => navigate("/")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Acesso do Avaliador</h1>
          <p className="text-sm text-muted-foreground">
            Digite o token de avaliador de 8 caracteres. Você o recebeu por email ao criar o grupo.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <Label htmlFor="eval-token-input" className="text-sm font-medium mb-2 block">
              Token de avaliador
            </Label>
            <Input
              id="eval-token-input"
              data-testid="input-eval-token"
              placeholder="Ex: A3BX9K2M"
              value={token}
              onChange={e => { setToken(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="text-center text-xl tracking-widest font-mono uppercase"
              maxLength={8}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive" data-testid="login-error">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loginMutation.isPending || !token.trim()}
            data-testid="btn-evaluator-login"
          >
            {loginMutation.isPending ? "Verificando..." : "Entrar como avaliador →"}
          </Button>
        </div>

        {/* Create group section */}
        <div className="mt-8 bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-sm text-foreground mb-1">Ainda não tem um grupo?</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Crie um grupo para gerar os tokens e enviar aos PMs. Você receberá os tokens por email.
          </p>
          <Button
            variant="outline"
            className="w-full"
            data-testid="btn-create-group-link"
            onClick={() => navigate("/evaluator/new")}
          >
            + Criar novo grupo
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          O token de avaliador é enviado por email ao criar o grupo. Ele nunca é compartilhado com os PMs.
        </p>
      </main>
    </div>
  );
}
