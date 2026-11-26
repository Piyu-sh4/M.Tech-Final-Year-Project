const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {parseFile} = require('../backend/services/fileParserService');

test('CSV preserves commas, embedded line breaks, escaped quotes, and leading zeros',async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'workforce-csv-'));
  const file=path.join(directory,'sample.csv');
  try {
    fs.writeFileSync(file,'name,note,code\r\n"Demo, Person","First line\nSecond ""quoted"" line",0012\r\n');
    const result=await parseFile(file,'text/csv');
    expect(result.totalRows).toBe(1);
    expect(result.rows[0]).toEqual({name:'Demo, Person',note:'First line\nSecond "quoted" line',code:'0012'});
  } finally { fs.rmSync(directory,{recursive:true}); }
});
