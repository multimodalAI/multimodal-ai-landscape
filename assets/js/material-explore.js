/* ============================================================
   material-explore.js — chart renderers for the Materials
   Science dataset (Fig. 1a, 1b, 3a, 3b).

   Depends on: common.js (fetchJSON, csv, num, showSkeleton,
               hideSkeleton, showChartError, downloadCSVFile,
               downloadPNG)
   ============================================================ */

const MAT_DATA_ROOT = './data/material-landscape/';

/* ── Shared year axis ─────────────────────────────────────── */
const MAT_YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
const matXAxis = {
  tickvals: MAT_YEARS,
  ticktext: MAT_YEARS.map(String),
  title: { text: 'Year', font: { size: 11 }, standoff: 6 },
  gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 }
};

const MAT_BASE_LAYOUT = {
  font: { family: 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif', size: 12 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor:  'rgba(0,0,0,0)',
  margin: { l: 60, r: 20, t: 40, b: 52 },
  legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.06, yanchor: 'bottom', font: { size: 11 } },
  hoverlabel: { bgcolor: '#1e293b', font: { color: '#f1f5f9', size: 12 } }
};
const MAT_CONFIG = {
  responsive: true,
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['select2d','lasso2d','autoScale2d'],
  toImageButtonOptions: { format: 'png', scale: 2, width: 1000, height: 560 }
};

function matLayout(overrides) {
  return Object.assign({}, MAT_BASE_LAYOUT,
    { xaxis: matXAxis, yaxis: { gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 } } },
    overrides);
}

function wirePNG(btnId, chartId, filename) {
  const btn = document.getElementById(btnId);
  if (btn) btn.addEventListener('click', () => downloadPNG(chartId, filename));
}
function wireCSV(btnId, data, filename) {
  const btn = document.getElementById(btnId);
  if (btn) btn.addEventListener('click', () => downloadCSVFile(filename, data));
}

/* ── Fig 1a — proportions line chart ─────────────────────── */
async function matDrawFig1a() {
  const id = 'mat-chart1a';
  showSkeleton(id);
  try {
    const rows  = await csv(MAT_DATA_ROOT + 'fig1a-proportions.csv');
    const years = rows.map(r => num(r.year));
    const traces = [
      {
        x: years, y: rows.map(r => num(r.multimodal_ai_pct)),
        name: 'Multimodal AI', mode: 'lines+markers',
        line: { color: '#1a56db', width: 2.5 }, marker: { size: 7, color: '#1a56db' },
        hovertemplate: 'Multimodal AI<br>%{x}: %{y:.2f}%<extra></extra>'
      },
      {
        x: years, y: rows.map(r => num(r.generative_ai_pct)),
        name: 'Generative AI', mode: 'lines+markers',
        line: { color: '#e05c2a', width: 2.5, dash: 'dash' }, marker: { size: 7, color: '#e05c2a' },
        hovertemplate: 'Generative AI<br>%{x}: %{y:.2f}%<extra></extra>'
      },
      {
        x: years, y: rows.map(r => num(r.mm_generative_ai_pct)),
        name: 'Multimodal Generative AI', mode: 'lines+markers',
        line: { color: '#5EB342', width: 2, dash: 'dot' }, marker: { size: 6, color: '#5EB342' },
        hovertemplate: 'Multimodal Generative AI<br>%{x}: %{y:.3f}%<extra></extra>'
      }
    ];
    hideSkeleton(id);
    Plotly.newPlot(id, traces, matLayout({
      yaxis: { title: { text: 'Proportion in AI for materials papers (%)', font: { size: 11 }, standoff: 8 },
               gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 }, ticksuffix: '%' }
    }), MAT_CONFIG);
    wirePNG('dl-png-mat1a', id, 'mat-fig1a-proportions');
    wireCSV('dl-csv-mat1a', rows, 'fig1a-proportions.csv');
  } catch (e) { showChartError(id, e.message); }
}

/* ── Fig 1b — grouped bar: property prediction vs design ─── */
async function matDrawFig1b() {
  const id = 'mat-chart1b';
  showSkeleton(id);
  try {
    const rows  = await csv(MAT_DATA_ROOT + 'fig1b-property-design.csv');
    const years = rows.map(r => num(r.year));
    const traces = [
      {
        x: years, y: rows.map(r => num(r.property_prediction)),
        name: 'Property prediction', type: 'bar',
        marker: { color: '#DC6464', opacity: 0.88 },
        hovertemplate: 'Property prediction<br>%{x}: %{y:,}<extra></extra>'
      },
      {
        x: years, y: rows.map(r => num(r.materials_design)),
        name: 'Materials design', type: 'bar',
        marker: { color: '#5496CE', opacity: 0.88 },
        hovertemplate: 'Materials design<br>%{x}: %{y:,}<extra></extra>'
      }
    ];
    hideSkeleton(id);
    Plotly.newPlot(id, traces, matLayout({
      barmode: 'group', bargap: 0.28,
      yaxis: { title: { text: 'Multimodal AI paper count', font: { size: 11 }, standoff: 8 },
               gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 } }
    }), MAT_CONFIG);
    wirePNG('dl-png-mat1b', id, 'mat-fig1b-property-design');
    wireCSV('dl-csv-mat1b', rows, 'fig1b-property-design.csv');
  } catch (e) { showChartError(id, e.message); }
}

