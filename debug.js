// debug-drive.js
const { google } = require('googleapis');
const stream = require('stream');


// --- 1. PASTE YOUR CREDENTIALS DIRECTLY HERE ---


// -----------------------------------------------

async function testConnection() {
  console.log("1. Authenticating...");
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log(`2. Checking permissions for Folder ID: ${FOLDER_ID}...`);
    
    // Test A: Can we see the folder?
    try {
      const folder = await drive.files.get({
        fileId: FOLDER_ID,
        fields: 'name, owners, capabilities',
        supportsAllDrives: true
      });
      console.log(`   ✅ Success! Found folder: "${folder.data.name}"`);
      console.log(`   Owner: ${folder.data.owners?.[0]?.emailAddress}`);
      console.log(`   Can robot edit? ${folder.data.capabilities.canAddChildren ? "YES" : "NO"}`);
      
      if (!folder.data.capabilities.canAddChildren) {
        console.error("   ❌ CRITICAL ERROR: Robot can 'see' the folder but CANNOT write to it.");
        console.error("   FIX: Change permission from 'Viewer' to 'Editor'.");
        return;
      }

    } catch (err) {
      console.error("   ❌ ERROR: Cannot find folder.");
      console.error("   Reason:", err.message);
      console.error("   Possible causes: Wrong ID, or Folder not shared with Robot.");
      return;
    }

    console.log("3. Attempting to create a test file...");
    
    // Test B: Can we write a file?
    const fileMetadata = {
      name: 'Test_Connection_File.txt',
      parents: [FOLDER_ID],
    };
    const media = {
      mimeType: 'text/plain',
      body: stream.Readable.from("Hello from Node.js"),
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
      supportsAllDrives: true
    });

    console.log("   ✅ Success! File created.");
    console.log("   File ID:", res.data.id);
    console.log("   Link:", res.data.webViewLink);
    console.log("\n🎉 CONGRATS! The ID and Permissions are correct.");

  } catch (error) {
    console.error("\n❌ FINAL ERROR:", error.message);
    if (error.message.includes("storage quota")) {
      console.log("   -> This proves the robot ignored the Folder ID and tried to save to Root.");
    }
  }
}

testConnection();