const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { staffOrAbove } = require("../middleware/authMiddleware");
const database = require("../config/db");
const { query } = require("../services/database");
/** Reporting relationships, not a caller-provided employee ID, define the team. */
router.get(
  "/overview",
  protect,
  staffOrAbove,
  async (request, response, next) => {
    try {
      const managerId = request.user.user_id;
      const [team, taskCounts, leaveCounts] = await Promise.all([
        query(
          database,
          `SELECT employee.user_id,employee.full_name,employee.email,employee.designation,department.dept_name,companies.name company_name FROM users employee LEFT JOIN departments department ON department.dept_id=employee.department_id LEFT JOIN companies ON companies.company_id=employee.company_id WHERE employee.reporting_manager_id=? AND employee.status='active' ORDER BY employee.full_name LIMIT 500`,
          [managerId],
        ),
        query(
          database,
          `SELECT COUNT(*) total,SUM(tasks.status<>'Completed') open_tasks FROM tasks JOIN users employee ON employee.user_id=tasks.assigned_to WHERE employee.reporting_manager_id=?`,
          [managerId],
        ),
        query(
          database,
          `SELECT COUNT(*) pending FROM leave_requests JOIN users employee ON employee.user_id=leave_requests.user_id WHERE employee.reporting_manager_id=? AND leave_requests.status='pending'`,
          [managerId],
        ),
      ]);
      response.json({
        team,
        total_tasks: taskCounts[0].total,
        open_tasks: Number(taskCounts[0].open_tasks || 0),
        pending_leave: leaveCounts[0].pending,
      });
    } catch (error) {
      next(error);
    }
  },
);
module.exports = router;
