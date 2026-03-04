/* ============================================================
   explore.js — all six interactive chart renderers

   Dataset-aware: reads ?dataset=<id> from the URL, loads the
   matching meta.json from datasets.json, then resolves every
   CSV path via meta.primary_files.figures.

   Depends on: common.js (fetchJSON, datasetFileUrl, csv,
               colorMap, colors, num, safeMax, fmt,
               displayModalityLabel, centerLegend,
               makeChipGroup, showSkeleton, hideSkeleton,
               showChartError, downloadCSVFile, downloadPNG)
   ============================================================ */

const LAST_UPDATED = 'January 2026';

/* ── Per-figure metadata (tips & captions only) ──────────── */
const FIGURES = {
  chart1: {
    tip: 'Annual count of multimodal AI arXiv preprints and their share of all AI preprints.',
    caption: 'Bars (left axis) show total multimodal AI preprint volume; the dashed line (right axis) shows multimodal AI as a proportion of all AI preprints. Growth is near-continuous from 2019 to 2025.'
  },
  chart2: {
    tip: 'Preprint counts by the dominant modality — filter using the chips.',
    caption: 'Grouped bars show yearly preprint counts per modality. Vision and Language consistently dominate, while Audio, Sensor, and Graph modalities show emerging but accelerating growth.'
  },
  chart3: {
    tip: 'How many modalities are combined per paper — pairwise, triple, quadruple, or quintuple.',
    caption: 'Pairwise combinations remain the most common, but triple-modality papers are growing fastest proportionally, reflecting the trend towards richer, more complex multimodal models.'
  },
  chart4: {
    tip: 'Within each combination type, the breakdown between Vision & Language vs. other pairings.',
    caption: 'Across all combination types, Vision & Language pairings dominate. The "Others" category captures novel pairings that do not involve either Vision or Language as a primary modality.'
  },
  chart5: {
    tip: 'Ranked frequency of specific modality pairs. Click a modality chip to highlight pairs containing it.',
    caption: 'Vision & Language is by far the most common pairing. Filtering by a specific modality reveals which pairings are most explored (or underexplored) relative to it.'
  },
  chart6: {
    tip: 'Trend lines for modality combinations that appear rarely — potential growth areas.',
    caption: 'These underexplored combinations typically involve non-standard modalities such as Sensor, Graph, Tabular, or Spatial data. Some show rapid recent growth, suggesting emerging research directions.'
  }
};

/* ── Active dataset context ──────────────────────────────── */
let DATASET_META = null;

/** Return the dataset id from ?dataset=<id>, validated against the manifest. */
function getDatasetId(manifest) {
  const params = new URLSearchParams(location.search);
  const id = params.get('dataset');
  if (id && manifest.datasets.some(d => d.id === id)) return id;
  return manifest.datasets[0]?.id ?? null;
}

/** Resolve a figure's CSV URL from the active dataset meta. */
function figUrl(key) {
  return datasetFileUrl(DATASET_META, key);
}

/* ── "Not available" panel ───────────────────────────────── */
function showUnavailable(chartId) {
  hideSkeleton(chartId);
  const el = document.getElementById(chartId);
  if (!el) return;
  el.innerHTML = `
    <div class="chart-unavailable" role="note">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="8" y1="8" x2="16" y2="16"/>
        <line x1="16" y1="8" x2="8" y2="16"/>
      </svg>
      <div>
        <strong>Not available for this dataset</strong><br>
        <span style="font-size:12px">This figure is not included in the selected dataset.</span>
      </div>
    </div>`;
}

/* ── Dataset selector (injected when >1 dataset exists) ──── */
function injectDatasetSelector(allDatasets, activeId) {
  if (allDatasets.length <= 1) return;
  const hero = document.querySelector('.page-hero .container')
            || document.querySelector('.dashboard-hero .hero-content');
  if (!hero) return;
  const isOnePage = document.body.classList.contains('one-page');
  const linkPage  = isOnePage ? 'index.html'
                              : (location.pathname.split('/').pop() || 'index.html');
  const wrap = document.createElement('div');
  wrap.className = 'dataset-selector';
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', 'Switch dataset');
  wrap.innerHTML =
    `<span class="dataset-label">Dataset:</span>` +
    allDatasets.map(d => {
      const title  = d.meta?.title || d.id;
      const active = d.id === activeId;
      return `<a class="chip${active ? ' active' : ''}"
                 href="${linkPage}?dataset=${encodeURIComponent(d.id)}"
                 aria-current="${active ? 'page' : 'false'}">${title}</a>`;
    }).join('');
  hero.appendChild(wrap);
}

