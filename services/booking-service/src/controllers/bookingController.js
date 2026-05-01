const { pool } = require('../config/db');
const { getPagination, getPaginationMeta } = require('../utils/pagination');
const { getUserById } = require('../services/authClient');
const { getFieldById, getSlotsByDate, updateSlotStatus } = require('../services/fieldClient');

const BOOKING_STATUS = {
  PENDING_DP: 'pending_dp',
  DP_PAID: 'dp_paid',
  FULLY_PAID: 'fully_paid',
  CANCELLED: 'cancelled',
};

const PAYMENT_TYPE = {
  DOWN_PAYMENT: 'down_payment',
  FULL_PAYMENT: 'full_payment',
};

const calculateBookingAmount = (field, selectedSlots) => {
  const pricePerHour = Number(field.price_per_hour);
  const totalAmount = pricePerHour * selectedSlots.length;
  const dpAmount = Math.ceil(totalAmount * 0.3);

  return {
    pricePerHour,
    totalAmount,
    dpAmount,
  };
};

const validateSelectedSlots = async (courtId, bookingDate, slotIds) => {
  const slots = await getSlotsByDate(courtId, bookingDate);
  const selectedSlots = slots.filter((slot) => slotIds.includes(Number(slot.id)));

  if (selectedSlots.length !== slotIds.length) {
    const error = new Error('One or more selected slots are invalid for this field and date');
    error.status = 422;
    throw error;
  }

  const unavailableSlots = selectedSlots.filter((slot) => slot.status !== 'available');

  if (unavailableSlots.length > 0) {
    const error = new Error(`Some slots are not available: ${unavailableSlots.map((slot) => slot.id).join(', ')}`);
    error.status = 409;
    throw error;
  }

  return selectedSlots;
};

const createBooking = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const {
      user_id,
      court_id,
      booking_date,
      slot_ids,
      notes,
    } = req.body;

    if (!user_id || !court_id || !booking_date || !Array.isArray(slot_ids) || slot_ids.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'user_id, court_id, booking_date, and slot_ids are required',
      });
    }

    const normalizedSlotIds = slot_ids.map((slotId) => Number(slotId));

    const user = await getUserById(user_id);
    const field = await getFieldById(court_id);
    const selectedSlots = await validateSelectedSlots(court_id, booking_date, normalizedSlotIds);

    const { pricePerHour, totalAmount, dpAmount } = calculateBookingAmount(field, selectedSlots);

    await connection.beginTransaction();

    const [bookingResult] = await connection.query(
      `
      INSERT INTO bookings
        (user_id, court_id, booking_date, status, total_amount, dp_amount, paid_amount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        user_id,
        court_id,
        booking_date,
        BOOKING_STATUS.PENDING_DP,
        totalAmount,
        dpAmount,
        0,
        notes || null,
      ]
    );

    const bookingId = bookingResult.insertId;

    for (const slot of selectedSlots) {
      await connection.query(
        `
        INSERT INTO booking_slots
          (booking_id, slot_id, start_time, end_time, price)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          bookingId,
          slot.id,
          slot.start_time,
          slot.end_time,
          pricePerHour,
        ]
      );
    }

    await connection.commit();

    for (const slot of selectedSlots) {
      await updateSlotStatus(court_id, slot.id, 'booked');
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: {
          id: bookingId,
          user_id,
          user_name: user.name,
          court_id,
          field_name: field.name,
          booking_date,
          status: BOOKING_STATUS.PENDING_DP,
          total_amount: totalAmount,
          dp_amount: dpAmount,
          paid_amount: 0,
          notes: notes || null,
        },
        slots: selectedSlots,
      },
    });
  } catch (error) {
    await connection.rollback().catch(() => {});
    return next(error);
  } finally {
    connection.release();
  }
};

