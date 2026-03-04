/* ============================================================
   common.js — CSV cache, shared helpers, nav/footer injection
   ============================================================ */

/* ── Site config ─────────────────────────────────────────── */
const SITE_REPO = {
  owner:  'multimodalAI',
  repo:   'multimodal-ai-landscape',
  branch: 'main'
};

/* ── CSV cache ──────────────────────────────────────────── */
const _csvCache = {};
function csv(url) {
  if (_csvCache[url]) return _csvCache[url];
  _csvCache[url] = new Promise((resolve, reject) =>
    Papa.parse(url, {
      download: true, header: true, skipEmptyLines: true,
      complete: r => resolve(r.data),
      error:    e => reject(e)
    })
  );
  return _csvCache[url];
}

/* ── Color palette ──────────────────────────────────────── */
const colorMap = {
  "Vision":     "#5496CE", "Language": "#5EB342",
  "TimeSeries": "#E9C54E", "Graph":    "#F29742",
  "Sensor":     "#B778B3", "Spatial":  "#96A0B3",
  "Audio":      "#DC6464", "Tabular":  "#C5C500",
  "Vision and Language":  "#5496CE",
  "Vision and Others":    "#5EB342",
  "Language and Others":  "#E9C54E",
  "Others":               "#F29742",
  "Pairwise":  "#5496CE", "Triple":   "#5EB342",
  "Quadruple": "#E9C54E", "Quintuple":"#F29742",
  "AI": "#DC6464", "Multimodal AI": "#5496CE"
};
const colors = [
  "#5496CE","#5EB342","#E9C54E","#F29742",
  "#B778B3","#96A0B3","#DC6464","#C5C500",
  "#E0DCCA","#96CED3","#D3A9CE"
];

/* ── Helpers ────────────────────────────────────────────── */
function num(x) {
  const n = Number(String(x).match(/-?\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(n) ? n : null;
}
function safeMax(arr) {
  const v = arr.filter(x => Number.isFinite(x));
  return v.length ? Math.max(...v) : 0;
}
function fmt(n) { return (n ?? 0).toLocaleString(); }
function displayModalityLabel(l) {
  return String(l).replace(/\bTimeSeries\b/g, 'Time series');
}
function centerLegend() {
  return { orientation: "h", x: 0.5, xanchor: "center", y: 1.05, yanchor: "bottom" };
}

/* ── Date helper ─────────────────────────────────────────── */
function _fmtDate(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d)) return null;
    return d.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  } catch (_) { return null; }
}

