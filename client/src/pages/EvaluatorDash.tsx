import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { LEVELS, PILLARS } from "@/lib/data";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "./ModeSelection";
import type { Assessment, Group, Evaluation } from "@shared/schema";
import type { QuizConfig } from "@/App";

interface Props {
  groupId: string;   // from URL params; "new" = create-group mode
  setQuizConfig: (cfg: QuizConfig) => void;
}

function levelBadgeClass(grp: string) {
  if (grp === "apm") return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  if (grp === "gpm") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-primary/10 text-primary";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) + " às " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ---- Create Group Form -------------------------------------------------------
function CreateGroupForm({ onCreated }: { onCreated: (group: Group) => void }) {
  const [evalName, setEvalName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [evalEmail, setEvalEmail] = useState("");
  const [createdGroup, setCreatedGroup] = useState<(Group & { emailSent?: boolean }) | null>(null);
  const [copied, setCopied] = useState<"pm" | "eval" | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/groups", {
        evaluatorName: evalName.trim(),
        groupName: groupName.trim(),
        evaluatorEmail: evalEmail.trim(),
      });
      return res.json() as Promise<Group & { emailSent?: boolean }>;
    },
    onSuccess: (g) => {
      setCreatedGroup(g);
    },
  });

  function copyText(text: string, type: "pm" | "eval") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  if (createdGroup) {
    return (
      <div className="space-y-4" data-testid="group-created">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-600 text-lg">✓</span>
          <h2 className="font-semibold text-foreground">Grupo criado: {createdGroup.groupName}</h2>
        </div>

        {createdGroup.emailSent && (
          <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
            ✓ Email enviado para {createdGroup.evaluatorEmail} com os dois tokens.
          </div>
        )}
        {!createdGroup.emailSent && createdGroup.evaluatorEmail && (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            ⚠️ Email não enviado (SMTP não configurado). Guarde os tokens abaixo manualmente.
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Guarde os tokens abaixo. O token de avaliador <strong>não será mostrado novamente</strong>.
        </p>

        {/* PM Token */}
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Token dos PMs (compartilhe com o time)</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-2xl font-bold font-mono tracking-widest text-primary" data-testid="pm-token-display">
              {createdGroup.token}
            </code>
            <button
              onClick={() => copyText(createdGroup.token, "pm")}
              className="text-xs text-primary hover:underline shrink-0"
              data-testid="btn-copy-pm-token"
            >
              {copied === "pm" ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Evaluator Token */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">🔐 Seu token de avaliador (não compartilhe)</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-2xl font-bold font-mono tracking-widest text-amber-800 dark:text-amber-300" data-testid="eval-token-display">
              {createdGroup.evaluatorToken}
            </code>
            <button
              onClick={() => copyText(createdGroup.evaluatorToken ?? "", "eval")}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline shrink-0"
              data-testid="btn-copy-eval-token"
            >
              {copied === "eval" ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
            Use este token para acessar o painel do avaliador em sessões futuras.
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => onCreated(createdGroup)}
          data-testid="btn-go-to-dashboard"
        >
          Ir para o painel →
        </Button>
      </div>
    );
  }

  const canCreate = evalName.trim().length > 0 && groupName.trim().length > 0;

  return (
    <div className="space-y-5" data-testid="create-group-form">
      <div>
        <h2 className="font-semibold text-foreground mb-1">Criar novo grupo</h2>
        <p className="text-xs text-muted-foreground">
          Após criar, você receberá dois tokens: um para os PMs e um de acesso exclusivo ao painel do avaliador.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs mb-1 block">Seu nome (avaliador)</Label>
          <Input
            data-testid="input-eval-name"
            placeholder="Ex: Ricardo Gomes"
            value={evalName}
            onChange={e => setEvalName(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Nome do grupo</Label>
          <Input
            data-testid="input-group-name"
            placeholder="Ex: Squad Payments Q2 2026"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label className="text-xs mb-1 block">Seu email (para receber os tokens)</Label>
        <Input
          data-testid="input-eval-email"
          type="email"
          placeholder="Ex: ricardo@empresa.com"
          value={evalEmail}
          onChange={e => setEvalEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Opcional mas recomendado — os tokens serão enviados para este email.
        </p>
      </div>

      <Button
        onClick={() => createMutation.mutate()}
        disabled={!canCreate || createMutation.isPending}
        data-testid="btn-confirm-create-group"
      >
        {createMutation.isPending ? "Criando..." : "Criar grupo e gerar tokens"}
      </Button>
    </div>
  );
}

// ---- Main Dashboard ---------------------------------------------------------
export default function EvaluatorDash({ groupId, setQuizConfig }: Props) {
  const [, navigate] = useLocation();
  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null);
  const [copied, setCopied] = useState(false);
  const qClient = useQueryClient();

  const isNewMode = groupId === "new";

  // Load group info
  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: ["/api/groups", groupId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/groups/${groupId}`);
      if (!res.ok) throw new Error("Group not found");
      return res.json();
    },
    enabled: !isNewMode,
    retry: false,
  });

  // Load assessments for this group — always fresh (no stale cache)
  const { data: assessments, isLoading: assessmentsLoading, refetch: refetchAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/groups", groupId, "assessments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/groups/${groupId}/assessments`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !isNewMode,
    staleTime: 0,           // always refetch on mount
    refetchOnWindowFocus: true,
  });

  // Load evaluations (to show "already evaluated" badge) — always fresh
  const { data: evaluations } = useQuery<Evaluation[]>({
    queryKey: ["/api/groups", groupId, "evaluations"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/groups/${groupId}/evaluations`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !isNewMode,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/assessments/${id}`),
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "assessments"] });
    },
  });

  function hasEvaluation(pm: Assessment): boolean {
    return !!evaluations?.find(e => e.assessmentId === pm.id);
  }

  function startEvaluate(pm: Assessment) {
    setQuizConfig({
      mode: "evaluator",
      pmName: pm.name,
      evaluatorName: group?.evaluatorName ?? "Avaliador",
      groupId,
      linkedAssessmentId: pm.id,
    });
    navigate("/quiz");
  }

  function copyToken() {
    if (!group) return;
    navigator.clipboard.writeText(group.token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ---- New group creation mode ----
  if (isNewMode) {
    return (
      <div className="min-h-screen bg-background" data-testid="screen-create-group">
        <header className="border-b border-border/40 px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/evaluator-login")} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
          <span className="ml-2 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">Avaliador</span>
        </header>
        <main className="max-w-lg mx-auto px-4 py-12">
          <CreateGroupForm
            onCreated={(g) => navigate(`/evaluator/${g.id}`)}
          />
        </main>
      </div>
    );
  }

  // ---- Normal dashboard ----
  // Only block on assessmentsLoading — group info loads in parallel and is optional for the list
  const isLoading = assessmentsLoading;

  return (
    <div className="min-h-screen bg-background" data-testid="screen-evaluator-dash">
      <header className="border-b border-border/40 px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
          <Logo />
        </button>
        <span className="ml-2 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">Avaliador</span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1">
              {groupLoading ? <Skeleton className="h-7 w-56 inline-block" /> : (group?.groupName ?? "Painel do Avaliador")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {groupLoading ? <Skeleton className="h-4 w-40 inline-block" /> : (group ? `Avaliador: ${group.evaluatorName}` : "Carregando...")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => refetchAssessments()} title="Atualizar lista" data-testid="btn-refresh">
              ↻ Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/evaluator-login")}>
              Trocar grupo
            </Button>
          </div>
        </div>

        {/* Group token card */}
        {group && (
          <div className="bg-card border border-border rounded-xl p-5 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Token dos PMs</p>
                <div className="flex items-center gap-3">
                  <code className="text-xl font-bold font-mono tracking-widest text-primary" data-testid="group-token">
                    {group.token}
                  </code>
                  <button
                    onClick={copyToken}
                    className="text-xs text-primary hover:underline"
                    data-testid="btn-copy-token"
                  >
                    {copied ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Envie este token para os PMs realizarem a autoavaliação.</p>
              </div>
            </div>
          </div>
        )}

        {/* PM List */}
        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : !assessments || assessments.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-xl" data-testid="empty-state">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="font-semibold text-foreground mb-1">Nenhuma autoavaliação ainda</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {group ? `Compartilhe o token ${group.token} com os PMs.` : "Aguarde os PMs realizarem a autoavaliação."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetchAssessments()}>
              ↻ Atualizar lista
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground mb-4">
              {assessments.length} autoavaliação{assessments.length !== 1 ? "ções" : ""} encontrada{assessments.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-4">
              {assessments.map(pm => {
                const level = LEVELS.find(l => l.id === pm.levelId);
                const grp = level?.group ?? "pm";
                const pillarData: {pillarId:string;pillarTitle:string;pct:number}[] = JSON.parse(pm.pillarData);
                const evaluated = hasEvaluation(pm);
                return (
                  <div key={pm.id} className="bg-card border border-border rounded-xl p-5" data-testid={`pm-card-${pm.id}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                          {pm.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground">{pm.name}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(pm.date)}</div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {pillarData.map(d => {
                              const pillar = PILLARS.find(p => p.id === d.pillarId);
                              return (
                                <span key={d.pillarId} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full" title={`${d.pillarTitle}: ${d.pct}%`}>
                                  {pillar?.icon} {d.pct}%
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {evaluated && (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                            ✓ Avaliado
                          </span>
                        )}
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelBadgeClass(grp)}`}>
                          {pm.levelLabel}
                        </span>
                        <span className="text-sm font-bold text-foreground">{pm.pct}%</span>
                        {/* Ver autoavaliação do PM */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/pm-result/${pm.id}?from=evaluator&group=${groupId}`)}
                          data-testid={`btn-view-${pm.id}`}
                        >
                          Ver resultado
                        </Button>
                        {evaluated ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/eval-result/${pm.id}`)}
                            data-testid={`btn-compare-${pm.id}`}
                          >
                            Ver comparativo
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => startEvaluate(pm)}
                            data-testid={`btn-evaluate-${pm.id}`}
                          >
                            Avaliar →
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteTarget(pm)}
                          className="text-muted-foreground"
                          data-testid={`btn-delete-${pm.id}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir autoavaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir a autoavaliação de "{deleteTarget?.name}"? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
