import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  PILLARS, allQuestions, getLevel,
  calcPillarData, calcTotalPct
} from "@/lib/data";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "./ModeSelection";
import type { QuizConfig } from "@/App";

interface Props {
  config: QuizConfig | null;
  setQuizConfig: (cfg: QuizConfig | null) => void;
}

export default function Quiz({ config, setQuizConfig }: Props) {
  const [, navigate] = useLocation();
  const [scores, setScores] = useState<Record<number, number>>({});
  const [currentPillar, setCurrentPillar] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const qClient = useQueryClient();

  if (!config) { navigate("/"); return null; }

  const { mode, pmName, groupId, linkedAssessmentId, evaluatorName } = config;
  const pillar = PILLARS[currentPillar];
  const isLast = currentPillar === PILLARS.length - 1;

  const pillarQuestions = allQuestions.filter(q => q.pillarIdx === currentPillar);
  const unanswered = pillarQuestions.filter(q => scores[q.globalIdx] === undefined).length;
  const totalAnswered = Object.keys(scores).length;
  const progressPct = Math.round((totalAnswered / allQuestions.length) * 100);

  const saveAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/assessments", data);
      return res.json();
    },
    onSuccess: () => qClient.invalidateQueries({ queryKey: ["/api/assessments"] }),
  });

  const saveEvaluationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/evaluations", data);
      return res.json();
    },
    onSuccess: (_, vars) => {
      qClient.invalidateQueries({ queryKey: ["/api/groups", vars.groupId, "evaluations"] });
    },
  });

  function tryNext() {
    if (unanswered > 0) setShowModal(true);
    else proceedNext();
  }

  function proceedNext() {
    setShowModal(false);
    if (isLast) finalize();
    else { setCurrentPillar(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }

  async function finalize() {
    const pct = calcTotalPct(scores);
    const pillarData = calcPillarData(scores);
    const level = getLevel(pct);

    if (mode === "pm") {
      const id = `pm_${pmName.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
      await saveAssessmentMutation.mutateAsync({
        id,
        groupId: groupId ?? null,
        name: pmName,
        date: new Date().toISOString(),
        scores: JSON.stringify(scores),
        pillarData: JSON.stringify(pillarData),
        levelId: level.id,
        levelLabel: level.label,
        pct,
      });
      // Navigate to server-driven result page — no state needed
      setQuizConfig(null);
      navigate(`/pm-result/${id}`);
    } else {
      // Evaluator mode
      const pmAssessmentId = linkedAssessmentId!;
      const evalId = `eval_${pmAssessmentId}_${Date.now()}`;
      await saveEvaluationMutation.mutateAsync({
        id: evalId,
        groupId: groupId ?? "",
        assessmentId: pmAssessmentId,
        evaluatorName: evaluatorName ?? "Avaliador",
        date: new Date().toISOString(),
        scores: JSON.stringify(scores),
        pillarData: JSON.stringify(pillarData),
        levelId: level.id,
        levelLabel: level.label,
        pct,
      });
      // Navigate to server-driven eval result — pass the PM's assessmentId
      setQuizConfig(null);
      navigate(`/eval-result/${pmAssessmentId}`);
    }
  }

  function pillarStatus(idx: number): "active" | "done" | "pending" {
    if (idx === currentPillar) return "active";
    if (allQuestions.filter(q => q.pillarIdx === idx).every(q => scores[q.globalIdx] !== undefined)) return "done";
    return "pending";
  }

  const isPending = saveAssessmentMutation.isPending || saveEvaluationMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex" data-testid="screen-quiz">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border/40 bg-card/50 p-5 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-8"><Logo /></div>

        <div className={`text-xs px-2 py-1 rounded-full font-medium mb-6 w-fit ${
          mode === "pm" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        }`}>
          {mode === "pm" ? `👤 ${pmName}` : `🎯 Avaliando PM`}
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progresso</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {PILLARS.map((p, i) => {
            const st = pillarStatus(i);
            return (
              <button key={p.id}
                onClick={() => { setCurrentPillar(i); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  st === "active" ? "bg-primary text-primary-foreground font-medium" :
                  st === "done" ? "text-muted-foreground" : "text-muted-foreground/60"
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  st === "active" ? "bg-primary-foreground" :
                  st === "done" ? "bg-green-500" : "bg-muted-foreground/30"
                }`} />
                {p.icon} {p.title}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-border/40">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Escala</p>
          <div className="flex gap-1.5">
            {[0,1,2,3,4].map(s => (
              <div key={s} className={`flex-1 rounded-md py-1.5 text-center text-xs font-bold ${
                s === 0 ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' :
                s === 4 ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {s}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border/40 px-6 py-3 flex items-center gap-4 sticky top-0 bg-background z-10">
          <span className="text-xs text-muted-foreground">Pilar {currentPillar + 1}/{PILLARS.length}</span>
          <span className="font-semibold text-sm">{pillar.icon} {pillar.title}</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden hidden sm:block">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{progressPct}%</span>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-8 max-w-3xl mx-auto w-full">
          <div className="mb-8">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">0{currentPillar + 1}</div>
            <h1 className="text-xl font-bold text-foreground mb-2">{pillar.title}</h1>
            <p className="text-sm text-muted-foreground italic">{pillar.quote}</p>
          </div>

          {pillar.subcategories.map(sc => {
            const scQs = allQuestions.filter(q => q.pillarIdx === currentPillar && q.subcategory === sc.label);
            return (
              <div key={sc.label} className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 border-b border-border/40 pb-2">{sc.label}</h2>
                <div className="space-y-4">
                  {scQs.map(q => {
                    const cur = scores[q.globalIdx];
                    return (
                      <div key={q.globalIdx} className="bg-card border border-border rounded-xl p-5">
                        <div className="flex items-start gap-3 mb-4">
                          <p className="text-sm text-foreground leading-relaxed">{q.text}</p>
                        </div>
                        <div className="flex gap-2">
                          {[0,1,2,3,4].map(s => (
                            <button
                              key={s}
                              onClick={() => setScores(prev => ({ ...prev, [q.globalIdx]: s }))}
                              className={`flex-1 py-2.5 rounded-lg border text-base font-bold transition-all ${
                                cur === s
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/40">
            <Button variant="ghost" onClick={() => { if (currentPillar > 0) { setCurrentPillar(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}} disabled={currentPillar === 0}>
              ← Anterior
            </Button>
            <Button onClick={tryNext} disabled={isPending}>
              {isPending ? "Salvando..." : isLast ? "Ver resultado →" : "Próximo →"}
            </Button>
          </div>
        </main>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Questões não respondidas</DialogTitle>
            <DialogDescription>
              Você ainda não avaliou {unanswered} competência(s) neste pilar. Deseja {isLast ? "ver o resultado" : "avançar"} assim mesmo?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Voltar e responder</Button>
            <Button onClick={proceedNext}>{isLast ? "Ver resultado" : "Avançar mesmo assim"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
