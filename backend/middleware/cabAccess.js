const database = require('../config/db');
const { query } = require('../services/database');

const isTransportStaff = (user) => [1, 3, 4].includes(user.role_id);

function bookingAccess(readBookingId, allowStaff = false) {
  return async (request, response, next) => {
    const rawId = readBookingId(request);
    const bookingId = Number(rawId);
    if (!['number', 'string'].includes(typeof rawId) || !Number.isSafeInteger(bookingId) || bookingId < 1)
      return response.status(400).json({ message: 'A valid booking ID is required.' });
    try {
      const [booking] = await query(database,
        'SELECT user_id FROM cab_bookings WHERE booking_id=?',
        [bookingId]);
      if (!booking || (booking.user_id !== request.user.user_id && !(allowStaff && isTransportStaff(request.user))))
        return response.status(404).json({ message: 'Booking not found.' });
      next();
    } catch (error) { next(error); }
  };
}

async function issueAccess(request, response, next) {
  try {
    const [issue] = await query(database, 'SELECT user_id FROM cab_issues WHERE issue_id=?', [request.params.id]);
    if (!issue || (issue.user_id !== request.user.user_id && !isTransportStaff(request.user)))
      return response.status(404).json({ message: 'Cab issue not found.' });
    next();
  } catch (error) { next(error); }
}

const readBooking = bookingAccess(request => request.params.booking_id, true);
const passengerBooking = bookingAccess(request => request.body.booking_id);
const optionalPassengerBooking = (request, response, next) =>
  request.body.booking_id == null ? next() : passengerBooking(request, response, next);

module.exports = { isTransportStaff, readBooking, passengerBooking, optionalPassengerBooking, issueAccess };
