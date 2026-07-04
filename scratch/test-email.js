require('dotenv').config({ path: './backend/.env' });
const emailService = require('../backend/services/emailService');

async function testRealEmail() {
  console.log('Testing Real Email Sending via Gmail SMTP...');
  const targetEmail = process.env.SMTP_USER || 'ghosttspotify@gmail.com';
  
  try {
    const res = await emailService.sendVerificationOtp(targetEmail, '987654');
    console.log('Result:', res);
    console.log('SUCCESS! Real email sent to', targetEmail);
  } catch (err) {
    console.error('FAILED to send email:', err);
  }
}

testRealEmail();
