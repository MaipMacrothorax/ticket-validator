"use client";
import { useState, useEffect } from "react";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-key": password },
      });
      if (!res.ok) { setError("Wrong password."); return; }
      const json = await res.json();
      setData(json);
      setAuthed(true);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s) => s >= 60 ? "#00c896" : s >= 40 ? "#f5a623" : "#e84040";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; font-family: 'DM Mono', monospace; color: #e8e8f0; }
        .header { border-bottom: 1px solid #1e1e2e; padding: 28px 40px; display: flex; align-items: center; gap: 16px; }
        .header-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff; }
        .badge { margin-left: auto; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #0070f3; border: 1px solid #0070f320; background: #0070f308; padding: 4px 10px; border-radius: 2px; }
        .main { max-width: 900px; margin: 0 auto; padding: 48px 40px; }
        .login-box { display: flex; flex-direction: column; gap: 16px; max-width: 320px; margin: 80px auto; }
        .label { font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; color: #555580; }
        input { background: #0f0f1a; border: 1px solid #1e1e30; color: #e8e8f0; font-family: 'DM Mono', monospace; font-size: 13px; padding: 12px 14px; border-radius: 4px; outline: none; width: 100%; }
        input:focus { border-color: #0070f3; }
        .btn { background: #0070f3; color: #fff; border: none; padding: 12px; font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; border-radius: 4px; width: 100%; }
        .btn:hover { background: #0060d0; }
        .err { font-size: 11px; color: #e84040; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
        .stat { background: #0f0f1a; border: 1px solid #1e1e30; border-radius: 6px; padding: 16px; }
        .stat-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #555580; margin-bottom: 8px; }
        .stat-value { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; }
        .section-title { font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: #333355; margin-bottom: 12px; }
        .table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .table th { text-align: left; padding: 8px 12px; color: #333355; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; border-bottom: 1px solid #1e1e30; }
        .table td { padding: 10px 12px; border-bottom: 1px solid #0f0f1a; color: #8888aa; }
        .score-pill { padding: 2px 8px; border-radius: 2px; border: 1px solid; font-size: 11px; }
        @media (max-width: 700px) { .stats { grid-template-columns: repeat(2, 1fr); } .main { padding: 24px 20px; } }
      `}</style>

      <div className="header">
        <div className="header-title">Admin Dashboard</div>
        <div className="badge">SAP Concur</div>
      </div>

      <div className="main">
        {!authed ? (
          <div className="login-box">
            <div className="label">Admin Password</div>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && login()}
            />
            {error && <div className="err">{error}</div>}
            <button className="btn" onClick={login} disabled={loading}>
              {loading ? "Loading..." : "Enter"}
            </button>
          </div>
        ) : (
          <>
            <div className="stats">
              <div className="stat">
                <div className="stat-label">Total Tickets</div>
                <div className="stat-value" style={{ color: "#fff" }}>{data.total}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Avg Score</div>
                <div className="stat-value" style={{ color: scoreColor(data.avgScore) }}>{data.avgScore}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Ready 1st Try</div>
                <div className="stat-value" style={{ color: "#00c896" }}>{data.readyPct}%</div>
              </div>
              <div className="stat">
                <div className="stat-label">This Week</div>
                <div className="stat-value" style={{ color: "#0070f3" }}>{data.thisWeek}</div>
              </div>
            </div>

            <div className="section-title" style={{ marginBottom: 12 }}>Recent Validations</div>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Partner</th>
                  <th>Module</th>
                  <th>Environment</th>
                  <th>Urgency</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i}>
                    <td>{new Date(row.created_at).toLocaleDateString()}</td>
                    <td style={{ color: "#aaaacc" }}>{row.partner_name || "—"}</td>
                    <td>{row.module}</td>
                    <td>{row.environment}</td>
                    <td>{row.urgency}</td>
                    <td>
                      <span className="score-pill" style={{
                        color: scoreColor(row.score),
                        borderColor: scoreColor(row.score) + "40",
                        background: scoreColor(row.score) + "10",
                      }}>
                        {row.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}
