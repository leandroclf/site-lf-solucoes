import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("portal_sync", ROOT / "scripts/validate_portal_registry_sync.py")
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class PortalRegistrySyncTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.snapshot = json.loads((ROOT / "data/platform-portfolio.snapshot.json").read_text())
        cls.catalog = json.loads((ROOT / "data/product-catalog.json").read_text())

    def reject(self, change):
        snap = copy.deepcopy(self.snapshot)
        catalog = copy.deepcopy(self.catalog)
        change(snap, catalog)
        self.assertTrue(module.validate(snap, catalog))

    def test_current_catalog_complete(self):
        self.assertEqual(module.validate(self.snapshot, self.catalog), [])

    def test_new_product_missing_from_catalog_is_blocked(self):
        self.reject(lambda s, c: s["domain_products"].append(
            {"repository": "new-product", "domain": "new_domain", "runtime": "python-server", "wave": 3}))

    def test_catalog_product_without_platform_registration_is_blocked(self):
        self.reject(lambda s, c: c["products"].append(
            {"id": "unregistered", "slug": "unregistered", "runtime": "python-server", "wave": 3}))

    def test_runtime_drift_is_blocked(self):
        self.reject(lambda s, c: c["products"][0].update(runtime="local-first-browser"))

    def test_slug_drift_is_blocked(self):
        self.reject(lambda s, c: c["products"][0].update(slug="wrong"))

    def test_false_live_sync_claim_is_blocked(self):
        self.reject(lambda s, c: s.update(live_registry_verified=True))

    def test_duplicate_product_is_blocked(self):
        self.reject(lambda s, c: c["products"].append(dict(c["products"][0])))


if __name__ == "__main__":
    unittest.main()
