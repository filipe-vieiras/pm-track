import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "./ModeSelection";
import type { Group, Assessment } from "@shared/schema";
import type { QuizConfig } from "@/App";

interface Props {
  setQuizConfig: (cfg: QuizConfig) => void;
}

type Mode = "new" | "resume";

export default function PMGroupEntry({ setQuizConfig }: Props) {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("new");

  // ── NEW mode state ────────────────────────────────────────────────────
  const [groupToken, setGroupToken] = useState("");
  const [pmName, setPmName] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [newError, setNewError] = useState("");

  // ── RESUME mode state ─────────────────────────────────────────────────
  const [pmToken, setPmToken] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeError, setResumeError] = useState("");

  // ── Mutations ─────────────────────────────────────────────────────────
  const verifyGroupMutation = useMutation({
    mutationFn: async (t: string) => {
      const res = await apiRequest("GET", `/api/groups/token/${t.trim().toUpperCase()}`);
      if (!res.ok) throw new Error("invalid");
      return res.json() as Promise<Group>;
    },
    onSuccess: (g) => { setGroup(g); setNewError(""); },
    onError: () => setNewError("Token inválido. Peça ao avaliador para confirmar o código."),
  });

  const findByPmTokenMutation = useMutation({
    mutationFn: async ({ token, name }: { token: string; name: string }) => {
      const res = await apiRequest("GET", `/api/assessments/by-pm-token/${token.trim().toUpperCase()}`);
      if (!res.ok) throw new Error("not_found");
      const a = await res.json() as Assessment;
      // Verify name matches (case-insensitive)
      if (a.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
        throw new Error("name_mismatch");
      }
      return a;
    },
    onSuccess: (a) => {
      navigate(`/pm-result/${a.id}`);
    },
    onError: (err: Error) => {
      if (err.message === "name_mismatch") {
        setResumeError("O nome não corresponde ao token. Verifique e tente novamente.");
      } else {
        setResumeError("Token não encontrado. Verifique o código e tente novamente.");
      }
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────
  function proceedNew() {
    if (!group) {
      verifyGroupMutation.mutate(groupToken);
      return;
    }
    if (!pmName.trim()) { setNewError("Digite seu nome para continuar."); return; }
    setNewError("");
    setQuizConfig({ mode: "pm", pmName: pmName.trim(), groupId: group.id });
    navigate("/pm-intro");
  }

  function proceedResume() {
    if (!pmToken.trim()) { setResumeError("Digite o seu token pessoal."); return; }
    if (!resumeName.trim()) { setResumeError("Digite o seu nome."); return; }
    setResumeError("");
    findByPmTokenMutation.mutate({ token: pmToken, name: resumeName });
  }

  return (
    <div className="min-h-screen bg-background" data-testid="screen-pm-entry">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <Logo />
        <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Voltar</button>
      </header>

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Área do PM</h1>
          <p className="text-sm text-muted-foreground">Escolha como deseja prosseguir.</p>
        </div>

        {/* Mode selector */}
        <div className="flex rounded-xl border border-border overflow-hidden mb-6">
          <button
            onClick={() => { setMode("new"); setNewError(""); setResumeError(""); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === "new"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-new"
          >
            Nova avaliação
          </button>
          <button
            onClick={() => { setMode("resume"); setNewError(""); setResumeError(""); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-l border-border ${
              mode === "resume"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-resume"
          >
            Continuar / Ver resultado
          </button>
        </div>

        {/* ── NEW mode ── */}
        {mode === "new" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <Label htmlFor="group-token-input" className="text-sm font-medium mb-2 block">Token do grupo</Label>
              <Input
                id="group-token-input"
                data-testid="input-group-token"
                placeholder="Ex: AB3X9K"
                value={groupToken}
                onChange={e => { setGroupToken(e.target.value.toUpperCase()); setGroup(null); setNewError(""); }}
                onKeyDown={e => e.key === "Enter" && !group && verifyGroupMutation.mutate(groupToken)}
                className="text-center text-xl tracking-widest font-mono uppercase"
                maxLength={6}
              />
              {group && (
                <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <span>✓</span>
                  <span>Grupo <strong>{group.groupName}</strong> — Avaliador: {group.evaluatorName}</span>
                </div>
              )}
            </div>

            {group && (
              <div>
                <Label htmlFor="pm-name-input" className="text-sm font-medium mb-2 block">Seu nome</Label>
                <Input
                  id="pm-name-input"
                  data-testid="input-pm-name"
                  placeholder="Ex: Ana Lima"
                  value={pmName}
                  onChange={e => { setPmName(e.target.value); setNewError(""); }}
                  onKeyDown={e => e.key === "Enter" && proceedNew()}
                  autoFocus
                />
              </div>
            )}

            {newError && <p className="text-xs text-destructive" data-testid="new-error">{newError}</p>}

            <Button
              className="w-full"
              onClick={proceedNew}
              disabled={verifyGroupMutation.isPending || (!group && !groupToken)}
              data-testid="btn-new-proceed"
            >
              {verifyGroupMutation.isPending ? "Verificando..." : group ? "Iniciar avaliação →" : "Verificar token →"}
            </Button>
          </div>
        )}

        {/* ── RESUME mode ── */}
        {mode === "resume" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              Digite o token pessoal que você recebeu ao concluir sua avaliação e seu nome para acessar o resultado.
            </div>

            <div>
              <Label htmlFor="pm-token-input" className="text-sm font-medium mb-2 block">Seu token pessoal (8 dígitos)</Label>
              <Input
                id="pm-token-input"
                data-testid="input-pm-token"
                placeholder="Ex: AB3X9K2M"
                value={pmToken}
                onChange={e => { setPmToken(e.target.value.toUpperCase()); setResumeError(""); }}
                onKeyDown={e => e.key === "Enter" && proceedResume()}
                className="text-center text-xl tracking-widest font-mono uppercase"
                maxLength={8}
              />
            </div>

            <div>
              <Label htmlFor="resume-name-input" className="text-sm font-medium mb-2 block">Seu nome</Label>
              <Input
                id="resume-name-input"
                data-testid="input-resume-name"
                placeholder="Ex: Ana Lima"
                value={resumeName}
                onChange={e => { setResumeName(e.target.value); setResumeError(""); }}
                onKeyDown={e => e.key === "Enter" && proceedResume()}
              />
            </div>

            {resumeError && <p className="text-xs text-destructive" data-testid="resume-error">{resumeError}</p>}

            <Button
              className="w-full"
              onClick={proceedResume}
              disabled={findByPmTokenMutation.isPending || !pmToken || !resumeName}
              data-testid="btn-resume-proceed"
            >
              {findByPmTokenMutation.isPending ? "Buscando..." : "Ver resultado →"}
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          {mode === "new"
            ? "Não tem token? Peça ao seu Diretor de Produto para criar um grupo e enviar o código."
            : "O token pessoal aparece na tela de resultado após concluir a avaliação."}
        </p>
      </main>
    </div>
  );
}
