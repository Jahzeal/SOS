import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '');
  console.log(`Testing SMTP connection for: ${user}...`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    console.log(' SMTP Connection verified successfully!');

    const info = await transporter.sendMail({
      from: `VerifyFlow <${user}>`,
      to: user,
      subject: 'VerifyFlow Test - Real Email Delivery Works!',
      html: '<h1>VerifyFlow SMTP Test</h1><p>Gmail SMTP is working 100%! OTP and transaction receipts can now be sent to any email address.</p>',
    });

    console.log(' Test email delivered! Message ID:', info.messageId);
  } catch (err: any) {
    console.error(' SMTP Test failed:', err.message);
  }
}

test();
