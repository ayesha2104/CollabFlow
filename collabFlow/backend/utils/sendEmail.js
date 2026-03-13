const nodemailer = require('nodemailer');

// Using Ethereal Email for testing purposes (can easily swap to SendGrid or real SMTP)
const sendEmail = async (options) => {
    try {
        let transporter;
        
        if (process.env.SMTP_HOST) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });
        } else {
            // Generate test ethereal account if no SMTP is provided
            let testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log(`[Email] Using Test Ethereal Account: ${testAccount.user}`);
        }

        const message = {
            from: `${process.env.FROM_NAME || 'CollabFlow'} <${process.env.FROM_EMAIL || 'noreply@collabflow.app'}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
            text: options.text || options.message
        };

        const info = await transporter.sendMail(message);
        console.log('[Email] Message sent: %s', info.messageId);
        
        if (!process.env.SMTP_HOST) {
            console.log('[Email] Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }

        return info;
    } catch (error) {
        console.error('[Email Error] Failed to send email:', error);
        // Continue execution even if email fails, so we don't break main flow
    }
};

module.exports = sendEmail;
