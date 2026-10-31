"""Regressions for issue #125: skip-link targets, main id fallback and native fragment navigation."""

import contextlib
import importlib.util
import io
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('validate_site_structure', Path(__file__).with_name('validate_site_structure.py'))
structure = importlib.util.module_from_spec(spec)
spec.loader.exec_module(structure)
catalog_spec = importlib.util.spec_from_file_location('build_product_catalog', Path(__file__).with_name('build_product_catalog.py'))
catalog = importlib.util.module_from_spec(catalog_spec)
catalog_spec.loader.exec_module(catalog)

FOCUSABLE = ' tabindex="-1"'

NODE = shutil.which('node')
PAGE_DIRS = (ROOT, ROOT / 'solucoes', ROOT / 'produtos', ROOT / 'dashboards', ROOT / 'sobre')

# Minimal DOM stub: enough for script.js bootstrap and the dashboard anchor handler.
HARNESS = r"""
'use strict';
const fs = require('fs');
const vm = require('vm');
const scenario = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const source = fs.readFileSync(process.argv[3], 'utf8');
const all = [];
const scrollLog = [];
function mk(spec) {
  const el = {
    tagName: String(spec.tag || 'div').toUpperCase(),
    id: spec.id || '',
    textContent: spec.text || '',
    _cls: new Set(String(spec.cls || '').split(/\s+/).filter(Boolean)),
    _href: spec.href === undefined ? null : spec.href,
    _attrs: Object.assign({}, spec.attrs || {}),
    _listeners: {},
  };
  el.classList = {
    contains: (c) => el._cls.has(c),
    add: (c) => el._cls.add(c),
    remove: (c) => el._cls.delete(c),
    toggle: (c) => { if (el._cls.has(c)) { el._cls.delete(c); return false; } el._cls.add(c); return true; },
  };
  el.getAttribute = (n) => (n === 'href' ? el._href : n === 'id' ? (el.id || null) : (n in el._attrs ? el._attrs[n] : null));
  el.hasAttribute = (n) => el.getAttribute(n) !== null;
  el.setAttribute = (n, v) => { if (n === 'id') el.id = String(v); else if (n === 'href') el._href = String(v); else el._attrs[n] = String(v); };
  el.addEventListener = (type, fn) => { (el._listeners[type] = el._listeners[type] || []).push(fn); };
  el.scrollIntoView = (opts) => { scrollLog.push({ id: el.id, behavior: opts ? opts.behavior : null }); };
  el.querySelector = () => null;
  el.querySelectorAll = () => [];
  el.closest = () => null;
  el.contains = () => false;
  el.appendChild = () => {};
  el.focus = () => {};
  return el;
}
function matches(el, sel) {
  if (/^#[\w-]+$/.test(sel)) return el.id === sel.slice(1);
  if (sel === 'main:not([id])') return el.tagName === 'MAIN' && !el.id;
  if (sel === 'a[href^="#"]') return el.tagName === 'A' && typeof el._href === 'string' && el._href.startsWith('#');
  return false;
}
for (const spec of scenario.elements) all.push(mk(spec));
const document = {
  currentScript: null,
  head: { appendChild: () => {} },
  createElement: (tag) => mk({ tag }),
  getElementById: (id) => all.find((el) => el.id === id) || null,
  querySelector: (sel) => all.find((el) => matches(el, sel)) || null,
  querySelectorAll: (sel) => all.filter((el) => matches(el, sel)),
  addEventListener: () => {},
};
const signals = [];
const window = {
  location: { href: 'http://127.0.0.1:8080/index.html' },
  matchMedia: (q) => ({ matches: /reduce/.test(q) ? Boolean(scenario.reducedMotion) : false }),
};
const context = vm.createContext({ window, document, URL, console, trackDashboardSignal: (...args) => signals.push(args) });
let error = null;
try { vm.runInContext(source, context, { filename: 'under-test.js' }); } catch (e) { error = String((e && e.stack) || e); }
const clicks = (scenario.clicks || []).map((index) => {
  const before = scrollLog.length;
  const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  for (const fn of all[index]._listeners.click || []) fn(event);
  return { index, prevented: event.defaultPrevented, scrolls: scrollLog.slice(before) };
});
process.stdout.write(JSON.stringify({
  error,
  ids: all.map((el) => el.id),
  mainIds: all.filter((el) => el.tagName === 'MAIN').map((el) => el.id),
  mainTabindex: all.filter((el) => el.tagName === 'MAIN').map((el) => el.getAttribute('tabindex')),
  clicks,
  signals: signals.length,
}));
"""


