const {repairText}=require('../backend/services/textEncoding');
test.each([
 ['Salary â‚¹20,000 â€” approved','Salary ₹20,000 — approved'],
 ['cafÃ© and à¤¦à¤¿à¤²à¥à¤²à¥€','café and दिल्ली'],
 ['ðŸ† Recognition','🏆 Recognition'],
 ['cafÃƒÂ©','café'],
 ['café — दिल्ली 🏆 François', 'café — दिल्ली 🏆 François'],
 ["A' and A^c remain literal ASCII","A' and A^c remain literal ASCII"]
])('repairs encoding without changing existing text %#',(input,expected)=>expect(repairText(input)).toBe(expected));
