"""
attrition_model.py — Predictive Employee Attrition Service (FIXED)
═══════════════════════════════════════════════════════════════════
FIXES:
  - Added flask-cors so Node.js backend can call it without CORS errors
  - Added /health endpoint (lets you verify it's running at localhost:5050/health)
  - Graceful DB error: returns helpful message if MySQL is unreachable
  - Startup banner shows the URL to verify it's working

Install:  pip install flask flask-cors scikit-learn pandas mysql-connector-python python-dotenv
Run:      python attrition_model.py
Verify:   open http://localhost:5050/health in browser → should show {"status":"ok"}
"""

import os, json
from datetime import datetime, date

import numpy  as np
import pandas as pd
from flask           import Flask, jsonify, request
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# ── CORS fix: allow the Node.js backend and browser to call this ──────
try:
    from flask_cors import CORS
    CORS(app)
    print('[ATTRITION] CORS enabled')
except ImportError:
    print('[ATTRITION] flask-cors not installed — install with: pip install flask-cors')

# ── DB connection ─────────────────────────────────────────────────────
def get_conn():
    import mysql.connector
    return mysql.connector.connect(
        host     = os.getenv('DB_HOST',     'localhost'),
        user     = os.getenv('DB_USER',     'root'),
        password = os.getenv('DB_PASSWORD', ''),
        database = os.getenv('DB_NAME',     'workforce_intelligence')
    )

# ── Feature extraction ────────────────────────────────────────────────
def extract_features():
    conn   = get_conn()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            u.user_id,
            u.full_name,
            u.join_date,
            u.designation,
            d.dept_name,
            COUNT(t.task_id)                                            AS total_tasks,
            SUM(t.status = 'Completed')                                 AS completed_tasks,
            SUM(t.status = 'Overdue')                                   AS overdue_tasks,
            AVG(a.total_hours)                                          AS avg_daily_hours,
            SUM(a.ot_hours)   / NULLIF(SUM(a.total_hours), 0)          AS ot_rate,
            SUM(a.status = 'Absent') / NULLIF(COUNT(a.attendance_id), 0) AS absence_rate,
            COALESCE(SUM(lb.used) / NULLIF(SUM(lb.entitled), 0), 0)    AS leave_utilisation,
            COUNT(DISTINCT sr.revision_id)                              AS salary_revision_cnt
        FROM users u
        LEFT JOIN tasks       t  ON t.assigned_to = u.user_id
        LEFT JOIN attendance  a  ON a.user_id = u.user_id
                                 AND a.work_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        LEFT JOIN leave_balances lb ON lb.user_id = u.user_id
                                    AND lb.year = YEAR(CURDATE())
        LEFT JOIN salary_revisions sr ON sr.user_id = u.user_id
        LEFT JOIN departments     d  ON d.dept_id = u.department_id
        WHERE u.status = 'active' AND u.role_id != 1
        GROUP BY u.user_id, u.full_name, u.join_date, u.designation, d.dept_name
    """)
    rows   = cursor.fetchall()
    cursor.close()
    conn.close()

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    today = date.today()
    df['tenure_months'] = df['join_date'].apply(
        lambda d: ((today - d).days // 30) if d else 0
    )
    df['completion_rate'] = (
        df['completed_tasks'] / df['total_tasks'].replace(0, 1) * 100
    ).fillna(0).clip(0, 100)
    df['overdue_rate'] = (
        df['overdue_tasks'] / df['total_tasks'].replace(0, 1) * 100
    ).fillna(0).clip(0, 100)
    for col in ['avg_daily_hours', 'ot_rate', 'absence_rate',
                'leave_utilisation', 'salary_revision_cnt']:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    return df


FEATURE_COLS = [
    'completion_rate', 'overdue_rate', 'avg_daily_hours',
    'ot_rate', 'absence_rate', 'leave_utilisation',
    'salary_revision_cnt', 'tenure_months'
]

def rule_based_label(row):
    risk = 0
    if row['completion_rate']   < 50:  risk += 2
    if row['overdue_rate']      > 30:  risk += 2
    if row['absence_rate']      > 0.2: risk += 2
    if row['leave_utilisation'] > 0.9: risk += 1
    if row['salary_revision_cnt'] == 0 and row['tenure_months'] > 18: risk += 2
    if row['avg_daily_hours']   < 5:   risk += 1
    return 1 if risk >= 4 else 0

_model = _scaler = _trained_at = None

def get_or_train_model(df):
    global _model, _scaler, _trained_at
    if _model and _trained_at and (datetime.now() - _trained_at).total_seconds() < 86400:
        return _model, _scaler
    df = df.copy()
    df['label'] = df.apply(rule_based_label, axis=1)
    X = df[FEATURE_COLS].fillna(0).values
    y = df['label'].values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    if len(set(y)) < 2:
        X_scaled = np.vstack([X_scaled, np.zeros((1, len(FEATURE_COLS)))])
        y = np.append(y, 1 - y[0])
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.25, random_state=42, stratify=y)
    clf = RandomForestClassifier(n_estimators=100, max_depth=6,
                                  random_state=42, class_weight='balanced')
    clf.fit(X_train, y_train)
    print("[ATTRITION] Model retrained")
    _model = clf; _scaler = scaler; _trained_at = datetime.now()
    return clf, scaler

def explain_risk(row):
    factors = []
    if row['completion_rate']   < 50:  factors.append('Low task completion rate (<50%)')
    if row['overdue_rate']      > 30:  factors.append('High overdue task rate (>30%)')
    if row['absence_rate']      > 0.2: factors.append('High absenteeism (>20% absent days)')
    if row['leave_utilisation'] > 0.9: factors.append('Near-full leave exhaustion (>90%)')
    if row['salary_revision_cnt'] == 0 and row['tenure_months'] > 18:
        factors.append('No salary revision despite 18+ months tenure')
    if row['avg_daily_hours']   < 5:   factors.append('Low avg daily hours (<5h/day)')
    if row['ot_rate']           > 0.3: factors.append('Excessive overtime (>30% of hours)')
    return factors if factors else ['No significant risk factors detected']


# ═══════════════════════════════════════════════════════════════════════
# API Endpoints
# ═══════════════════════════════════════════════════════════════════════

@app.route('/health', methods=['GET'])
def health():
    """Quick check — open http://localhost:5050/health in browser to verify service is running"""
    return jsonify({'status': 'ok', 'service': 'attrition-model', 'version': '1.0.0-fixed'})

