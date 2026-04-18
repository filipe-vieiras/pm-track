import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Logo } from "./ModeSelection";
import { getAdminPassword } from "./AdminLogin";
import { PILLARS, LEVELS } from "@/lib/data";
import type { Assessment, Group } from "@shared/schema";

// Use the same API_BASE as queryClient so requests work both locally and deployed
const API_BASE = ("__PORT_5000__" as string).startsWith("__") ? "" : "__PORT_5000__";

async function adminFetch(method: string, path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "x-admin-password": getAdminPassword() },
  });
  return res;
}

type GroupWithCount = Group & { assessmentCount: number };
type Tab = "dashboard" | "groups" | "assessments";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ---- Trash icon ---------------------------------------------------------------
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}

// ---- Horizontal bar chart component -------------------------------------------
function HBar({ label, value, max, color, sublabel }: {
  label: string; value: number; max: number; color: string; sublabel?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-right text-muted-foreground shrink-0 truncate" title={label}>{label}</div>
      <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden relative">
        <div
          className="h-full rounded-lg transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
        {value > 0 && (
          <span className="absolute inset-0 flex items-center pl-2 text-xs font-bold text-white mix-blend-multiply dark:mix-blend-normal">
            {sublabel ?? value}
          </span>
        )}
      </div>
      <div className="w-10 text-xs font-bold text-foreground shrink-0 text-right">{sublabel ?? value}</div>
    </div>
  );
}

