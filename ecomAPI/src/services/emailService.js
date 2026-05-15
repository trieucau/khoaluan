import 'dotenv/config';
import nodemailer from 'nodemailer';

// Gửi email qua Brevo HTTP API (port 443 — không bị block bởi cloud hosting)
const sendViaBrevoAPI = async (to, subject, html) => {
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_APP;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'SolanaShop', email: senderEmail },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(`Brevo API ${response.status}: ${errBody.message || response.statusText}`);
  }

  return response.json();
};

// Fallback: Gmail SMTP (dùng ở local khi không có BREVO_API_KEY)
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

let sendSimpleEmail = async (dataSend) => {
  const useBrevo = !!process.env.BREVO_API_KEY;

  if (dataSend.type === 'verifyEmail') {
    if (useBrevo) {
      await sendViaBrevoAPI(
        dataSend.email,
        'Xác thực email | SolanaShop',
        getBodyHTMLEmailVerify(dataSend)
      );
    } else {
      const t = createGmailTransporter();
      try {
        await t.sendMail({
          from: `"SolanaShop" <${process.env.EMAIL_APP}>`,
          to: dataSend.email,
          subject: 'Xác thực email | SolanaShop',
          html: getBodyHTMLEmailVerify(dataSend),
        });
      } finally {
        t.close();
      }
    }
  }

  if (dataSend.type === 'forgotpassword') {
    if (useBrevo) {
      await sendViaBrevoAPI(
        dataSend.email,
        'Xác nhận quên mật khẩu | SolanaShop',
        getBodyHTMLEmailForgotPassword(dataSend)
      );
    } else {
      const t = createGmailTransporter();
      try {
        await t.sendMail({
          from: `"SolanaShop" <${process.env.EMAIL_APP}>`,
          to: dataSend.email,
          subject: 'Xác nhận quên mật khẩu | SolanaShop',
          html: getBodyHTMLEmailForgotPassword(dataSend),
        });
      } finally {
        t.close();
      }
    }
  }
};

let getBodyHTMLEmailVerify = (dataSend) => {
  let fullname = `${dataSend.firstName || ''} ${dataSend.lastName || ''}`.trim() || 'Quý khách';
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Xác thực email</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#ff6b9d,#f8b195);padding:36px 40px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">SolanaShop</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Xác thực địa chỉ email</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#1a1a2e;font-size:20px;margin:0 0 16px;">Xin chào ${fullname}!</h2>
                  <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 12px;">
                    Bạn nhận được email này vì đã yêu cầu xác thực địa chỉ email trên <strong>SolanaShop</strong>.
                  </p>
                  <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">
                    Vui lòng nhấn vào nút bên dưới để xác nhận và hoàn tất thủ tục xác minh email của bạn.
                  </p>
                  <div style="text-align:center;margin:0 0 28px;">
                    <a href="${dataSend.redirectLink}" target="_blank"
                       style="display:inline-block;background:linear-gradient(135deg,#ff6b9d,#f8b195);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                      ✅ Xác thực ngay
                    </a>
                  </div>
                  <p style="color:#999;font-size:13px;line-height:1.6;margin:0;">
                    Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.<br/>
                    Đường link sẽ hết hạn sau 24 giờ.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
                  <p style="color:#aaa;font-size:12px;margin:0;">© 2025 SolanaShop. Mọi quyền được bảo lưu.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

let getBodyHTMLEmailForgotPassword = (dataSend) => {
  let fullname = `${dataSend.firstName || ''} ${dataSend.lastName || ''}`.trim() || 'Quý khách';
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Quên mật khẩu</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:36px 40px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">SolanaShop</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Đặt lại mật khẩu</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#1a1a2e;font-size:20px;margin:0 0 16px;">Xin chào ${fullname}!</h2>
                  <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 12px;">
                    Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>SolanaShop</strong> của bạn.
                  </p>
                  <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">
                    Vui lòng nhấn vào nút bên dưới để tiến hành đặt lại mật khẩu mới.
                  </p>
                  <div style="text-align:center;margin:0 0 28px;">
                    <a href="${dataSend.redirectLink}" target="_blank"
                       style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                      🔒 Đặt lại mật khẩu
                    </a>
                  </div>
                  <p style="color:#999;font-size:13px;line-height:1.6;margin:0;">
                    Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.<br/>
                    Đường link sẽ hết hạn sau 1 giờ.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
                  <p style="color:#aaa;font-size:12px;margin:0;">© 2025 SolanaShop. Mọi quyền được bảo lưu.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export default {
  sendSimpleEmail: sendSimpleEmail,
};
