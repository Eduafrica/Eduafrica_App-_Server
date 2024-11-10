import nodemailer from 'nodemailer'
import Mailgen from 'mailgen'
import { config } from 'dotenv'
config()

let nodeConfig = {
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_USER, // user
      pass: process.env.NODEMAILER_PW, // password
    },
}

let transporter = nodemailer.createTransport(nodeConfig);

let MailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: "EDTECH AFRIC",
        link: 'http://www.google.com'
    }
})

export const registerMail = async ({ username, userEmail, subject, instructions, outro, otp, intro, textName }) => {
    const email = {
        body: {
            name: username || 'New User',
            intro: intro,
            action: {
                instructions: instructions,
                button: {
                    color: '#00BF63',
                    text: `${textName ? textName : 'OTP'}: ${otp}`,
                }
            },
            outro: outro
        }
    };

    const emailBody = MailGenerator.generate(email);

    const message = {
        from: process.env.NODEMAILER_USER,
        to: userEmail,
        subject: subject || 'Signup Successfully',
        html: emailBody
    };

    transporter.sendMail(message)
        .then(() => {
            console.log('Email sent successfully');
        })
        .catch(error => {
            console.log('Error sending email:', error);
            throw new Error('Error sending email');
        });
};