import { useLocation } from "wouter";
import { PILLARS } from "@/lib/data";

export default function ModeSelection() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="screen-mode">
      {/* Header */}
      <header className="border-b border-border/40 px-6 py-4 flex items-center gap-3">
        <Logo />
      </header>

      {/* Hero section — Gran light aesthetic: vermelho + branco */}
      <div className="relative overflow-hidden bg-primary border-b border-primary">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-72 h-72 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">
              Gran Cursos Online
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mb-3 leading-tight tracking-tight drop-shadow-sm">
            Avaliação de Maturidade<br />
            <span className="text-white/80 font-extrabold">Product Manager</span>
          </h1>
          <p className="text-sm text-white/75 max-w-md mx-auto leading-relaxed">
            Meça e desenvolva as competências do seu time de produto com base nos 5 pilares de maturidade.
          </p>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        {/* Mode cards */}
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6 font-semibold">
          Como você está acessando?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl w-full mb-12">
          {/* PM Card */}
          <button
            data-testid="btn-mode-pm"
            onClick={() => navigate("/pm-entry")}
            className="group relative bg-card border border-border rounded-xl p-7 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl" />
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-xl">
              👤
            </div>
            <h2 className="font-black text-base text-foreground mb-1 tracking-tight">Sou PM</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              Realize sua autoavaliação, receba diagnóstico por pilar e acompanhe sua evolução.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
              Entrar com token
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </button>

          {/* Evaluator Card */}
          <button
            data-testid="btn-mode-evaluator"
            onClick={() => navigate("/evaluator-login")}
            className="group relative bg-card border border-border rounded-xl p-7 text-left transition-all focus:outline-none focus:ring-2 overflow-hidden"
            style={{ '--tw-ring-color': 'hsl(222 76% 48%)' } as never}
          >
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: 'hsl(222 76% 48%)' }} />
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-xl" style={{ background: 'hsl(222 76% 48% / 0.12)' }}>
              🎯
            </div>
            <h2 className="font-black text-base text-foreground mb-1 tracking-tight">Sou Avaliador</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              Gerencie grupos, visualize autoavaliações do time e realize avaliações como Diretor de Produto.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(222 76% 55%)' }}>
              Painel do avaliador
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </button>
        </div>

        {/* Pillars */}
        <div className="max-w-2xl w-full">
          <p className="text-[10px] text-muted-foreground text-center mb-3 uppercase tracking-widest font-semibold">
            Os 5 pilares da avaliação
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {PILLARS.map(p => (
              <span
                key={p.id}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border"
              >
                {p.icon} {p.title}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Gran-inspired logo: bold G mark with PM track identity */}
      <svg viewBox="0 0 38 38" width={size} height={size} fill="none" aria-label="PM Track">
        <rect width="38" height="38" rx="9" fill="#E8192C" />
        {/* Bold "G" letterform — Gran reference */}
        <text
          x="19"
          y="26"
          textAnchor="middle"
          fontFamily="Montserrat, sans-serif"
          fontWeight="900"
          fontSize="22"
          fill="white"
          letterSpacing="-1"
        >
          G
        </text>
        {/* Small "PM" label bottom right */}
        <rect x="22" y="24" width="14" height="10" rx="3" fill="#1B4FD8" />
        <text
          x="29"
          y="31.5"
          textAnchor="middle"
          fontFamily="Montserrat, sans-serif"
          fontWeight="800"
          fontSize="6"
          fill="white"
        >
          PM
        </text>
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-black text-sm text-foreground tracking-tight leading-none">PM Track</span>
        <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider leading-none mt-0.5">Gran Cursos</span>
      </div>
    </div>
  );
}
