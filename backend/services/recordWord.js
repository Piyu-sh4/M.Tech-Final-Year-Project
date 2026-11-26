const { Document, HeadingLevel, Packer, Paragraph, TextRun } = require('docx');

function renderRecordWord(title, fields) {
  const paragraphs = [
    new Paragraph({ text: 'Workforce Intelligence', heading: HeadingLevel.SUBTITLE }),
    new Paragraph({ text: title, heading: HeadingLevel.TITLE })
  ];
  for (const [label, value] of fields) {
    paragraphs.push(new Paragraph({ text: label, heading: HeadingLevel.HEADING_2 }));
    for (const line of value.split(/\r?\n/)) paragraphs.push(new Paragraph({
      children: [new TextRun(line || '—')],
      spacing: { after: 120 }
    }));
  }
  return Packer.toBuffer(new Document({
    title,
    description: 'Workforce Intelligence record export',
    sections: [{ children: paragraphs }]
  }));
}

module.exports = { renderRecordWord };
