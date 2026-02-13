const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.sendEventAcceptedMail = async (boutique, event) => {
  return transporter.sendMail({
    from: `"Olympia Mall" <${process.env.MAIL_USER}>`,
    // to: <${event.boutique.user.email},
    to: "ranaivofitia970@gmail.com",

    subject: "Your Event Request Has Been Approved ",
    html: `
      <h2>Hello ${boutique.nom},</h2>

      <p>We are pleased to inform you that your event request 
      <b>${event.description}</b> ahas been successfully reviewed and **approved** by the shopping center administration.
      </p>

      <p>Here are the event details for your confirmation:</p>

      <ul>
        <li> Event name : ${event.reference}</li>
        <li> Start Date: ${new Date(event.dateDebut).toLocaleDateString()}</li>
        <li> End Date : ${new Date(event.dateFin).toLocaleDateString()}</li>
        <li> Location : Olympia Mall</li>
      </ul>

      <p>
        You may now proceed with the preparation and organization of your event in accordance with the center’s guidelines.
        If you need any additional support or have questions, feel free to contact us.
      </p>

      <p>We look forward to the success of your event and thank you for contributing to the vibrancy of our shopping center.</p>
      <p>Best regards,</p>


      <p style="margin-top:20px;">
        <b>Équipe Olympia Mall</b>
      </p>
    `,
  });
};

