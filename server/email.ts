import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingNotification(details: {
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping booking email');
    return;
  }
  try {
    await resend.emails.send({
      from: 'Fosua Papabi <onboarding@resend.dev>',
      to: ['delivered@resend.dev'], // In a real app, this would be the manager's email
      subject: `New Room Booking: Room ${details.roomNumber}`,
      html: `
        <h1>New Room Booking</h1>
        <p><strong>Guest:</strong> ${details.guestName}</p>
        <p><strong>Room:</strong> ${details.roomNumber}</p>
        <p><strong>Check-in:</strong> ${details.checkIn}</p>
        <p><strong>Check-out:</strong> ${details.checkOut}</p>
        <p><strong>Total Price:</strong> GH₵${details.totalPrice}</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send booking email:', error);
  }
}

export async function sendOrderNotification(details: {
  orderId: number;
  type: string;
  totalAmount: number;
  items: { name: string; quantity: number }[];
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping order email');
    return;
  }
  try {
    const itemsHtml = details.items
      .map((item) => `<li>${item.name} x ${item.quantity}</li>`)
      .join('');

    await resend.emails.send({
      from: 'Fosua Papabi <onboarding@resend.dev>',
      to: ['delivered@resend.dev'], // In a real app, this would be the kitchen/manager email
      subject: `New Restaurant Order #${details.orderId}`,
      html: `
        <h1>New Restaurant Order</h1>
        <p><strong>Order ID:</strong> #${details.orderId}</p>
        <p><strong>Type:</strong> ${details.type}</p>
        <p><strong>Total Amount:</strong> GH₵${details.totalAmount}</p>
        <h3>Items:</h3>
        <ul>${itemsHtml}</ul>
      `,
    });
  } catch (error) {
    console.error('Failed to send order email:', error);
  }
}