/* ── Fig 3a — stacked bar: absolute counts ────────────────── */
async function matDrawFig3a() {
  const id = 'mat-chart3a';
  showSkeleton(id);
  try {
    const rows  = await csv(MAT_DATA_ROOT + 'fig3a-category-counts.csv');
    const years = rows.map(r => num(r.year));
    const cats  = [
      { key: 'composition',              label: 'Composition',                color: '#5496CE' },
      { key: 'microstructure',           label: 'Microstructure',             color: '#5EB342' },
      { key: 'processing',               label: 'Processing',                 color: '#E9C54E' },
      { key: 'testing_characterisation', label: 'Testing & characterisation', color: '#DC6464' }
    ];
    const traces = cats.map(c => ({
      x: years, y: rows.map(r => num(r[c.key])),
      name: c.label, type: 'bar',
      marker: { color: c.color, opacity: 0.9 },
      hovertemplate: `${c.label}<br>%{x}: %{y}<extra></extra>`
    }));
    hideSkeleton(id);
    Plotly.newPlot(id, traces, matLayout({
      barmode: 'stack', bargap: 0.28,
      yaxis: { title: { text: 'Multimodal AI paper count', font: { size: 11 }, standoff: 8 },
               gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 } }
    }), MAT_CONFIG);
    wirePNG('dl-png-mat3a', id, 'mat-fig3a-category-counts');
    wireCSV('dl-csv-mat3a', rows, 'fig3a-category-counts.csv');
  } catch (e) { showChartError(id, e.message); }
}

/* ── Fig 3b — 100% stacked bar: proportions ──────────────── */
async function matDrawFig3b() {
  const id = 'mat-chart3b';
  showSkeleton(id);
  try {
    const rows  = await csv(MAT_DATA_ROOT + 'fig3b-category-proportions.csv');
    const years = rows.map(r => num(r.year));
    const cats  = [
      { key: 'composition_pct',              label: 'Composition',                color: '#5496CE' },
      { key: 'microstructure_pct',           label: 'Microstructure',             color: '#5EB342' },
      { key: 'processing_pct',               label: 'Processing',                 color: '#E9C54E' },
      { key: 'testing_characterisation_pct', label: 'Testing & characterisation', color: '#DC6464' }
    ];
    const traces = cats.map(c => ({
      x: years, y: rows.map(r => num(r[c.key])),
      name: c.label, type: 'bar',
      marker: { color: c.color, opacity: 0.9 },
      hovertemplate: `${c.label}<br>%{x}: %{y:.2f}%<extra></extra>`
    }));
    hideSkeleton(id);
    Plotly.newPlot(id, traces, matLayout({
      barmode: 'stack', bargap: 0.28,
      yaxis: { title: { text: 'Proportion (%)', font: { size: 11 }, standoff: 8 },
               gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 },
               ticksuffix: '%', range: [0, 101] }
    }), MAT_CONFIG);
    wirePNG('dl-png-mat3b', id, 'mat-fig3b-category-proportions');
    wireCSV('dl-csv-mat3b', rows, 'fig3b-category-proportions.csv');
  } catch (e) { showChartError(id, e.message); }
}

/* ── Stats loader ─────────────────────────────────────────── */
async function matLoadStats() {
  const container = document.getElementById('mat-datasets-stats');
  if (!container) return;
  function card(label, value, sub) {
    return `<div class="stat-card" role="listitem">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-sub">${sub}</div>
    </div>`;
  }
  try {
    const s = await fetchJSON('./data/material-landscape/summary.json');
    container.innerHTML = `<div class="stats-strip" role="list">
      ${card(`Multimodal AI papers in ${s.end_year}`, s.total_latest_year.toLocaleString(), `Up from ${s.total_start_year} in ${s.start_year}`)}
      ${card(`Growth (${s.start_year} → ${s.end_year})`, `${s.growth_multiplier}×`, 'Year-on-year increase')}
      ${card('Data categories tracked', s.modalities_count, 'Composition, Microstructure, Processing, T&amp;C')}
      ${card('Interactive figures', s.figures_count, 'Downloadable PNG &amp; CSV')}
    </div>`;
  } catch (_) {
    container.innerHTML = `<div class="stats-strip" role="list">
      ${card('Multimodal AI papers in 2025', '576', 'Up from 32 in 2020')}
      ${card('Growth (2020 → 2025)', '18×', 'Year-on-year increase')}
      ${card('Data categories tracked', '4', 'Composition, Microstructure, Processing, T&amp;C')}
      ${card('Interactive figures', '4', 'Downloadable PNG &amp; CSV')}
    </div>`;
  }
}

/* ── Boot ─────────────────────────────────────────────────── */
matLoadStats();
matDrawFig1a();
matDrawFig1b();
matDrawFig3a();
matDrawFig3b();
