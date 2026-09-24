import nodemailer from "nodemailer";
import { generateQRCodeBuffer } from "./qr";

export interface StudentEmailPayload {
  name: string;
  rollNo: string;
  email: string;
  qrToken: string;
}

export function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn("Gmail SMTP credentials not set in environment variables.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user || "demo@cutm.ac.in",
      pass: pass || "demo-app-password",
    },
  });
}

export async function sendFresherPassEmail(student: StudentEmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    const qrBuffer = await generateQRCodeBuffer(student.qrToken);

    const eventName = process.env.EVENT_NAME || "BCA Freshers 2026";
    const eventDate = process.env.EVENT_DATE || "13 OCTOBER 2026";
    const eventVenue = process.env.EVENT_VENUE || "GYM AREA";
    const collegeName = process.env.EVENT_COLLEGE || "Centurion University Of Technology and Management";

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${eventName} - Entry Pass</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0b0f19;
          margin: 0;
          padding: 24px;
          color: #f1f5f9;
        }
        .container {
          max-width: 520px;
          margin: 0 auto;
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.025em;
        }
        .header p {
          margin: 6px 0 0 0;
          color: #e0e7ff;
          font-size: 13px;
          font-weight: 600;
        }
        .badge {
          display: inline-block;
          margin-top: 12px;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .content {
          padding: 28px 24px;
          text-align: center;
        }
        .student-info {
          background: #1f2937;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: left;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #374151;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          color: #9ca3af;
          font-size: 13px;
        }
        .info-val {
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
        }
        .qr-card {
          background: #ffffff;
          display: inline-block;
          padding: 16px;
          border-radius: 16px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          margin-bottom: 20px;
        }
        .qr-card img {
          display: block;
          width: 220px;
          height: 220px;
        }
        .instructions {
          background: #1e1b4b;
          border: 1px solid #3730a3;
          border-radius: 12px;
          padding: 16px;
          text-align: left;
          margin-top: 20px;
        }
        .instructions h3 {
          margin: 0 0 8px 0;
          color: #a5b4fc;
          font-size: 14px;
          font-weight: 700;
        }
        .instructions ul {
          margin: 0;
          padding-left: 18px;
          color: #c7d2fe;
          font-size: 13px;
          line-height: 1.6;
        }
        .footer {
          padding: 20px 24px;
          background: #0d1117;
          border-top: 1px solid #1f2937;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 ${eventName}</h1>
          <p>${collegeName}</p>
          <span class="badge">Official Entry & Food Pass</span>
        </div>
        
        <div class="content">
          <p style="font-size: 16px; margin-top: 0; color: #e2e8f0;">
            Hello <strong>${student.name}</strong>, get ready for an unforgettable day!
          </p>

          <div class="student-info">
            <div class="info-row">
              <span class="info-label">Student Name</span>
              <span class="info-val">${student.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Registration No.</span>
              <span class="info-val">${student.rollNo}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Event Date</span>
              <span class="info-val">${eventDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Venue</span>
              <span class="info-val">${eventVenue}</span>
            </div>
          </div>

          <div class="qr-card">
            <img src="cid:fresher-qr-code" alt="Fresher QR Pass" />
          </div>
          
          <p style="font-size: 12px; color: #94a3b8; margin: 0 0 16px 0;">
            Keep this QR code handy on your phone or take a screenshot.
          </p>

          <div class="instructions">
            <h3>⚡ Verification Guidelines:</h3>
            <ul>
              <li><strong>Scan 1 (Main Gate):</strong> Required for entry into the event area.</li>
              <li><strong>Scan 2 (Food Counter):</strong> Required to collect your meal coupon.</li>
              <li>This QR is uniquely generated for your registration number. Do not forward or share.</li>
              <li>Each scanner station will only accept one valid scan per student.</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          Sent by ${eventName} Organizing Committee • ${collegeName}<br />
          If you have any questions, reach out to your senior coordinators.
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"${eventName} Organizing Team" <${process.env.GMAIL_USER || "events@cutm.ac.in"}>`,
      to: student.email,
      subject: `🎟️ Your Official Pass for ${eventName} (${student.rollNo})`,
      html: htmlContent,
      attachments: [
        {
          filename: `fresher-qr-${student.rollNo}.png`,
          content: qrBuffer,
          cid: "fresher-qr-code",
        },
      ],
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to send email to ${student.email}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}