/* ── Chip factory ───────────────────────────────────────── */
function makeChipGroup(container, labels, { multi = true, defaultOn = [] } = {}) {
  const entries = labels.map(l => typeof l === 'string' ? { value: l, label: l } : l);
  container.innerHTML = entries.map(e =>
    `<button class="chip" data-val="${e.value}" role="checkbox" aria-checked="false" tabindex="0">${e.label}</button>`
  ).join('');
  const allVals = entries.map(e => e.value);
  const selected = new Set(defaultOn.length ? defaultOn : (multi ? allVals : [allVals[0]]));

  function sync() {
    container.querySelectorAll('.chip[data-val]').forEach(btn => {
      const on = selected.has(btn.dataset.val);
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  function toggle(v) {
    if (multi) selected.has(v) ? selected.delete(v) : selected.add(v);
    else       { selected.clear(); selected.add(v); }
    sync();
  }
  container.addEventListener('click', e => {
    const btn = e.target.closest('button[data-val]'); if (!btn) return;
    toggle(btn.dataset.val);
    container.dispatchEvent(new CustomEvent('chips-change', { detail: { selected: new Set(selected) } }));
  });
  container.addEventListener('keydown', e => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    const btn = e.target.closest('button[data-val]'); if (!btn) return;
    e.preventDefault();
    toggle(btn.dataset.val);
    container.dispatchEvent(new CustomEvent('chips-change', { detail: { selected: new Set(selected) } }));
  });
  sync();
  return { selected, sync };
}

/* ── Loading / error helpers ────────────────────────────── */
function showSkeleton(chartId) {
  const el = document.getElementById(chartId); if (!el) return;
  if (el.querySelector('.skeleton-wrap')) return;
  const h = el.offsetHeight || 460;
  const bars = [.28,.45,.18,.38].map(f =>
    `<div class="skeleton" style="height:${Math.round(h * f)}px;flex:1"></div>`
  ).join('');
  const sk = document.createElement('div');
  sk.className = 'skeleton-wrap'; sk.id = `sk-${chartId}`;
  sk.innerHTML = bars;
  el.style.position = 'relative';
  el.appendChild(sk);
}
function hideSkeleton(chartId) {
  document.getElementById(`sk-${chartId}`)?.remove();
}
function showChartError(chartId, msg = 'Failed to load data.') {
  hideSkeleton(chartId);
  const el = document.getElementById(chartId); if (!el) return;
  el.innerHTML = `
    <div class="chart-error" role="alert">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <circle cx="12" cy="16" r=".5" fill="currentColor"/>
      </svg>
      <div><strong>Could not load chart</strong><br><span style="font-size:12px">${msg}</span></div>
    </div>`;
}

/* ── Download helpers ───────────────────────────────────── */
function downloadCSVFile(filename, data) {
  const blob = new Blob([Papa.unparse(data)], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
function downloadPNG(chartId, filename) {
  Plotly.downloadImage(chartId, { format: 'png', filename, width: 1200, height: 700, scale: 2 });
}

/* ── Navigation HTML ────────────────────────────────────── */
const NAV_HTML = `
<nav class="site-nav" aria-label="Main navigation">
  <div class="container nav-inner">
    <a href="index.html" class="nav-logo" aria-label="Multimodal AI Landscape — home">
      <img src="./assets/img/multimodalai-logo.png" alt="" class="nav-logo-img"
           width="28" height="28" aria-hidden="true" onerror="this.style.display='none'">
      Multimodal AI Landscape
    </a>
    <ul class="nav-links" role="list">
      <li><a href="index.html">Home</a></li>
      <li>
        <a href="https://github.com/multimodalAI/multimodal-ai-landscape"
           class="nav-github" target="_blank" rel="noopener"
           aria-label="Open GitHub repository">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839
              9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343
              -3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608
              1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647
              .35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988
              1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564
              9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027
              2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0
              3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012
              2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22
              6.484 17.522 2 12 2z"/>
          </svg>
          GitHub
        </a>
      </li>
    </ul>
    <button class="nav-hamburger" aria-label="Toggle menu"
            aria-expanded="false" aria-controls="nav-mobile">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <line x1="3" y1="6"  x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  </div>
  <div class="nav-mobile-menu" id="nav-mobile"
       role="navigation" aria-label="Mobile navigation">
    <a href="index.html">Home</a>
    <a href="https://github.com/multimodalAI/multimodal-ai-landscape"
       target="_blank" rel="noopener">GitHub ↗</a>
  </div>
</nav>`;

/* ── Footer HTML ────────────────────────────────────────── */
const FOOTER_HTML = `
<footer class="site-footer" role="contentinfo">
  <div class="container-wide">
    <div class="footer-citation-section">
      <div class="footer-cite-info">
        <a href="index.html" class="nav-logo" style="text-decoration:none">
          <img src="./assets/img/multimodalai-logo.png" alt="" class="nav-logo-img"
               width="28" height="28" aria-hidden="true" onerror="this.style.display='none'">
          Multimodal AI Landscape
        </a>
        <p>Interactive data visualisations from the <em>Nature Machine
        Intelligence</em> Perspective on multimodal AI beyond vision and language.
        Coverage: arXiv 2019-2025. Last updated <span id="footer-last-updated">February 2026</span>.</p>
      </div>
      <div class="footer-cite-bibtex">
        <div class="bibtex-wrap">
          <div class="bibtex-header">
            <span class="bibtex-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              BibTeX
            </span>
            <span class="bibtex-hint">Copy the entry below for use in LaTeX documents</span>
          </div>
          <div class="bibtex-block"><button class="bibtex-copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.textContent.trim()).then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',1500)})" aria-label="Copy BibTeX to clipboard">Copy</button><code>@article{liu2025towards,
  title   = {Towards deployment-centric multimodal AI beyond vision and language},
  author  = {Liu, Xianyuan and Zhang, Jiayang and Zhou, Shuo and van der Plas, Thijs L. and Vijayaraghavan, Avish and Grishina, 
              Anastasiia and Zhuang, Mengdie and Schofield, Daniel and Tomlinson, Christopher and others},
  journal = {Nature Machine Intelligence},
  volume  = {7},
  pages   = {1612--1624},
  year    = {2025},
  doi     = {10.1038/s42256-025-01116-5},
  url     = {https://doi.org/10.1038/s42256-025-01116-5}
}</code></div>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span class="footer-bottom-text">
        &copy; <span id="copyright-year">2025</span> Multimodal AI Landscape &mdash;
        <a href="https://opensource.org/licenses/MIT"
           target="_blank" rel="noopener">MIT Licence</a> &mdash;
        Built with
        <a href="https://plotly.com/javascript/" target="_blank" rel="noopener">Plotly.js</a>
        and
        <a href="https://www.papaparse.com/" target="_blank" rel="noopener">Papa Parse</a>.
      </span>
      <div class="footer-bottom-links">
        <a href="https://github.com/multimodalAI/multimodal-ai-landscape"
           target="_blank" rel="noopener">GitHub</a>
        <a href="https://opensource.org/licenses/MIT"
           target="_blank" rel="noopener">Licence</a>
      </div>
    </div>
  </div>
</footer>`;

/* ── JSON cache & dataset helpers ───────────────────────── */
const _jsonCache = {};

/**
 * Fetch a JSON file, caching the Promise so the same URL is only
 * requested once per page session.
 */
function fetchJSON(url) {
  if (_jsonCache[url]) return _jsonCache[url];
  _jsonCache[url] = fetch(url).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
    return r.json();
  });
  return _jsonCache[url];
}

/**
 * Load datasets.json and resolve each dataset's meta.json.
 * Returns an array of { id, meta } objects.
 */
async function loadDatasets() {
  const manifest = await fetchJSON('./data/datasets.json');
  return Promise.all(
    manifest.datasets.map(async d => {
      const meta = await fetchJSON(d.meta);
      return { id: d.id, meta };
    })
  );
}

/**
 * Return the absolute (relative-to-root) URL for a figure's CSV
 * given the active dataset meta and a figure key (e.g. 'fig1').
 * Returns null if the key isn't declared in meta.primary_files.figures.
 */
function datasetFileUrl(meta, figKey) {
  const fname = meta?.primary_files?.figures?.[figKey];
  if (!fname) return null;
  return `./data/${meta.id}/${fname}`;
}

/* ── Last-updated resolver ───────────────────────────────── */
/**
 * Resolve the most recent commit date for the repository and update
 * any #last-updated and #footer-last-updated elements on the page.
 *
 * Resolution order:
 *   1. localStorage cache (24-hour TTL, keyed by repo)
 *   2. GitHub Commits REST API
 *   3. ./assets/meta/build.json  { "built_at": "<ISO date>" }
 *   4. Leave existing element text intact (silent no-op)
 */
async function setLastUpdated() {
  const CACHE_KEY = `lastUpdated:${SITE_REPO.owner}/${SITE_REPO.repo}`;
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h

  function _apply(label) {
    ['last-updated', 'footer-last-updated'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = label;
    });
  }

  // 1. Check localStorage cache
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && (Date.now() - cached.ts) < CACHE_TTL && cached.label) {
      _apply(cached.label);
      return;
    }
  } catch (_) { /* ignore storage errors */ }

  // 2. Try GitHub Commits API
  try {
    const apiUrl =
      `https://api.github.com/repos/${SITE_REPO.owner}/${SITE_REPO.repo}` +
      `/commits?sha=${SITE_REPO.branch}&per_page=1`;
    const res = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (res.ok) {
      const commits = await res.json();
      const iso = commits?.[0]?.commit?.committer?.date || commits?.[0]?.commit?.author?.date;
      const label = _fmtDate(iso);
      if (label) {
        _apply(label);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), label }));
        } catch (_) { /* ignore */ }
        return;
      }
    }
  } catch (_) { /* network / CORS errors are expected in some environments */ }

  // 3. Try ./assets/meta/build.json
  try {
    const build = await fetchJSON('./assets/meta/build.json');
    const label = _fmtDate(build?.built_at);
    if (label) { _apply(label); return; }
  } catch (_) { /* file may not exist */ }

  // 4. Silent fallback — leave whatever is already in the DOM
}

