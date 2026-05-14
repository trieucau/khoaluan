import 'dotenv/config';
import nodemailer from 'nodemailer';

let sendSimpleEmail = async (dataSend) => {
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
  if (dataSend.type === 'verifyEmail') {
    let info = await transporter.sendMail({
      from: '"SolanaShop 👻" <solanashop77@gmail.com>>',
      to: dataSend.email,
      subject: 'Xác thực email | PTITSHOP',
      html: getBodyHTMLEmailVerify(dataSend),
    });
  }
  if (dataSend.type === 'forgotpassword') {
    let info = await transporter.sendMail({
      from: '"SolanaShop 👻" <solanashop77@gmail.com>',
      to: dataSend.email,
      subject: 'Xác nhận quên mật khẩu | PTITSHOP',
      html: getBodyHTMLEmailForgotPassword(dataSend),
    });
  }
};
let getBodyHTMLEmailVerify = (dataSend) => {
  let fullname = `${dataSend.firstName} ${dataSend.lastName}`;
  let result = `<h3>Xin chào ${fullname}!</h3>
        <p>Bạn nhận được email này vì đã thực hiện lệnh xác thực email!</p>
        <p>Bui lòng click vào đường link bên dưới để xác nhận và hoàn tất thủ tục xác minh email của bạn</p>
        <div>
            <a href="${dataSend.redirectLink}" target=""_blank>Click here</a>
        </div>
        <div>Xin cảm ơn !</div>
    `;

  return result;
};
let getBodyHTMLEmailForgotPassword = (dataSend) => {
  let fullname = `${dataSend.firstName} ${dataSend.lastName}`;
  let result = `<h3>Xin chào ${fullname}!</h3>
        <p>Bạn nhận được email này vì đã thực hiện lệnh quên mật khẩu!</p>
        <p>Bui lòng click vào đường link bên dưới để xác nhận quên mật khẩu và lấy lại mật khẩu của bạn</p>
        <div>
            <a href="${dataSend.redirectLink}" target=""_blank>Click here</a>
        </div>
        <div>Xin cảm ơn !</div>
    `;

  return result;
};
export default {
  sendSimpleEmail: sendSimpleEmail,
};
