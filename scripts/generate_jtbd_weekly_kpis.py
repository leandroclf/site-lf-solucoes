#!/usr/bin/env python3
"""Gera snapshot semanal de funil + JTBD por ICP (ISSUE-008)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KANBAN_PATH = ROOT / "dashboards" / "data" / "kanban.json"
OUT_PATH = ROOT / "dashboards" / "data" / "jtbd-weekly-kpis.json"


def load_kanban() -> dict:
    with KANBAN_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def collect_auto_product_tasks(kanban: dict) -> list[dict]:
    valid_cols = {"authorized", "in-progress"}
    selected: list[dict] = []
    for col in kanban.get("columns", []):
        if col.get("id") not in valid_cols:
            continue
        for task in col.get("tasks", []):
            if task.get("mode") != "AUTO":
                continue
            if task.get("status", "").upper() in {"DONE", "CANCELLED", "CONCLUÍDO"}:
                continue
            if task.get("categoryPrimary") in {"produto-receita", "engenharia-arquitetura"}:
                selected.append(task)
    return selected


def build_snapshot(tasks: list[dict]) -> dict:
    total = len(tasks)
    by_category = {
        "produto-receita": 0,
        "engenharia-arquitetura": 0,
        "outros": 0,
    }
    for t in tasks:
        c = t.get("categoryPrimary")
        if c in by_category:
            by_category[c] += 1
        else:
            by_category["outros"] += 1

    # KPI operacional simples para acompanhamento semanal.
    kpi_funnel_coverage = round(((by_category["produto-receita"] + by_category["engenharia-arquitetura"]) / total) * 100, 2) if total else 0.0

    return {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": str(KANBAN_PATH.relative_to(ROOT)),
        "issue": "ISSUE-008",
        "window": "weekly",
        "kpis": {
            "eligibleAutoTasks": total,
            "byCategory": by_category,
            "funnelAndJtbdCoveragePct": kpi_funnel_coverage,
        },
        "nextActions": [
            "Atualizar síntese JTBD com entrevistas da semana",
            "Revisar variação de conversão por ICP no próximo ciclo",
        ],
    }


def main() -> int:
    kanban = load_kanban()
    tasks = collect_auto_product_tasks(kanban)
    payload = build_snapshot(tasks)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"generated={OUT_PATH}")
    print(f"eligible_auto_tasks={payload['kpis']['eligibleAutoTasks']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