const listBookings = async (req, res, next) => {
  try {
    const { page, perPage, offset } = getPagination(req.query);
    const conditions = ['1 = 1'];
    const params = [];

    if (req.query.status) {
      conditions.push('status = ?');
      params.push(req.query.status);
    }

    if (req.query.user_id) {
      conditions.push('user_id = ?');
      params.push(Number(req.query.user_id));
    }

    if (req.query.court_id) {
      conditions.push('court_id = ?');
      params.push(Number(req.query.court_id));
    }

    const whereClause = conditions.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings WHERE ${whereClause}`,
      params
    );

    const total = countRows[0].total;

    const [rows] = await pool.query(
      `
      SELECT *
      FROM bookings
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, perPage, offset]
    );

    return res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: rows,
      meta: getPaginationMeta(total, page, perPage),
    });
  } catch (error) {
    return next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);

    const [bookingRows] = await pool.query(
      'SELECT * FROM bookings WHERE id = ? LIMIT 1',
      [bookingId]
    );

    if (!bookingRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const [slotRows] = await pool.query(
      `
      SELECT id, slot_id, start_time, end_time, price
      FROM booking_slots
      WHERE booking_id = ?
      ORDER BY start_time ASC
      `,
      [bookingId]
    );

    const [paymentRows] = await pool.query(
      `
      SELECT id, payment_type, amount, payment_method, status, paid_at, created_at
      FROM payments
      WHERE booking_id = ?
      ORDER BY created_at ASC
      `,
      [bookingId]
    );

    return res.status(200).json({
      success: true,
      message: 'Booking detail retrieved successfully',
      data: {
        booking: bookingRows[0],
        slots: slotRows,
        payments: paymentRows,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const bookingId = Number(req.params.id);

    const [bookingRows] = await connection.query(
      'SELECT * FROM bookings WHERE id = ? LIMIT 1',
      [bookingId]
    );

    if (!bookingRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const booking = bookingRows[0];

    if (booking.status === BOOKING_STATUS.FULLY_PAID) {
      return res.status(409).json({
        success: false,
        message: 'Fully paid booking cannot be cancelled',
      });
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return res.status(409).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    const [slotRows] = await connection.query(
      'SELECT slot_id FROM booking_slots WHERE booking_id = ?',
      [bookingId]
    );

    await connection.beginTransaction();

    await connection.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [BOOKING_STATUS.CANCELLED, bookingId]
    );

    await connection.commit();

    for (const slot of slotRows) {
      await updateSlotStatus(booking.court_id, slot.slot_id, 'available');
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    await connection.rollback().catch(() => {});
    return next(error);
  } finally {
    connection.release();
  }
};

const payDownPayment = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const bookingId = Number(req.params.id);
    const paymentMethod = req.body.payment_method || 'manual_transfer';

    const [bookingRows] = await connection.query(
      'SELECT * FROM bookings WHERE id = ? LIMIT 1',
      [bookingId]
    );

    if (!bookingRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const booking = bookingRows[0];

    if (booking.status !== BOOKING_STATUS.PENDING_DP) {
      return res.status(409).json({
        success: false,
        message: 'Down payment can only be paid for pending_dp booking',
      });
    }

    await connection.beginTransaction();

    const [paymentResult] = await connection.query(
      `
      INSERT INTO payments
        (booking_id, payment_type, amount, payment_method, status, paid_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [
        bookingId,
        PAYMENT_TYPE.DOWN_PAYMENT,
        booking.dp_amount,
        paymentMethod,
        'paid',
      ]
    );

    await connection.query(
      `
      INSERT INTO payment_logs
        (payment_id, old_status, new_status, note)
      VALUES (?, ?, ?, ?)
      `,
      [
        paymentResult.insertId,
        'pending',
        'paid',
        'Down payment completed',
      ]
    );

    await connection.query(
      `
      UPDATE bookings
      SET status = ?, paid_amount = paid_amount + ?
      WHERE id = ?
      `,
      [
        BOOKING_STATUS.DP_PAID,
        booking.dp_amount,
        bookingId,
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Down payment completed successfully',
      data: {
        booking_id: bookingId,
        payment_id: paymentResult.insertId,
        amount: Number(booking.dp_amount),
        status: BOOKING_STATUS.DP_PAID,
      },
    });
  } catch (error) {
    await connection.rollback().catch(() => {});
    return next(error);
  } finally {
    connection.release();
  }
};

const payFullPayment = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const bookingId = Number(req.params.id);
    const paymentMethod = req.body.payment_method || 'manual_transfer';

    const [bookingRows] = await connection.query(
      'SELECT * FROM bookings WHERE id = ? LIMIT 1',
      [bookingId]
    );

    if (!bookingRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const booking = bookingRows[0];

    if (booking.status !== BOOKING_STATUS.DP_PAID) {
      return res.status(409).json({
        success: false,
        message: 'Full payment can only be paid after down payment',
      });
    }

    const remainingAmount = Number(booking.total_amount) - Number(booking.paid_amount);

    await connection.beginTransaction();

    const [paymentResult] = await connection.query(
      `
      INSERT INTO payments
        (booking_id, payment_type, amount, payment_method, status, paid_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [
        bookingId,
        PAYMENT_TYPE.FULL_PAYMENT,
        remainingAmount,
        paymentMethod,
        'paid',
      ]
    );

    await connection.query(
      `
      INSERT INTO payment_logs
        (payment_id, old_status, new_status, note)
      VALUES (?, ?, ?, ?)
      `,
      [
        paymentResult.insertId,
        'pending',
        'paid',
        'Full payment completed',
      ]
    );

    await connection.query(
      `
      UPDATE bookings
      SET status = ?, paid_amount = total_amount
      WHERE id = ?
      `,
      [
        BOOKING_STATUS.FULLY_PAID,
        bookingId,
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Full payment completed successfully',
      data: {
        booking_id: bookingId,
        payment_id: paymentResult.insertId,
        amount: remainingAmount,
        status: BOOKING_STATUS.FULLY_PAID,
      },
    });
  } catch (error) {
    await connection.rollback().catch(() => {});
    return next(error);
  } finally {
    connection.release();
  }
};

const getOwnerDashboard = async (req, res, next) => {
  try {
    const courtId = req.query.court_id ? Number(req.query.court_id) : null;
    const params = [];
    const conditions = ['status != ?'];
    params.push(BOOKING_STATUS.CANCELLED);

    if (courtId) {
      conditions.push('court_id = ?');
      params.push(courtId);
    }

    const whereClause = conditions.join(' AND ');

    const [summaryRows] = await pool.query(
      `
      SELECT
        COUNT(*) AS total_bookings,
        SUM(CASE WHEN status = 'pending_dp' THEN 1 ELSE 0 END) AS pending_dp_count,
        SUM(CASE WHEN status = 'dp_paid' THEN 1 ELSE 0 END) AS dp_paid_count,
        SUM(CASE WHEN status = 'fully_paid' THEN 1 ELSE 0 END) AS fully_paid_count,
        COALESCE(SUM(total_amount), 0) AS gross_revenue,
        COALESCE(SUM(paid_amount), 0) AS collected_revenue
      FROM bookings
      WHERE ${whereClause}
      `,
      params
    );

    const [latestRows] = await pool.query(
      `
      SELECT *
      FROM bookings
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 10
      `,
      params
    );

    return res.status(200).json({
      success: true,
      message: 'Owner dashboard retrieved successfully',
      data: {
        summary: summaryRows[0],
        latest_bookings: latestRows,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBooking,
  listBookings,
  getBookingById,
  cancelBooking,
  payDownPayment,
  payFullPayment,
  getOwnerDashboard,
};