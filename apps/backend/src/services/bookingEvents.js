const bookingClients = new Set();
let eventId = 0;

export function subscribeBookingEvents(response) {
  bookingClients.add(response);

  response.write(`retry: 3000\n`);
  response.write(`id: ${++eventId}\n`);
  response.write(`event: connected\n`);
  response.write(`data: ${JSON.stringify({ ok: true })}\n\n`);

  return () => {
    bookingClients.delete(response);
  };
}

export function publishBookingEvent(type, booking) {
  const payload = JSON.stringify({
    type,
    booking
  });

  for (const client of bookingClients) {
    client.write(`id: ${++eventId}\n`);
    client.write(`event: booking\n`);
    client.write(`data: ${payload}\n\n`);
  }
}
