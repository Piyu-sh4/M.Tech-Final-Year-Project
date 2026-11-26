const { renderPDF } = require('./pdfService');

const escape = value => String(value).replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

const domainColors = {technical:'#155e75',compliance:'#854d0e',product:'#6d28d9',leadership:'#31552d',
  security:'#9f1239',soft_skills:'#0f766e'};
function renderCertificate(certificate) {
  const modern = certificate.template === 'modern';
  const ink = modern ? '#174e50' : certificate.template === 'course' ? domainColors[certificate.category] || '#273e71' : '#273e71';
  const trim = modern ? '#54a89d' : certificate.template === 'course' ? ink : '#a68130';
  const date = new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeZone: 'UTC' }).format(certificate.issued_at);
  return renderPDF(`<!doctype html><html lang="en"><head><meta charset="utf-8">
    <title>Workforce Intelligence Certificate</title><style>
    * { box-sizing: border-box; }
    body { margin: 0; font: 16px "DejaVu Sans", sans-serif; color: #16223b; text-align: center; }
    main { margin: 12mm 8mm; border: 2px solid ${ink}; padding: 8mm; background: ${modern ? "#effaf8" : "#fcf9f0"}; overflow-wrap: anywhere; }
    article { padding: 12mm 8mm; border: 1px solid ${trim}; }
    .seal { display: grid; place-items: center; width: 54px; height: 54px; margin: 0 auto 12px;
      border: 2px solid ${trim}; border-radius: 50%; background: ${ink}; color: white; font-weight: bold; }
    .brand { margin: 0; color: ${ink}; font-weight: bold; letter-spacing: .06em; }
    h1 { margin: 18px 0 26px; font: bold 30px Georgia, serif; }
    p { margin: 8px 0; }
    .recipient { font: bold 25px Georgia, serif; }
    .course { font-size: 20px; font-weight: bold; }
    footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid ${trim}; color: #39496a; font-size: 13px; }
    </style></head><body><main><article>
    <div class="seal" aria-hidden="true">WI</div><p class="brand">Workforce Intelligence</p>
    <h1>Certificate of Completion</h1>
    <p>This certificate is awarded to</p><p class="recipient">${escape(certificate.learner_name)}</p>
    <p>for completing</p><p class="course">${escape(certificate.course_title)}</p>
    <footer><p>Issued ${escape(date)} · Reference WFI-TRAIN-${Number(certificate.enrollment_id)}</p>
    <p>Internal workforce learning record</p></footer>
    </article></main></body></html>`);
}

module.exports = { renderCertificate };