/* ── Attach download buttons ─────────────────────────────── */
function attachActions(chartId, csvUrl) {
  const figNum = chartId.replace('chart', '');
  const pngBtn = document.querySelector(`[data-png="${chartId}"]`);
  const csvBtn = document.querySelector(`[data-csv="${chartId}"]`);

  if (pngBtn) pngBtn.addEventListener('click', () =>
    downloadPNG(chartId, `fig${figNum}-multimodal-ai`)
  );
  if (csvBtn && csvUrl) csvBtn.addEventListener('click', async () => {
    try { downloadCSVFile(`fig${figNum}-data.csv`, await csv(csvUrl)); }
    catch { alert('Data download failed.'); }
  });
  if (csvBtn && !csvUrl) csvBtn.style.display = 'none';
}

/* ── Shared Plotly layout defaults ──────────────────────── */
const BASE_LAYOUT = {
  plot_bgcolor:  'white',
  paper_bgcolor: 'white',
  font: { family: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', size: 12 }
};

/* ============================================================
   Chart 1 — Overall preprint counts
   ============================================================ */
async function renderChart1() {
  const url = figUrl('fig1');
  showSkeleton('chart1');
  if (!url) { showUnavailable('chart1'); return; }
  try {
    const data  = await csv(url);
    const years = data.map(r => num(r.Year)).filter(v => v != null);
    const ai    = data.map(r => num(r['AI']));
    const mmai  = data.map(r => num(r['Multimodal AI']));
    const pct   = mmai.map((v, i) => (ai[i] > 0) ? v / ai[i] : null);

    hideSkeleton('chart1');
    Plotly.newPlot('chart1', [
      {
        x: years, y: mmai, name: 'Multimodal AI preprints', type: 'bar',
        marker: { color: colorMap['Multimodal AI'], opacity: 0.88 }, width: 0.6,
        hovertemplate: '<b>%{x}</b><br>Count: %{y:,}<extra></extra>'
      },
      {
        x: years, y: pct, name: 'Share of all AI preprints',
        type: 'scatter', mode: 'lines+markers', yaxis: 'y2',
        line:   { width: 2.5, color: colorMap['AI'], dash: 'dash' },
        marker: { size: 7, color: colorMap['AI'], symbol: 'diamond' },
        hovertemplate: '<b>%{x}</b><br>Share: %{y:.1%}<extra></extra>'
      }
    ], {
      ...BASE_LAYOUT,
      xaxis:  { title: 'Year', dtick: 1, tickformat: 'd' },
      yaxis:  { title: 'Preprint count' },
      yaxis2: {
        title: 'Proportion of AI preprints', overlaying: 'y', side: 'right',
        tickformat: '.0%',
        range: [0, safeMax(pct) * 1.25 || 0.06]
      },
      legend: centerLegend(),
      margin: { l: 68, r: 68, t: 50, b: 58 }
    }, { responsive: true });

    attachActions('chart1', url);
  } catch (e) {
    showChartError('chart1', 'Could not load data for this figure.');
  }
}

/* ============================================================
   Chart 2 — By modality
   ============================================================ */
async function renderChart2() {
  const url = figUrl('fig2');
  showSkeleton('chart2');
  if (!url) { showUnavailable('chart2'); return; }
  try {
    const data    = await csv(url);
    const years   = data.map(r => num(r.Year));
    const modCols = Object.keys(data[0]).filter(k => k.toLowerCase() !== 'year');
    const items   = modCols.map(k => ({ value: k, label: displayModalityLabel(k) }));

    const wrap  = document.getElementById('modChips');
    const chips = makeChipGroup(wrap, items, { multi: true, defaultOn: modCols });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'chip chip-clear';
    clearBtn.textContent = 'Clear';
    clearBtn.style.marginLeft = 'auto';
    clearBtn.setAttribute('aria-label', 'Clear modality selection');
    wrap.appendChild(clearBtn);
    clearBtn.addEventListener('click', () => { chips.selected.clear(); chips.sync(); draw([]); });

    function draw(cols) {
      const traces = cols.map((k, i) => ({
        x: years, y: data.map(r => num(r[k])),
        name: displayModalityLabel(k), type: 'bar',
        marker: { color: colorMap[k] || colors[i % colors.length], opacity: 0.88 },
        hovertemplate: '<b>%{x}</b><br>' + displayModalityLabel(k) + ': %{y:,}<extra></extra>'
      }));
      hideSkeleton('chart2');
      if (!traces.length) {
        Plotly.newPlot('chart2', [], {
          ...BASE_LAYOUT,
          xaxis: { title: 'Year', dtick: 1 }, yaxis: { title: 'Count' },
          annotations: [{ text: 'Select one or more modalities to display',
            xref: 'paper', yref: 'paper', x: .5, y: .5,
            showarrow: false, font: { size: 14, color: '#64748b' } }],
          legend: centerLegend()
        }, { responsive: true });
        return;
      }
      Plotly.newPlot('chart2', traces, {
        ...BASE_LAYOUT, barmode: 'group',
        xaxis: { title: 'Year', dtick: 1 }, yaxis: { title: 'Preprint count' },
        legend: centerLegend(),
        margin: { l: 60, r: 20, t: 50, b: 58 }
      }, { responsive: true });
    }

    draw([...chips.selected]);
    wrap.addEventListener('chips-change', e => draw([...e.detail.selected]));
    attachActions('chart2', url);
  } catch (e) {
    showChartError('chart2', 'Could not load data for this figure.');
  }
}

/* ============================================================
   Chart 3 — By number of modalities
   ============================================================ */
async function renderChart3() {
  const url = figUrl('fig3');
  showSkeleton('chart3');
  if (!url) { showUnavailable('chart3'); return; }
  try {
    const data    = await csv(url);
    const years   = data.map(r => num(r.Year));
    const numCols = Object.keys(data[0]).filter(k => k.toLowerCase() !== 'year');

    const wrap  = document.getElementById('numChips');
    const chips = makeChipGroup(wrap, numCols, { multi: true, defaultOn: numCols });

    function draw(cols) {
      const traces = cols.map((k, i) => ({
        x: years, y: data.map(r => num(r[k])), name: k, type: 'bar',
        marker: { color: colorMap[k] || colors[i % colors.length] },
        hovertemplate: '<b>%{x}</b><br>' + k + ': %{y:,}<extra></extra>'
      }));
      hideSkeleton('chart3');
      if (!traces.length) {
        Plotly.newPlot('chart3', [], {
          ...BASE_LAYOUT,
          xaxis: { title: 'Year', dtick: 1 }, yaxis: { title: 'Count' },
          annotations: [{ text: 'Select one or more combination types',
            xref: 'paper', yref: 'paper', x: .5, y: .5,
            showarrow: false, font: { size: 14, color: '#64748b' } }]
        }, { responsive: true });
        return;
      }
      Plotly.newPlot('chart3', traces, {
        ...BASE_LAYOUT, barmode: 'group',
        xaxis: { title: 'Year', dtick: 1 }, yaxis: { title: 'Preprint count' },
        legend: centerLegend(),
        margin: { l: 60, r: 20, t: 50, b: 58 }
      }, { responsive: true });
    }

    draw([...chips.selected]);
    wrap.addEventListener('chips-change', e => draw([...e.detail.selected]));
    attachActions('chart3', url);
  } catch (e) {
    showChartError('chart3', 'Could not load data for this figure.');
  }
}

/* ============================================================
   Chart 4 — Breakdown by combination type
   ============================================================ */
async function renderChart4() {
  const url = figUrl('fig4');
  showSkeleton('chart4');
  if (!url) { showUnavailable('chart4'); return; }
  try {
    const data    = await csv(url);
    const typeKey = Object.keys(data[0] || {}).find(k => k.toLowerCase() === 'type') || 'Type';
    const types   = [...new Set(data.map(r => String(r[typeKey] || '').trim()))].filter(Boolean);
    const items   = types.map(t => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }));

    const wrap  = document.getElementById('typeChips');
    const chips = makeChipGroup(wrap, items, { multi: false, defaultOn: [types[0]] });

    function displayLabel(key, typeSel) {
      const t = typeSel.toLowerCase();
      switch (key) {
        case 'Vision and Language':
          return t === 'pairwise' ? 'Vision & Language'
               : t === 'triple'  ? 'Vision & Language & Other'
               :                   'Vision & Language & Others';
        case 'Vision and Others':
          return t === 'pairwise' ? 'Vision & Other' : 'Vision & Others';
        case 'Language and Others':
          return t === 'pairwise' ? 'Language & Other' : 'Language & Others';
        default: return key;
      }
    }

    function draw(typeSel) {
      const filtered = data.filter(r => String(r[typeKey] || '').trim() === typeSel);
      if (!filtered.length) { Plotly.purge('chart4'); return; }
      const years = filtered.map(r => num(r.Year));
      const cats  = ['Vision and Language','Vision and Others','Language and Others','Others']
                    .filter(k => k in filtered[0]);
      const traces = cats.map((k, i) => ({
        x: years, y: filtered.map(r => num(r[k])),
        name: displayLabel(k, typeSel), type: 'bar',
        marker: { color: colorMap[k] || colors[i % colors.length] },
        hovertemplate: '<b>%{x}</b><br>%{fullData.name}: %{y:,}<extra></extra>'
      }));
      hideSkeleton('chart4');
      Plotly.newPlot('chart4', traces, {
        ...BASE_LAYOUT, barmode: 'group',
        xaxis: { title: 'Year', dtick: 1 }, yaxis: { title: 'Preprint count' },
        legend: centerLegend(),
        margin: { l: 60, r: 20, t: 50, b: 58 }
      }, { responsive: true });
    }

    draw([...chips.selected][0]);
    wrap.addEventListener('chips-change', e => draw([...e.detail.selected][0]));
    attachActions('chart4', url);
  } catch (e) {
    showChartError('chart4', 'Could not load data for this figure.');
  }
}

