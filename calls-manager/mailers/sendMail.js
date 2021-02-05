const nodemailer = require('nodemailer');

// Assumes we use gmail
let transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER,
  port: process.env.EMAIL_SERVER_PORT || 465,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

module.exports = (mailOptions) => {
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      return console.error('error', JSON.stringify(err));
    }
    if (info) {
      return console.info('info', JSON.stringify(err));
    }
    return null;
  });
};