def page_files():
    for directory in PAGE_DIRS:
        if directory.is_dir():
            yield from sorted(directory.glob('*.html'))


class _MainCollector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.mains_without_id = 0
        self.mains = []
        self.ids = []
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get('id'):
            self.ids.append(values['id'])
        if tag == 'main':
            self.mains.append(values)
            if not values.get('id'):
                self.mains_without_id += 1
        if tag == 'script' and values.get('src'):
            self.scripts.append(values['src'])


class SkipLinkStructure(unittest.TestCase):
    def test_valid_skip_link_has_no_errors(self):
        html = '<a class="skip-link" href="#conteudo">Pular</a><main id="conteudo" tabindex="-1"></main>'
        self.assertEqual(structure.check_skip_links('ok.html', html), [])

    def test_attribute_order_and_quoting_variations_are_accepted(self):
        for main in (
            '<main tabindex="-1" id="conteudo">',
            "<main class='x' tabindex='-1' id='conteudo'>",
            '<main id=conteudo tabindex=-1>',
            '<main id="conteudo" class="dashboard-container" tabindex=" -1 ">',
        ):
            html = '<a href="#conteudo" class="skip-link">Pular</a>' + main + '</main>'
            self.assertEqual(structure.check_skip_links('variant.html', html), [], main)

    def test_target_without_tabindex_is_rejected(self):
        # Exact markup shipped before this fix: hash changes but focus stays on the link.
        html = '<a class="skip-link" href="#conteudo">Pular</a><main id="conteudo"></main>'
        errors = structure.check_skip_links('nofocus.html', html)
        self.assertEqual(len(errors), 1)
        self.assertIn('nao recebe foco', errors[0])

    def test_invalid_tabindex_values_are_rejected(self):
        for value in ('0', '', '1', '-2', 'abc'):
            html = f'<a class="skip-link" href="#main-content">Pular</a><main id="main-content" tabindex="{value}"></main>'
            errors = structure.check_skip_links('bad.html', html)
            self.assertEqual(len(errors), 1, value)
            self.assertIn('nao recebe foco', errors[0])
        html = '<a class="skip-link" href="#main-content">Pular</a><main id="main-content" tabindex></main>'
        self.assertEqual(len(structure.check_skip_links('bare.html', html)), 1)

    def test_target_must_be_main(self):
        html = '<a class="skip-link" href="#conteudo">Pular</a><div id="conteudo" tabindex="-1"></div><main tabindex="-1"></main>'
        errors = structure.check_skip_links('div.html', html)
        self.assertEqual(len(errors), 1)
        self.assertIn('esperado <main>', errors[0])

    def test_page_without_skip_link_does_not_require_focusable_main(self):
        self.assertEqual(structure.check_skip_links('noskip.html', '<main></main><main id="x"></main>'), [])

    def test_missing_target_is_reported(self):
        html = '<a class="skip-link" href="#conteudo">Pular</a><main></main>'
        errors = structure.check_skip_links('missing.html', html)
        self.assertEqual(len(errors), 1)
        self.assertIn('0 destinos', errors[0])

    def test_duplicated_target_is_reported(self):
        html = '<a href="#main-content" class="btn skip-link">Pular</a><div id="main-content"></div><main id="main-content"></main>'
        errors = structure.check_skip_links('dup.html', html)
        self.assertEqual(len(errors), 1)
        self.assertIn('2 destinos', errors[0])

    def test_non_fragment_href_is_reported(self):
        errors = structure.check_skip_links('ext.html', '<a class="skip-link" href="/conteudo">Pular</a><main id="conteudo" tabindex="-1"></main>')
        self.assertEqual(len(errors), 1)
        self.assertIn('sem fragmento local', errors[0])

    def test_ids_inside_inline_scripts_are_not_targets(self):
        html = '<a class="skip-link" href="#c">Pular</a><script>const tpl = \'<div id="c"></div>\';</script>'
        self.assertEqual(len(structure.check_skip_links('script.html', html)), 1)

    def test_site_skip_link_inventory_resolves_to_exactly_one_target(self):
        expected = {
            'index.html': ['#conteudo'],
            'dashboards/index.html': ['#main-content'],
            'solucoes/openalex-enrichment.html': ['#main-content'],
            'solucoes/wikidata-entity-graph.html': ['#main-content'],
            'solucoes/worldbank-risk-pricing.html': ['#main-content'],
        }
        for product in sorted((ROOT / 'produtos').glob('*.html')):
            expected[str(product.relative_to(ROOT))] = ['#conteudo']
        found = {}
        for page in page_files():
            text = page.read_text(encoding='utf-8')
            label = str(page.relative_to(ROOT))
            collector = structure._SkipLinkCollector()
            collector.feed(text)
            if collector.skip_hrefs:
                found[label] = collector.skip_hrefs
            self.assertEqual(structure.check_skip_links(label, text), [], label)
        self.assertEqual(found, expected)
        self.assertEqual(len(found), 15)

    def test_previous_site_markup_is_rejected(self):
        """Removing tabindex from any real skip-link target (the pre-fix markup) must fail validation."""
        rejected = 0
        for page in page_files():
            text = page.read_text(encoding='utf-8')
            collector = structure._SkipLinkCollector()
            collector.feed(text)
            if not collector.skip_hrefs:
                continue
            label = str(page.relative_to(ROOT))
            self.assertEqual(text.count(FOCUSABLE), 1, label)
            errors = structure.check_skip_links(label, text.replace(FOCUSABLE, '', 1))
            self.assertEqual(len(errors), 1, label)
            self.assertIn('nao recebe foco', errors[0])
            rejected += 1
        self.assertEqual(rejected, 15)

    def test_mains_without_skip_link_are_left_unchanged(self):
        checked = 0
        for page in page_files():
            text = page.read_text(encoding='utf-8')
            skip = structure._SkipLinkCollector()
            skip.feed(text)
            if skip.skip_hrefs:
                continue
            mains = _MainCollector()
            mains.feed(text)
            for main in mains.mains:
                checked += 1
                self.assertNotIn('tabindex', main, str(page.relative_to(ROOT)))
        self.assertGreater(checked, 0)

    def test_mains_without_id_receive_unique_conteudo_fallback(self):
        checked = 0
        for page in page_files():
            collector = _MainCollector()
            collector.feed(page.read_text(encoding='utf-8'))
            if collector.mains_without_id:
                checked += 1
                label = str(page.relative_to(ROOT))
                self.assertEqual(collector.mains_without_id, 1, label)
                self.assertNotIn('conteudo', collector.ids, label)
                self.assertTrue(any(src.endswith('script.js') and 'dashboards' not in src for src in collector.scripts), label)
        self.assertGreater(checked, 0)


