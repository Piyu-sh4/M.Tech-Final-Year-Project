const router = require('express').Router();
const protect = require('../middleware/authMiddleware');
const { renderRecordPdf } = require('../services/recordPdf');
const { renderRecordWord } = require('../services/recordWord');

router.post('/', protect, async (request, response, next) => {
  const { title, fields } = request.body || {};
  if (typeof title !== 'string' || !title.trim() || title.length > 150 ||
      !Array.isArray(fields) || !fields.length || fields.length > 40 ||
      fields.some(field => !Array.isArray(field) || field.length !== 2 ||
        typeof field[0] !== 'string' || field[0].length > 100 ||
        typeof field[1] !== 'string' || field[1].length > 3000)) {
    return response.status(400).json({ message: 'Choose a record with valid export fields.' });
  }
  try {
    // Render only the submitted display fields. This endpoint reads no employee data.
    if (request.query.format === 'docx') {
      const buffer = await renderRecordWord(title, fields);
      return response.attachment('workforce-record.docx')
        .type('application/vnd.openxmlformats-officedocument.wordprocessingml.document').send(buffer);
    }
    const buffer = await renderRecordPdf(title, fields);
    response.attachment('workforce-record.pdf').type('application/pdf').send(buffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