@app.route('/attrition', methods=['GET'])
def predict_attrition():
    try:
        df = extract_features()
        if df.empty:
            return jsonify({'message': 'No employee data available', 'employees': [], 'summary': {}})
        clf, scaler = get_or_train_model(df)
        X     = df[FEATURE_COLS].fillna(0).values
        X_sc  = scaler.transform(X)
        proba = clf.predict_proba(X_sc)
        at_risk_proba = proba[:, 1] if proba.shape[1] == 2 else proba[:, 0]
        results = []
        for i, row in df.iterrows():
            score = round(float(at_risk_proba[df.index.get_loc(i)]) * 100, 1)
            level = 'High' if score >= 65 else ('Medium' if score >= 35 else 'Low')
            results.append({
                'user_id':      int(row['user_id']),
                'full_name':    row['full_name'],
                'dept_name':    row.get('dept_name') or 'N/A',
                'designation':  row.get('designation') or 'N/A',
                'risk_score':   score,
                'risk_level':   level,
                'risk_factors': explain_risk(row),
                'features': {
                    'completion_rate':       round(float(row['completion_rate']), 1),
                    'overdue_rate':          round(float(row['overdue_rate']), 1),
                    'avg_daily_hours':       round(float(row['avg_daily_hours']), 1),
                    'absence_rate_pct':      round(float(row['absence_rate']) * 100, 1),
                    'leave_utilisation_pct': round(float(row['leave_utilisation']) * 100, 1),
                    'salary_revision_cnt':   int(row['salary_revision_cnt']),
                    'tenure_months':         int(row['tenure_months'])
                }
            })
        results.sort(key=lambda x: x['risk_score'], reverse=True)
        summary = {
            'high_risk':   sum(1 for r in results if r['risk_level'] == 'High'),
            'medium_risk': sum(1 for r in results if r['risk_level'] == 'Medium'),
            'low_risk':    sum(1 for r in results if r['risk_level'] == 'Low'),
        }
        return jsonify({
            'generated_at': datetime.now().isoformat(),
            'total_employees': len(results),
            'employees': results,
            'summary': summary
        })
    except Exception as e:
        return jsonify({'error': str(e), 'hint': 'Check MySQL is running and .env DB credentials are correct'}), 500

@app.route('/attrition/<int:user_id>', methods=['GET'])
def predict_single(user_id):
    try:
        df = extract_features()
        row_df = df[df['user_id'] == user_id]
        if row_df.empty:
            return jsonify({'error': 'Employee not found'}), 404
        clf, scaler = get_or_train_model(df)
        X_sc  = scaler.transform(row_df[FEATURE_COLS].fillna(0).values)
        proba = clf.predict_proba(X_sc)
        score = round(float(proba[0, 1] if proba.shape[1] == 2 else proba[0, 0]) * 100, 1)
        row   = row_df.iloc[0]
        level = 'High' if score >= 65 else ('Medium' if score >= 35 else 'Low')
        return jsonify({
            'user_id':      user_id,
            'full_name':    row['full_name'],
            'risk_score':   score,
            'risk_level':   level,
            'risk_factors': explain_risk(row),
            'features': {k: round(float(row[k]), 2) for k in FEATURE_COLS}
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('ATTRITION_PORT', 5050))
    print('')
    print('╔══════════════════════════════════════════════════════════╗')
    print('║       Attrition Model Microservice — RUNNING             ║')
    print('╚══════════════════════════════════════════════════════════╝')
    print(f'   URL     : http://localhost:{port}')
    print(f'   Health  : http://localhost:{port}/health   ← open this to verify')
    print(f'   Predict : http://localhost:{port}/attrition')
    print('')
    app.run(host='0.0.0.0', port=port, debug=False)
