// Recover UTF-8 text that was previously decoded using Windows-1252.
// Decode only complete, valid byte sequences so existing Unicode stays intact.
const utf8 = new TextDecoder('utf-8',{fatal:true});
const bytes = new Map(Array.from({length:256},(_,value) => [String.fromCharCode(value),value]));
const extensions = ['€',null,'‚','ƒ','„','…','†','‡','ˆ','‰','Š','‹','Œ',null,'Ž',null,
  null,'‘','’','“','”','•','–','—','˜','™','š','›','œ',null,'ž','Ÿ'];
extensions.forEach((character,index) => { if (character) bytes.set(character,0x80+index); });

function repairText(value) {
  if (typeof value !== 'string') return value;
  let text = value;
  for (let pass=0;pass<3;pass++) {
    const characters = Array.from(text);
    let output = '';
    for (let index=0;index<characters.length;index++) {
      const first = bytes.get(characters[index]);
      const length = first>=0xc2 && first<=0xdf ? 2 : first>=0xe0 && first<=0xef ? 3 : first>=0xf0 && first<=0xf4 ? 4 : 0;
      const sequence = characters.slice(index,index+length).map(character => bytes.get(character));
      if (length && sequence.length===length && sequence.slice(1).every(byte => byte>=0x80 && byte<=0xbf)) {
        try {
          output += utf8.decode(Uint8Array.from(sequence));
          index += length-1;
          continue;
        } catch { /* Preserve an invalid sequence verbatim. */ }
      }
      output += characters[index];
    }
    if (output===text) break;
    text = output;
  }
  return text;
}
module.exports = {repairText};