/* ── Bootstrap: inject nav + footer, set active link ────── */
(function bootstrap() {
  const navEl = document.getElementById('site-nav');
  if (navEl) navEl.outerHTML = NAV_HTML;

  const footerEl = document.getElementById('site-footer');
  if (footerEl) footerEl.outerHTML = FOOTER_HTML;

  // Dynamic copyright year
  const yearEl = document.getElementById('copyright-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Highlight current page
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile-menu a').forEach(a => {
    const href = (a.getAttribute('href') || '').replace(/^\.\//, '');
    const match = href === page || (page === '' && href === 'index.html');
    if (match) a.classList.add('active');
  });

  // Mobile hamburger toggle
  document.addEventListener('click', e => {
    const btn = e.target.closest('.nav-hamburger');
    const menu = document.getElementById('nav-mobile');
    if (!menu) return;
    if (btn) {
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    } else if (!menu.contains(e.target)) {
      menu.classList.remove('open');
      const ham = document.querySelector('.nav-hamburger');
      if (ham) ham.setAttribute('aria-expanded', 'false');
    }
  });

  // Expose help-tip content to screen readers via aria-label
  document.querySelectorAll('.help-tip[data-tip]').forEach(el => {
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.dataset.tip);
  });

  // Resolve last-updated date asynchronously
  setLastUpdated();
})();
