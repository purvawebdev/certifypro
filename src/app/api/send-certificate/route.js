import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import nodemailer from 'nodemailer';

// 1. Initialize OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// 2. Set the Refresh Token 
// (This allows the server to generate new access tokens forever)
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// 3. Initialize Drive Service
const driveService = google.drive({
  version: 'v3',
  auth: oauth2Client, 
});

// 4. Initialize Nodemailer (Gmail)
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

    // Convert Blob to Buffer/Stream for Upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = Readable.from(buffer);

    // --- UPLOAD TO DRIVE (Using OAuth) ---
    const fileMetadata = {
      name: `${name}_Certificate.pdf`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // Your clean ID (no URL junk)
    };

    const media = {
      mimeType: 'application/pdf',
      body: stream,
    };

    const driveResponse = await driveService.files.create({
      requestBody: fileMetadata, // Uses requestBody (newer standard)
      media: media,
      fields: 'id, webViewLink',
    });

    const fileId = driveResponse.data.id;
    const webViewLink = driveResponse.data.webViewLink;

    // --- PERMISSIONS ---
    // Make the file readable by anyone with the link so the student can open it
    await driveService.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // --- SEND EMAIL ---
    const mailOptions = {
      from: `"Certificate Team" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Course Certificate: ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Congratulations, ${name}!</h2>
          <p>You have successfully completed the course.</p>
          <p>You can download your certificate here:</p>
          <a href="${webViewLink}" style="display:inline-block; background: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px;">
            Download Certificate
          </a>
          <br><br>
          <p style="font-size: 12px; color: #666;">If the button fails: ${webViewLink}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, link: webViewLink });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}