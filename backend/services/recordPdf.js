const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

let activeExports = 0;

async function renderRecordPdf(title, fields, kind = 'Record export') {
  if (activeExports >= 2) {
    throw Object.assign(new Error('PDF exports are busy. Try again shortly.'), { status: 503 });
  }
  activeExports++;
  try {
    const rows = fields.map(([label, value]) =>
      '<tr><th scope="row">' + escapeHTML(label) + '</th><td>' + escapeHTML(value ?? '—') + '</td></tr>'
    ).join('');
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <title>${escapeHTML(title)}</title><style>
        *{box-sizing:border-box}
        body{margin:10mm;font:13px/1.5 "DejaVu Sans",sans-serif;color:#19233b}
        header{padding:16px 20px;margin-bottom:20px;border-left:5px solid #3754ce;background:#eef2ff;break-inside:avoid}
        header p{margin:0 0 5px;color:#354974;font-weight:bold}
        h1{font-size:24px;line-height:1.18;margin:0;overflow-wrap:anywhere}
        table{width:100%;border-collapse:collapse;table-layout:fixed}
        th,td{padding:10px 12px;text-align:left;vertical-align:top;border-bottom:1px solid #dce3ee;overflow-wrap:anywhere;white-space:pre-wrap}
        th{width:30%;background:#f4f6fb}
        footer{margin-top:18px;color:#55637e}
      </style></head><body>
      <header><p>Workforce Intelligence · ${escapeHTML(kind)}</p><h1>${escapeHTML(title)}</h1></header>
      <table>${rows}</table><footer>Generated from Workforce Intelligence</footer>
    </body></html>`;
    return await require('./pdfService').renderPDF(html);
  } finally {
    activeExports--;
  }
}

module.exports = { renderRecordPdf };