class CatalogGeneratorFocusTarget(unittest.TestCase):
    """The generator must emit focusable skip-link targets and --check must reject their loss."""

    def test_generated_pages_have_focusable_main(self):
        pages = catalog.expected_files()
        self.assertEqual(len(pages), 10)
        for path, html in pages.items():
            label = str(path.relative_to(ROOT))
            self.assertIn('<main id="conteudo" tabindex="-1">', html, label)
            self.assertTrue(catalog.has_focusable_main(html), label)
            self.assertEqual(structure.check_skip_links(label, html), [], label)

    def test_has_focusable_main_contract(self):
        self.assertTrue(catalog.has_focusable_main('<main tabindex=\'-1\' class="x" id="conteudo"></main>'))
        self.assertFalse(catalog.has_focusable_main('<main id="conteudo"></main>'))
        self.assertFalse(catalog.has_focusable_main('<main id="conteudo" tabindex="0"></main>'))
        self.assertFalse(catalog.has_focusable_main('<main id="outro" tabindex="-1"></main>'))
        self.assertFalse(catalog.has_focusable_main('<script>"<main id=\\"conteudo\\" tabindex=\\"-1\\">"</script>'))

    def run_check(self, mutate=None):
        """Run the real --check against a temporary copy of produtos/ (the checkout is never modified)."""
        saved = (catalog.ROOT, catalog.OUTPUT, sys.argv)
        with tempfile.TemporaryDirectory() as tmp:
            tmp_root = Path(tmp)
            shutil.copytree(ROOT / 'produtos', tmp_root / 'produtos')
            if mutate:
                mutate(tmp_root / 'produtos')
            catalog.ROOT, catalog.OUTPUT, sys.argv = tmp_root, tmp_root / 'produtos', ['build_product_catalog.py', '--check']
            out = io.StringIO()
            try:
                with contextlib.redirect_stdout(out):
                    code = catalog.main()
            finally:
                catalog.ROOT, catalog.OUTPUT, sys.argv = saved
        return code, out.getvalue()

    def test_check_accepts_committed_pages(self):
        code, out = self.run_check()
        self.assertEqual(code, 0, out)

    def test_check_tolerates_manual_attribute_refinement(self):
        def reorder(directory):
            page = directory / 'ai-docs.html'
            page.write_text(page.read_text(encoding='utf-8').replace('<main id="conteudo" tabindex="-1">', '<main tabindex="-1" id="conteudo" class="refinado">'), encoding='utf-8')
        code, out = self.run_check(reorder)
        self.assertEqual(code, 0, out)

    def test_check_rejects_lost_focusability(self):
        def strip(directory):
            for name in ('index.html', 'ai-docs.html'):
                page = directory / name
                page.write_text(page.read_text(encoding='utf-8').replace(FOCUSABLE, '', 1), encoding='utf-8')
        code, out = self.run_check(strip)
        self.assertEqual(code, 1, out)
        self.assertIn('produtos/index.html missing focusable', out)
        self.assertIn('produtos/ai-docs.html missing focusable', out)

    def test_check_works_on_freshly_generated_output(self):
        def regenerate(directory):
            for path, html in catalog.expected_files().items():
                (directory / path.name).write_text(html, encoding='utf-8')
        code, out = self.run_check(regenerate)
        self.assertEqual(code, 0, out)


