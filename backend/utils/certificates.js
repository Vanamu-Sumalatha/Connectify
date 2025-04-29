import crypto from 'crypto';

// Generate a unique certificate ID
export const generateCertificateId = async () => {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(4).toString('hex');
  return `CERT-${timestamp}-${random}`;
};

// Validate certificate format
export const validateCertificateId = (certificateId) => {
  const pattern = /^CERT-\d{13}-[a-f0-9]{8}$/;
  return pattern.test(certificateId);
};

// Generate certificate HTML
export const generateCertificateHTML = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Certificate of Completion</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          text-align: center;
          padding: 40px;
          background: #f9f9f9;
        }
        .certificate {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background: white;
          border: 2px solid #gold;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          font-size: 36px;
          color: #2c3e50;
          margin-bottom: 20px;
        }
        .subheader {
          font-size: 24px;
          color: #34495e;
          margin-bottom: 30px;
        }
        .content {
          font-size: 18px;
          line-height: 1.6;
          color: #2c3e50;
          margin-bottom: 30px;
        }
        .footer {
          font-size: 14px;
          color: #7f8c8d;
          margin-top: 40px;
        }
        .signature {
          margin: 20px 0;
        }
        .certificate-id {
          font-family: monospace;
          color: #7f8c8d;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">Certificate of Completion</div>
        <div class="subheader">This is to certify that</div>
        <div class="content">
          <strong>${data.studentName}</strong><br>
          has successfully completed<br>
          <strong>${data.testTitle}</strong><br>
          with a score of <strong>${data.score}%</strong>
        </div>
        <div class="signature">
          <div>Date: ${new Date(data.issueDate).toLocaleDateString()}</div>
        </div>
        <div class="footer">
          <div>Course: ${data.courseName}</div>
          <div class="certificate-id">Certificate ID: ${data.certificateId}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};
