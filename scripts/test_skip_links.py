"""Regressions for issue #125: skip-link targets, main id fallback and native fragment navigation."""

import importlib.util
import json
import shutil
import subprocess
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('validate_site_structure', Path(__file__).with_name('validate_site_structure.py'))
structure = importlib.util.module_from_spec(spec)
spec.loader.exec_module(structure)

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
        self.ids = []
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get('id'):
            self.ids.append(values['id'])
        if tag == 'main' and not values.get('id'):
            self.mains_without_id += 1
        if tag == 'script' and values.get('src'):
            self.scripts.append(values['src'])


class SkipLinkStructure(unittest.TestCase):
    def test_valid_skip_link_has_no_errors(self):
        html = '<a class="skip-link" href="#conteudo">Pular</a><main id="conteudo"></main>'
        self.assertEqual(structure.check_skip_links('ok.html', html), [])

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
        errors = structure.check_skip_links('ext.html', '<a class="skip-link" href="/conteudo">Pular</a><main id="conteudo"></main>')
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
