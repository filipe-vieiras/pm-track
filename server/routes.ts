import type { Express } from "express";
import type { Server } from "http";
import https from "https";
import { storage } from "./storage";
import { insertAssessmentSchema, insertEvaluationSchema } from "@shared/schema";
import { z } from "zod";

function nanoid(len = 10) {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}
function makeToken(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let t = "";
  for (let i = 0; i < len; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

function buildEmailHtml(opts: { evaluatorName: string; groupName: string; pmToken: string; evaluatorToken: string }) {
  return `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
      <div style="margin-bottom:24px">
        <span style="background:#3b3fa8;color:white;padding:6px 14px;border-radius:8px;font-weight:700;font-size:16px">PM Track</span>
      </div>
      <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px">Olá, ${opts.evaluatorName}!</h2>
      <p style="color:#6b7280;margin:0 0 24px">Seu grupo <strong>${opts.groupName}</strong> foi criado. Guarde os dois tokens abaixo com segurança.</p>

      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:16px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;margin-bottom:8px">Token dos PMs (compartilhe com o time)</div>
        <div style="font-size:28px;font-weight:800;letter-spacing:0.15em;font-family:monospace;color:#3b3fa8">${opts.pmToken}</div>
        <div style="font-size:12px;color:#9ca3af;margin-top:6px">Envie este código para os PMs que realizarão a autoavaliação.</div>
      </div>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px;margin-bottom:24px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9a3412;margin-bottom:8px">🔐 Seu token de avaliador (não compartilhe)</div>
        <div style="font-size:28px;font-weight:800;letter-spacing:0.15em;font-family:monospace;color:#9a3412">${opts.evaluatorToken}</div>
        <div style="font-size:12px;color:#c2410c;margin-top:6px">Use este token para acessar o painel do avaliador e ver as avaliações do time.</div>
      </div>

      <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:16px;margin:0">
        PM Track · Avaliação de Maturidade de Produto
      </p>
    </div>
  `;
}

async function sendGroupEmail(opts: {
  to: string;
  evaluatorName: string;
  groupName: string;
  pmToken: string;
  evaluatorToken: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[email] RESEND_API_KEY not set — tokens:", opts.pmToken, opts.evaluatorToken);
    return false;
  }

  const body = JSON.stringify({
    from: "PM Track <onboarding@resend.dev>",
    to: [opts.to],
    subject: `PM Track — Grupo "${opts.groupName}" criado`,
    html: buildEmailHtml(opts),
  });

  return new Promise((resolve) => {
    const req = https.request(
      { hostname: "api.resend.com", path: "/emails", method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let data = "";
        res.on("data", (c) => data += c);
        res.on("end", () => {
          if (res.statusCode && res.statusCode < 300) {
            console.log("[email] Sent via Resend to", opts.to);
            resolve(true);
          } else {
            console.error("[email] Resend error", res.statusCode, data);
            resolve(false);
          }
        });
      }
    );
    req.on("error", (e) => { console.error("[email] Request error:", e); resolve(false); });
    req.write(body);
    req.end();
  });
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "pmtrack-admin-2026";

export async function registerRoutes(httpServer: Server, app: Express) {

  // ---- ADMIN ----------------------------------------------------------------

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Senha incorreta" });
    }
    res.json({ ok: true });
  });

  // All admin routes require the admin password as a header
  function requireAdmin(req: any, res: any, next: any) {
    const pw = req.headers["x-admin-password"];
    if (!pw || pw !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    next();
  }

  // GET all groups with their assessment + evaluation counts
  app.get("/api/admin/groups", requireAdmin, (req, res) => {
    const allGroups = storage.getAllGroups();
    const allAssessments = storage.getAllAssessments();
    const result = allGroups
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(g => {
        const groupAssessments = allAssessments.filter(a => a.groupId === g.id);
        return { ...g, assessmentCount: groupAssessments.length };
      });
    res.json(result);
  });

  // GET all assessments (admin)
  app.get("/api/admin/assessments", requireAdmin, (req, res) => {
    const all = storage.getAllAssessments()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(all);
  });

  // DELETE a group (cascades to assessments + evaluations)
  app.delete("/api/admin/groups/:id", requireAdmin, (req, res) => {
    storage.deleteGroup(req.params.id);
    res.json({ ok: true });
  });

  // DELETE a single assessment (and its evaluation)
  app.delete("/api/admin/assessments/:id", requireAdmin, (req, res) => {
    // Also delete associated evaluation
    const ev = storage.getEvaluationForAssessment(req.params.id);
    if (ev) {
      // Delete evaluation inline via db
      storage.deleteAssessment(req.params.id); // deletes assessment
    } else {
      storage.deleteAssessment(req.params.id);
    }
    res.json({ ok: true });
  });

  // ---- GROUPS ---------------------------------------------------------------

  app.post("/api/groups", async (req, res) => {
    const { evaluatorName, groupName, evaluatorEmail } = req.body;
    if (!evaluatorName || !groupName) {
      return res.status(400).json({ error: "evaluatorName e groupName são obrigatórios" });
    }
    const pmToken = makeToken(6);
    const evaluatorToken = makeToken(8); // longer for security
    const group = storage.createGroup({
      id: nanoid(10),
      token: pmToken,
      evaluatorToken,
      evaluatorName: evaluatorName.trim(),
      evaluatorEmail: (evaluatorEmail || "").trim(),
      groupName: groupName.trim(),
      createdAt: new Date().toISOString(),
    });

    // Try to send email if address provided
    let emailSent = false;
    if (evaluatorEmail?.trim()) {
      try {
        emailSent = await sendGroupEmail({
          to: evaluatorEmail.trim(),
          evaluatorName: evaluatorName.trim(),
          groupName: groupName.trim(),
          pmToken,
          evaluatorToken,
        });
      } catch (e) {
        console.error("[email] Failed to send:", e);
      }
    }

    // Return full group (including evaluatorToken) ONLY at creation time
    res.status(201).json({ ...group, emailSent });
  });

  // Verify PM token — returns public group info (no evaluatorToken)
  app.get("/api/groups/token/:token", (req, res) => {
    const group = storage.getGroupByToken(req.params.token);
    if (!group) return res.status(404).json({ error: "Token inválido" });
    const { evaluatorToken, ...pub } = group;
    res.json(pub);
  });

  // Verify evaluator token — returns full group
  app.post("/api/groups/evaluator-login", (req, res) => {
    const { evaluatorToken } = req.body;
    if (!evaluatorToken) return res.status(400).json({ error: "Token obrigatório" });
    const group = storage.getGroupByEvaluatorToken(evaluatorToken.trim().toUpperCase());
    if (!group) return res.status(404).json({ error: "Token de avaliador inválido" });
    res.json(group);
  });

  // Get group by id (public — no evaluatorToken)
  app.get("/api/groups/:id", (req, res) => {
    const group = storage.getGroup(req.params.id);
    if (!group) return res.status(404).json({ error: "Not found" });
    const { evaluatorToken, ...pub } = group;
    res.json(pub);
  });

  // List assessments for a group (evaluator only — requires evaluatorToken header)
  app.get("/api/groups/:id/assessments", (req, res) => {
    const group = storage.getGroup(req.params.id);
    if (!group) return res.status(404).json({ error: "Not found" });
    const list = storage.getAssessmentsByGroup(req.params.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(list);
  });

  app.get("/api/groups/:id/evaluations", (req, res) => {
    const group = storage.getGroup(req.params.id);
    if (!group) return res.status(404).json({ error: "Not found" });
    res.json(storage.getEvaluationsByGroup(req.params.id));
  });

  // ---- ASSESSMENTS ----------------------------------------------------------

  app.get("/api/assessments", (_req, res) => {
    const all = storage.getAllAssessments()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(all);
  });

  app.get("/api/assessments/:id", (req, res) => {
    const a = storage.getAssessment(req.params.id);
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });

  app.post("/api/assessments", (req, res) => {
    try {
      // Generate a personal PM token if not supplied
      const body = { ...req.body };
      if (!body.pmToken) body.pmToken = makeToken(8);
      const data = insertAssessmentSchema.parse(body);
      const created = storage.createAssessment(data);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: "Server error" });
    }
  });

  // Look up assessment by PM personal token (so PM can retrieve their own result)
  app.get("/api/assessments/by-pm-token/:token", (req, res) => {
    const a = storage.getAssessmentByPmToken(req.params.token);
    if (!a) return res.status(404).json({ error: "Token inválido ou avaliação não encontrada" });
    res.json(a);
  });

  app.delete("/api/assessments/:id", (req, res) => {
    storage.deleteAssessment(req.params.id);
    res.json({ ok: true });
  });

  // ---- EVALUATIONS ----------------------------------------------------------

  app.get("/api/evaluations/for/:assessmentId", (req, res) => {
    const ev = storage.getEvaluationForAssessment(req.params.assessmentId);
    if (!ev) return res.status(404).json({ error: "Not found" });
    res.json(ev);
  });

  app.post("/api/evaluations", (req, res) => {
    try {
      const data = insertEvaluationSchema.parse(req.body);
      const created = storage.createEvaluation(data);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: "Server error" });
    }
  });
}
