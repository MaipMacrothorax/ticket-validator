"use client";
import { useState, useEffect, useRef } from "react";

const MODULES = ["Expense", "Travel", "Invoice", "Request"];
const MAX_LENGTH = 2000;
const MAX_SCREENSHOTS = 5;

export default function Home() {
  const [concurModule, setConcurModule] = useState("");
  const [currentBehavior, setCurrentBehavior] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [context, setContext] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [copied, setCopied] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const resultRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (result) {
      setAnimatedScore(0);
      const timer = setTimeout(() => setAnimatedScore(result.score), 50);
      return () => clearTimeout(timer);
    }
  }, [result]);

  useEffect(() => {
    if (result && resultRef.current) {
      if (window.innerWidth <= 700) {
        resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [result]);

  const handleScreenshots = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter(f => f.type.startsWith("image/")).slice(0, MAX_SCREENSHOTS - screenshots.length);
    const newScreenshots = valid.map(f => ({
      file: f,
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    setScreenshots(prev => [...prev, ...newScreenshots].slice(0, MAX_SCREENSHOTS));
  };

  const removeScreenshot = (idx) => {
    setScreenshots(prev => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const errors = {};
    if (!concurModule) errors.concurModule = true;
    if (!currentBehavior.trim()) errors.currentBehavior = true;
    if (!expectedBehavior.trim()) errors.expectedBehavior = true;
    if (!context.trim()) errors.context = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill in all highlighted fields.");
      return;
    }

    setFieldErrors({});
    setError(null);
    setResult(null);
    setLoading(true);

    fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concurModule, currentBehavior, expectedBehavior, context }),
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
    const screenshotLine = screenshots.length > 0
      ? `\nAttached screenshots (${screenshots.length}):\n${screenshots.map((s, i) => `  ${i + 1}. ${s.name}`).join("\n")}`
      : "";

    const output = `────────────────────────────────────
SAP CONCUR SUPPORT TICKET
────────────────────────────────────
Module: ${concurModule}

Current Behavior:
${currentBehavior}

Expected Behavior:
${expectedBehavior}

Context:
${context}${screenshotLine}
────────────────────────────────────`;

    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor = (score) => {
    if (score >= 80) return "#00c896";
    if (score >= 50) return "#f5a623";
    return "#e84040";
  };

  const scoreLabel = (score) => {
    if (score >= 80) return "Ready to submit";
    if (score >= 50) return "Needs improvement";
    return "Incomplete";
  };

  const charCount = (val) => `${val.length} / ${MAX_LENGTH}`;
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
        .header-sub {
          font-size: 11px;
          color: #444466;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
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
        .label {
          font-size: 10px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #555580;
          font-weight: 500;
        }
        .label.error { color: #e84040; }
        .char-count { font-size: 9px; color: #333355; letter-spacing: 0.5px; }
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
        .textarea { resize: vertical; min-height: 88px; line-height: 1.6; }
        .textarea::placeholder { color: #2a2a40; }
        .textarea.over { border-color: #e84040; }

        /* Screenshot upload */
        .upload-zone {
          border: 1px dashed #1e1e30;
          border-radius: 4px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .upload-zone:hover { border-color: #333355; }
        .upload-btn {
          background: transparent;
          border: 1px solid #1e1e30;
          color: #555580;
          padding: 10px 14px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.15s;
          text-align: center;
        }
        .upload-btn:hover { border-color: #333355; color: #8888aa; }
        .upload-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .screenshots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
          gap: 8px;
        }
        .screenshot-thumb {
          position: relative;
          aspect-ratio: 1;
          border-radius: 3px;
          overflow: hidden;
          border: 1px solid #1e1e30;
        }
        .screenshot-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .screenshot-remove {
          position: absolute;
          top: 3px;
          right: 3px;
          width: 18px;
          height: 18px;
          background: #0a0a0f;
          border: 1px solid #1e1e30;
          border-radius: 50%;
          color: #e84040;
          font-size: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .screenshot-name {
          font-size: 9px;
          color: #333355;
          margin-top: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
        }
        .upload-hint { font-size: 10px; color: #2a2a40; letter-spacing: 0.5px; }

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
        .score-label {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .score-summary { font-size: 11px; color: #666688; line-height: 1.5; }

        .score-bar-wrap {
          padding: 14px 22px;
          border-bottom: 1px solid #1e1e30;
          background: #0a0a12;
        }
        .score-bar-bg { height: 3px; background: #1e1e30; border-radius: 2px; overflow: hidden; }
        .score-bar-fill { height: 100%; border-radius: 2px; transition: width 0.7s cubic-bezier(0.4,0,0.2,1); }

        .section { padding: 14px 22px; border-bottom: 1px solid #0f0f1a; }
        .section:last-child { border-bottom: none; }
        .section-title {
          font-size: 9px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #333355;
          margin-bottom: 10px;
          font-weight: 500;
        }
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

        /* Formatted output block */
        .output-block {
          border: 1px solid #1e1e30;
          border-radius: 6px;
          overflow: hidden;
          animation: fadeIn 0.3s ease;
        }
        .output-header {
          padding: 12px 16px;
          border-bottom: 1px solid #1e1e30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #0a0a12;
        }
        .output-title {
          font-size: 9px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #333355;
        }
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
        .output-screenshots {
          padding: 12px 16px;
          border-top: 1px solid #1e1e30;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .output-thumb {
          width: 48px;
          height: 48px;
          border-radius: 3px;
          overflow: hidden;
          border: 1px solid #1e1e30;
          flex-shrink: 0;
        }
        .output-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
      `}</style>

      <div className="header">
        <div className="header-title">Ticket Validator</div>
        <div className="header-sub">Partner Pre-Submission</div>
        <div className="sap-badge">SAP Concur</div>
      </div>

      <div className="main">
        {/* FORM */}
        <div className="form-col">
          <div className="field">
            <div className="field-header">
              <label className={`label ${fieldErrors.concurModule ? "error" : ""}`}>Module</label>
            </div>
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

          {[
            { key: "currentBehavior", val: currentBehavior, set: setCurrentBehavior, label: "Current Behavior", placeholder: "What is broken or not working as expected?" },
            { key: "expectedBehavior", val: expectedBehavior, set: setExpectedBehavior, label: "Expected Behavior", placeholder: "What should happen? What is the goal?" },
            { key: "context", val: context, set: setContext, label: "Context", placeholder: "What have you already tried? Prod or sandbox? Relevant config details?" },
          ].map(({ key, val, set, label, placeholder }) => (
            <div className="field" key={key}>
              <div className="field-header">
                <label className={`label ${fieldErrors[key] ? "error" : ""}`}>{label}</label>
                {val.length > 0 && (
                  <span className={`char-count ${isOverLimit(val) ? "over" : ""}`}>{charCount(val)}</span>
                )}
              </div>
              <textarea
                className={`textarea ${fieldErrors[key] ? "error" : ""} ${isOverLimit(val) ? "over" : ""}`}
                placeholder={placeholder}
                value={val}
                rows={4}
                onChange={e => { set(e.target.value); setFieldErrors(f => ({ ...f, [key]: false })); }}
              />
            </div>
          ))}

          {/* Screenshots */}
          <div className="field">
            <div className="field-header">
              <label className="label">Screenshots</label>
              <span className="char-count">{screenshots.length} / {MAX_SCREENSHOTS}</span>
            </div>
            <div className="upload-zone">
              {screenshots.length > 0 && (
                <div className="screenshots-grid">
                  {screenshots.map((s, i) => (
                    <div key={i}>
                      <div className="screenshot-thumb">
                        <img src={s.url} alt={s.name} />
                        <button className="screenshot-remove" onClick={() => removeScreenshot(i)}>×</button>
                      </div>
                      <div className="screenshot-name">{s.name}</div>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleScreenshots}
              />
              <button
                className="upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={screenshots.length >= MAX_SCREENSHOTS}
              >
                + Add screenshots
              </button>
              {screenshots.length === 0 && (
                <div className="upload-hint">Optional · up to 5 images</div>
              )}
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            className="btn-validate"
            onClick={validate}
            disabled={loading || isOverLimit(currentBehavior) || isOverLimit(expectedBehavior) || isOverLimit(context)}
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
                    <div className="score-label" style={{ color: scoreColor(result.score) }}>
                      {scoreLabel(result.score)}
                    </div>
                    <div className="score-summary">{result.summary}</div>
                  </div>
                </div>

                <div className="score-bar-wrap">
                  <div className="score-bar-bg">
                    <div className="score-bar-fill" style={{
                      width: `${animatedScore}%`,
                      background: scoreColor(result.score),
                    }} />
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

              {/* Formatted output block - always shown after validation */}
              <div className="output-block">
                <div className="output-header">
                  <span className="output-title">Formatted ticket</span>
                  <button className={`btn-copy ${copied ? "copied" : ""}`} onClick={handleCopy}>
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <div className="output-text">{`────────────────────────────────────
SAP CONCUR SUPPORT TICKET
────────────────────────────────────
Module: ${concurModule}

Current Behavior:
${currentBehavior}

Expected Behavior:
${expectedBehavior}

Context:
${context}${screenshots.length > 0 ? `\n\nAttached screenshots (${screenshots.length}):\n${screenshots.map((s, i) => `  ${i + 1}. ${s.name}`).join("\n")}` : ""}
────────────────────────────────────`}</div>
                {screenshots.length > 0 && (
                  <div className="output-screenshots">
                    {screenshots.map((s, i) => (
                      <div className="output-thumb" key={i}>
                        <img src={s.url} alt={s.name} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
