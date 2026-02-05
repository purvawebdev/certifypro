import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Initialize Nodemailer (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf'); // Blob
    const email = formData.get('email');
    const name = formData.get('name');

    if (!file || !email) {
      return NextResponse.json({ error: 'Missing file or email' }, { status: 400 });
    }

    // Convert Blob to Buffer for attachment
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // --- SEND EMAIL WITH ATTACHMENT ---
    // --- SEND EMAIL ---
    const mailOptions = {
      from: `"Gryphon Academy" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Certificate of Appreciation - Gryphon Academy Training`,
      html: `
        <div style="font-family: sans-serif; padding: 0; margin: 0; max-width: 600px;">
          <p>Dear <strong>${name}</strong>,</p>
          
          <p>We are thrilled to present you with your <strong>digital certificate</strong> in recognition of your successful completion of the training program at <strong>Gryphon Academy</strong>. This certificate is a testament to your skills and expertise, which you have diligently cultivated during your time with us.</p>
          
          <p>We believe that this accomplishment will serve as a stepping stone toward a brighter and more promising future in your chosen field. The skills you've gained will not only open doors to new opportunities but also empower you to stand out in a competitive job market.</p>
          
          <p>Wishing you all the best in your future endeavors!</p>
          
          <p style="margin-top: 30px;">
            Warm regards,<br>
            <strong>Gryphon Academy Team</strong>
          </p>
          
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">Please find your certificate attached to this email.</p>
        </div>
      `,
      attachments: [
        {
          filename: `${name}_Certificate.pdf`,
          content: buffer,
          contentType: 'application/pdf',
        },
      ],
    };
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Certificate sent successfully!' });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}