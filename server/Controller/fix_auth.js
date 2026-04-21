import fs from 'fs';

let content = fs.readFileSync('AuthController.js', 'utf8');

// Replace usages
content = content.replace(/usersCol(?!\(\))/g, 'usersCol()');
content = content.replace(/candidatesCol(?!\(\))/g, 'candidatesCol()');
content = content.replace(/electionsCol(?!\(\))/g, 'electionsCol()');
content = content.replace(/otpCol(?!\(\))/g, 'otpCol()');

// Fix the definitions themselves (since they now have extra parens from the regex)
content = content.replace(/const usersCol = \(\) => getCol\("users"\)\(\);/g, 'const usersCol = () => getCol("users");');
content = content.replace(/const candidatesCol = \(\) => getCol\("candidates"\)\(\);/g, 'const candidatesCol = () => getCol("candidates");');
content = content.replace(/const electionsCol = \(\) => getCol\("elections"\)\(\);/g, 'const electionsCol = () => getCol("elections");');
content = content.replace(/const otpCol = \(\) => getCol\("otp_verifications"\)\(\);/g, 'const otpCol = () => getCol("otp_verifications");');

// Fix getCol definition if it got messed up
content = content.replace(/const getCol = \(name\) => db \? db.collection\(name\) : null\(\);/g, 'const getCol = (name) => db ? db.collection(name) : null;');

fs.writeFileSync('AuthController.js', content);
console.log('✅ AuthController.js updated successfully');
