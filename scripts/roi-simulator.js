const FORM = document.getElementById("roi-form");
const RESULT = document.getElementById("roi-result");
const RANGES = document.getElementById("roi-ranges");
const PAYBACK = document.getElementById("roi-payback");
const RESET_BTN = document.getElementById("roi-reset");
const STORAGE_KEY = "lf_roi_simulator_v1";

if (!FORM || !RESULT || !RANGES || !PAYBACK || !RESET_BTN) {
  throw new Error("Modulo de ROI nao encontrou elementos obrigatorios no DOM.");
}

function track(eventName, payload = {}) {
  if (typeof window.LFSiteTrack === "function") {
    window.LFSiteTrack(eventName, payload);
  }
}

function parseNumber(name) {
  const value = Number(FORM.elements.namedItem(name).value);
  return Number.isFinite(value) ? value : 0;
}

function currency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
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

function fillForm(data) {
  Object.entries(data).forEach(([key, value]) => {
    const input = FORM.elements.namedItem(key);
    if (input) input.value = value;
  });
}

function computeROI(input) {
  const conversaoAtual = input.conversao / 100;
  const vendasAtuais = input.leads * conversaoAtual;
  const receitaAtual = vendasAtuais * input.ticket;
  const custoRetrabalho = input.retrabalho * input.custoHora;

  const conservative = receitaAtual * 0.08 + custoRetrabalho * 0.25;
  const probable = receitaAtual * 0.14 + custoRetrabalho * 0.4;
  const aggressive = receitaAtual * 0.21 + custoRetrabalho * 0.55;

  return {
    conservative,
    probable,
    aggressive,
  };
}

function renderResult(output) {
  RESULT.hidden = false;
  RANGES.innerHTML = "";

  const lines = [
    ["Conservador", output.conservative],
    ["Provavel", output.probable],
    ["Agressivo", output.aggressive],
  ];

  lines.forEach(([label, value]) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${label}:</strong> ${currency(value)} / mes`;
    RANGES.appendChild(li);
  });

  const monthlyReference = Math.max(output.probable, 1);
  const setupEstimate = 15000;
  const payback = setupEstimate / monthlyReference;
  PAYBACK.textContent = `Payback estimado com cenario provavel: ${payback.toFixed(1)} meses (referencia de setup ${currency(setupEstimate)}).`;
}

FORM.addEventListener("submit", (event) => {
  event.preventDefault();

  const input = {
    leads: parseNumber("leads"),
    conversao: parseNumber("conversao"),
    ticket: parseNumber("ticket"),
    retrabalho: parseNumber("retrabalho"),
    custoHora: parseNumber("custoHora"),
  };

  const output = computeROI(input);
  renderResult(output);
  persist(input);
  track("roi_calculated", {
    leads: input.leads,
    conversao: input.conversao,
  });
});

RESET_BTN.addEventListener("click", () => {
  FORM.reset();
  RESULT.hidden = true;
  localStorage.removeItem(STORAGE_KEY);
  track("roi_reset");
});

const persisted = loadPersisted();
if (persisted) {
  fillForm(persisted);
  renderResult(computeROI(persisted));
}
