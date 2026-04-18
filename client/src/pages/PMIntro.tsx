import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PILLARS } from "@/lib/data";
import { Logo } from "./ModeSelection";
import type { QuizConfig } from "@/App";

interface Props {
  quizConfig: QuizConfig | null;
  setQuizConfig: (cfg: QuizConfig) => void;
}

export default function PMIntro({ quizConfig, setQuizConfig }: Props) {
  const [, navigate] = useLocation();

  if (!quizConfig) {
    navigate("/pm-entry");
    return null;
  }

  function start() {
    navigate("/quiz");
  }

  return (
    <div className="min-h-screen bg-background" data-testid="screen-pm-intro">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <Logo />
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
          Autoavaliação · {quizConfig.pmName}
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-xl font-bold text-foreground mb-3">Avaliação de Maturidade PM</h1>
          <p className="text-muted-foreground leading-relaxed text-sm">
            Você vai responder 82 questões distribuídas em 5 pilares de competência. Ao final, você receberá um
            <strong> gráfico de teia</strong> com seu perfil por pilar e dicas personalizadas de pontos fortes e áreas de melhoria.
          </p>
        </div>

        {/* Pillars grid */}
        <div className="mb-10">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Os 5 pilares</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PILLARS.map((p, i) => (
              <div key={p.id} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                <span className="text-2xl shrink-0">{p.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-foreground">0{i + 1} {p.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.subcategories.length} subcategorias · {p.subcategories.reduce((a, s) => a + s.questions.length, 0)} questões
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div className="bg-muted/50 rounded-xl p-5 mb-10">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Escala de pontuação</p>
          <div className="flex gap-2">
            {[0,1,2,3,4].map(s => (
              <div key={s} className={`flex-1 rounded-lg py-3 text-center font-bold text-lg ${
                s === 0 ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' :
                s === 4 ? 'bg-primary text-primary-foreground' :
                'bg-muted text-foreground'
              }`}>
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button data-testid="btn-start-quiz" onClick={start} size="lg">
            Iniciar avaliação →
          </Button>
          <button onClick={() => navigate("/pm-entry")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar
          </button>
        </div>
      </main>
    </div>
  );
}
