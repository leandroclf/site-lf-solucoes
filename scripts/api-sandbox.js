/**
 * API Sandbox — componente reutilizável para testar endpoints REST no browser.
 * Uso: new ApiSandbox(containerEl, config)
 */
export class ApiSandbox {
  constructor(container, { baseUrl, endpoints }) {
    this.container = container;
    this.baseUrl = baseUrl;
    this.endpoints = endpoints;
    this.selected = endpoints[0];
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <div class="sandbox">
        <div class="sandbox-sidebar">
          <p class="sandbox-label">Endpoints</p>
          <nav class="sandbox-nav" id="sb-nav"></nav>
        </div>
        <div class="sandbox-main">
          <div class="sandbox-request-bar">
            <span class="sb-method" id="sb-method"></span>
            <span class="sb-url" id="sb-url"></span>
            <button class="btn btn-primary sb-send" id="sb-send">Enviar</button>
          </div>
          <div class="sandbox-body" id="sb-body-wrap" hidden>
            <p class="sandbox-label">Request Body (JSON)</p>
            <textarea class="sb-textarea" id="sb-body" rows="6" spellcheck="false"></textarea>
          </div>
          <div class="sandbox-params" id="sb-params-wrap" hidden>
            <p class="sandbox-label">Query Params</p>
            <div id="sb-params"></div>
          </div>
          <div class="sandbox-response" id="sb-response" hidden>
            <div class="sandbox-response-header">
              <p class="sandbox-label">Resposta</p>
              <span class="sb-status" id="sb-status"></span>
              <span class="sb-time" id="sb-time"></span>
            </div>
            <pre class="sb-pre" id="sb-output"></pre>
          </div>
          <div class="sandbox-error" id="sb-error" hidden>
            <p class="sandbox-label" style="color:var(--warning)">Erro</p>
            <pre class="sb-pre" id="sb-error-msg"></pre>
          </div>
        </div>
      </div>`;

    this._buildNav();
    this._selectEndpoint(this.selected);
    document.getElementById('sb-send').addEventListener('click', () => this._send());
  }

  _buildNav() {
    const nav = document.getElementById('sb-nav');
    this.endpoints.forEach(ep => {
      const btn = document.createElement('button');
      btn.className = 'sb-nav-btn';
      btn.dataset.id = ep.id;
      btn.innerHTML = `<span class="sb-badge sb-badge-${ep.method.toLowerCase()}">${ep.method}</span><span class="sb-nav-label">${ep.label}</span>`;
      btn.addEventListener('click', () => this._selectEndpoint(ep));
      nav.appendChild(btn);
    });
  }

  _selectEndpoint(ep) {
    this.selected = ep;

    // Highlight nav
    document.querySelectorAll('.sb-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.id === ep.id));

    // Method + URL
    document.getElementById('sb-method').textContent = ep.method;
    document.getElementById('sb-method').className = `sb-method sb-method-${ep.method.toLowerCase()}`;
    document.getElementById('sb-url').textContent = `${this.baseUrl}${ep.path}`;

    // Body
    const bodyWrap = document.getElementById('sb-body-wrap');
    const bodyEl = document.getElementById('sb-body');
    if (ep.body) {
      bodyWrap.hidden = false;
      bodyEl.value = JSON.stringify(ep.body, null, 2);
    } else {
      bodyWrap.hidden = true;
      bodyEl.value = '';
    }

    // Query params
    const paramsWrap = document.getElementById('sb-params-wrap');
    const paramsEl = document.getElementById('sb-params');
    if (ep.params && ep.params.length) {
      paramsWrap.hidden = false;
      paramsEl.innerHTML = ep.params.map(p => `
        <div class="sb-param-row">
          <label class="sb-param-label">${p.name}${p.required ? ' <span style="color:var(--warning)">*</span>' : ''}</label>
          <input class="sb-param-input" data-param="${p.name}" type="${p.type || 'text'}" value="${p.default ?? ''}" placeholder="${p.placeholder || ''}" />
          <span class="sb-param-desc">${p.description || ''}</span>
        </div>`).join('');
    } else {
      paramsWrap.hidden = true;
    }

    // Clear response
    document.getElementById('sb-response').hidden = true;
    document.getElementById('sb-error').hidden = true;
  }

  async _send() {
    const ep = this.selected;
    const btn = document.getElementById('sb-send');
    btn.textContent = 'Enviando…';
    btn.disabled = true;

    // Build URL with query params
    let url = `${this.baseUrl}${ep.path}`;
    if (ep.params && ep.params.length) {
      const qs = ep.params.map(p => {
        const input = document.querySelector(`[data-param="${p.name}"]`);
        const val = input ? input.value.trim() : '';
        return val ? `${encodeURIComponent(p.name)}=${encodeURIComponent(val)}` : '';
      }).filter(Boolean).join('&');
      if (qs) url += `?${qs}`;
    }

    const opts = { method: ep.method, headers: {} };
    if (ep.body) {
      try {
        opts.body = document.getElementById('sb-body').value;
        opts.headers['Content-Type'] = 'application/json';
        JSON.parse(opts.body); // validate
      } catch {
        this._showError('JSON inválido no body da requisição.');
        btn.textContent = 'Enviar'; btn.disabled = false;
        return;
      }
    }

    const t0 = performance.now();
    try {
      const res = await fetch(url, opts);
      const ms = Math.round(performance.now() - t0);
      let text;
      try { text = JSON.stringify(await res.json(), null, 2); }
      catch { text = await res.text(); }

      document.getElementById('sb-status').textContent = res.status;
      document.getElementById('sb-status').className = `sb-status ${res.ok ? 'sb-status-ok' : 'sb-status-err'}`;
      document.getElementById('sb-time').textContent = `${ms}ms`;
      document.getElementById('sb-output').textContent = text;
      document.getElementById('sb-response').hidden = false;
      document.getElementById('sb-error').hidden = true;
    } catch (err) {
      this._showError(`Falha na requisição: ${err.message}\n\nVerifique se a API está online ou se há bloqueio de CORS.`);
    }

    btn.textContent = 'Enviar'; btn.disabled = false;
  }

  _showError(msg) {
    document.getElementById('sb-error-msg').textContent = msg;
    document.getElementById('sb-error').hidden = false;
    document.getElementById('sb-response').hidden = true;
  }
}
