/**
 * cabController.js — Full Cab System v2
 * Includes: booking, driver management, tracking, SOS, distance limits, ratings
 */
const db = require('../config/db');
const { randomInt } = require('node:crypto');
const q  = (sql, vals) => new Promise((res,rej) =>
  db.query(sql, vals||[], (e,r) => e ? rej(e) : res(r))
);

/* ═══════════════════════════════════════════════
   ROUTES & VEHICLES
═══════════════════════════════════════════════ */
exports.getRoutes = async (req,res) => {
  try { res.json(await q(`SELECT * FROM cab_routes WHERE is_active=1 ORDER BY route_id`)); }
  catch(e){ res.status(500).json({message:e.message}); }
};

exports.getVehicles = async (req,res) => {
  try { res.json(await q(`SELECT * FROM cab_vehicles WHERE is_active=1 ORDER BY vehicle_type,vehicle_id`)); }
  catch(e){ res.status(500).json({message:e.message}); }
};

exports.getAvailableSlots = async (req,res) => {
  const {route_id,date,vehicle_id} = req.query;
  if(!route_id||!date) return res.status(400).json({message:'route_id and date required'});
  try {
    const [route] = await q(`SELECT * FROM cab_routes WHERE route_id=?`,[route_id]);
    if(!route) return res.status(404).json({message:'Route not found'});
    const veh = vehicle_id
      ? (await q(`SELECT * FROM cab_vehicles WHERE vehicle_id=?`,[vehicle_id]))[0]
      : null;
    const capacity = veh ? veh.capacity : route.total_seats;
    const [{cnt:taken}] = await q(
      `SELECT COUNT(*) cnt FROM cab_bookings
       WHERE route_id=? AND booking_date=? AND status IN('pending','approved')
       ${vehicle_id?'AND vehicle_id=?':''}`,
      vehicle_id?[route_id,date,vehicle_id]:[route_id,date]
    );
    const seats = await q(
      `SELECT b.seat_number FROM cab_bookings b
       WHERE b.route_id=? AND b.booking_date=? AND b.status IN('pending','approved')`,
      [route_id,date]
    );
    res.json({
      route_id:Number(route_id), date,
      total_seats:capacity, booked:taken,
      available:Math.max(0,capacity-taken),
      booked_seats:seats,
      max_distance_km: route.max_distance_km||30
    });
  } catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════════════════════════════════════
   BOOKING
═══════════════════════════════════════════════ */
exports.createBooking = async (req,res) => {
  const userId = req.user.user_id;
  const {route_id,vehicle_id,booking_date,trip_type,night_cab,special_note,distance_km} = req.body;
  if(!route_id||!vehicle_id||!booking_date)
    return res.status(400).json({message:'route_id, vehicle_id and booking_date required.'});
  try {
    const [route] = await q(`SELECT * FROM cab_routes WHERE route_id=?`,[route_id]);
    if(!route) return res.status(404).json({message:'Route not found.'});

    // Distance limit check
    if(distance_km && route.max_distance_km && Number(distance_km) > Number(route.max_distance_km))
      return res.status(400).json({
        message:`📍 Your distance (${distance_km} km) exceeds this route's limit of ${route.max_distance_km} km. Please select a different route or contact HR.`
      });

    // 2-hour advance booking rule
    const pickupDT  = new Date(`${booking_date}T${route.pickup_time}`);
    const hoursLeft = (pickupDT - new Date()) / 3_600_000;
    if(hoursLeft < 2)
      return res.status(400).json({
        message:`⏰ Cab must be booked at least 2 hours before pickup. Pickup: ${route.pickup_time} on ${booking_date} — only ${hoursLeft.toFixed(1)}h remaining. Please book earlier.`
      });

    // Seat check
    const [veh] = await q(`SELECT * FROM cab_vehicles WHERE vehicle_id=?`,[vehicle_id]);
    if(!veh) return res.status(404).json({message:'Vehicle not found.'});
    const [{cnt}] = await q(
      `SELECT COUNT(*) cnt FROM cab_bookings
       WHERE route_id=? AND booking_date=? AND vehicle_id=? AND status IN('pending','approved')`,
      [route_id,booking_date,vehicle_id]
    );
    if(cnt >= veh.capacity)
      return res.status(400).json({message:`❌ No seats available. Try another vehicle or route.`});

    // Duplicate check
    const dup = await q(
      `SELECT booking_id FROM cab_bookings
       WHERE user_id=? AND booking_date=? AND status NOT IN('cancelled','rejected')`,
      [userId,booking_date]
    );
    if(dup.length) return res.status(400).json({message:'⚠️ You already have an active booking for this date.'});

    // Shift + seat assign
    const [usr]  = await q(`SELECT shift_id FROM users WHERE user_id=?`,[userId]);
    const taken  = (await q(
      `SELECT seat_number FROM cab_bookings WHERE route_id=? AND booking_date=? AND vehicle_id=? AND status IN('pending','approved')`,
      [route_id,booking_date,vehicle_id]
    )).map(r=>r.seat_number);
    let seat=null;
    for(let i=1;i<=veh.capacity;i++){ if(!taken.includes(i)){seat=i;break;} }

    // Auto-assign driver for this route
    const drivers = await q(
      `SELECT driver_id FROM cab_drivers WHERE assigned_route=? AND status='active' LIMIT 1`,
      [route_id]
    );
    const driverId = drivers[0]?.driver_id || null;

    // Generate 6-digit OTP
    const otp = String(randomInt(100000, 1000000));

    const result = await q(
      `INSERT INTO cab_bookings
         (user_id,route_id,vehicle_id,shift_id,booking_date,trip_type,night_cab,
          seat_number,status,special_note,distance_km,driver_id,otp,journey_status)
       VALUES(?,?,?,?,?,?,?,?,'pending',?,?,?,?,'waiting')`,
      [userId,route_id,vehicle_id,usr?.shift_id||null,booking_date,
       trip_type||'both',night_cab?1:0,seat,special_note||null,
       distance_km||null,driverId,otp]
    );

    res.status(201).json({
      message:`✅ Cab booked! Awaiting approval.${night_cab?' 🌙 Night cab flagged.':''}`,
      booking_id:result.insertId,
      seat_number:seat,
      otp,
      driver_assigned:!!driverId,
      status:'pending'
    });
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.getMyBookings = async (req,res) => {
  try {
    const rows = await q(
      `SELECT b.*,
              r.route_name,r.zone,r.pickup_stop,r.pickup_time,r.drop_time,r.max_distance_km,
              r.pickup_lat,r.pickup_lng,r.drop_lat,r.drop_lng,
              v.vehicle_type,v.label AS vehicle_label,
              s.shift_name,
              a.full_name AS approved_by_name,
              d.full_name AS driver_name, d.mobile AS driver_mobile,
              d.vehicle_id AS driver_vehicle_id, d.employee_code AS driver_code,
              d.photo_url AS driver_photo
       FROM cab_bookings b
       JOIN cab_routes   r ON b.route_id=r.route_id
       JOIN cab_vehicles v ON b.vehicle_id=v.vehicle_id
       LEFT JOIN shifts  s ON b.shift_id=s.shift_id
       LEFT JOIN users   a ON b.approved_by=a.user_id
       LEFT JOIN cab_drivers d ON b.driver_id=d.driver_id
       WHERE b.user_id=?
       ORDER BY b.booking_date DESC, b.booked_at DESC LIMIT 30`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.cancelBooking = async (req,res,next) => {
  const { transaction } = require('../services/database');
  const { decisionId, fail } = require('../services/workforceDecisions');
  try {
    const id = decisionId(req.params.id);
    await transaction(async run => {
      const [row] = await run('SELECT status,journey_status FROM cab_bookings WHERE booking_id=? AND user_id=? FOR UPDATE',
        [id,req.user.user_id]);
      if (!row) fail(404, 'Booking not found.');
      if (row.status === 'cancelled') return;
      if (!['pending','approved'].includes(row.status) || row.journey_status !== 'waiting')
        fail(409, 'Only a booking that has not started can be cancelled.');
      await run("UPDATE cab_bookings SET status='cancelled' WHERE booking_id=?", [id]);
    });
    res.json({message:'Booking cancelled.'});
  } catch (error) { next(error); }
};

exports.getAllBookings = async (req,res) => {
  const {status,date} = req.query;
  try {
    let sql=`SELECT b.*,u.full_name,u.email,u.phone,
              r.route_name,r.zone,r.pickup_stop,r.pickup_time,r.drop_time,
              v.vehicle_type,v.label AS vehicle_label,s.shift_name,
              a.full_name AS approved_by_name,
              d.full_name AS driver_name,d.mobile AS driver_mobile,d.employee_code AS driver_code
       FROM cab_bookings b
       JOIN users u ON b.user_id=u.user_id
       JOIN cab_routes r ON b.route_id=r.route_id
       JOIN cab_vehicles v ON b.vehicle_id=v.vehicle_id
       LEFT JOIN shifts s ON b.shift_id=s.shift_id
       LEFT JOIN users a ON b.approved_by=a.user_id
       LEFT JOIN cab_drivers d ON b.driver_id=d.driver_id
       WHERE 1=1`;
    const vals=[];
    if(status){sql+=` AND b.status=?`;vals.push(status);}
    if(date){sql+=` AND b.booking_date=?`;vals.push(date);}
    sql+=` ORDER BY b.booking_date DESC,b.booked_at DESC LIMIT 200`;
    const bookings = await q(sql, vals);
    res.json(bookings.map(({ otp, ...booking }) => booking));
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.approveBooking = async (req,res) => {
  const approverId = req.user.user_id;
  try {
    // ── Fetch full booking with joins ─────────────────────────────
    const [row] = await q(
      `SELECT b.*,
              u.full_name AS passenger_name, u.email AS passenger_email,
              r.route_name, r.pickup_stop, r.pickup_time, r.drop_time, r.zone,
              v.label AS vehicle_label, v.vehicle_type,
              s.shift_name
       FROM cab_bookings b
       JOIN cab_routes   r ON b.route_id   = r.route_id
       JOIN cab_vehicles v ON b.vehicle_id = v.vehicle_id
       LEFT JOIN users   u ON b.user_id    = u.user_id
       LEFT JOIN shifts  s ON b.shift_id   = s.shift_id
       WHERE b.booking_id = ?`, [req.params.id]);

    if(!row) return res.status(404).json({message:'Booking not found.'});
    if(row.status !== 'pending') return res.status(400).json({message:`Booking is already ${row.status}.`});

    // ── Auto-assign driver if missing ────────────────────────────
    let driverId = row.driver_id;
    let driverRow = null;
    if(!driverId) {
      const drivers = await q(
        `SELECT driver_id FROM cab_drivers WHERE assigned_route=? AND status='active' LIMIT 1`,
        [row.route_id]);
      if(drivers[0]) {
        driverId = drivers[0].driver_id;
        await q(`UPDATE cab_bookings SET driver_id=? WHERE booking_id=?`, [driverId, req.params.id]);
      }
    }
    if(driverId) {
      const [d] = await q(`SELECT * FROM cab_drivers WHERE driver_id=?`, [driverId]);
      driverRow = d || null;
    }

    // ── Mark approved ────────────────────────────────────────────
    await q(
      `UPDATE cab_bookings SET status='approved', approved_by=?, approved_at=NOW() WHERE booking_id=?`,
      [approverId, req.params.id]);

    const vIcon = row.vehicle_type==='Bus'?'🚌':row.vehicle_type==='Car'?'🚗':'🏍️';
    const dt    = new Date(row.booking_date || Date.now());
    const dateStr = dt.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});

    try {
      const ws = require('../socketServer');

      // ── 1. Notify EMPLOYEE (passenger) ────────────────────────
      ws.createAndEmitAlert(row.user_id, 'cab_approved',
        '✅ Cab Booking Confirmed!',
        `Your cab booking for ${row.route_name} on ${dateStr} has been approved. ` +
        `${driverRow ? 'Driver: '+driverRow.full_name+' ('+driverRow.mobile+')' : 'Driver will be assigned soon.'}`,
        {
          booking_id:   req.params.id,
          route_name:   row.route_name,
          pickup_stop:  row.pickup_stop,
          pickup_time:  row.pickup_time,
          vehicle:      row.vehicle_label,
          seat:         row.seat_number,
          driver_name:  driverRow?.full_name  || null,
          driver_mobile:driverRow?.mobile     || null,
          driver_code:  driverRow?.employee_code || null,
          otp:          row.otp,
          booking_date: row.booking_date
        }
      );

      // ── 2. Notify DRIVER ──────────────────────────────────────
      if(driverRow) {
        // Find driver's user account (if they have one) — otherwise just log
        ws.emitToRole(1, 'wip:cab_driver_new_booking', {
          type:         'driver_new_booking',
          booking_id:   req.params.id,
          driver_id:    driverId,
          driver_name:  driverRow.full_name,
          driver_code:  driverRow.employee_code,
          passenger:    row.passenger_name,
          route:        row.route_name,
          pickup_stop:  row.pickup_stop,
          pickup_time:  String(row.pickup_time).slice(0,5),
          vehicle:      row.vehicle_label,
          seat:         row.seat_number,
          booking_date: row.booking_date,
          trip_type:    row.trip_type,
          night_cab:    row.night_cab,
          special_note: row.special_note,
          message:      `🚗 New cab booking assigned to you: ${row.passenger_name} on ${row.route_name}, ${dateStr} at ${String(row.pickup_time||'').slice(0,5)}. Please acknowledge.`
        });
        // Also broadcast to driver panel (any open browser)
        ws.emitToRole(3, 'wip:cab_driver_new_booking', {
          booking_id: req.params.id,
          message: `New booking assigned to driver ${driverRow.full_name} for ${row.passenger_name}`,
          driver_name: driverRow.full_name
        });
      }

    } catch(wsErr){ console.warn('[CAB APPROVE WS]', wsErr.message); }

    res.json({
      message:      '✅ Booking approved. Employee & Driver notified.',
      booking_id:   req.params.id,
      passenger:    row.passenger_name,
      driver_name:  driverRow?.full_name  || null,
      driver_mobile:driverRow?.mobile     || null,
      driver_code:  driverRow?.employee_code || null,
      route:        row.route_name,
      pickup_time:  row.pickup_time
    });
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.rejectBooking = async (req,res) => {
  const {reason}=req.body;
  try {
    const [row]=await q(`SELECT * FROM cab_bookings WHERE booking_id=?`,[req.params.id]);
    if(!row) return res.status(404).json({message:'Booking not found.'});
    await q(`UPDATE cab_bookings SET status='rejected',approved_by=?,approved_at=NOW(),reject_reason=? WHERE booking_id=?`,
      [req.user.user_id,reason||'No reason',req.params.id]);
    res.json({message:'❌ Booking rejected.'});
  } catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════════════════════════════════════
   DRIVER CRUD
═══════════════════════════════════════════════ */
exports.getDrivers = async (req,res) => {
  try {
    const rows=await q(
      `SELECT d.*,
              r.route_name,v.label AS vehicle_label,v.vehicle_type,
              COALESCE(AVG(dr.rating),5) AS avg_rating,
              COUNT(dr.rating_id) AS rating_count
       FROM cab_drivers d
       LEFT JOIN cab_routes r  ON d.assigned_route=r.route_id
       LEFT JOIN cab_vehicles v ON d.vehicle_id=v.vehicle_id
       LEFT JOIN cab_driver_ratings dr ON d.driver_id=dr.driver_id
       GROUP BY d.driver_id ORDER BY d.status,d.full_name`
    );
    res.json(rows);
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.getDriver = async (req,res) => {
  try {
    const [d]=await q(
      `SELECT d.*,r.route_name,v.label AS vehicle_label,v.vehicle_type
       FROM cab_drivers d
       LEFT JOIN cab_routes r   ON d.assigned_route=r.route_id
       LEFT JOIN cab_vehicles v ON d.vehicle_id=v.vehicle_id
       WHERE d.driver_id=?`,[req.params.id]
    );
    if(!d) return res.status(404).json({message:'Driver not found.'});
    const ratings=await q(
      `SELECT dr.*,u.full_name AS reviewer FROM cab_driver_ratings dr
       JOIN users u ON dr.user_id=u.user_id WHERE dr.driver_id=? ORDER BY dr.created_at DESC LIMIT 10`,
      [req.params.id]
    );
    const trips=await q(
      `SELECT b.booking_date,b.journey_status,r.route_name,b.trip_type
       FROM cab_bookings b JOIN cab_routes r ON b.route_id=r.route_id
       WHERE b.driver_id=? ORDER BY b.booking_date DESC LIMIT 10`,[req.params.id]
    );
    res.json({...d,recent_ratings:ratings,recent_trips:trips});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.createDriver = async (req,res) => {
  const {full_name,mobile,alt_mobile,email,address,license_number,license_expiry,
         id_card_number,id_card_type,vehicle_id,assigned_route,joining_date,
         emergency_contact_name,emergency_contact_mobile,notes} = req.body;
  if(!full_name||!mobile||!address||!license_number||!license_expiry||!id_card_number)
    return res.status(400).json({message:'Name, mobile, address, license and ID card are required.'});
  try {
    const [{max_code}]=await q(`SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code,5) AS UNSIGNED)),0) AS max_code FROM cab_drivers`);
    const code=`DRV-${String(max_code+1).padStart(3,'0')}`;
    const result=await q(
      `INSERT INTO cab_drivers
         (employee_code,full_name,mobile,alt_mobile,email,address,license_number,
          license_expiry,id_card_number,id_card_type,vehicle_id,assigned_route,
          joining_date,emergency_contact_name,emergency_contact_mobile,notes,status)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'active')`,
      [code,full_name,mobile,alt_mobile||null,email||null,address,license_number,
       license_expiry,id_card_number,id_card_type||'Aadhaar',vehicle_id||null,
       assigned_route||null,joining_date||null,emergency_contact_name||null,
       emergency_contact_mobile||null,notes||null]
    );
    res.status(201).json({message:'✅ Driver profile created.',driver_id:result.insertId,employee_code:code});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.updateDriver = async (req,res) => {
  const allowed=['full_name','mobile','alt_mobile','email','address','license_number',
    'license_expiry','id_card_number','id_card_type','vehicle_id','assigned_route',
    'joining_date','emergency_contact_name','emergency_contact_mobile','status','notes'];
  const sets=[]; const vals=[];
  allowed.forEach(k=>{ if(req.body[k]!==undefined){sets.push(`${k}=?`);vals.push(req.body[k]);} });
  if(!sets.length) return res.status(400).json({message:'Nothing to update.'});
  vals.push(req.params.id);
  try {
    const _safeCabCols=['full_name','mobile','license_number','license_expiry','rating','status','photo_url','emergency_contact'];
      const _safeS=sets.filter((_,i)=>_safeCabCols.includes(cols?.[i]));
      await q(`UPDATE cab_drivers SET ${sets.join(',')} WHERE driver_id=?`,vals);
    res.json({message:'✅ Driver updated.'});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.deleteDriver = async (req,res) => {
  try {
    await q(`UPDATE cab_drivers SET status='inactive' WHERE driver_id=?`,[req.params.id]);
    res.json({message:'Driver deactivated.'});
  } catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════════════════════════════════════
   TRACKING
═══════════════════════════════════════════════ */
exports.getTracking = async (req,res) => {
  // Last 20 pings for a booking
  try {
    const rows=await q(
      `SELECT t.*,d.full_name AS driver_name
       FROM cab_tracking t JOIN cab_drivers d ON t.driver_id=d.driver_id
       WHERE t.booking_id=? ORDER BY t.recorded_at DESC LIMIT 20`,
      [req.params.booking_id]
    );
    res.json(rows);
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.postPing = async (req,res) => {
  // Driver posts location ping (in real app: driver mobile app)
  const {booking_id,latitude,longitude,speed_kmh,heading}=req.body;
  if(!booking_id||!latitude||!longitude) return res.status(400).json({message:'booking_id, lat, lng required.'});
  try {
    const [bk]=await q(`SELECT * FROM cab_bookings WHERE booking_id=?`,[booking_id]);
    if(!bk||!bk.driver_id) return res.status(404).json({message:'Booking/driver not found.'});
    await q(
      `INSERT INTO cab_tracking(booking_id,driver_id,latitude,longitude,speed_kmh,heading) VALUES(?,?,?,?,?,?)`,
      [booking_id,bk.driver_id,latitude,longitude,speed_kmh||0,heading||0]
    );
    // Update journey status to in_transit if still waiting
    if(bk.journey_status==='waiting')
      await q(`UPDATE cab_bookings SET journey_status='in_transit',journey_start=NOW() WHERE booking_id=?`,[booking_id]);
    res.json({message:'Ping recorded.'});
  } catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════════════════════════════════════
   DRIVER ACKNOWLEDGE BOOKING RESPONSIBILITY
═══════════════════════════════════════════════ */
exports.driverAcknowledge = async (req,res) => {
  // Driver confirms they have received and accept the booking responsibility
  const bookingId = req.params.booking_id;
  try {
    const [bk] = await q(
      `SELECT b.*, u.full_name AS passenger_name, r.route_name, r.pickup_stop,
              r.pickup_time, v.label AS vehicle_label, v.vehicle_type
       FROM cab_bookings b
       JOIN cab_routes r   ON b.route_id   = r.route_id
       JOIN cab_vehicles v ON b.vehicle_id = v.vehicle_id
       LEFT JOIN users u   ON b.user_id    = u.user_id
       WHERE b.booking_id = ?`, [bookingId]);
    if(!bk) return res.status(404).json({message:'Booking not found.'});
    if(bk.status !== 'approved') return res.status(400).json({message:'Booking is not approved yet.'});
    if(bk.driver_acknowledged)  return res.status(400).json({message:'Already acknowledged.'});

    await q(
      `UPDATE cab_bookings SET driver_acknowledged=1, driver_ack_at=NOW() WHERE booking_id=?`,
      [bookingId]);

    // Notify the employee that driver has acknowledged
    try {
      const ws = require('../socketServer');
      ws.emitToUser(bk.user_id, 'wip:cab_driver_acknowledged', {
        booking_id:   bookingId,
        route_name:   bk.route_name,
        pickup_stop:  bk.pickup_stop,
        pickup_time:  bk.pickup_time,
        vehicle:      bk.vehicle_label,
        message:      '🚗 Your driver has acknowledged your cab booking and will be at the pickup point on time.'
      });
    } catch(wsErr){ /* socket optional */ }

    res.json({
      message: '✅ Booking acknowledged. Employee notified.',
      booking_id: bookingId,
      passenger: bk.passenger_name,
      route: bk.route_name,
      pickup: bk.pickup_stop,
      pickup_time: bk.pickup_time
    });
  } catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════════════════════════════════════
   COMPLETE JOURNEY — with km + broadcast to ALL
═══════════════════════════════════════════════ */
exports.completeJourney = async (req,res) => {
  const { otp, travel_km, completion_note } = req.body;
  const bookingId = req.params.booking_id;
  try {
    // Get full booking details
    const [bk] = await q(
      `SELECT b.*,
              u.full_name  AS passenger_name,
              u.email      AS passenger_email,
              r.route_name, r.zone, r.pickup_stop, r.pickup_time, r.drop_time,
              v.vehicle_type, v.label AS vehicle_label,
              d.full_name  AS driver_name,
              d.employee_code AS driver_code,
              d.mobile     AS driver_mobile
       FROM cab_bookings b
       JOIN cab_routes   r ON b.route_id   = r.route_id
       JOIN cab_vehicles v ON b.vehicle_id = v.vehicle_id
       LEFT JOIN users   u ON b.user_id    = u.user_id
       LEFT JOIN cab_drivers d ON b.driver_id = d.driver_id
       WHERE b.booking_id = ?`, [bookingId]);

    if(!bk) return res.status(404).json({message:'Booking not found.'});
    if (bk.status !== 'approved') return res.status(409).json({ message: 'Only an approved booking can complete its journey.' });
    if(bk.journey_status === 'completed') return res.status(400).json({message:'Journey already completed.'});

    // OTP validation
    if (!bk.otp || !/^\d{6}$/.test(String(otp)) || bk.otp !== String(otp))
      return res.status(400).json({message:'❌ Invalid OTP. Please verify with the passenger.'});

    // Calculate actual km driven (use provided or distance_km from booking)
    const actualKm = travel_km ? parseFloat(travel_km) : (bk.distance_km || null);

    // Mark journey complete
    await q(
      `UPDATE cab_bookings
       SET journey_status   = 'completed',
           journey_end      = NOW(),
           travel_km        = ?,
           completion_note  = ?,
           notify_sent      = 1
       WHERE booking_id = ?`,
      [actualKm, completion_note || null, bookingId]);

    // Increment driver trip count
    if(bk.driver_id) {
      await q(`UPDATE cab_drivers SET total_trips = total_trips + 1 WHERE driver_id = ?`, [bk.driver_id]);
    }

    // ── Build notification message ────────────────────────────
    const now        = new Date();
    const timeStr    = now.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', hour12:true});
    const dateStr    = now.toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
    const kmText     = actualKm ? ` · ${actualKm} km covered` : '';
    const vIcon      = bk.vehicle_type==='Bus' ? '🚌' : bk.vehicle_type==='Car' ? '🚗' : '🏍️';

    const notifMessage =
      `🏁 Travel Complete — ${bk.route_name}
` +
      `Passenger: ${bk.passenger_name} · Driver: ${bk.driver_name || 'N/A'} (${bk.driver_code || ''})
` +
      `${vIcon} ${bk.vehicle_label} · ${dateStr} at ${timeStr}${kmText}
` +
      `Pickup: ${bk.pickup_stop} → Completed safely ✅` +
      (completion_note ? `
Note: ${completion_note}` : '');

    const shortMsg =
      `🏁 Journey complete: ${bk.passenger_name} travelled via ${bk.route_name}${kmText}. ✅`;

    // ── Save notification log ─────────────────────────────────
    await q(
      `INSERT INTO cab_travel_notifications
         (booking_id, driver_id, sent_to, message, travel_km)
       VALUES (?, ?, 'all', ?, ?)`,
      [bookingId, bk.driver_id || 0, notifMessage, actualKm]);

    // ── WebSocket broadcast to ALL roles ─────────────────────
    try {
      const ws = require('../socketServer');

      // 1. Notify the passenger (employee)
      ws.emitToUser(bk.user_id, 'wip:cab_travel_complete', {
        booking_id:    bookingId,
        route_name:    bk.route_name,
        driver_name:   bk.driver_name,
        driver_code:   bk.driver_code,
        travel_km:     actualKm,
        completed_at:  now.toISOString(),
        message:       `🏁 Your journey on ${bk.route_name} is complete. Thank you for travelling safely!`,
        type:          'travel_complete'
      });

      // 2. Notify all Managers (role_id = 3)
      ws.emitToRole(3, 'wip:cab_travel_complete', {
        booking_id:    bookingId,
        passenger:     bk.passenger_name,
        route:         bk.route_name,
        driver:        bk.driver_name || 'N/A',
        driver_code:   bk.driver_code,
        travel_km:     actualKm,
        completed_at:  now.toISOString(),
        message:       shortMsg,
        type:          'travel_complete'
      });

      // 3. Notify all Admins (role_id = 1) and HR (role_id = 4)
      ws.emitToRole(1, 'wip:cab_travel_complete', {
        booking_id:    bookingId,
        passenger:     bk.passenger_name,
        route:         bk.route_name,
        driver:        bk.driver_name || 'N/A',
        driver_code:   bk.driver_code,
        travel_km:     actualKm,
        completed_at:  now.toISOString(),
        message:       shortMsg,
        type:          'travel_complete'
      });
      ws.emitToRole(4, 'wip:cab_travel_complete', {
        booking_id: bookingId,
        message:    shortMsg,
        type:       'travel_complete'
      });

    } catch(wsErr){ console.warn('[CAB WS]', wsErr.message); }

    // ── Also write to DB notifications table for all admins/managers ──
    try {
      const admins = await q(
        `SELECT user_id FROM users WHERE role_id IN (1,3,4) AND status='active'`);
      for(const admin of admins) {
        await q(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES (?, 'cab_complete', '🏁 Travel Complete', ?, ?)
           ON DUPLICATE KEY UPDATE created_at=NOW()`,
          [admin.user_id, shortMsg,
           JSON.stringify({booking_id:bookingId, travel_km:actualKm, route:bk.route_name})]
        ).catch(()=>{});
      }
      // Also notify the passenger
      await q(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES (?, 'cab_complete', '🏁 Your Journey is Complete', ?, ?)
         ON DUPLICATE KEY UPDATE created_at=NOW()`,
        [bk.user_id,
         `Your journey on ${bk.route_name} has been marked complete by the driver.${kmText}`,
         JSON.stringify({booking_id:bookingId, travel_km:actualKm})]
      ).catch(()=>{});
    } catch(dbErr){ /* notifications table may not exist — skip silently */ }

    res.json({
      message:       '✅ Journey marked complete. Admin, Manager & Employee notified.',
      booking_id:    bookingId,
      passenger:     bk.passenger_name,
      driver:        bk.driver_name,
      route:         bk.route_name,
      travel_km:     actualKm,
      completed_at:  now.toISOString(),
      notification:  notifMessage
    });
  } catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════════════════════════════════════
   SOS
═══════════════════════════════════════════════ */
exports.triggerSOS = async (req,res) => {
  const userId=req.user.user_id;
  const {booking_id,latitude,longitude,message}=req.body;
  if(!booking_id) return res.status(400).json({message:'booking_id required.'});
  try {
    await q(`UPDATE cab_bookings SET journey_status='sos' WHERE booking_id=?`,[booking_id]);
    const result=await q(
      `INSERT INTO cab_sos(booking_id,user_id,latitude,longitude,message) VALUES(?,?,?,?,?)`,
      [booking_id,userId,latitude||null,longitude||null,message||'SOS triggered']
    );
    res.status(201).json({message:'🚨 SOS sent to admin and manager. Help is on the way.',sos_id:result.insertId});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.getSOSAlerts = async (req,res) => {
  try {
    const rows=await q(
      `SELECT s.*,u.full_name,u.phone,b.booking_date,r.route_name,d.full_name AS driver_name,d.mobile AS driver_mobile
       FROM cab_sos s
       JOIN users u ON s.user_id=u.user_id
       JOIN cab_bookings b ON s.booking_id=b.booking_id
       JOIN cab_routes r ON b.route_id=r.route_id
       LEFT JOIN cab_drivers d ON b.driver_id=d.driver_id
       WHERE s.status='open' ORDER BY s.created_at DESC`
    );
    res.json(rows);
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.resolvesSOS = async (req,res) => {
  try {
    await q(`UPDATE cab_sos SET status='resolved',resolved_by=?,resolved_at=NOW() WHERE sos_id=?`,
      [req.user.user_id,req.params.sos_id]);
    res.json({message:'SOS resolved.'});
  } catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════════════════════════════════════
   RATINGS
═══════════════════════════════════════════════ */
exports.rateDriver = async (req,res) => {
  const userId=req.user.user_id;
  const {booking_id,rating,feedback}=req.body;
  if(!booking_id||!rating) return res.status(400).json({message:'booking_id and rating required.'});
  if(rating<1||rating>5) return res.status(400).json({message:'Rating must be 1–5.'});
  try {
    const [bk]=await q(`SELECT * FROM cab_bookings WHERE booking_id=? AND user_id=?`,[booking_id,userId]);
    if(!bk) return res.status(403).json({message:'Not your booking.'});
    if(!bk.driver_id) return res.status(400).json({message:'No driver assigned.'});
    if(bk.journey_status!=='completed') return res.status(400).json({message:'Journey not completed yet.'});
    await q(
      `INSERT INTO cab_driver_ratings(driver_id,booking_id,user_id,rating,feedback) VALUES(?,?,?,?,?)
       ON DUPLICATE KEY UPDATE rating=VALUES(rating),feedback=VALUES(feedback)`,
      [bk.driver_id,booking_id,userId,rating,feedback||null]
    );
    // Recalculate driver avg
    await q(
      `UPDATE cab_drivers SET rating=(SELECT AVG(rating) FROM cab_driver_ratings WHERE driver_id=?) WHERE driver_id=?`,
      [bk.driver_id,bk.driver_id]
    );
    res.json({message:'⭐ Rating submitted. Thank you!'});
  } catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════════════════════════════════════
   TRAVEL NOTIFICATION HISTORY
═══════════════════════════════════════════════ */
exports.getTravelNotifications = async (req,res) => {
  try {
    const rows = await q(
      `SELECT tn.*,
              d.full_name AS driver_name, d.employee_code AS driver_code, d.mobile AS driver_mobile,
              b.booking_date, b.trip_type, b.journey_start, b.journey_end,
              u.full_name AS passenger_name,
              r.route_name, r.zone
       FROM cab_travel_notifications tn
       JOIN cab_bookings b  ON tn.booking_id = b.booking_id
       JOIN cab_routes r    ON b.route_id    = r.route_id
       LEFT JOIN cab_drivers d ON tn.driver_id = d.driver_id
       LEFT JOIN users u    ON b.user_id     = u.user_id
       ORDER BY tn.sent_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch(e){ res.status(500).json({message:e.message}); }
};
