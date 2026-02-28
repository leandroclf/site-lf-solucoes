const FORM = document.getElementById("diagnostic-form");
const RESULT = document.getElementById("diagnostic-result");
const TAGS = document.getElementById("diagnostic-tags");
const GAPS = document.getElementById("diagnostic-gaps");
const ACTIONS = document.getElementById("diagnostic-actions");
const CTA = document.getElementById("diagnostic-cta");
const RESET_BTN = document.getElementById("diagnostic-reset");
const REPORT_BTN = document.getElementById("diagnostic-report-btn");
const REPORT_BOX = document.getElementById("diagnostic-report");
const REPORT_TEXT = document.getElementById("diagnostic-report-text");
const STORAGE_KEY = "lf_diagnostic_v1";

if (!FORM || !RESULT || !TAGS || !GAPS || !ACTIONS || !CTA || !RESET_BTN || !REPORT_BTN || !REPORT_BOX || !REPORT_TEXT) {
  throw new Error("Modulo de diagnostico nao encontrou elementos obrigatorios no DOM.");
}

let reportCooldownUntil = 0;

function track(eventName, payload = {}) {
  if (typeof window.LFSiteTrack === "function") {
    window.LFSiteTrack(eventName, payload);
  }
}

function toObject(formData) {
  return Object.fromEntries(formData.entries());
}

function chip(label) {
  const span = document.createElement("span");
  span.className = "result-chip";
  span.textContent = label;
  return span;
}

function renderList(target, title, items) {
  target.innerHTML = "";
  if (title) {
    const header = document.createElement("li");
    header.innerHTML = `<strong>${title}</strong>`;
    target.appendChild(header);
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function getDiagnostic(data) {
  const baseGaps = [];
  const baseActions = [];

  if (data.maturidade === "baixa") {
    baseGaps.push("Processos criticos ainda dependem de execucao manual.");
    baseActions.push("Mapear os 3 fluxos de maior volume e automatizar primeiro o de menor risco.");
  } else if (data.maturidade === "media") {
    baseGaps.push("Automacoes isoladas sem governanca completa entre canais.");
    baseActions.push("Padronizar regras de dados e consolidar eventos de ponta a ponta.");
  } else {
    baseGaps.push("Escalabilidade limitada por observabilidade e custos de operacao.");
    baseActions.push("Otimizar monitoramento de SLA e custo por fluxo com alertas executivos.");
  }

  if (data.dados === "baixa") {
    baseGaps.push("Confiabilidade de dados insuficiente para priorizacao segura.");
    baseActions.push("Implantar validacao de qualidade de dados antes do roteamento comercial.");
  } else if (data.dados === "media") {
    baseGaps.push("Consolidacao parcial de indicadores entre operacao e comercial.");
    baseActions.push("Unificar indicadores de throughput, conversao e retrabalho em um painel unico.");
  }

  if (data.objetivo === "acelerar-vendas") {
    baseActions.push("Ativar playbook de follow-up automatico com prioridade para leads quentes.");
  } else if (data.objetivo === "melhorar-atendimento") {
    baseActions.push("Criar respostas padrao por contexto e fila de escalonamento para casos complexos.");
  } else if (data.objetivo === "governanca-dados") {
    baseActions.push("Definir taxonomia de dados e ownership por area para reduzir retrabalho analitico.");
  } else {
    baseActions.push("Priorizar automacoes com payback inferior a 90 dias.");
  }

  if (data.canal === "whatsapp") {
    baseActions.push("Estruturar funil no WhatsApp com qualificacao automatizada e handoff monitorado.");
  }

  const cta = "Proximo passo recomendado: diagnostico tecnico de 90 minutos com plano por fase.";

  return {
    tags: [
      `Setor: ${data.setor}`,
      `Objetivo: ${data.objetivo}`,
      `Canal: ${data.canal}`,
      `Maturidade: ${data.maturidade}`,
      `Dados: ${data.dados}`,
    ],
    gaps: baseGaps.slice(0, 3),
    actions: baseActions.slice(0, 4),
    cta,
  };
}

function fillForm(data) {
  Object.entries(data).forEach(([key, value]) => {
    const input = FORM.elements.namedItem(key);
    if (input) input.value = value;
  });
}

function showDiagnostic(output) {
  RESULT.hidden = false;
  TAGS.innerHTML = "";
  output.tags.forEach((label) => TAGS.appendChild(chip(label)));
  renderList(GAPS, "Gargalos provaveis", output.gaps);
  renderList(ACTIONS, "Recomendacoes imediatas", output.actions);
  CTA.textContent = output.cta;
}

function persist(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadPersisted() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearPersisted() {
  localStorage.removeItem(STORAGE_KEY);
}

function fallbackReport(data, output) {
  return (
    `Resumo executivo: no setor ${data.setor}, o foco atual em ${data.objetivo} ` +
    `aponta para ganhos rapidos ao atuar no canal ${data.canal}. ` +
    `Priorize as duas primeiras acoes recomendadas e acompanhe semanalmente throughput, ` +
    `tempo de resposta e custo operacional para validar impacto. ` +
    `Nivel de maturidade atual: ${data.maturidade}.`
  );
}

async function tryRemoteReport(payload) {
  const endpoint = window.LFReportEndpoint;
  if (!endpoint || typeof endpoint !== "string") return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const json = await response.json();
    return typeof json.report === "string" ? json.report : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateReport() {
  const data = toObject(new FormData(FORM));
  const output = getDiagnostic(data);

  const now = Date.now();
  if (now < reportCooldownUntil) {
    const waitSeconds = Math.ceil((reportCooldownUntil - now) / 1000);
    REPORT_BOX.hidden = false;
    REPORT_TEXT.textContent = `Aguarde ${waitSeconds}s para gerar novo relatorio.`;
    return;
  }

  reportCooldownUntil = now + 15000;
  REPORT_BOX.hidden = false;
  REPORT_TEXT.textContent = "Gerando relatorio...";
  track("diagnostic_report_requested", { objective: data.objetivo, channel: data.canal });

  const payload = {
    setor: data.setor,
    objetivo: data.objetivo,
    canal: data.canal,
    maturidade: data.maturidade,
    dados: data.dados,
    recommendations: output.actions,
  };

  const remoteReport = await tryRemoteReport(payload);
  if (remoteReport) {
    REPORT_TEXT.textContent = remoteReport;
    track("diagnostic_report_generated", { source: "remote" });
    return;
  }

  REPORT_TEXT.textContent = fallbackReport(data, output);
  track("diagnostic_report_generated", { source: "local-fallback" });
}

FORM.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = toObject(new FormData(FORM));
  const output = getDiagnostic(data);
  showDiagnostic(output);
  persist(data);
  track("diagnostic_completed", { objective: data.objetivo, channel: data.canal });
});

RESET_BTN.addEventListener("click", () => {
  FORM.reset();
  RESULT.hidden = true;
  REPORT_BOX.hidden = true;
  REPORT_TEXT.textContent = "";
  clearPersisted();
  track("diagnostic_reset");
});

REPORT_BTN.addEventListener("click", () => {
  generateReport();
});

const persisted = loadPersisted();
if (persisted) {
  fillForm(persisted);
  showDiagnostic(getDiagnostic(persisted));
}
