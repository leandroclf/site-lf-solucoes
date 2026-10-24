import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('budget_check',Path(__file__).with_name('budget_check.py'))
budget=importlib.util.module_from_spec(spec)
spec.loader.exec_module(budget)

class BudgetRegression(unittest.TestCase):
    def test_build_and_tooling_copies_do_not_inflate_source_assets(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/'styles.css').write_text('a'*100)
            (root/'script.js').write_text('b'*200)
            for directory in ['dist','node_modules','.lighthouseci']:
                target=root/directory/'nested';target.mkdir(parents=True)
                (target/'copy.css').write_text('a'*100000)
                (target/'copy.js').write_text('b'*200000)
            with patch.object(budget,'ROOT',root):
                self.assertEqual(budget.total_size(budget.collect(('*.css',))),100)
                self.assertEqual(budget.total_size(budget.collect(('*.js',))),200)

    def test_nested_real_assets_still_count(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'produtos').mkdir()
            (root/'produtos'/'catalog.css').write_text('a'*80001)
            with patch.object(budget,'ROOT',root):
                self.assertGreater(budget.total_size(budget.collect(('*.css',))),budget.BUDGETS['css_total_bytes'])

if __name__=='__main__':unittest.main()
