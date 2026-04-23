import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LEVELS, PILLARS, allQuestions } from "@/lib/data";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "./ModeSelection";
import type { Assessment, Evaluation } from "@shared/schema";

// ---- Overlay Spider Chart ---------------------------------------------------
function OverlaySpiderChart({
  pmData,
  evalData,
}: {
  pmData: { pillarId: string; pillarTitle: string; pct: number }[];
  evalData: { pillarId: string; pillarTitle: string; pct: number }[];
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

  const evalPath = (() => {
    const pts = evalData.map((d, i) => polarToCartesian(angles[i], r * (Math.max(d.pct, 2) / 100)));
    return "M " + pts.map(p => `${p.x},${p.y}`).join(" L ") + " Z";
  })();

  const axisLines = angles.map(a => {
    const end = polarToCartesian(a, r);
    return { x1: cx, y1: cy, x2: end.x, y2: end.y };
  });

  const labels = pmData.map((d, i) => {
    const pos = polarToCartesian(angles[i], r + 26);
    const pillar = PILLARS.find(p => p.id === d.pillarId);
    return { ...pos, icon: pillar?.icon ?? "", pmPct: d.pct, label: d.pillarTitle };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto overflow-visible">
        {ringPaths.map((path, i) => (
          <path key={i} d={path} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
        ))}
        {axisLines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="currentColor" strokeWidth="0.5" className="text-border" />
        ))}
        {/* PM polygon (behind) */}
        <path d={pmPath} fill="hsl(221 83% 53% / 0.2)" stroke="hsl(221 83% 53%)" strokeWidth="2" strokeLinejoin="round" />
        {/* Evaluator polygon (on top) */}
        <path d={evalPath} fill="hsl(38 92% 50% / 0.15)" stroke="hsl(38 92% 50%)" strokeWidth="2" strokeLinejoin="round" />
        {/* PM dots */}
        {pmData.map((d, i) => {
          const pos = polarToCartesian(angles[i], r * (Math.max(d.pct, 2) / 100));
          return <circle key={`pm-${i}`} cx={pos.x} cy={pos.y} r="3.5" fill="hsl(221 83% 53%)" />;
        })}
        {/* Evaluator dots */}
        {evalData.map((d, i) => {
          const pos = polarToCartesian(angles[i], r * (Math.max(d.pct, 2) / 100));
          return <circle key={`ev-${i}`} cx={pos.x} cy={pos.y} r="3.5" fill="hsl(38 92% 50%)" />;
        })}
        {/* Labels */}
        {labels.map((l, i) => {
          const xAnchor = l.x < cx - 5 ? "end" : l.x > cx + 5 ? "start" : "middle";
          return (
            <g key={i}>
              <text x={l.x} y={l.y - 6} textAnchor={xAnchor} fontSize="11" fill="currentColor" className="text-foreground" fontWeight="600">
                {l.icon} {l.pmPct}%
              </text>
              <text x={l.x} y={l.y + 7} textAnchor={xAnchor} fontSize="9" fill="currentColor" className="text-muted-foreground">
                {l.label.length > 16 ? l.label.slice(0, 14) + "\u2026" : l.label}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-0.5 rounded" style={{ background: "hsl(221 83% 53%)" }} />
          <span className="text-muted-foreground">Autoavaliação (PM)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-0.5 rounded" style={{ background: "hsl(38 92% 50%)" }} />
          <span className="text-muted-foreground">Avaliador</span>
        </div>
      </div>
    </div>
  );
}

// ---- Single Spider Chart (PM only, no overlay) ---------------------------------
function SingleSpiderChart({ data }: { data: { pillarId: string; pillarTitle: string; pct: number }[] }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;
  const n = data.length;

  function polarToCartesian(angle: number, radius: number) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  const angles = data.map((_, i) => (360 / n) * i);
  const rings = [20, 40, 60, 80, 100];
  const ringPaths = rings.map(pct => {
    const pts = angles.map(a => polarToCartesian(a, r * (pct / 100)));
    return "M " + pts.map(p => `${p.x},${p.y}`).join(" L ") + " Z";
  });
  const pmPath = (() => {
    const pts = data.map((d, i) => polarToCartesian(angles[i], r * (Math.max(d.pct, 2) / 100)));
    return "M " + pts.map(p => `${p.x},${p.y}`).join(" L ") + " Z";
  })();
  const axisLines = angles.map(a => {
    const end = polarToCartesian(a, r);
    return { x1: cx, y1: cy, x2: end.x, y2: end.y };
  });
  const labels = data.map((d, i) => {
    const pos = polarToCartesian(angles[i], r + 26);
    const pillar = PILLARS.find(p => p.id === d.pillarId);
    return { ...pos, icon: pillar?.icon ?? "", pct: d.pct, label: d.pillarTitle };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto overflow-visible">
        {ringPaths.map((path, i) => (
          <path key={i} d={path} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
        ))}
        {axisLines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="currentColor" strokeWidth="0.5" className="text-border" />
        ))}
        <path d={pmPath} fill="hsl(221 83% 53% / 0.2)" stroke="hsl(221 83% 53%)" strokeWidth="2" strokeLinejoin="round" />
        {data.map((d, i) => {
          const pos = polarToCartesian(angles[i], r * (Math.max(d.pct, 2) / 100));
          return <circle key={i} cx={pos.x} cy={pos.y} r="3.5" fill="hsl(221 83% 53%)" />;
        })}
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
    </div>
  );
}

interface Props {
  assessmentId: string; // PM's assessment ID — load both PM + evaluator data from server
  viewer?: "pm" | "evaluator"; // "pm" = hide all level labels/badges/trail
}

const LEVEL_ORDER = ["apm0","apm1","pm1","pm2","pm3","pm4","gpm2"];
const LEVEL_LABELS: Record<string, string> = {
  apm0:"APM0", apm1:"APM1", pm1:"PM1", pm2:"PM2", pm3:"PM3", pm4:"PM4/GPM1", gpm2:"GPM2"
};

function groupColor(group: string) {
  if (group === "apm") return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  if (group === "gpm") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-primary/10 text-primary";
}

function groupTextColor(group: string) {
  if (group === "apm") return "text-zinc-600 dark:text-zinc-300";
  if (group === "gpm") return "text-red-700 dark:text-red-400";
  return "text-primary";
}

// ---- Comparison panel -------------------------------------------------------
function ComparisonContent({
  pmName, pmPct, pmLevel, pmPillar,
  evalPct, evalLevel, evalPillar,
  evaluatorName, diff, diffLabel, diffClass,
  pmScores, evalScores,
  hideLevels,
}: {
  pmName: string;
  pmPct: number; pmLevel: (typeof LEVELS)[0];
  pmPillar: { pillarId: string; pillarTitle: string; pct: number }[];
  evalPct: number; evalLevel: (typeof LEVELS)[0];
  evalPillar: { pillarId: string; pillarTitle: string; pct: number }[];
  evaluatorName: string;
  diff: number; diffLabel: string; diffClass: string;
  pmScores: Record<number,number>;
  evalScores: Record<number,number>;
  hideLevels?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-8" data-testid="comparison-panel">
      <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-6">
        Comparativo: Autoavaliação vs. Visão do Avaliador
      </h2>

      {/* Big scores */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Autoavaliação ({pmName})</p>
          <div className={`text-3xl font-bold mb-2 ${hideLevels ? "text-foreground" : groupTextColor(pmLevel.group)}`}>{pmPct}%</div>
          {!hideLevels && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${groupColor(pmLevel.group)}`}>{pmLevel.label}</span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className={`text-sm font-semibold text-center ${diffClass}`}>{diffLabel}</div>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Visão do avaliador ({evaluatorName})</p>
          <div className={`text-3xl font-bold mb-2 ${hideLevels ? "text-foreground" : groupTextColor(evalLevel.group)}`}>{evalPct}%</div>
          {!hideLevels && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${groupColor(evalLevel.group)}`}>{evalLevel.label}</span>
          )}
        </div>
      </div>

      {/* Pillar comparison */}
      <div className="space-y-5">
        {pmPillar.map((pmP, i) => {
          const evalP = evalPillar[i];
          const d = evalP ? evalP.pct - pmP.pct : 0;
          const dClass = d > 8 ? "text-green-600" : d < -8 ? "text-red-500" : "text-muted-foreground";
          const pillar = PILLARS.find(p => p.id === pmP.pillarId);
          return (
            <div key={pmP.pillarId}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">{pillar?.icon} {pmP.pillarTitle}</span>
                <span className={`text-xs font-bold ${dClass}`}>{d > 0 ? "+" : ""}{d}pp</span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>PM (auto)</span><span>{pmP.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full transition-all" style={{ width: `${pmP.pct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Avaliador</span><span>{evalP?.pct ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${evalP?.pct ?? 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Biggest divergences */}
      <div className="mt-8 pt-6 border-t border-border/40">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Maiores divergências por competência</p>
        {(() => {
          const divergences = allQuestions
            .map(q => ({
              q,
              pmS: pmScores[q.globalIdx] ?? 0,
              evS: evalScores[q.globalIdx] ?? 0,
              diff: (evalScores[q.globalIdx] ?? 0) - (pmScores[q.globalIdx] ?? 0),
            }))
            .filter(d => Math.abs(d.diff) >= 2)
            .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
            .slice(0, 5);

          if (divergences.length === 0) {
            return <p className="text-xs text-muted-foreground italic">Nenhuma divergência significativa (≥ 2 pontos) encontrada. Avaliações bastante alinhadas.</p>;
          }
          return (
            <ul className="space-y-3">
              {divergences.map(({ q, pmS, evS, diff: d }) => (
                <li key={q.globalIdx} className="flex items-start gap-3">
                  <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                    d > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {d > 0 ? "+" : ""}{d}
                  </span>
                  <div>
                    <div className="text-xs text-foreground leading-relaxed">{q.text}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {q.pillarTitle} · PM: {pmS}/4 → Avaliador: {evS}/4
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          );
        })()}
      </div>
    </div>
  );
}

// ---- Main page ----------------------------------------------------------------
export default function EvaluatorResult({ assessmentId, viewer = "evaluator" }: Props) {
  const isEvaluator = viewer === "evaluator";
  const hideLevels = !isEvaluator;
  const [, navigate] = useLocation();
  const ringRef = useRef<SVGCircleElement>(null);

  // Load PM's self-assessment
  const { data: assessment, isLoading: loadingAssessment, isError: errorAssessment } = useQuery<Assessment>({
    queryKey: ["/api/assessments", assessmentId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/assessments/${assessmentId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
  });

  // Load evaluator's evaluation of this PM
  const { data: evaluation, isLoading: loadingEvaluation } = useQuery<Evaluation>({
    queryKey: ["/api/evaluations/for", assessmentId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/evaluations/for/${assessmentId}`);
      if (!res.ok) throw new Error("No evaluation yet");
      return res.json();
    },
    enabled: !!assessment,
    retry: false,
  });

  const evalPct = evaluation?.pct ?? 0;
  const evalLevelId = evaluation?.levelId ?? "pm1";
  const evalLevel = LEVELS.find(l => l.id === evalLevelId) || LEVELS[0];

  useEffect(() => {
    if (!evaluation || !ringRef.current) return;
    const timeout = setTimeout(() => {
      if (ringRef.current) {
        const circumference = 314.16;
        ringRef.current.style.strokeDashoffset = String(circumference - (evalPct / 100) * circumference);
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [evaluation, evalPct]);

  // ---- Loading state ----
  if (loadingAssessment || loadingEvaluation) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 px-6 py-4 flex items-center"><Logo /></header>
        <main className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          <div className="flex flex-col items-center gap-4 mb-10">
            <Skeleton className="w-40 h-40 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </main>
      </div>
    );
  }

  // ---- Error state ----
  if (errorAssessment || !assessment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">😕</div>
        <p className="text-foreground font-semibold">Avaliação não encontrada</p>
        <p className="text-sm text-muted-foreground">O ID da avaliação pode estar incorreto ou foi excluído.</p>
        <Button variant="ghost" onClick={() => navigate("/")}>← Início</Button>
      </div>
    );
  }

  // ---- No evaluation yet ----
  if (!evaluation) {
    const pmPillar: { pillarId: string; pillarTitle: string; pct: number }[] = JSON.parse(assessment.pillarData);
    const pmLevel = LEVELS.find(l => l.id === assessment.levelId) || LEVELS[0];
    const pmCurIdx = LEVEL_ORDER.indexOf(assessment.levelId);

    // PM sees waiting screen
    if (!isEvaluator) {
      return (
        <div className="min-h-screen bg-background" data-testid="screen-eval-result-no-eval">
          <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
            <Logo />
            <button onClick={() => navigate(`/pm-result/${assessmentId}`)} className="text-xs text-muted-foreground hover:text-foreground">← Voltar</button>
          </header>
          <main className="max-w-3xl mx-auto px-4 py-10">
            <div className="text-center py-16">
              <div className="text-5xl mb-4">⏳</div>
              <h1 className="text-xl font-bold text-foreground mb-2">Aguardando avaliação do avaliador</h1>
              <p className="text-sm text-muted-foreground mb-6">
                {assessment.name}, sua autoavaliação está salva com {assessment.pct}%.<br />
                O comparativo aparecerá aqui quando o avaliador concluir.
              </p>
              <Button variant="ghost" onClick={() => navigate(`/pm-result/${assessmentId}`)}>← Voltar ao meu resultado</Button>
            </div>
          </main>
        </div>
      );
    }

    // Evaluator sees PM's self-assessment in full, with a banner to start evaluating
    return (
      <div className="min-h-screen bg-background" data-testid="screen-eval-result-no-eval-evaluator">
        <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
          <Logo />
          <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
            Autoavaliação de {assessment.name}
          </span>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-10">

          {/* Banner — you haven't evaluated yet */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  Autoavaliação de {assessment.name} — ainda não avaliado por você
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Veja abaixo como {assessment.name} se avaliou. Volte ao painel para iniciar sua avaliação e liberar o comparativo.
                </p>
              </div>
            </div>
          </div>

          {/* Score ring */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-36 h-36 mb-4">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
                <circle
                  cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray="314.16"
                  strokeDashoffset={String(314.16 - (assessment.pct / 100) * 314.16)}
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{assessment.pct}%</span>
                <span className="text-xs text-muted-foreground">autoavaliação</span>
              </div>
            </div>
            <span className={`text-sm font-semibold px-4 py-1.5 rounded-full mb-2 ${groupColor(pmLevel.group)}`}>{pmLevel.label}</span>
            <h1 className="text-xl font-bold text-center">{assessment.name} — {pmLevel.title}</h1>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-1">{pmLevel.desc}</p>
          </div>

          {/* Spider chart — PM only */}
          <div className="bg-card border border-border rounded-2xl p-8 mb-8">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-6 text-center">
              Perfil de competências (autoavaliação)
            </h2>
            <SingleSpiderChart data={pmPillar} />
          </div>

          {/* Pillar bars */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-5">Resultado por pilar</h2>
            <div className="space-y-4">
              {pmPillar.map((p) => {
                const pillar = PILLARS.find(pl => pl.id === p.pillarId);
                return (
                  <div key={p.pillarId}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{pillar?.icon} {p.pillarTitle}</span>
                      <span className="text-sm font-bold">{p.pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level trail */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-5">Trilha — nível da autoavaliação</h2>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {LEVEL_ORDER.map((lid, i) => {
                const isCur = lid === assessment.levelId;
                const isAch = i < pmCurIdx;
                return (
                  <div key={lid} className="flex items-center gap-1">
                    <div className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg min-w-[64px] text-center ${
                      isCur ? "bg-primary text-primary-foreground" :
                      isAch ? "bg-green-500/10 text-green-700 dark:text-green-400" :
                      "bg-muted text-muted-foreground/50"
                    }`}>
                      <span className="text-xs font-bold">{LEVEL_LABELS[lid]}</span>
                      {isCur && <span className="text-[9px]">← PM</span>}
                    </div>
                    {i < LEVEL_ORDER.length - 1 && <div className={`w-4 h-0.5 shrink-0 ${isAch ? "bg-green-500" : "bg-muted"}`} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="ghost" onClick={() => window.history.back()}>← Voltar</Button>
          </div>
        </main>
      </div>
    );
  }

  // ---- Full comparison view (both PM self-assessment + evaluator done) ----
  const pmPillar: { pillarId: string; pillarTitle: string; pct: number }[] = JSON.parse(assessment.pillarData);
  const evalPillar: { pillarId: string; pillarTitle: string; pct: number }[] = JSON.parse(evaluation.pillarData);
  const pmScores: Record<number,number> = JSON.parse(assessment.scores);
  const evalScores: Record<number,number> = JSON.parse(evaluation.scores);
  const pmLevel = LEVELS.find(l => l.id === assessment.levelId) || LEVELS[0];
  const curIdx = LEVEL_ORDER.indexOf(evalLevelId);
  const diff = evalPct - assessment.pct;
  const diffLabel = diff > 0 ? `+${diff}pp (avaliador vê mais)` : diff < 0 ? `${diff}pp (avaliador vê menos)` : "Alinhados";
  const diffClass = diff > 4 ? "text-green-600" : diff < -4 ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background" data-testid="screen-eval-result">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <Logo />
        <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
          Avaliação de {assessment.name}
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Score ring + level badge */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative w-40 h-40 mb-5">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30"/>
              <circle
                ref={ringRef}
                cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10"
                strokeLinecap="round" strokeDasharray="314.16" strokeDashoffset="314.16"
                style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
                className={isEvaluator
                  ? (evalLevel.group === "apm" ? "text-zinc-500" : evalLevel.group === "gpm" ? "text-red-500" : "text-primary")
                  : "text-primary"
                }
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{evalPct}%</span>
              <span className="text-xs text-muted-foreground">avaliador</span>
            </div>
          </div>
          {isEvaluator && (
            <span className={`text-sm font-semibold px-4 py-1.5 rounded-full mb-3 ${groupColor(evalLevel.group)}`}>{evalLevel.label}</span>
          )}
          <h1 className="text-xl font-bold text-center mb-2">
            {isEvaluator ? `${assessment.name} — ${evalLevel.title}` : `Comparativo — ${assessment.name}`}
          </h1>
          {isEvaluator && (
            <p className="text-sm text-muted-foreground text-center max-w-md">{evalLevel.desc}</p>
          )}
        </div>

        {/* PM4/GPM1 note — evaluator only */}
        {isEvaluator && evalLevel.id === "pm4" && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 text-sm text-amber-800 dark:text-amber-300">
            <strong>Nota PM4 / GPM1:</strong> As competências técnicas são equivalentes neste nível. A diferença está no escopo: PM4 é IC de alto impacto, GPM1 lidera um grupo de PMs.
          </div>
        )}

        {/* Overlay spider chart */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-6 text-center">
            Sobreposição das avaliações
          </h2>
          <OverlaySpiderChart pmData={pmPillar} evalData={evalPillar} />
        </div>

        {/* Comparison panel */}
        <ComparisonContent
          pmName={assessment.name}
          pmPct={assessment.pct} pmLevel={pmLevel}
          pmPillar={pmPillar}
          evalPct={evalPct} evalLevel={evalLevel}
          evalPillar={evalPillar}
          evaluatorName={evaluation.evaluatorName}
          diff={diff} diffLabel={diffLabel} diffClass={diffClass}
          pmScores={pmScores} evalScores={evalScores}
          hideLevels={hideLevels}
        />

        {/* Level trail — evaluator only */}
        {isEvaluator && (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-5">Trilha — nível avaliado</h2>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {LEVEL_ORDER.map((lid, i) => {
                const isCur = lid === evalLevelId;
                const isAch = i < curIdx;
                return (
                  <div key={lid} className="flex items-center gap-1">
                    <div className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg min-w-[64px] text-center ${
                      isCur ? "bg-primary text-primary-foreground" :
                      isAch ? "bg-green-500/10 text-green-700 dark:text-green-400" :
                      "bg-muted text-muted-foreground/50"
                    }`}>
                      <span className="text-xs font-bold">{LEVEL_LABELS[lid]}</span>
                      {isCur && <span className="text-[9px]">← avaliado</span>}
                    </div>
                    {i < LEVEL_ORDER.length - 1 && <div className={`w-4 h-0.5 shrink-0 ${isAch ? "bg-green-500" : "bg-muted"}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Next steps — evaluator only */}
        {isEvaluator && (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-5">Sugestões de desenvolvimento</h2>
            <div className="space-y-4">
              {evalLevel.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="text-2xl shrink-0">{s.icon}</span>
                  <div>
                    <div className="text-sm font-semibold mb-1">{s.title}</div>
                    <div className="text-sm text-muted-foreground">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => assessment?.groupId ? navigate(`/evaluator/${assessment.groupId}`) : window.history.back()}
          >
            ← Voltar à lista de PMs
          </Button>
          <Button variant="outline" onClick={() => window.print()}>Imprimir comparativo</Button>
        </div>

        {/* Comments Section */}
        <div className="mt-12 space-y-6 print:mt-8">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">Considerações e Sugestões</h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Autoavaliação ({assessment.name})</p>
              <div className="text-sm text-foreground italic whitespace-pre-wrap">
                {assessment.comments || "Nenhum comentário registrado."}
              </div>
            </div>

            {evaluation && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Visão do Avaliador ({evaluation.evaluatorName})</p>
                <div className="text-sm text-foreground italic whitespace-pre-wrap">
                  {evaluation.comments || "Nenhum comentário registrado."}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
