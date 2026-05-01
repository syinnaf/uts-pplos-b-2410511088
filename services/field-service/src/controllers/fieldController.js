const { pool } = require('../config/db');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

const buildFieldFilters = (query) => {
  const conditions = ['c.is_active = TRUE', 'v.is_active = TRUE'];
  const params = [];

  if (query.sport_type) {
    conditions.push('LOWER(c.sport_type) = LOWER(?)');
    params.push(query.sport_type);
  }

  if (query.city) {
    conditions.push('LOWER(v.city) LIKE LOWER(?)');
    params.push(`%${query.city}%`);
  }

  if (query.location) {
    conditions.push('(LOWER(v.city) LIKE LOWER(?) OR LOWER(v.address) LIKE LOWER(?))');
    params.push(`%${query.location}%`, `%${query.location}%`);
  }

  if (query.min_price) {
    conditions.push('c.price_per_hour >= ?');
    params.push(Number(query.min_price));
  }

  if (query.max_price) {
    conditions.push('c.price_per_hour <= ?');
    params.push(Number(query.max_price));
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

const listFields = async (req, res, next) => {
  try {
    const { page, perPage, offset } = getPagination(req.query);
    const { whereClause, params } = buildFieldFilters(req.query);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM courts c
      JOIN venues v ON v.id = c.venue_id
      WHERE ${whereClause}
    `;

    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    const dataSql = `
      SELECT
        c.id,
        c.venue_id,
        c.name,
        c.sport_type,
        c.surface_type,
        c.price_per_hour,
        c.is_active,
        v.name AS venue_name,
        v.address AS venue_address,
        v.city AS venue_city,
        op.business_name AS owner_business_name,
        (
          SELECT cp.image_url
          FROM court_photos cp
          WHERE cp.court_id = c.id AND cp.is_primary = TRUE
          LIMIT 1
        ) AS primary_photo
      FROM courts c
      JOIN venues v ON v.id = c.venue_id
      JOIN owner_profiles op ON op.id = v.owner_profile_id
      WHERE ${whereClause}
      ORDER BY c.id ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, perPage, offset]);

    return res.status(200).json({
      success: true,
      message: 'Fields retrieved successfully',
      data: rows,
      meta: getPaginationMeta(total, page, perPage),
    });
  } catch (error) {
    return next(error);
  }
};

