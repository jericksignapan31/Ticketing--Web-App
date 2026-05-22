const bcrypt = require('bcrypt');

async function test() {
  const password = 'admin123';
  const hash = '$2b$10$N3BriWpximX09H/awlnR2OEJucuxUSwojj0gc5VreU31IL7yIjG.W';
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('✅ Password "admin123" matches hash:', isValid);
  console.log('Hash to use:', hash);
}

test();
