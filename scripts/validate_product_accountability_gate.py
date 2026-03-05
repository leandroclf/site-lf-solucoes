#!/usr/bin/env python3
"""Valida gate de accountability de produto em AUTO tasks (ISSUE-009)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KANBAN_PATH = ROOT / "dashboards" / "data" / "kanban.json"


def load_kanban() -> dict:
    with KANBAN_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def iter_eligible_auto_tasks(kanban: dict):
    for col in kanban.get("columns", []):
        if col.get("id") not in {"authorized", "in-progress"}:
            continue
        for task in col.get("tasks", []):
            if task.get("mode") != "AUTO":
                continue
            status = task.get("status", "").upper()
            if status in {"DONE", "CANCELLED", "CONCLUÍDO"}:
                continue
            yield col.get("id"), task


def main() -> int:
    kanban = load_kanban()
    violations = []
    total = 0

    for col_id, task in iter_eligible_auto_tasks(kanban):
        total += 1
        title = task.get("title", "(sem título)")
        if not task.get("ownerPrimary"):
            violations.append(f"[{col_id}] {title} :: missing ownerPrimary")
        if not task.get("valueKpi"):
            violations.append(f"[{col_id}] {title} :: missing valueKpi")

    coverage_pct = 100.0 if total == 0 else round(((total - len(violations)) / total) * 100, 2)
    print(f"checked={total}")
    print(f"violations={len(violations)}")
    print(f"coverage_pct={coverage_pct}")

    if violations:
        print("gate=FAIL")
        for v in violations:
            print(f"- {v}")
        return 1

    print("gate=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
