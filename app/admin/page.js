"use client";
import { useState, useEffect, useRef } from "react";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-key": password },
      });
      if (!res.ok) { setError("Wrong password."); setLoading(false); return; }
      const json = await res.json();
      setData(json);
      setAuthed(true);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data?.trend?.length || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const pad = { top: 20, right: 20, bottom: 40, left: 40 };

    ctx.clearRect(0, 0, W, H);

    const trend = data.trend;
    const scores = trend.map(t => t.avgScore);
    const minScore = Math.max(0, Math.min(...scores) - 10);
    const maxScore = Math.min(100, Math.max(...scores) + 10);

    const toX = (i) => pad.left + (i / (trend.length - 1 || 1)) * (W - pad.left - pad.right);
    const toY = (s) => pad.top + (1 - (s - minScore) / (maxScore - minScore)) * (H - pad.top - pad.bottom);

    // Grid lines
    ctx.strokeStyle = "#1e1e30";
    ctx.lineWidth = 1;
    [40, 60, 80, 100].forEach(score => {
      if (score >= minScore && score <= maxScore) {
        const y = toY(score);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
        ctx.fillStyle = "#333355";
        ctx.font = "10px DM Mono, monospace";
        ctx.fillText(score, 4, y + 4);
      }
    });

    // 60 threshold line
    if (60 >= minScore && 60 <= maxScore) {
      ctx.strokeStyle = "#0070f330";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, toY(60));
      ctx.lineTo(W - pad.right, toY(60));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (trend.length < 2) {
      // Single point
      const x = toX(0);
      const y = toY(scores[0]);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#0070f3";
      ctx.fill();
    } else {
      // Gradient fill
      const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
      grad.addColorStop(0, "#0070f320");
      grad.addColorStop(1, "#0070f300");
      ctx.beginPath();
      ctx.moveTo(toX(0), H - pad.bottom);
      trend.forEach((t, i) => ctx.lineTo(toX(i), toY(t.avgScore)));
      ctx.lineTo(toX(trend.length - 1), H - pad.bottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.strokeStyle = "#0070f3";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      trend.forEach((t, i) => {
        if (i === 0) ctx.moveTo(toX(i), toY(t.avgScore));
        else ctx.lineTo(toX(i), toY(t.avgScore));
      });
      ctx.stroke();

      // Dots
      trend.forEach((t, i) => {
        const color = t.avgScore >= 60 ? "#00c896" : t.avgScore >= 40 ? "#f5a623" : "#e84040";
        ctx.beginPath();
        ctx.arc(toX(i), toY(t.avgScore), 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    }

    // X axis dates
    ctx.fillStyle = "#333355";
    ctx.font = "9px DM Mono, monospace";
    ctx.textAlign = "center";
    trend.forEach((t, i) => {
      if (trend.length <= 7 || i % Math.ceil(trend.length / 7) === 0) {
        const d = new Date(t.day);
        ctx.fillText(`${d.getMonth()+1}/${d.getDate()}`, toX(i), H - 8);
      }
    });
  }, [data]);

  const scoreColor = (s) => s >= 60 ? "#00c896" : s >= 40 ? "#f5a623" : "#e84040";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; font-family: 'DM Mono', monospace; color: #e8e8f0; min-height: 100vh; }
        .header { border-bottom: 1px solid #1e1e2e; padding: 28px 40px; display: flex; align-items: center; gap: 16px; }
        .header-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff; }
        .badge { margin-left: auto; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #0070f3; border: 1px solid #0070f320; background: #0070f308; padding: 4px 10px; border-radius: 2px; }
        .main { max-width: 900px; margin: 0 auto; padding: 48px 40px; display: flex; flex-direction: column; gap: 24px; }
        .login-box { display: flex; flex-direction: column; gap: 16px; max-width: 320px; margin: 80px auto; }
        .label { font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; color: #555580; }
        input[type=password] { background: #0f0f1a; border: 1px solid #1e1e30; color: #e8e8f0; font-family: 'DM Mono', monospace; font-size: 13px; padding: 12px 14px; border-radius: 4px; outline: none; width: 100%; }
        input[type=password]:focus { border-color: #0070f3; }
        .btn { background: #0070f3; color: #fff; border: none; padding: 12px; font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; border-radius: 4px; width: 100%; }
        .btn:hover { background: #0060d0; }
        .err { font-size: 11px; color: #e84040; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .stat { background: #0f0f1a; border: 1px solid #1e1e30; border-radius: 6px; padding: 16px; }
        .stat-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #555580; margin-bottom: 8px; }
        .stat-value { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; }
        .card { background: #0f0f1a; border: 1px solid #1e1e30; border-radius: 6px; padding: 20px; }
        .section-title { font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: #333355; margin-bottom: 16px; }
        .table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .table th { text-align: left; padding: 8px 12px; color: #333355; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; border-bottom: 1px solid #1e1e30; }
        .table td { padding: 10px 12px; border-bottom: 1px solid #0f0f1a; color: #8888aa; }
        .score-pill { padding: 2px 8px; border-radius: 2px; border: 1px solid; font-size: 11px; }
        .module-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #0f0f1a; }
        .module-row:last-child { border-bottom: none; }
        .module-name { font-size: 11px; color: #8888aa; width: 80px; flex-shrink: 0; }
        .module-bar-bg { flex: 1; height: 3px; background: #1e1e30; border-radius: 2px; overflow: hidden; }
        .module-bar-fill { height: 100%; border-radius: 2px; }
        .module-score { font-size: 11px; width: 32px; text-align: right; flex-shrink: 0; }
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

            {/* Trend Chart */}
            <div className="card">
              <div className="section-title">Score trend over time</div>
              {data.trend?.length > 0 ? (
                <canvas ref={canvasRef} width={820} height={200} style={{ width: "100%", height: "200px" }} />
              ) : (
                <div style={{ color: "#333355", fontSize: "11px", padding: "40px 0", textAlign: "center" }}>
                  No data yet — validate some tickets first
                </div>
              )}
            </div>

            {/* Module breakdown */}
            {data.moduleStats?.length > 0 && (
              <div className="card">
                <div className="section-title">Avg score by module</div>
                {data.moduleStats.map((m, i) => (
                  <div className="module-row" key={i}>
                    <div className="module-name">{m.module}</div>
                    <div className="module-bar-bg">
                      <div className="module-bar-fill" style={{
                        width: `${m.avgScore}%`,
                        background: scoreColor(m.avgScore),
                      }} />
                    </div>
                    <div className="module-score" style={{ color: scoreColor(m.avgScore) }}>{m.avgScore}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent validations */}
            <div className="card">
              <div className="section-title">Recent validations</div>
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
            </div>
          </>
        )}
      </div>
    </>
  );
}
