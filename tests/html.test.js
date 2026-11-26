const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../frontend/html.js'),'utf8'),context);

test('HTML rendering escapes text and JSON attribute values',()=>{
  const text="O'Connor <b>café</b> & दिल्ली";
  expect(context.window.wfiText(text)).toBe('O&#39;Connor &lt;b&gt;café&lt;/b&gt; &amp; दिल्ली');
  expect(context.window.wfiText(JSON.stringify({name:'"quoted" &quot;'}))).toContain('&amp;quot;');
});
