const {query} = require('../database');
const {repairText} = require('../textEncoding');

module.exports = async connection => {
  const columns = await query(connection, `SELECT c.TABLE_NAME,c.COLUMN_NAME,c.COLUMN_KEY,c.DATA_TYPE,c.EXTRA
    FROM information_schema.columns c JOIN information_schema.tables t
    ON t.TABLE_SCHEMA=c.TABLE_SCHEMA AND t.TABLE_NAME=c.TABLE_NAME
    WHERE c.TABLE_SCHEMA=DATABASE() AND t.TABLE_TYPE='BASE TABLE' ORDER BY c.TABLE_NAME,c.ORDINAL_POSITION`);
  const tables = new Map();
  const skip = new Set(['chat_providers','chat_provider_selection','user_sessions','login_sessions','pwa_push_subscriptions']);
  for (const column of columns) {
    if (skip.has(column.TABLE_NAME)) continue;
    if (!tables.has(column.TABLE_NAME)) tables.set(column.TABLE_NAME,[]);
    tables.get(column.TABLE_NAME).push(column);
  }
  let repaired = 0;
  for (const [table,definitions] of tables) {
    const keys = definitions.filter(column => column.COLUMN_KEY==='PRI').map(column => column.COLUMN_NAME);
    const fields = definitions.filter(column => ['char','varchar','text','mediumtext','longtext','tinytext','json'].includes(column.DATA_TYPE) && !column.EXTRA.includes('GENERATED')).map(column => column.COLUMN_NAME);
    if (!keys.length || !fields.length) continue;
    const rows = await query(connection,'SELECT ?? FROM ??',[[...new Set([...keys,...fields])],table]);
    for (const row of rows) for (const field of fields) {
      const original = row[field];
      const fixed = repairText(original);
      if (fixed===original) continue;
      const where = keys.map(() => '??=?').join(' AND ');
      const bindings = keys.flatMap(key => [key,row[key]]);
      // Preserve a concurrent edit if it replaced the value after the scan.
      const result = await query(connection,'UPDATE ?? SET ??=? WHERE '+where+' AND ?? <=> ?',
        [table,field,fixed,...bindings,field,original]);
      repaired += result.affectedRows;
    }
  }
  console.log('[BOOT] Repaired legacy text fields:',repaired);
};
