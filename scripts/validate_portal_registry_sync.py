#!/usr/bin/env python3
"""Fail closed on local portal/portfolio drift without remote credentials.

This verifies a reviewed snapshot only. The source registry must be refreshed
from the platform in a separate PR to establish cross-repository currency.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def validate(snapshot, catalog):
    errors = []
    if snapshot.get("source_repository") != "leandroclf/product-platform" or snapshot.get("source_path") != "packages/kit/contracts/portfolio-products.json":
        errors.append("Untrusted source registry provenance")
    if snapshot.get("sync_mode") != "manually-reviewed-snapshot" or snapshot.get("live_registry_verified") is not False:
        errors.append("Snapshot cannot claim real-time cross-repository synchronization")
    entries = snapshot.get("domain_products")
    products = catalog.get("products")
    if not isinstance(entries, list) or not isinstance(products, list):
        return errors + ["Invalid registry or catalog collection"]
    domains = {}
    for item in entries:
        if not isinstance(item, dict):
            errors.append("Invalid registry product")
            continue
        name = item.get("repository")
        if not isinstance(name, str) or not name or name in domains:
            errors.append("Invalid or duplicate registry product")
            continue
        domains[name] = item
    published = {}
    for item in products:
        if not isinstance(item, dict):
            errors.append("Invalid catalog product")
            continue
        name = item.get("id")
        if not isinstance(name, str) or not name or name in published:
            errors.append("Invalid or duplicate catalog product")
            continue
        published[name] = item
    missing = sorted(set(domains) - set(published))
    unexpected = sorted(set(published) - set(domains))
    if missing:
        errors.append("Products missing from LF portal: " + ", ".join(missing))
    if unexpected:
        errors.append("Unregistered products in LF portal: " + ", ".join(unexpected))
    for name in domains.keys() & published.keys():
        source = domains[name]
        display = published[name]
        if display.get("slug") != name or display.get("detail_url") != f"/produtos/{name}.html":
            errors.append("Unstable public identity: " + name)
        if display.get("runtime") != source.get("runtime") or display.get("wave") != source.get("wave"):
            errors.append("Platform/product metadata drift: " + name)
        if display.get("visibility") != "public":
            errors.append("Unreviewed visibility: " + name)
    if catalog.get("source_registry") != snapshot["source_path"]:
        errors.append("Catalog points to a different source registry")
    if catalog.get("publication_policy", {}).get("publishing_new_product_requires_portal_change") is not True:
        errors.append("New products must be published in LF portal")
    return errors


def main():
    snapshot = json.loads((ROOT / "data/platform-portfolio.snapshot.json").read_text(encoding="utf-8"))
    catalog = json.loads((ROOT / "data/product-catalog.json").read_text(encoding="utf-8"))
    errors = validate(snapshot, catalog)
    if errors:
        for error in errors:
            print("PORTAL_SYNC_BLOCKED:", error)
        raise SystemExit(1)
    print(f"PORTAL_SNAPSHOT_CONSISTENT: {len(snapshot['domain_products'])} products (reviewed local snapshot, not live registry)")


if __name__ == "__main__":
    main()
