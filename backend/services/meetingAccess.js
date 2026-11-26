const { query } = require("./database");
const database = require("../config/db");
/** Membership gates every meeting detail, message, note and report endpoint. */
module.exports = async (request, response, next) => {
  try {
    const [meeting] = await query(
      database,
      "SELECT * FROM meetings WHERE meeting_id=?",
      [request.params.id],
    );
    if (!meeting)
      return response.status(404).json({ message: "Meeting not found." });
    const host =
      meeting.host_id === request.user.user_id || request.user.role_id === 1;
    const [participant] = await query(
      database,
      "SELECT id FROM meeting_participants WHERE meeting_id=? AND user_id=? AND status<>'declined'",
      [meeting.meeting_id, request.user.user_id],
    );
    if (!host && !participant)
      return response.status(404).json({ message: 'Meeting not found.' });
    request.isMeetingHost = host;
    request.meeting = meeting;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports.hostOnly = (request, response, next) => request.isMeetingHost ? next()
  : response.status(403).json({ message: 'Only the host or administrator can manage this meeting.' });