@unittest.skipUnless(NODE, 'node indisponivel: regressoes comportamentais de JavaScript nao executadas')
class SkipLinkBehaviour(unittest.TestCase):
    def run_js(self, source, elements, clicks=(), reduced_motion=False):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / 'harness.js').write_text(HARNESS, encoding='utf-8')
            (tmp_path / 'scenario.json').write_text(json.dumps({'elements': elements, 'clicks': list(clicks), 'reducedMotion': reduced_motion}), encoding='utf-8')
            (tmp_path / 'source.js').write_text(source, encoding='utf-8')
            proc = subprocess.run(
                [NODE, str(tmp_path / 'harness.js'), str(tmp_path / 'scenario.json'), str(tmp_path / 'source.js')],
                capture_output=True, text=True, timeout=30, cwd=tmp, check=False,
            )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        result = json.loads(proc.stdout)
        self.assertIsNone(result['error'], result['error'])
        return result

    def site_script(self, elements, clicks=(), reduced_motion=False):
        return self.run_js((ROOT / 'script.js').read_text(encoding='utf-8'), elements, clicks, reduced_motion)

    def dashboard_handler(self, elements, clicks=()):
        source = (ROOT / 'dashboards' / 'script.js').read_text(encoding='utf-8')
        marker = "for (const link of document.querySelectorAll('a[href^=\"#\"]')) {"
        start = source.index(marker)
        depth = 0
        for pos in range(start, len(source)):
            if source[pos] == '{':
                depth += 1
            elif source[pos] == '}':
                depth -= 1
                if depth == 0:
                    return self.run_js(source[start:pos + 1], elements, clicks)
        self.fail('bloco de ancoras do dashboard nao encontrado')

    def test_existing_main_id_is_preserved(self):
        result = self.site_script([{'tag': 'a', 'cls': 'skip-link', 'href': '#main-content'}, {'tag': 'main', 'id': 'main-content'}])
        self.assertEqual(result['mainIds'], ['main-content'])
        self.assertNotIn('conteudo', result['ids'])

    def test_focusable_main_keeps_tabindex_after_initialisation(self):
        for target in ('main-content', 'conteudo'):
            elements = [{'tag': 'a', 'cls': 'skip-link', 'href': '#' + target}, {'tag': 'main', 'id': target, 'attrs': {'tabindex': '-1'}}]
            result = self.site_script(elements, clicks=[0])
            self.assertEqual(result['mainIds'], [target])
            self.assertEqual(result['mainTabindex'], ['-1'])
            self.assertFalse(result['clicks'][0]['prevented'])
            self.assertEqual(result['clicks'][0]['scrolls'], [])

    def test_main_without_id_receives_conteudo(self):
        result = self.site_script([{'tag': 'main'}])
        self.assertEqual(result['mainIds'], ['conteudo'])

    def test_existing_conteudo_is_not_duplicated(self):
        result = self.site_script([{'tag': 'div', 'id': 'conteudo'}, {'tag': 'main'}])
        self.assertEqual(result['ids'].count('conteudo'), 1)
        self.assertEqual(result['mainIds'], [''])

    def test_main_with_conteudo_is_kept(self):
        result = self.site_script([{'tag': 'main', 'id': 'conteudo'}])
        self.assertEqual(result['ids'].count('conteudo'), 1)

    def test_page_without_main_does_not_fail(self):
        result = self.site_script([{'tag': 'a', 'href': '#x'}])
        self.assertEqual(result['mainIds'], [])

    def test_site_skip_link_keeps_native_navigation(self):
        elements = [
            {'tag': 'a', 'cls': 'skip-link', 'href': '#main-content'},
            {'tag': 'a', 'href': '#secao'},
            {'tag': 'main', 'id': 'main-content'},
            {'tag': 'section', 'id': 'secao'},
        ]
        result = self.site_script(elements, clicks=[0, 1])
        self.assertFalse(result['clicks'][0]['prevented'])
        self.assertEqual(result['clicks'][0]['scrolls'], [])
        self.assertTrue(result['clicks'][1]['prevented'])
        self.assertEqual(result['clicks'][1]['scrolls'], [{'id': 'secao', 'behavior': 'smooth'}])

    def test_site_anchor_respects_reduced_motion(self):
        result = self.site_script([{'tag': 'a', 'href': '#secao'}, {'tag': 'section', 'id': 'secao'}], clicks=[0], reduced_motion=True)
        self.assertEqual(result['clicks'][0]['scrolls'], [{'id': 'secao', 'behavior': 'auto'}])

    def test_dashboard_skip_link_keeps_native_navigation(self):
        elements = [
            {'tag': 'a', 'cls': 'skip-link', 'href': '#main-content'},
            {'tag': 'a', 'href': '#kanban', 'text': 'Kanban'},
            {'tag': 'a', 'cls': 'btn', 'href': '#alertas-gargalos', 'attrs': {'data-dashboard-action': 'open-alerts'}},
            {'tag': 'main', 'id': 'main-content'},
            {'tag': 'section', 'id': 'kanban'},
            {'tag': 'section', 'id': 'alertas-gargalos'},
        ]
        result = self.dashboard_handler(elements, clicks=[0])
        self.assertFalse(result['clicks'][0]['prevented'])
        self.assertEqual(result['clicks'][0]['scrolls'], [])
        self.assertEqual(result['signals'], 0)

    def test_dashboard_shortcuts_still_scroll_and_track(self):
        elements = [
            {'tag': 'a', 'cls': 'skip-link', 'href': '#main-content'},
            {'tag': 'a', 'href': '#kanban', 'text': 'Kanban'},
            {'tag': 'a', 'cls': 'btn', 'href': '#alertas-gargalos', 'attrs': {'data-dashboard-action': 'open-alerts'}},
            {'tag': 'main', 'id': 'main-content'},
            {'tag': 'section', 'id': 'kanban'},
            {'tag': 'section', 'id': 'alertas-gargalos'},
        ]
        result = self.dashboard_handler(elements, clicks=[1, 2])
        self.assertTrue(result['clicks'][0]['prevented'])
        self.assertEqual(result['clicks'][0]['scrolls'], [{'id': 'kanban', 'behavior': 'smooth'}])
        self.assertTrue(result['clicks'][1]['prevented'])
        self.assertEqual(result['clicks'][1]['scrolls'], [{'id': 'alertas-gargalos', 'behavior': 'smooth'}])
        self.assertEqual(result['signals'], 1)


if __name__ == '__main__':
    unittest.main()