/* ============================================================
   Chart 5 — Modality pairs
   ============================================================ */
async function renderChart5() {
  showSkeleton('chart5');

  // Build year options from whichever fig5_YEAR files are declared in meta
  const yearOptions = [2024, 2025]
    .map(y => ({ year: y, url: figUrl(`fig5_${y}`) }))
    .filter(o => o.url !== null);

  if (!yearOptions.length) { showUnavailable('chart5'); return; }

  try {
    let currentYear = yearOptions[yearOptions.length - 1].year;
    let pairRows = [], allMods = [];

    function splitMods(label) {
      return label.split('&').map(s => s.trim()).filter(Boolean);
    }

    async function loadPairs(year) {
      const opt = yearOptions.find(o => o.year === year);
      if (!opt) throw new Error(`No data URL for year ${year}`);
      const raw = await new Promise((res, rej) =>
        Papa.parse(opt.url, {
          download: true, header: false, skipEmptyLines: true,
          complete: r => res(r.data), error: rej
        })
      );
      let labs = (raw[0] || []).map(s => String(s).trim());
      let cnts = (raw[1] || []).map(v => num(v));
      if (labs[0]?.toLowerCase() === 'year') { labs = labs.slice(1); cnts = cnts.slice(1); }
      pairRows = labs.map((lab, i) => ({ label: lab, count: cnts[i], mods: splitMods(lab) }));
      const known = ['Vision','Language','Audio','TimeSeries','Sensor','Spatial','Graph','Tabular'];
      const allSet = new Set(pairRows.flatMap(r => r.mods));
      allMods = known.filter(m => allSet.has(m)).concat([...allSet].filter(m => !known.includes(m)));
    }

    const chipWrap  = document.getElementById('pairChips');
    const yearWrap  = document.getElementById('pairYearChips');
    const selectedMods = new Set();

    yearWrap.innerHTML = `<span class="year-label">Year</span>` +
      yearOptions.map(o => `<button class="chip" data-year="${o.year}">${o.year}</button>`).join('');

    function syncYearChips() {
      yearWrap.querySelectorAll('button[data-year]').forEach(btn =>
        btn.classList.toggle('active', Number(btn.dataset.year) === currentYear)
      );
    }

    const row5    = chipWrap.parentElement;
    const topSel  = document.getElementById('pairTopN');
    const selWrap = topSel?.closest('.select-wrap') || topSel;
    const clearBtn = document.createElement('button');
    clearBtn.className = 'chip chip-clear';
    clearBtn.textContent = 'Clear';
    clearBtn.style.marginLeft = 'auto';
    clearBtn.setAttribute('aria-label', 'Clear modality filter');
    if (selWrap) row5.insertBefore(clearBtn, selWrap);
    else row5.appendChild(clearBtn);
    clearBtn.addEventListener('click', () => { selectedMods.clear(); syncPairChips(); draw(); });

    function renderPairChips() {
      chipWrap.innerHTML = allMods.map(m =>
        `<button class="chip" data-mod="${m}" role="checkbox" aria-checked="false"
          tabindex="0">${displayModalityLabel(m)}</button>`
      ).join('');
    }
    function syncPairChips() {
      chipWrap.querySelectorAll('.chip[data-mod]').forEach(btn => {
        const on = selectedMods.has(btn.dataset.mod);
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }

    function getTopN() {
      const v = topSel?.value; return v === 'All' ? Infinity : Number(v) || 10;
    }

    function draw() {
      const needFilter = selectedMods.size > 0;
      let rows = needFilter
        ? pairRows.filter(r => r.mods.some(m => selectedMods.has(m)))
        : pairRows.slice();
      rows.sort((a, b) => (b.count || 0) - (a.count || 0));
      const N = getTopN();
      if (rows.length > N) rows = rows.slice(0, N);

      const labels   = rows.map(r => displayModalityLabel(r.label));
      const values   = rows.map(r => r.count);
      const hitFlags = rows.map(r => r.mods.some(m => selectedMods.has(m)));
      const barColors  = hitFlags.map(h => h || !needFilter ? colors[0] : '#d5dbe7');
      const barOpacity = hitFlags.map(h => h || !needFilter ? 0.92 : 0.3);

      function boldLabel(lab) {
        if (!selectedMods.size) return lab;
        let o = lab;
        for (const m of selectedMods) {
          const d = displayModalityLabel(m);
          o = o.replaceAll(d, `<b>${d}</b>`);
        }
        return o;
      }

      const maxVal = safeMax(values);
      const annos  = labels.map((lab, i) => ({
        xref: 'x', yref: 'y',
        x: -maxVal * 0.02, y: lab,
        text: boldLabel(lab),
        showarrow: false, align: 'right', xanchor: 'right',
        font: { size: 12.5, color: hitFlags[i] || !needFilter ? '#1e293b' : '#94a3b8' }
      }));

      hideSkeleton('chart5');
      Plotly.newPlot('chart5', [{
        x: values, y: labels, type: 'bar', orientation: 'h',
        marker: { color: barColors, opacity: barOpacity },
        hovertemplate: '<b>%{y}</b><br>Count: %{x:,}<extra></extra>'
      }], {
        ...BASE_LAYOUT,
        xaxis: { title: 'Preprint count', range: [-maxVal * 0.16, maxVal * 1.05] },
        yaxis: { showticklabels: false, autorange: 'reversed' },
        annotations: annos,
        margin: { l: 200, r: 30, t: 40, b: 58 },
        showlegend: false
      }, { responsive: true });
    }

    await loadPairs(currentYear);
    renderPairChips(); syncPairChips(); syncYearChips();
    hideSkeleton('chart5'); draw();

    chipWrap.addEventListener('click', e => {
      const btn = e.target.closest('button[data-mod]'); if (!btn) return;
      const m = btn.dataset.mod;
      selectedMods.has(m) ? selectedMods.delete(m) : selectedMods.add(m);
      syncPairChips(); draw();
    });
    topSel?.addEventListener('change', draw);

    yearWrap.addEventListener('click', async e => {
      const btn = e.target.closest('button[data-year]'); if (!btn) return;
      const year = Number(btn.dataset.year);
      if (year === currentYear) return;
      currentYear = year;
      selectedMods.clear(); syncYearChips();
      showSkeleton('chart5');
      await loadPairs(currentYear);
      renderPairChips(); syncPairChips(); draw();
    });

    // Chart 5 uses two year-specific CSVs, so no single CSV download
    attachActions('chart5', null);
  } catch (e) {
    showChartError('chart5', 'Could not load modality-pairs data.');
  }
}

/* ============================================================
   Chart 6 — Underexplored combinations
   ============================================================ */
async function renderChart6() {
  const url = figUrl('fig6');
  showSkeleton('chart6');
  if (!url) { showUnavailable('chart6'); return; }
  try {
    const data     = await csv(url);
    const years    = data.map(r => num(r.Year));
    const rawCols  = Object.keys(data[0]).filter(k => k.toLowerCase() !== 'year');

    function colTotal(col) {
      return data.reduce((s, r) => { const v = num(r[col]); return s + (Number.isFinite(v) ? v : 0); }, 0);
    }

    const sorted    = rawCols.map(col => ({ col, total: colTotal(col) })).sort((a, b) => b.total - a.total);
    const comboCols = sorted.map(d => d.col);
    const totals    = Object.fromEntries(sorted.map(d => [d.col, d.total]));

    const lineStyles = ['solid','dot','dash','longdash','dashdot','longdashdot'];
    const colorFor = {}, styleFor = {};
    comboCols.forEach((c, i) => {
      colorFor[c] = colors[i % colors.length];
      styleFor[c] = lineStyles[i % lineStyles.length];
    });

    const wrap = document.getElementById('comboChips');
    const maxV = 10;
    let showAll = false;
    const selected = new Set(comboCols.slice(0, 2));

    function renderChips() {
      const visible = showAll ? comboCols : comboCols.slice(0, maxV);
      wrap.innerHTML =
        visible.map(c =>
          `<button class="chip" data-col="${c}" role="checkbox"
            aria-checked="${selected.has(c)}">${displayModalityLabel(c)} (${fmt(totals[c])})</button>`
        ).join('') +
        (comboCols.length > maxV
          ? `<button id="toggleMore" class="chip chip-more">${showAll ? 'Show less −' : 'Show more +'}</button>`
          : '') +
        `<button id="clearChips" class="chip chip-clear"
          style="margin-left:auto" aria-label="Clear selection">Clear</button>`;
      wrap.querySelectorAll('.chip[data-col]').forEach(btn =>
        btn.classList.toggle('active', selected.has(btn.dataset.col))
      );
    }

    function draw() {
      const cols   = comboCols.filter(c => selected.has(c));
      const cleanLabel = col => displayModalityLabel(col);
      const traces = cols.map((col, i) => ({
        x: years,
        y: data.map(r => num(r[col])),
        name: `${cleanLabel(col)} (${fmt(totals[col])})`,
        customdata: years.map(() => cleanLabel(col)),
        type: 'scatter', mode: 'lines+markers',
        line:   { width: 2.5, color: colorFor[col], dash: styleFor[col] },
        marker: { size: 7,  color: colorFor[col],
          symbol: ['circle','square','diamond','cross','triangle-up','triangle-down'][i % 6] },
        hovertemplate: '<b>%{x}</b><br>%{customdata}: %{y:,}<extra></extra>'
      }));
      hideSkeleton('chart6');
      if (!traces.length) {
        Plotly.newPlot('chart6', [], {
          ...BASE_LAYOUT,
          xaxis: { title: 'Year', dtick: 1 }, yaxis: { title: 'Count' },
          annotations: [{ text: 'Select one or more combinations to display',
            xref: 'paper', yref: 'paper', x: .5, y: .5,
            showarrow: false, font: { size: 14, color: '#64748b' } }]
        }, { responsive: true });
        return;
      }
      Plotly.newPlot('chart6', traces, {
        ...BASE_LAYOUT,
        xaxis: { title: 'Year', dtick: 1 }, yaxis: { title: 'Preprint count' },
        legend: centerLegend(),
        margin: { l: 60, r: 20, t: 60, b: 58 }
      }, { responsive: true });
    }

    renderChips(); draw();

    wrap.addEventListener('click', e => {
      const btn = e.target.closest('button'); if (!btn) return;
      if (btn.id === 'toggleMore') { showAll = !showAll; renderChips(); return; }
      if (btn.id === 'clearChips') { selected.clear(); renderChips(); draw(); return; }
      const col = btn.dataset.col; if (!col) return;
      selected.has(col) ? selected.delete(col) : selected.add(col);
      renderChips(); draw();
    });

    attachActions('chart6', url);
  } catch (e) {
    showChartError('chart6', 'Could not load data for this figure.');
  }
}

/* ── Collapsible mobile figure nav ──────────────────────── */
function initMobileNav() {
  const nav    = document.getElementById('figure-nav');
  const toggle = document.getElementById('fig-menu-toggle');
  const panel  = document.getElementById('fig-menu-panel');
  if (!nav || !toggle || !panel) return;

  toggle.addEventListener('click', () => {
    const opening = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(opening));
  });

  // Auto-close after selecting a figure link
  panel.addEventListener('click', e => {
    if (!e.target.closest('.sub-nav-link')) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    // Let layout settle, then tell Plotly to refit
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (nav.classList.contains('open') && !nav.contains(e.target)) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}

/* ── Sticky sub-nav active highlighting ─────────────────── */
function initSubNav() {
  const sections = document.querySelectorAll('.explore-section[id]');
  const links    = document.querySelectorAll('.sub-nav-link[href^="#"]');
  if (!sections.length || !links.length) return;

  const isOnePage = document.body.classList.contains('one-page');
  const navH = isOnePage ? 48 : 60;          // topbar vs full nav
  const subNav = document.querySelector('.sub-nav');
  const subNavH = subNav ? subNav.offsetHeight : 44;
  const offset = navH + subNavH + 24;        // nav + sub-nav + breathing room
  const toggleText = document.querySelector('.sub-nav-toggle-text');

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
        // Update mobile toggle label with current section
        if (toggleText) {
          const active = [...links].find(l => l.getAttribute('href') === `#${id}`);
          if (active) toggleText.textContent = active.textContent.trim();
        }
      }
    });
  }, { rootMargin: `-${offset}px 0px -55% 0px`, threshold: 0 });

  sections.forEach(s => io.observe(s));
}

