/**
 * fileParserService.js — File Parser Service v5.1
 * Supports: CSV, XLSX/XLS, PDF, TXT/MD/JSON/LOG,
 *           DOCX, PNG/JPG/GIF/WEBP (meta), MP3/WAV/M4A (meta)
 */

const fs   = require('fs');
const path = require('path');

/* ── CSV ──────────────────────────────────────────────────── */
function parseCSV(filePath) {
  const XLSX = require('xlsx');
  const book = XLSX.readFile(filePath, {raw:true});
  const sheet = book.Sheets[book.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const preview = XLSX.utils.sheet_to_csv(sheet).slice(0,8000);
  return {text:`CSV: ${path.basename(filePath)}\nColumns: ${columns.join(', ')}\nRows: ${rows.length}\n\n${preview}`,
    rows,columns,totalRows:rows.length};
}

/* ── XLSX / XLS ───────────────────────────────────────────── */
function parseXLSX(filePath) {
  try {
    const XLSX = require('xlsx');
    const wb   = XLSX.readFile(filePath);
    const results = [];
    wb.SheetNames.forEach(sheet => {
      const ws      = wb.Sheets[sheet];
      const rows    = XLSX.utils.sheet_to_json(ws, { defval:'' });
      const columns = rows.length ? Object.keys(rows[0]) : [];
      const preview = XLSX.utils.sheet_to_csv(ws).split('\n').slice(0,50).join('\n');
      results.push({ sheet, rows, columns, preview, totalRows:rows.length });
    });
    const text = results.map(s => `Sheet: ${s.sheet}\nColumns: ${s.columns.join(', ')}\nRows: ${s.totalRows}\n${s.preview}`).join('\n\n');
    return { text, sheets:results, rows:results[0]?.rows||[], columns:results[0]?.columns||[], totalRows:results.reduce((a,s)=>a+s.totalRows,0) };
  } catch(e) {
    return { text:`XLSX error: ${e.message}`, rows:[], columns:[], totalRows:0 };
  }
}

/* ── PDF ──────────────────────────────────────────────────── */
async function parsePDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const data     = await pdfParse(fs.readFileSync(filePath));
    return { text:data.text.slice(0,8000), pages:data.numpages, rows:[], columns:[], totalRows:0 };
  } catch(e) {
    return { text:`PDF error: ${e.message}`, rows:[], columns:[], totalRows:0 };
  }
}

/* ── TXT / MD / JSON / LOG ────────────────────────────────── */
function parseTXT(filePath) {
  let text = fs.readFileSync(filePath,'utf8').slice(0,8000);
  // If JSON, try to format nicely
  if (path.extname(filePath).toLowerCase() === '.json') {
    try { text = JSON.stringify(JSON.parse(text), null, 2).slice(0,8000); } catch(_) {}
  }
  return { text, rows:[], columns:[], totalRows:0 };
}

/* ── DOCX ─────────────────────────────────────────────────── */
async function parseDOCX(filePath) {
  try {
    const mammoth = require('mammoth');
    const result  = await mammoth.extractRawText({ path: filePath });
    return { text: result.value.slice(0,8000), rows:[], columns:[], totalRows:0 };
  } catch(e) {
    // fallback: read as binary and extract readable text fragments
    const buf = fs.readFileSync(filePath);
    const readable = buf.toString('utf8','binary').replace(/[^\x20-\x7E\n\r\t]/g,' ').replace(/\s{3,}/g,' ').slice(0,4000);
    return { text: `DOCX (raw extraction):\n${readable}`, rows:[], columns:[], totalRows:0 };
  }
}

/* ── Image (PNG/JPG/GIF/WEBP) ─────────────────────────────── */
function parseImage(filePath) {
  const stat = fs.statSync(filePath);
  const ext  = path.extname(filePath).toLowerCase().replace('.','').toUpperCase();
  return {
    text: `Image file: ${path.basename(filePath)}\nFormat: ${ext}\nSize: ${(stat.size/1024).toFixed(1)} KB\nThis is an image attachment added to the task for visual reference.`,
    rows:[], columns:[], totalRows:0
  };
}

/* ── Audio (MP3/WAV/M4A/OGG) ─────────────────────────────── */
function parseAudio(filePath) {
  const stat = fs.statSync(filePath);
  const ext  = path.extname(filePath).toLowerCase().replace('.','').toUpperCase();
  return {
    text: `Audio file: ${path.basename(filePath)}\nFormat: ${ext}\nSize: ${(stat.size/1024).toFixed(1)} KB\nThis is a voice note or audio instruction attached to the task.`,
    rows:[], columns:[], totalRows:0
  };
}

/* ── Dispatcher ───────────────────────────────────────────── */
async function parseFile(filePath, mimetype) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext==='.csv' || (mimetype||'').includes('csv'))
    return { ...parseCSV(filePath), type:'csv' };

  if (['.xlsx','.xls'].includes(ext) || (mimetype||'').match(/spreadsheet|excel/))
    return { ...parseXLSX(filePath), type:'xlsx' };

  if (ext==='.pdf' || (mimetype||'').includes('pdf'))
    return { ...(await parsePDF(filePath)), type:'pdf' };

  if (ext==='.docx' || ext==='.doc' || (mimetype||'').includes('word'))
    return { ...(await parseDOCX(filePath)), type:'docx' };

  if (['.png','.jpg','.jpeg','.gif','.webp'].includes(ext) || (mimetype||'').includes('image'))
    return { ...parseImage(filePath), type:'image' };

  if (['.mp3','.wav','.m4a','.ogg','.aac'].includes(ext) || (mimetype||'').includes('audio'))
    return { ...parseAudio(filePath), type:'audio' };

  if (['.txt','.md','.json','.log','.csv'].includes(ext))
    return { ...parseTXT(filePath), type:'text' };

  // Generic fallback
  try { return { ...parseTXT(filePath), type:'text' }; }
  catch(_) { return { text:'Unsupported file type.', rows:[], columns:[], totalRows:0, type:'unknown' }; }
}

/* ── Detect importable rows ───────────────────────────────── */
function detectImportableData(parsed) {
  if (!parsed.rows?.length) return null;
  const cols = parsed.columns.map(c => c.toLowerCase());
  if (['name','email'].every(f => cols.some(c => c.includes(f))))
    return { type:'employees', count:parsed.rows.length, preview:parsed.rows.slice(0,3), columns:parsed.columns };
  if (['title'].some(f => cols.some(c => c.includes(f))))
    return { type:'tasks', count:parsed.rows.length, preview:parsed.rows.slice(0,3), columns:parsed.columns };
  if (parsed.rows.length)
    return { type:'generic', count:parsed.rows.length, preview:parsed.rows.slice(0,3), columns:parsed.columns };
  return null;
}

module.exports = { parseFile, detectImportableData };
