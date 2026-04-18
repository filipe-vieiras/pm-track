import { useState } from "react";
import { Router, Switch, Route } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import ModeSelection from "@/pages/ModeSelection";
import PMGroupEntry from "@/pages/PMGroupEntry";
import PMIntro from "@/pages/PMIntro";
import Quiz from "@/pages/Quiz";
import PMResult from "@/pages/PMResult";
import EvaluatorLogin from "@/pages/EvaluatorLogin";
import EvaluatorDash from "@/pages/EvaluatorDash";
import EvaluatorResult from "@/pages/EvaluatorResult";
import AdminLogin from "@/pages/AdminLogin";
import AdminDash from "@/pages/AdminDash";

// In-memory state: only used to carry data FORWARD to the next step.
// Result pages (PMResult, EvaluatorResult) are server-driven via URL params
// and never depend on this state.
export interface QuizConfig {
  mode: "pm" | "evaluator";
  pmName: string;
  groupId?: string;
  evaluatorName?: string;
  linkedAssessmentId?: string; // evaluator mode: PM's assessment id
}

export default function App() {
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={ModeSelection} />

          {/* PM flow */}
          <Route path="/pm-entry">
            <PMGroupEntry setQuizConfig={setQuizConfig} />
          </Route>
          <Route path="/pm-intro">
            <PMIntro quizConfig={quizConfig} setQuizConfig={setQuizConfig} />
          </Route>
          {/* Server-driven result — no in-memory state needed */}
          <Route path="/pm-result/:assessmentId">
            {(params) => <PMResult assessmentId={params.assessmentId} />}
          </Route>

          {/* Shared quiz — used for both PM self-assessment and evaluator assessment */}
          <Route path="/quiz">
            <Quiz config={quizConfig} setQuizConfig={setQuizConfig} />
          </Route>

          {/* Evaluator result — server-driven via assessmentId */}
          <Route path="/eval-result/:assessmentId">
            {(params) => <EvaluatorResult assessmentId={params.assessmentId} viewer="evaluator" />}
          </Route>

          {/* PM comparison — same data but level indicators hidden */}
          <Route path="/pm-comparison/:assessmentId">
            {(params) => <EvaluatorResult assessmentId={params.assessmentId} viewer="pm" />}
          </Route>

          {/* Admin flow */}
          <Route path="/admin" component={AdminLogin} />
          <Route path="/admin-dash" component={AdminDash} />

          {/* Evaluator flow */}
          <Route path="/evaluator-login">
            <EvaluatorLogin />
          </Route>
          <Route path="/evaluator/new">
            <EvaluatorDash groupId="new" setQuizConfig={setQuizConfig} />
          </Route>
          <Route path="/evaluator/:groupId">
            {(params) => <EvaluatorDash groupId={params.groupId} setQuizConfig={setQuizConfig} />}
          </Route>
        </Switch>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