/* ── Reset all filters ──────────────────────────────────── */
function initResetAll() {
  const btn = document.getElementById('resetAll');
  if (btn) btn.addEventListener('click', () => location.reload());
}

/* ── Main ───────────────────────────────────────────────── */
(async function main() {
  // 1. Load manifest, resolve the active dataset
  let manifest = null;
  try {
    manifest = await fetchJSON('./data/datasets.json');
  } catch (e) {
    console.error('Could not load datasets.json:', e.message);
  }

  if (manifest?.datasets?.length) {
    const dsId    = getDatasetId(manifest);
    const dsEntry = manifest.datasets.find(d => d.id === dsId);

    if (dsEntry) {
      try {
        DATASET_META = await fetchJSON(dsEntry.meta);
      } catch (e) {
        console.error('Could not load dataset meta:', e.message);
      }
    }

    // Inject dataset switcher (only when >1 dataset exists)
    const allDs = await Promise.all(
      manifest.datasets.map(async d => {
        try   { return { id: d.id, meta: await fetchJSON(d.meta) }; }
        catch { return { id: d.id, meta: { title: d.id } }; }
      })
    );
    injectDatasetSelector(allDs, dsId);
  }

  initMobileNav();
  initSubNav();
  initResetAll();
  await renderChart1();
  await renderChart2();
  await renderChart3();
  await renderChart4();
  await renderChart5();
  await renderChart6();
})();
