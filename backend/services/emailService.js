const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  return transporter;
};

// Generic sender - swallow errors so email failures never break a request
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('EMAIL_USER/EMAIL_PASSWORD not set - skipping email send:', subject);
      return { skipped: true };
    }
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    return info;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { error: err.message };
  }
};

const sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: 'Welcome to Car Rental System',
    html: `
      <h2>Welcome, ${user.name}!</h2>
      <p>Thanks for registering with our Car Rental System. You can now browse and book cars anytime.</p>
    `,
  });

const sendBookingConfirmationEmail = (user, booking, car) =>
  sendEmail({
    to: user.email,
    subject: `Booking Confirmed - ${booking.bookingId}`,
    html: `
      <h2>Your booking has been confirmed</h2>
      <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
      <p><strong>Car:</strong> ${car.brand} ${car.model}</p>
      <p><strong>Pickup:</strong> ${new Date(booking.pickupDate).toDateString()}</p>
      <p><strong>Return:</strong> ${new Date(booking.returnDate).toDateString()}</p>
      <p><strong>Total:</strong> ₹${booking.totalAmount.toLocaleString('en-IN')}</p>
    `,
  });

const sendBookingCancellationEmail = (user, booking) =>
  sendEmail({
    to: user.email,
    subject: `Booking Cancelled - ${booking.bookingId}`,
    html: `
      <h2>Your booking has been cancelled</h2>
      <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
      <p>If you did not request this cancellation, please contact support.</p>
    `,
  });

const sendStatusUpdateEmail = (user, booking) =>
  sendEmail({
    to: user.email,
    subject: `Booking Status Updated - ${booking.bookingId}`,
    html: `
      <h2>Your booking status has changed</h2>
      <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
      <p><strong>New Status:</strong> ${booking.status}</p>
    `,
  });

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendStatusUpdateEmail,
};
