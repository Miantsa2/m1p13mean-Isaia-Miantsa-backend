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

    subject: "Votre événement a été accepté ",
    html: `
      <h2>Bonjour ${boutique.nom},</h2>

      <p>Nous avons le plaisir de vous informer que votre événement 
      <b>${event.description}</b> a été <b style="color:green;">accepté</b>.</p>

      <ul>
        <li> Date Début : ${new Date(event.dateDebut).toLocaleDateString()}</li>
        <li> Date Fin : ${new Date(event.dateFin).toLocaleDateString()}</li>
        <li> Lieu : Olympia Mall</li>
      </ul>

      <p>Merci pour votre collaboration.</p>

      <p style="margin-top:20px;">
        <b>Équipe Olympia Mall</b>
      </p>
    `,
  });
};
