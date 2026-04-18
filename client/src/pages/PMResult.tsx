import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PILLARS, allQuestions } from "@/lib/data";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "./ModeSelection";
import type { Assessment, Evaluation } from "@shared/schema";

interface Props {
  assessmentId: string;
}

// ---- Spider Chart (single or overlay) ----------------------------------------
function SpiderChart({
  pmData,
  evalData,
}: {
  pmData: { pillarId: string; pillarTitle: string; pct: number }[];
  evalData?: { pillarId: string; pillarTitle: string; pct: number }[];
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;
  const n = pmData.length;

  function polarToCartesian(angle: number, radius: number) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  const angles = pmData.map((_, i) => (360 / n) * i);

  const rings = [20, 40, 60, 80, 100];
  const ringPaths = rings.map(pct => {
    const pts = angles.map(a => polarToCartesian(a, r * (pct / 100)));
    return "M " + pts.map(p => `${p.x},${p.y}`).join(" L ") + " Z";
  });

  const pmPath = (() => {
    const pts = pmData.map((d, i) => polarToCartesian(angles[i], r * (Math.max(d.pct, 2) / 100)));
    return "M " + pts.map(p => `${p.x},${p.y}`).join(" L ") + " Z";
  })();

  const evalPath = evalData ? (() => {
    const pts = evalData.map((d, i) => polarToCartesian(angles[i], r * (Math.max(d.pct, 2) / 100)));
    return "M " + pts.map(p => `${p.x},${p.y}`).join(" L ") + " Z";
  })() : null;

  const axisLines = angles.map(a => {
    const end = polarToCartesian(a, r);
    return { x1: cx, y1: cy, x2: end.x, y2: end.y };
  });

  const labels = pmData.map((d, i) => {
    const pos = polarToCartesian(angles[i], r + 26);
    const pillar = PILLARS.find(p => p.id === d.pillarId);
    return { ...pos, icon: pillar?.icon ?? "", pct: d.pct, label: d.pillarTitle };
  });

  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto overflow-visible">
        {ringPaths.map((path, i) => (
          <path key={i} d={path} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
        ))}
        {axisLines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="currentColor" strokeWidth="0.5" className="text-border" />
        ))}
        {/* Evaluator polygon (below PM so PM is on top) */}
        {evalPath && (
          <path d={evalPath} fill="hsl(38 92% 50% / 0.15)" stroke="hsl(38 92% 50%)" strokeWidth="2" strokeLinejoin="round" />
        )}
        {/* PM polygon */}
        <path d={pmPath} fill="hsl(221 83% 53% / 0.2)" stroke="hsl(221 83% 53%)" strokeWidth="2" strokeLinejoin="round" />
        {/* PM dots */}
        {pmData.map((d, i) => {
          const pos = polarToCartesian(angles[i], r * (Math.max(d.pct, 2) / 100));
          return <circle key={i} cx={pos.x} cy={pos.y} r="4" fill="hsl(221 83% 53%)" />;
        })}
        {/* Evaluator dots */}
        {evalData && evalData.map((d, i) => {
          const pos = polarToCartesian(angles[i], r * (Math.max(d.pct, 2) / 100));
          return <circle key={`ev-${i}`} cx={pos.x} cy={pos.y} r="3.5" fill="hsl(38 92% 50%)" />;
        })}
        {/* Labels */}
        {labels.map((l, i) => {
          const xAnchor = l.x < cx - 5 ? "end" : l.x > cx + 5 ? "start" : "middle";
          return (
            <g key={i}>
              <text x={l.x} y={l.y - 6} textAnchor={xAnchor} fontSize="11" fill="currentColor" className="text-foreground" fontWeight="600">
                {l.icon} {l.pct}%
              </text>
              <text x={l.x} y={l.y + 7} textAnchor={xAnchor} fontSize="9" fill="currentColor" className="text-muted-foreground">
                {l.label.length > 16 ? l.label.slice(0, 14) + "…" : l.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend — only when overlay */}
      {evalData && (
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-8 h-0.5 rounded" style={{ background: "hsl(221 83% 53%)" }} />
            <span className="text-muted-foreground">Autoavaliação</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-8 h-0.5 rounded" style={{ background: "hsl(38 92% 50%)" }} />
            <span className="text-muted-foreground">Avaliador</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Token display card -------------------------------------------------------
function PmTokenCard({ pmToken }: { pmToken: string }) {
  const [copied, setCopied] = useState(false);
  function copyToken() {
    navigator.clipboard.writeText(pmToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // fallback — select text
    });
  }
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8" data-testid="pm-token-card">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔑</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-1">Seu token pessoal</p>
          <p className="text-xs text-muted-foreground mb-3">
            Guarde este código para voltar ao seu resultado a qualquer momento — sem precisar refazer a avaliação.
          </p>
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-2xl font-bold tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-lg"
              data-testid="pm-token-value"
            >
              {pmToken}
            </span>
            <button
              onClick={copyToken}
              className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors"
              data-testid="btn-copy-token"
            >
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Pillar tip card ----------------------------------------------------------
function PillarTipCard({ pillarId, pillarTitle, icon, pct, scores }: {
  pillarId: string; pillarTitle: string; icon: string; pct: number; scores: Record<number, number>;
}) {
  const pillarQs = allQuestions.filter(q => q.pillarId === pillarId);
  const strengths = pillarQs.filter(q => (scores[q.globalIdx] ?? 0) >= 3).slice(0, 3);
  const improvements = pillarQs
    .filter(q => (scores[q.globalIdx] ?? 0) <= 1)
    .sort((a, b) => (scores[a.globalIdx] ?? 0) - (scores[b.globalIdx] ?? 0))
    .slice(0, 3);

  const barClass = pct < 35 ? "bg-red-400" : pct < 55 ? "bg-amber-400" : pct < 75 ? "bg-primary" : "bg-green-500";
  const perfLabel = pct < 35 ? "Área crítica" : pct < 55 ? "Em desenvolvimento" : pct < 75 ? "Bom desempenho" : "Destaque";
  const perfClass = pct < 35 ? "text-red-500" : pct < 55 ? "text-amber-500" : pct < 75 ? "text-primary" : "text-green-600";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <span className="font-semibold text-sm text-foreground">{pillarTitle}</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-foreground">{pct}%</span>
            <div className={`text-xs font-medium ${perfClass}`}>{perfLabel}</div>
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${barClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="p-5 grid sm:grid-cols-2 gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-green-600 dark:text-green-400 mb-3 flex items-center gap-1.5">
            <span>✓</span> O que você faz bem
          </p>
          {strengths.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhuma competência com score ≥ 3 neste pilar ainda.</p>
          ) : (
            <ul className="space-y-2">
              {strengths.map(q => (
                <li key={q.globalIdx} className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs flex items-center justify-center font-bold mt-0.5">
                    {scores[q.globalIdx]}
                  </span>
                  <span className="text-xs text-foreground leading-relaxed">{q.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
            <span>↑</span> Para desenvolver
          </p>
          {improvements.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhuma competência com score ≤ 1. Continue assim!</p>
          ) : (
            <ul className="space-y-2">
              {improvements.map(q => (
                <li key={q.globalIdx} className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-center font-bold mt-0.5">
                    {scores[q.globalIdx] ?? 0}
                  </span>
                  <span className="text-xs text-foreground leading-relaxed">{q.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Main Result Page --------------------------------------------------------
export default function PMResult({ assessmentId }: Props) {
  const [, navigate] = useLocation();

  // Detect if coming from evaluator dashboard (query param: ?from=evaluator&group=XXX)
  // wouter/use-hash-location puts query string in url.search (not inside the hash)
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const fromEvaluator = searchParams.get("from") === "evaluator";
  const evaluatorGroupId = searchParams.get("group") ?? "";

  const { data: assessment, isLoading, isError } = useQuery<Assessment>({
    queryKey: ["/api/assessments", assessmentId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/assessments/${assessmentId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
  });

  const { data: evaluation } = useQuery<Evaluation>({
    queryKey: ["/api/evaluations/for", assessmentId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/evaluations/for/${assessmentId}`);
      if (!res.ok) throw new Error("No evaluation");
      return res.json();
    },
    enabled: !!assessment,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 px-6 py-4 flex items-center"><Logo /></header>
        <main className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-40 rounded-xl" />
        </main>
      </div>
    );
  }

  if (isError || !assessment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">😕</div>
        <p className="text-foreground font-semibold">Resultado não encontrado</p>
        <p className="text-sm text-muted-foreground">O ID da avaliação pode estar incorreto ou o resultado foi excluído.</p>
        <Button variant="ghost" onClick={() => navigate("/")}>← Início</Button>
      </div>
    );
  }

  const pillarData: { pillarId: string; pillarTitle: string; pct: number }[] = JSON.parse(assessment.pillarData);
  const evalPillarData: { pillarId: string; pillarTitle: string; pct: number }[] | undefined =
    evaluation ? JSON.parse(evaluation.pillarData) : undefined;
  const scores: Record<number, number> = JSON.parse(assessment.scores);
  const pct = assessment.pct;
  const pmName = assessment.name;
  const pmToken = assessment.pmToken;

  const overallTip = pct < 35
    ? "Você está no início da jornada. Foque em absorver os fundamentos de produto — leia Inspired e Escaping the Build Trap como prioridade."
    : pct < 55
    ? "Você já tem uma base sólida e consegue contribuir com o time. O próximo passo é aprofundar seu entendimento de negócio e dados para tomar decisões mais autônomas."
    : pct < 75
    ? "Você opera com boa autonomia e entrega valor consistente. Hora de expandir sua influência além do squad e desenvolver visão estratégica."
    : "Você está em um patamar avançado. Seu foco agora é multiplicar — desenvolver outros PMs, criar frameworks e impactar a cultura de produto da empresa.";

  return (
    <div className="min-h-screen bg-background" data-testid="screen-pm-result">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <Logo />
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
          Resultado — {pmName}
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-xl font-bold text-foreground mb-2">Seu perfil de competências</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{overallTip}</p>
        </div>

        {/* Personal token — ALWAYS shown so PM can save it */}
        {pmToken && <PmTokenCard pmToken={pmToken} />}

        {/* Spider chart — overlay when evaluator is done */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8 flex flex-col items-center">
          {evaluation && (
            <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-widest">
              Comparativo: autoavaliação vs. avaliador
            </p>
          )}
          <SpiderChart pmData={pillarData} evalData={evalPillarData} />
          <div className="mt-4 text-center">
            <div className="text-3xl font-bold text-foreground">{pct}%</div>
            <div className="text-sm text-muted-foreground">
              {evaluation ? `sua autoavaliação · avaliador: ${evaluation.pct}%` : "pontuação geral"}
            </div>
          </div>
        </div>

        {/* Evaluator comparison banner — navigate to full comparison */}
        {evaluation && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-8" data-testid="eval-available-banner">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div className="flex-1">
                <div className="font-semibold text-sm text-amber-800 dark:text-amber-300 mb-1">
                  O avaliador já concluiu sua avaliação
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                  {evaluation.evaluatorName} completou a avaliação. Veja o comparativo detalhado com diagnóstico por pilar.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="btn-view-comparison"
                  onClick={() => navigate(`/pm-comparison/${assessmentId}`)}
                >
                  Ver comparativo completo →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pillar tip cards */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">Diagnóstico por pilar</h2>
          <div className="space-y-4">
            {PILLARS.map(p => {
              const pd = pillarData.find(d => d.pillarId === p.id);
              return (
                <PillarTipCard
                  key={p.id}
                  pillarId={p.id}
                  pillarTitle={p.title}
                  icon={p.icon}
                  pct={pd?.pct ?? 0}
                  scores={scores}
                />
              );
            })}
          </div>
        </div>

        {/* References */}
        <div className="bg-muted/40 rounded-xl p-5 mb-8 text-xs text-muted-foreground">
          <p className="font-medium mb-2">Referências recomendadas</p>
          <ul className="space-y-1">
            <li>Inspired — Marty Cagan (SVPG)</li>
            <li>Escaping the Build Trap — Melissa Perri</li>
            <li>Strong Product People — Petra Wille</li>
            <li><a href="https://www.svpg.com/product-model-competencies/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">SVPG Product Model Competencies</a></li>
          </ul>
        </div>

        <div className="flex gap-3 flex-wrap">
          {fromEvaluator ? (
            <Button variant="ghost" onClick={() => navigate(`/evaluator/${evaluatorGroupId}`)} data-testid="btn-back">
              ← Lista de PMs
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate("/")} data-testid="btn-back">← Início</Button>
          )}
          <Button variant="outline" onClick={() => window.print()}>Imprimir</Button>
        </div>
      </main>
    </div>
  );
}