const getFieldById = async (req, res, next) => {
  try {
    const fieldId = Number(req.params.id);

    const [rows] = await pool.query(
      `
      SELECT
        c.id,
        c.venue_id,
        c.name,
        c.sport_type,
        c.surface_type,
        c.price_per_hour,
        c.is_active,
        v.name AS venue_name,
        v.address AS venue_address,
        v.city AS venue_city,
        v.description AS venue_description,
        op.business_name AS owner_business_name,
        op.phone AS owner_phone
      FROM courts c
      JOIN venues v ON v.id = c.venue_id
      JOIN owner_profiles op ON op.id = v.owner_profile_id
      WHERE c.id = ?
      LIMIT 1
      `,
      [fieldId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Field not found',
      });
    }

    const [photos] = await pool.query(
      `
      SELECT id, image_url, is_primary
      FROM court_photos
      WHERE court_id = ?
      ORDER BY is_primary DESC, id ASC
      `,
      [fieldId]
    );

    return res.status(200).json({
      success: true,
      message: 'Field detail retrieved successfully',
      data: {
        ...rows[0],
        photos,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const createField = async (req, res, next) => {
  try {
    const {
      venue_id,
      name,
      sport_type,
      surface_type,
      price_per_hour,
      is_active = true,
    } = req.body;

    if (!venue_id || !name || !sport_type || !price_per_hour) {
      return res.status(422).json({
        success: false,
        message: 'venue_id, name, sport_type, and price_per_hour are required',
      });
    }

    const [venueRows] = await pool.query(
      'SELECT id FROM venues WHERE id = ?',
      [venue_id]
    );

    if (!venueRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO courts (venue_id, name, sport_type, surface_type, price_per_hour, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [venue_id, name, sport_type, surface_type || null, price_per_hour, Boolean(is_active)]
    );

    return res.status(201).json({
      success: true,
      message: 'Field created successfully',
      data: {
        id: result.insertId,
        venue_id,
        name,
        sport_type,
        surface_type: surface_type || null,
        price_per_hour,
        is_active: Boolean(is_active),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateField = async (req, res, next) => {
  try {
    const fieldId = Number(req.params.id);
    const {
      venue_id,
      name,
      sport_type,
      surface_type,
      price_per_hour,
      is_active,
    } = req.body;

    const [existingRows] = await pool.query(
      'SELECT id FROM courts WHERE id = ?',
      [fieldId]
    );

    if (!existingRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Field not found',
      });
    }

    await pool.query(
      `
      UPDATE courts
      SET
        venue_id = COALESCE(?, venue_id),
        name = COALESCE(?, name),
        sport_type = COALESCE(?, sport_type),
        surface_type = COALESCE(?, surface_type),
        price_per_hour = COALESCE(?, price_per_hour),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
      `,
      [
        venue_id || null,
        name || null,
        sport_type || null,
        surface_type || null,
        price_per_hour || null,
        typeof is_active === 'boolean' ? is_active : null,
        fieldId,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Field updated successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const deleteField = async (req, res, next) => {
  try {
    const fieldId = Number(req.params.id);

    const [result] = await pool.query(
      'UPDATE courts SET is_active = FALSE WHERE id = ?',
      [fieldId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Field not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Field deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const getFieldSlots = async (req, res, next) => {
  try {
    const fieldId = Number(req.params.id);
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const [fieldRows] = await pool.query(
      'SELECT id FROM courts WHERE id = ?',
      [fieldId]
    );

    if (!fieldRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Field not found',
      });
    }

    const [rows] = await pool.query(
      `
      SELECT id, court_id, slot_date, start_time, end_time, status
      FROM court_slots
      WHERE court_id = ? AND slot_date = ?
      ORDER BY start_time ASC
      `,
      [fieldId, date]
    );

    return res.status(200).json({
      success: true,
      message: 'Field slots retrieved successfully',
      data: rows,
    });
  } catch (error) {
    return next(error);
  }
};

const updateSlotStatus = async (req, res, next) => {
  try {
    const fieldId = Number(req.params.id);
    const slotId = Number(req.params.slotId);
    const { status } = req.body;

    const allowedStatuses = ['available', 'booked', 'blocked'];

    if (!allowedStatuses.includes(status)) {
      return res.status(422).json({
        success: false,
        message: 'Invalid slot status',
        allowed_statuses: allowedStatuses,
      });
    }

    const [result] = await pool.query(
      `
      UPDATE court_slots
      SET status = ?
      WHERE id = ? AND court_id = ?
      `,
      [status, slotId, fieldId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Slot status updated successfully',
      data: {
        field_id: fieldId,
        slot_id: slotId,
        status,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const createVenue = async (req, res, next) => {
  try {
    const {
      owner_profile_id,
      name,
      address,
      city,
      description,
      is_active = true,
    } = req.body;

    if (!owner_profile_id || !name || !address || !city) {
      return res.status(422).json({
        success: false,
        message: 'owner_profile_id, name, address, and city are required',
      });
    }

    const [ownerRows] = await pool.query(
      'SELECT id FROM owner_profiles WHERE id = ?',
      [owner_profile_id]
    );

    if (!ownerRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Owner profile not found',
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO venues (owner_profile_id, name, address, city, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [owner_profile_id, name, address, city, description || null, Boolean(is_active)]
    );

    return res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: {
        id: result.insertId,
        owner_profile_id,
        name,
        address,
        city,
        description: description || null,
        is_active: Boolean(is_active),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateVenue = async (req, res, next) => {
  try {
    const venueId = Number(req.params.id);
    const { name, address, city, description, is_active } = req.body;

    const [existingRows] = await pool.query(
      'SELECT id FROM venues WHERE id = ?',
      [venueId]
    );

    if (!existingRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    await pool.query(
      `
      UPDATE venues
      SET
        name = COALESCE(?, name),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
      `,
      [
        name || null,
        address || null,
        city || null,
        description || null,
        typeof is_active === 'boolean' ? is_active : null,
        venueId,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Venue updated successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const deleteVenue = async (req, res, next) => {
  try {
    const venueId = Number(req.params.id);

    const [result] = await pool.query(
      'UPDATE venues SET is_active = FALSE WHERE id = ?',
      [venueId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Venue deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listFields,
  getFieldById,
  createField,
  updateField,
  deleteField,
  getFieldSlots,
  updateSlotStatus,
  createVenue,
  updateVenue,
  deleteVenue,
};