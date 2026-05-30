"use client";
import { useState, useEffect, useRef } from "react";

const MODULES = ["Expense", "Travel", "Invoice", "Request"];
const MAX_LENGTH = 2000;

const QUICK_CHECKS = [
  { id: "tested_sandbox", label: "Already tested in sandbox" },
  { id: "reproducible", label: "Issue reproducible consistently" },
  { id: "users_notified", label: "Users have been notified" },
  { id: "after_config_change", label: "Occurred after a configuration change" },
];

export default function Home() {
  const [partnerName, setPartnerName] = useState("");
  const [concurModule, setConcurModule] = useState("");
  const [environment, setEnvironment] = useState("");
  const [checks, setChecks] = useState({});
  const [urgency, setUrgency] = useState("");
  const [issue, setIssue] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [copied, setCopied] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result) {
      setAnimatedScore(0);
      const timer = setTimeout(() => setAnimatedScore(result.score), 50);
      return () => clearTimeout(timer);
    }
  }, [result]);

  useEffect(() => {
    if (result && resultRef.current && window.innerWidth <= 700) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const toggleCheck = (id) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const validate = () => {
    const errors = {};
    if (!partnerName.trim()) errors.partnerName = true;
    if (!concurModule) errors.concurModule = true;
    if (!environment) errors.environment = true;
    if (!urgency) errors.urgency = true;
    if (!issue.trim()) errors.issue = true;
    if (!expectedResult.trim()) errors.expectedResult = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill in all highlighted fields.");
      return;
    }

    setFieldErrors({});
    setError(null);
    setResult(null);
    setLoading(true);

    const checkedItems = QUICK_CHECKS.filter(c => checks[c.id]).map(c => c.label);

    fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerName,
        concurModule,
        environment,
        urgency,
        checks: checkedItems,
        issue,
        expectedResult,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Request failed");
        }
        return res.json();
      })
      .then((data) => setResult(data))
      .catch((err) => setError(err.message || "Validation failed. Please try again."))
      .finally(() => setLoading(false));
  };

  const handleCopy = () => {
    const checkedItems = QUICK_CHECKS.filter(c => checks[c.id]).map(c => `  ✓ ${c.label}`);
    const output = `────────────────────────────────────
SAP CONCUR SUPPORT TICKET
────────────────────────────────────
Partner: ${partnerName}
Module: ${concurModule}
Environment: ${environment}
Urgency: ${urgency}
${checkedItems.length > 0 ? `\nChecks:\n${checkedItems.join("\n")}\n` : ""}
Issue:
${issue}

Expected Result:
${expectedResult}
────────────────────────────────────`;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor = (s) => s >= 80 ? "#00c896" : s >= 50 ? "#f5a623" : "#e84040";
  const scoreLabel = (s) => s >= 60 ? "Ready to submit" : s >= 40 ? "Needs improvement" : "Incomplete";
  const isOverLimit = (val) => val.length > MAX_LENGTH;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }

        .header {
          border-bottom: 1px solid #1e1e2e;
          padding: 28px 40px;
          display: flex;
          align-items: center;
          gap: 16px;
          font-family: 'DM Mono', monospace;
        }
        .header-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #fff;
        }
        .header-sub { font-size: 11px; color: #444466; letter-spacing: 2px; text-transform: uppercase; }
        .sap-badge {
          margin-left: auto;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #0070f3;
          border: 1px solid #0070f320;
          background: #0070f308;
          padding: 4px 10px;
          border-radius: 2px;
          white-space: nowrap;
        }
        .main {
          max-width: 900px;
          margin: 0 auto;
          padding: 48px 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          font-family: 'DM Mono', monospace;
          color: #e8e8f0;
        }
        @media (max-width: 700px) {
          .main { grid-template-columns: 1fr; padding: 24px 20px; gap: 24px; }
          .header { padding: 20px; }
          .header-sub { display: none; }
        }
        .form-col { display: flex; flex-direction: column; gap: 20px; }
        .result-col { display: flex; flex-direction: column; gap: 16px; }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-header { display: flex; justify-content: space-between; align-items: baseline; }
        .label { font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; color: #555580; font-weight: 500; }
        .label.error { color: #e84040; }
        .char-count { font-size: 9px; color: #333355; }
        .char-count.over { color: #e84040; }

        .select-wrap { position: relative; }
        .select-wrap::after {
          content: '▾';
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #555580;
          pointer-events: none;
          font-size: 12px;
        }
        .select, .textarea {
          width: 100%;
          background: #0f0f1a;
          border: 1px solid #1e1e30;
          color: #e8e8f0;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          padding: 12px 14px;
          border-radius: 4px;
          outline: none;
          transition: border-color 0.15s;
          appearance: none;
          -webkit-appearance: none;
        }
        .select { padding-right: 36px; cursor: pointer; }
        .select:focus, .textarea:focus { border-color: #0070f3; }
        .select.error, .textarea.error { border-color: #e8404060; background: #e8404006; }
        .select option { background: #0f0f1a; }
        .textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
        .textarea::placeholder { color: #2a2a40; }

        /* Toggle */
        .toggle-row { display: flex; gap: 8px; }
        .toggle-btn {
          flex: 1;
          padding: 10px;
          background: #0f0f1a;
          border: 1px solid #1e1e30;
          color: #555580;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.15s;
          text-align: center;
        }
        .toggle-btn.active-Sandbox { background: #0070f310; border-color: #0070f3; color: #0070f3; }
        .toggle-btn.active-Production { background: #e8404010; border-color: #e84040; color: #e84040; }
        .toggle-btn.error { border-color: #e8404060; }

        /* Urgency */
        .urgency-row { display: flex; gap: 8px; }
        .urgency-btn {
          flex: 1;
          padding: 10px;
          background: #0f0f1a;
          border: 1px solid #1e1e30;
          color: #555580;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.15s;
          text-align: center;
        }
        .urgency-btn.active-Low { background: #00c89610; border-color: #00c896; color: #00c896; }
        .urgency-btn.active-Medium { background: #f5a62310; border-color: #f5a623; color: #f5a623; }
        .urgency-btn.active-High { background: #e8404010; border-color: #e84040; color: #e84040; }
        .urgency-btn.error { border-color: #e8404060; }

        /* Checkboxes */
        .checks-grid { display: flex; flex-direction: column; gap: 8px; }
        .check-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #0f0f1a;
          border: 1px solid #1e1e30;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
          user-select: none;
        }
        .check-item:hover { border-color: #333355; }
        .check-item.checked { background: #0070f308; border-color: #0070f330; }
        .check-box {
          width: 14px;
          height: 14px;
          border: 1px solid #333355;
          border-radius: 2px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: #0070f3;
          background: transparent;
          transition: all 0.15s;
        }
        .check-item.checked .check-box { background: #0070f320; border-color: #0070f3; }
        .check-label { font-size: 11px; color: #666688; letter-spacing: 0.5px; }
        .check-item.checked .check-label { color: #aaaacc; }

        .btn-validate {
          background: #0070f3;
          color: #fff;
          border: none;
          padding: 14px 20px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 4px;
          font-weight: 500;
          transition: background 0.15s, transform 0.1s;
          margin-top: 4px;
          width: 100%;
        }
        .btn-validate:hover:not(:disabled) { background: #0060d0; }
        .btn-validate:active:not(:disabled) { transform: scale(0.99); }
        .btn-validate:disabled { background: #111128; color: #333355; cursor: not-allowed; }

        .error-msg {
          font-size: 11px;
          color: #e84040;
          background: #e8404010;
          border: 1px solid #e8404020;
          padding: 10px 12px;
          border-radius: 4px;
        }

        .placeholder-state {
          border: 1px dashed #1e1e30;
          border-radius: 6px;
          padding: 48px 24px;
          text-align: center;
          color: #2a2a40;
          font-size: 12px;
          letter-spacing: 1px;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }
        .loading-state {
          border: 1px solid #1e1e30;
          border-radius: 6px;
          padding: 48px 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          min-height: 200px;
        }
        .spinner {
          width: 28px;
          height: 28px;
          border: 2px solid #1e1e30;
          border-top-color: #0070f3;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { font-size: 11px; letter-spacing: 2px; color: #333355; text-transform: uppercase; }

        .result-card {
          border: 1px solid #1e1e30;
          border-radius: 6px;
          overflow: hidden;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

        .score-header {
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid #1e1e30;
        }
        .score-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          flex-shrink: 0;
          border: 2px solid;
        }
        .score-info { flex: 1; min-width: 0; }
        .score-label { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
        .score-summary { font-size: 11px; color: #666688; line-height: 1.5; }

        .score-bar-wrap { padding: 14px 22px; border-bottom: 1px solid #1e1e30; background: #0a0a12; }
        .score-bar-bg { height: 3px; background: #1e1e30; border-radius: 2px; overflow: hidden; }
        .score-bar-fill { height: 100%; border-radius: 2px; transition: width 0.7s cubic-bezier(0.4,0,0.2,1); }

        .section { padding: 14px 22px; border-bottom: 1px solid #0f0f1a; }
        .section:last-child { border-bottom: none; }
        .section-title { font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: #333355; margin-bottom: 10px; font-weight: 500; }
        .issue-item, .suggestion-item {
          font-size: 12px;
          line-height: 1.6;
          padding: 5px 0;
          border-bottom: 1px solid #0f0f1a;
          display: flex;
          gap: 10px;
          color: #aaaacc;
        }
        .issue-item:last-child, .suggestion-item:last-child { border-bottom: none; }
        .issue-dot { color: #e84040; flex-shrink: 0; }
        .suggestion-dot { color: #0070f3; flex-shrink: 0; }

        .output-block { border: 1px solid #1e1e30; border-radius: 6px; overflow: hidden; animation: fadeIn 0.3s ease; }
        .output-header {
          padding: 12px 16px;
          border-bottom: 1px solid #1e1e30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #0a0a12;
        }
        .output-title { font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: #333355; }
        .btn-copy {
          background: transparent;
          border: 1px solid #1e1e30;
          color: #555580;
          padding: 6px 12px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.15s;
        }
        .btn-copy:hover { border-color: #333355; color: #8888aa; }
        .btn-copy.copied { border-color: #00c896; color: #00c896; }
        .output-text {
          padding: 16px;
          font-size: 11px;
          line-height: 1.8;
          color: #8888aa;
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 300px;
          overflow-y: auto;
        }
      `}</style>

      <div className="header">
        <div className="header-title">Ticket Validator</div>
        <div className="header-sub">Partner Pre-Submission</div>
        <div className="sap-badge">SAP Concur</div>
      </div>

      <div className="main">
        <div className="form-col">

          {/* Partner */}
          <div className="field">
            <label className={`label ${fieldErrors.partnerName ? "error" : ""}`}>Partner Company</label>
            <input
              type="text"
              className={`select ${fieldErrors.partnerName ? "error" : ""}`}
              placeholder="Your company name"
              value={partnerName}
              onChange={e => { setPartnerName(e.target.value); setFieldErrors(f => ({ ...f, partnerName: false })); }}
              style={{paddingRight: '14px'}}
            />
          </div>

                    {/* Module */}
          <div className="field">
            <label className={`label ${fieldErrors.concurModule ? "error" : ""}`}>Module</label>
            <div className="select-wrap">
              <select
                className={`select ${fieldErrors.concurModule ? "error" : ""}`}
                value={concurModule}
                onChange={e => { setConcurModule(e.target.value); setFieldErrors(f => ({ ...f, concurModule: false })); }}
              >
                <option value="">Select module...</option>
                {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Environment */}
          <div className="field">
            <label className={`label ${fieldErrors.environment ? "error" : ""}`}>Environment</label>
            <div className="toggle-row">
              {["Sandbox", "Production"].map(env => (
                <button
                  key={env}
                  className={`toggle-btn ${environment === env ? `active-${env}` : ""} ${fieldErrors.environment ? "error" : ""}`}
                  onClick={() => { setEnvironment(env); setFieldErrors(f => ({ ...f, environment: false })); }}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div className="field">
            <label className={`label ${fieldErrors.urgency ? "error" : ""}`}>Urgency</label>
            <div className="urgency-row">
              {["Low", "Medium", "High"].map(u => (
                <button
                  key={u}
                  className={`urgency-btn ${urgency === u ? `active-${u}` : ""} ${fieldErrors.urgency ? "error" : ""}`}
                  onClick={() => { setUrgency(u); setFieldErrors(f => ({ ...f, urgency: false })); }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Checks */}
          <div className="field">
            <label className="label">Quick Checks</label>
            <div className="checks-grid">
              {QUICK_CHECKS.map(c => (
                <div
                  key={c.id}
                  className={`check-item ${checks[c.id] ? "checked" : ""}`}
                  onClick={() => toggleCheck(c.id)}
                >
                  <div className="check-box">{checks[c.id] ? "✓" : ""}</div>
                  <span className="check-label">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Issue */}
          <div className="field">
            <div className="field-header">
              <label className={`label ${fieldErrors.issue ? "error" : ""}`}>Describe the Issue</label>
              {issue.length > 0 && <span className={`char-count ${isOverLimit(issue) ? "over" : ""}`}>{issue.length} / {MAX_LENGTH}</span>}
            </div>
            <textarea
              className={`textarea ${fieldErrors.issue ? "error" : ""}`}
              placeholder="What is broken? Be specific — what happens, when, for who."
              value={issue}
              rows={5}
              onChange={e => { setIssue(e.target.value); setFieldErrors(f => ({ ...f, issue: false })); }}
            />
          </div>

          {/* Expected Result */}
          <div className="field">
            <div className="field-header">
              <label className={`label ${fieldErrors.expectedResult ? "error" : ""}`}>Expected Result</label>
              {expectedResult.length > 0 && <span className={`char-count ${isOverLimit(expectedResult) ? "over" : ""}`}>{expectedResult.length} / {MAX_LENGTH}</span>}
            </div>
            <textarea
              className={`textarea ${fieldErrors.expectedResult ? "error" : ""}`}
              placeholder="What should happen instead?"
              value={expectedResult}
              rows={3}
              onChange={e => { setExpectedResult(e.target.value); setFieldErrors(f => ({ ...f, expectedResult: false })); }}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            className="btn-validate"
            onClick={validate}
            disabled={loading || isOverLimit(issue) || isOverLimit(expectedResult)}
          >
            {loading ? "Validating..." : "Validate Ticket"}
          </button>
        </div>

        {/* RESULT */}
        <div className="result-col" ref={resultRef}>
          {!result && !loading && (
            <div className="placeholder-state">Fill the form and validate</div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <div className="loading-text">Reviewing ticket</div>
            </div>
          )}

          {result && !loading && (
            <>
              <div className="result-card">
                <div className="score-header">
                  <div className="score-circle" style={{
                    color: scoreColor(result.score),
                    borderColor: scoreColor(result.score) + "40",
                    background: scoreColor(result.score) + "08",
                  }}>
                    {result.score}
                  </div>
                  <div className="score-info">
                    <div className="score-label" style={{ color: scoreColor(result.score) }}>{scoreLabel(result.score)}</div>
                    <div className="score-summary">{result.summary}</div>
                  </div>
                </div>

                <div className="score-bar-wrap">
                  <div className="score-bar-bg">
                    <div className="score-bar-fill" style={{ width: `${animatedScore}%`, background: scoreColor(result.score) }} />
                  </div>
                </div>

                {result.issues?.length > 0 && (
                  <div className="section">
                    <div className="section-title">What's missing</div>
                    {result.issues.map((issue, i) => (
                      <div className="issue-item" key={i}>
                        <span className="issue-dot">×</span>
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}

                {result.suggestions?.length > 0 && (
                  <div className="section">
                    <div className="section-title">How to improve it</div>
                    {result.suggestions.map((s, i) => (
                      <div className="suggestion-item" key={i}>
                        <span className="suggestion-dot">→</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="output-block">
                <div className="output-header">
                  <span className="output-title">Formatted ticket</span>
                  <button className={`btn-copy ${copied ? "copied" : ""}`} onClick={handleCopy}>
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <div className="output-text">{(() => {
                  const checkedItems = QUICK_CHECKS.filter(c => checks[c.id]).map(c => `  ✓ ${c.label}`);
                  return `────────────────────────────────────
SAP CONCUR SUPPORT TICKET
────────────────────────────────────
Partner: ${partnerName}
Module: ${concurModule}
Environment: ${environment}
Urgency: ${urgency}
${checkedItems.length > 0 ? `\nChecks:\n${checkedItems.join("\n")}\n` : ""}
Issue:
${issue}

Expected Result:
${expectedResult}
────────────────────────────────────`;
                })()}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