// ---- Donut chart component ----------------------------------------------------
function Donut({ segments, size = 120 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="text-xs text-muted-foreground italic">Sem dados</div>;

  const r = 40;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const arcs = segments.filter(s => s.value > 0).map(seg => {
    const dash = (seg.value / total) * circumference;
    const gap = circumference - dash;
    const arc = { ...seg, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="18" className="text-muted/30" />
      {arcs.map((a, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={a.color}
          strokeWidth="18"
          strokeDasharray={`${a.dash} ${a.gap}`}
          strokeDashoffset={-a.offset + circumference / 4}
          strokeLinecap="butt"
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor" className="text-foreground">{total}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="9" fill="currentColor" className="text-muted-foreground">avaliações</text>
    </svg>
  );
}

// ---- Dashboard tab ------------------------------------------------------------
function DashboardTab({ assessments, groups }: { assessments: Assessment[]; groups: GroupWithCount[] }) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  const filtered = selectedGroupId === "all"
    ? assessments
    : assessments.filter(a => a.groupId === selectedGroupId);

  // ── Level distribution ──────────────────────────────────────────────────────
  const levelOrder = ["apm0","apm1","pm1","pm2","pm3","pm4","gpm2"];
  const levelLabels: Record<string,string> = {
    apm0:"APM0", apm1:"APM1", pm1:"PM1", pm2:"PM2", pm3:"PM3", pm4:"PM4/GPM1", gpm2:"GPM2"
  };
  const levelColors: Record<string,string> = {
    apm0:"hsl(220 9% 60%)", apm1:"hsl(220 9% 50%)",
    pm1:"hsl(221 83% 70%)", pm2:"hsl(221 83% 60%)", pm3:"hsl(221 83% 53%)",
    pm4:"hsl(38 92% 50%)", gpm2:"hsl(142 71% 45%)"
  };
  const levelCounts = levelOrder.map(lid => ({
    id: lid,
    label: levelLabels[lid],
    count: filtered.filter(a => a.levelId === lid).length,
    color: levelColors[lid],
  }));
  const maxLevelCount = Math.max(...levelCounts.map(l => l.count), 1);

  // ── Average per pillar ──────────────────────────────────────────────────────
  const pillarAvgs = PILLARS.map(p => {
    const vals = filtered
      .map(a => {
        try {
          const pd: {pillarId:string; pct:number}[] = JSON.parse(a.pillarData);
          return pd.find(d => d.pillarId === p.id)?.pct ?? null;
        } catch { return null; }
      })
      .filter((v): v is number => v !== null);
    const avg = vals.length > 0 ? Math.round(vals.reduce((s,v) => s+v, 0) / vals.length) : 0;
    return { ...p, avg };
  });
  const maxPillarAvg = Math.max(...pillarAvgs.map(p => p.avg), 1);

  // ── Overall avg ─────────────────────────────────────────────────────────────
  const overallAvg = filtered.length > 0
    ? Math.round(filtered.reduce((s,a) => s+a.pct, 0) / filtered.length)
    : 0;

  // ── Score distribution (0–4 buckets mapped to pct ranges) ───────────────────
  const scoreBuckets = [
    { label: "0–20%", min: 0, max: 20, color: "hsl(0 72% 60%)" },
    { label: "20–35%", min: 20, max: 35, color: "hsl(25 90% 60%)" },
    { label: "35–55%", min: 35, max: 55, color: "hsl(38 92% 50%)" },
    { label: "55–75%", min: 55, max: 75, color: "hsl(221 83% 53%)" },
    { label: "75–100%", min: 75, max: 101, color: "hsl(142 71% 45%)" },
  ];
  const bucketCounts = scoreBuckets.map(b => ({
    ...b,
    count: filtered.filter(a => a.pct >= b.min && a.pct < b.max).length,
  }));
  const maxBucket = Math.max(...bucketCounts.map(b => b.count), 1);

  // ── PMs who haven't completed (groups with 0 assessments, filtered group) ───
  const pendingGroups = selectedGroupId === "all"
    ? groups.filter(g => g.assessmentCount === 0)
    : groups.filter(g => g.id === selectedGroupId && g.assessmentCount === 0);

  // ── Donut segments ───────────────────────────────────────────────────────────
  const donutSegments = levelOrder
    .map(lid => ({
      label: levelLabels[lid],
      value: filtered.filter(a => a.levelId === lid).length,
      color: levelColors[lid],
    }))
    .filter(s => s.value > 0);

  const groupOptions = [
    { id: "all", label: "Todos os grupos" },
    ...groups.map(g => ({ id: g.id, label: `${g.groupName} (${g.evaluatorName})` })),
  ];

  if (assessments.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <div className="text-4xl mb-3">📊</div>
        <p>Nenhuma avaliação realizada ainda. As métricas aparecerão aqui quando os PMs completarem as avaliações.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Group filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Filtrar por grupo</span>
        <div className="flex flex-wrap gap-2">
          {groupOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelectedGroupId(opt.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                selectedGroupId === opt.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "PMs avaliados", value: filtered.length, icon: "👤", sub: "autoavaliações" },
          { label: "Média geral", value: `${overallAvg}%`, icon: "📊", sub: "pontuação média" },
          { label: "Nível mais comum", value: levelCounts.sort((a,b) => b.count - a.count)[0]?.count > 0 ? levelCounts.sort((a,b) => b.count - a.count)[0].label : "—", icon: "🏷️", sub: "entre os avaliados" },
          { label: "Grupos ativos", value: selectedGroupId === "all" ? groups.filter(g => g.assessmentCount > 0).length : (groups.find(g=>g.id===selectedGroupId)?.assessmentCount ?? 0) > 0 ? 1 : 0, icon: "🗂️", sub: "com avaliações" },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-5">
            <div className="text-2xl mb-2">{k.icon}</div>
            <div className="text-2xl font-bold text-foreground mb-0.5">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Donut + Level distribution */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Donut */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">Distribuição de Níveis</h3>
          <div className="flex items-center gap-6">
            <Donut segments={donutSegments} size={130} />
            <div className="flex-1 space-y-2">
              {levelCounts.filter(l => l.count > 0).map(l => (
                <div key={l.id} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                  <span className="text-xs text-foreground font-medium flex-1">{l.label}</span>
                  <span className="text-xs font-bold text-foreground">{l.count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({filtered.length > 0 ? Math.round((l.count / filtered.length) * 100) : 0}%)
                  </span>
                </div>
              ))}
              {levelCounts.every(l => l.count === 0) && (
                <p className="text-xs text-muted-foreground italic">Sem dados para este filtro.</p>
              )}
            </div>
          </div>
        </div>

        {/* Score distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">Distribuição de Scores</h3>
          <div className="space-y-3">
            {bucketCounts.map(b => (
              <HBar
                key={b.label}
                label={b.label}
                value={b.count}
                max={maxBucket}
                color={b.color}
                sublabel={`${b.count} PM${b.count !== 1 ? "s" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Pillar averages */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">Média por Pilar</h3>
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Sem dados para este filtro.</p>
        ) : (
          <div className="space-y-4">
            {pillarAvgs
              .sort((a, b) => b.avg - a.avg)
              .map(p => {
                const barColor =
                  p.avg < 35 ? "hsl(0 72% 60%)" :
                  p.avg < 55 ? "hsl(38 92% 50%)" :
                  p.avg < 75 ? "hsl(221 83% 53%)" :
                  "hsl(142 71% 45%)";
                const label = p.avg < 35 ? "Crítico" : p.avg < 55 ? "Desenvolvimento" : p.avg < 75 ? "Bom" : "Destaque";
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground">{p.icon} {p.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-sm font-bold text-foreground">{p.avg}%</span>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${p.avg}%`, background: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Row 3: PM ranking table */}
      {filtered.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">Ranking de PMs</h3>
          <div className="space-y-2">
            {[...filtered]
              .sort((a, b) => b.pct - a.pct)
              .map((a, idx) => {
                const group = groups.find(g => g.id === a.groupId);
                const medalColor = idx === 0 ? "text-amber-500" : idx === 1 ? "text-zinc-400" : idx === 2 ? "text-amber-700" : "text-muted-foreground";
                const barColor = a.pct < 35 ? "hsl(0 72% 60%)" : a.pct < 55 ? "hsl(38 92% 50%)" : a.pct < 75 ? "hsl(221 83% 53%)" : "hsl(142 71% 45%)";
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                    <span className={`w-5 text-xs font-bold shrink-0 text-right ${medalColor}`}>
                      {idx < 3 ? ["🥇","🥈","🥉"][idx] : `${idx+1}º`}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{a.name}</span>
                        <span className="text-xs text-muted-foreground">{a.levelLabel}</span>
                        {group && <span className="text-xs text-muted-foreground hidden sm:inline">· {group.groupName}</span>}
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${a.pct}%`, background: barColor }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground w-10 text-right shrink-0">{a.pct}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Row 4: Groups without assessments */}
      {(selectedGroupId === "all" ? groups : groups.filter(g => g.id === selectedGroupId)).filter(g => g.assessmentCount === 0).length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-4">
            ⚠️ Grupos sem avaliações ({(selectedGroupId === "all" ? groups : groups.filter(g => g.id === selectedGroupId)).filter(g => g.assessmentCount === 0).length})
          </h3>
          <div className="space-y-2">
            {(selectedGroupId === "all" ? groups : groups.filter(g => g.id === selectedGroupId))
              .filter(g => g.assessmentCount === 0)
              .map(g => (
                <div key={g.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {g.groupName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{g.groupName}</span>
                    <span className="text-xs text-muted-foreground ml-2">· {g.evaluatorName}</span>
                    {g.evaluatorEmail && <span className="text-xs text-muted-foreground ml-1">· {g.evaluatorEmail}</span>}
                  </div>
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">{g.token}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main AdminDash -----------------------------------------------------------
export default function AdminDash() {
  const [, navigate] = useLocation();
  const qClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<GroupWithCount | null>(null);
  const [deleteAssessmentTarget, setDeleteAssessmentTarget] = useState<Assessment | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const pw = getAdminPassword();
  if (!pw) { navigate("/admin"); return null; }

  // ---- Queries ----------------------------------------------------------------
  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useQuery<GroupWithCount[]>({
    queryKey: ["/api/admin/groups"],
    queryFn: async () => {
      const res = await adminFetch("GET", "/api/admin/groups");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
    staleTime: 0,
  });

  const { data: assessments, isLoading: assessmentsLoading, refetch: refetchAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/admin/assessments"],
    queryFn: async () => {
      const res = await adminFetch("GET", "/api/admin/assessments");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
    staleTime: 0,
  });

  // ---- Mutations --------------------------------------------------------------
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminFetch("DELETE", `/api/admin/groups/${id}`);
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      qClient.invalidateQueries({ queryKey: ["/api/admin/assessments"] });
      refetchGroups(); refetchAssessments();
    },
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminFetch("DELETE", `/api/admin/assessments/${id}`);
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ["/api/admin/assessments"] });
      qClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      refetchAssessments(); refetchGroups();
    },
  });

  const totalGroups = groups?.length ?? 0;
  const totalAssessments = assessments?.length ?? 0;
  const isLoading = groupsLoading || assessmentsLoading;

  const TABS: { id: Tab; label: string }[] = [
    { id: "dashboard", label: `Dashboard` },
    { id: "groups", label: `Grupos (${totalGroups})` },
    { id: "assessments", label: `Avaliações (${totalAssessments})` },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="screen-admin-dash">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">Admin</span>
        </div>
        <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Sair</button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">

        {/* Tabs */}
        <div className="flex rounded-xl border border-border overflow-hidden mb-8 w-fit">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${i > 0 ? "border-l border-border" : ""} ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        )}

        {/* ── DASHBOARD TAB ── */}
        {!isLoading && tab === "dashboard" && (
          <DashboardTab assessments={assessments ?? []} groups={groups ?? []} />
        )}

        {/* ── GROUPS TAB ── */}
        {!isLoading && tab === "groups" && (
          <>
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="sm" onClick={() => refetchGroups()}>↻ Atualizar</Button>
            </div>
            {!groups || groups.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">Nenhum grupo cadastrado.</div>
            ) : (
              <div className="space-y-3">
                {groups.map(g => {
                  const groupAssessments = assessments?.filter(a => a.groupId === g.id) ?? [];
                  const isExpanded = expandedGroup === g.id;
                  return (
                    <div key={g.id} className="bg-card border border-border rounded-xl overflow-hidden">
                      <div className="px-5 py-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{g.groupName}</span>
                            <span className="text-xs text-muted-foreground">· Avaliador: {g.evaluatorName}</span>
                            {g.evaluatorEmail && <span className="text-xs text-muted-foreground">· {g.evaluatorEmail}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">PM: {g.token}</span>
                            <span className="text-xs font-mono text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Avaliador: {g.evaluatorToken}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(g.createdAt)}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              g.assessmentCount > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"
                            }`}>
                              {g.assessmentCount} avaliação{g.assessmentCount !== 1 ? "ões" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {groupAssessments.length > 0 && (
                            <button
                              onClick={() => setExpandedGroup(isExpanded ? null : g.id)}
                              className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
                            >
                              {isExpanded ? "▲ Fechar" : "▼ Ver avaliações"}
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteGroupTarget(g)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Excluir grupo e todas as avaliações"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                      {isExpanded && groupAssessments.length > 0 && (
                        <div className="border-t border-border/40 divide-y divide-border/40">
                          {groupAssessments.map(a => (
                            <div key={a.id} className="px-5 py-3 flex items-center gap-3 bg-muted/20">
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                {a.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground">{a.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">{a.pct}% · {a.levelLabel} · {formatDate(a.date)}</span>
                              </div>
                              <button
                                onClick={() => setDeleteAssessmentTarget(a)}
                                className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── ASSESSMENTS TAB ── */}
        {!isLoading && tab === "assessments" && (
          <>
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="sm" onClick={() => refetchAssessments()}>↻ Atualizar</Button>
            </div>
            {!assessments || assessments.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">Nenhuma avaliação cadastrada.</div>
            ) : (
              <div className="space-y-2">
                {assessments.map(a => {
                  const group = groups?.find(g => g.id === a.groupId);
                  return (
                    <div key={a.id} className="bg-card border border-border rounded-xl px-5 py-3 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{a.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{a.levelLabel}</span>
                          <span className="text-xs font-bold text-foreground">{a.pct}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {group ? `${group.groupName} · ${group.evaluatorName}` : "Sem grupo"} · {formatDate(a.date)}
                          {a.pmToken && <span className="ml-2 font-mono text-primary/70">token: {a.pmToken}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => navigate(`/pm-result/${a.id}`)}
                          className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1 transition-colors"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => setDeleteAssessmentTarget(a)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── DELETE GROUP DIALOG ── */}
      <AlertDialog open={!!deleteGroupTarget} onOpenChange={open => !open && setDeleteGroupTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir o grupo <strong>"{deleteGroupTarget?.groupName}"</strong>? Isso removerá também todas as{" "}
              <strong>{deleteGroupTarget?.assessmentCount} avaliações</strong> associadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteGroupTarget) { deleteGroupMutation.mutate(deleteGroupTarget.id); setDeleteGroupTarget(null); } }}
            >
              Excluir grupo e avaliações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── DELETE ASSESSMENT DIALOG ── */}
      <AlertDialog open={!!deleteAssessmentTarget} onOpenChange={open => !open && setDeleteAssessmentTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir a autoavaliação de <strong>"{deleteAssessmentTarget?.name}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteAssessmentTarget) { deleteAssessmentMutation.mutate(deleteAssessmentTarget.id); setDeleteAssessmentTarget(null); } }}
            >
              Excluir avaliação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
