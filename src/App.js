import React, { useMemo, useState } from "react";

const protectionOptions = [
  {
    label: "EC 2:1",
    value: "ec21",
    efficiency: 2 / 3,
    description: "2 data blocks + 1 parity block",
  },
  {
    label: "EC 4:1",
    value: "ec41",
    efficiency: 4 / 5,
    description: "4 data blocks + 1 parity block",
  },
  {
    label: "RF2 / 1D:1N",
    value: "rf2",
    efficiency: 1 / 2,
    description: "2 total copies",
  },
  {
    label: "RF3 / 2D:2N",
    value: "rf3",
    efficiency: 1 / 3,
    description: "3 total copies",
  },
];

function formatNumber(v) {
  if (!Number.isFinite(v)) return "0.00";
  return v.toFixed(2);
}

function toTB(value, unit) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return unit === "GB" ? num / 1024 : num;
}

function fromTB(tb, unit) {
  if (!Number.isFinite(tb) || tb <= 0) return 0;
  return unit === "GB" ? tb * 1024 : tb;
}

function calculateResults(capacity, unit, selected) {
  const usableTB = toTB(capacity, unit);
  const eff = selected.efficiency;

  if (!usableTB) {
    return {
      usable: 0,
      quota: 0,
      overhead: 0,
      effPct: eff * 100,
      overheadPct: (1 - eff) * 100,
    };
  }

  const quotaTB = usableTB / eff;
  const overheadTB = quotaTB - usableTB;

  return {
    usable: fromTB(usableTB, unit),
    quota: fromTB(quotaTB, unit),
    overhead: fromTB(overheadTB, unit),
    effPct: eff * 100,
    overheadPct: (1 - eff) * 100,
  };
}

export default function App() {
  const [mode, setMode] = useState("single");
  const [protection, setProtection] = useState("ec41");
  const [compareProtection, setCompareProtection] = useState("rf2");
  const [capacity, setCapacity] = useState("40");
  const [unit, setUnit] = useState("GB");
  const [copyStatus, setCopyStatus] = useState("");

  const selected =
    protectionOptions.find((p) => p.value === protection) ||
    protectionOptions[0];

  const compareSelected =
    protectionOptions.find((p) => p.value === compareProtection) ||
    protectionOptions[1];

  const results = useMemo(() => {
    return calculateResults(capacity, unit, selected);
  }, [capacity, unit, selected]);

  const compareResults = useMemo(() => {
    return calculateResults(capacity, unit, compareSelected);
  }, [capacity, unit, compareSelected]);

  const singleEmailText = `Subject: Storage Domain Quota Sizing

Here is the storage domain sizing output for the requested configuration:

Protection Type: ${selected.label}
Desired Usable Capacity: ${formatNumber(results.usable)} ${unit}
Efficiency: ${formatNumber(results.effPct)}%
Protection Overhead: ${formatNumber(results.overheadPct)}%
Required Storage Domain Quota: ${formatNumber(results.quota)} ${unit}
Overhead Capacity: ${formatNumber(results.overhead)} ${unit}

Summary:
To allow ${formatNumber(results.usable)} ${unit} using ${
    selected.label
  }, the required storage domain quota is ${formatNumber(
    results.quota
  )} ${unit}. This includes ${formatNumber(
    results.overhead
  )} ${unit} of protection overhead.`;

  const compareEmailText = `Subject: Storage Domain Quota Comparison

Here is the storage domain sizing comparison for the requested configuration:

Desired Usable Capacity: ${formatNumber(Number(capacity) || 0)} ${unit}

Option 1:
Protection Type: ${selected.label}
Efficiency: ${formatNumber(results.effPct)}%
Protection Overhead: ${formatNumber(results.overheadPct)}%
Required Storage Domain Quota: ${formatNumber(results.quota)} ${unit}
Overhead Capacity: ${formatNumber(results.overhead)} ${unit}

Option 2:
Protection Type: ${compareSelected.label}
Efficiency: ${formatNumber(compareResults.effPct)}%
Protection Overhead: ${formatNumber(compareResults.overheadPct)}%
Required Storage Domain Quota: ${formatNumber(compareResults.quota)} ${unit}
Overhead Capacity: ${formatNumber(compareResults.overhead)} ${unit}

Summary:
For ${formatNumber(Number(capacity) || 0)} ${unit} of usable capacity, ${
    selected.label
  } requires ${formatNumber(results.quota)} ${unit}, while ${
    compareSelected.label
  } requires ${formatNumber(compareResults.quota)} ${unit}.`;

  async function handleCopyEmail() {
    try {
      const textToCopy = mode === "single" ? singleEmailText : compareEmailText;
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus("Email summary copied.");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus("Copy failed.");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }

  const styles = {
    page: {
      background: "#0d1117",
      minHeight: "100vh",
      padding: "30px 16px",
      fontFamily: "Arial, sans-serif",
      color: "#e6edf3",
    },
    container: {
      maxWidth: 1080,
      margin: "0 auto",
    },
    header: {
      background: "#161b22",
      border: "1px solid #30363d",
      borderRadius: 18,
      padding: 24,
      marginBottom: 20,
      boxShadow: "0 10px 28px rgba(0,0,0,0.24)",
    },
    badge: {
      display: "inline-block",
      background: "rgba(103,179,70,0.16)",
      color: "#7fd35b",
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 12,
      letterSpacing: "0.03em",
    },
    title: {
      fontSize: "1.7rem",
      fontWeight: 700,
      margin: "0 0 10px 0",
      color: "#f8fafc",
    },
    subtitle: {
      color: "#9da7b3",
      lineHeight: 1.7,
      margin: 0,
      maxWidth: 820,
    },
    modeRow: {
      display: "flex",
      gap: 10,
      marginTop: 18,
      flexWrap: "wrap",
    },
    modeButton: (active) => ({
      padding: "10px 14px",
      borderRadius: 12,
      border: active ? "1px solid #67b346" : "1px solid #30363d",
      background: active ? "rgba(103,179,70,0.14)" : "#0d1117",
      color: active ? "#7fd35b" : "#dbe3ea",
      fontWeight: 700,
      cursor: "pointer",
    }),
    grid: {
      display: "grid",
      gridTemplateColumns:
        mode === "compare"
          ? "minmax(320px, 360px) 1fr"
          : "repeat(auto-fit, minmax(340px, 1fr))",
      gap: 20,
      marginBottom: 20,
    },
    card: {
      background: "#161b22",
      border: "1px solid #30363d",
      borderRadius: 18,
      padding: 20,
      boxShadow: "0 10px 28px rgba(0,0,0,0.2)",
    },
    sectionTitle: {
      fontSize: "1.2rem",
      fontWeight: 700,
      margin: "0 0 18px 0",
      color: "#ffffff",
    },
    fieldGroup: {
      marginBottom: 18,
    },
    label: {
      display: "block",
      fontSize: 14,
      fontWeight: 700,
      color: "#dbe3ea",
      marginBottom: 8,
    },
    helper: {
      marginTop: 8,
      fontSize: 13,
      color: "#8b98a7",
      lineHeight: 1.5,
    },
    input: {
      width: "100%",
      padding: "13px 14px",
      borderRadius: 12,
      border: "1px solid #30363d",
      background: "#0d1117",
      color: "#e6edf3",
      fontSize: 15,
      boxSizing: "border-box",
      outline: "none",
    },
    select: {
      width: "100%",
      padding: "13px 14px",
      borderRadius: 12,
      border: "1px solid #30363d",
      background: "#0d1117",
      color: "#e6edf3",
      fontSize: 15,
      boxSizing: "border-box",
      outline: "none",
    },
    capacityRow: {
      display: "grid",
      gridTemplateColumns: "1fr 120px",
      gap: 10,
    },
    compareGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 16,
    },
    highlight: {
      borderLeft: "4px solid #67b346",
      background: "#0f141b",
      padding: 14,
      marginBottom: 14,
      borderRadius: 10,
    },
    highlightLabel: {
      fontSize: 12,
      fontWeight: 700,
      color: "#7fd35b",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: 6,
    },
    highlightValue: {
      fontSize: "1.3rem",
      fontWeight: 700,
      color: "#ffffff",
    },
    resultsList: {
      display: "grid",
      gap: 10,
    },
    resultRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      background: "#0d1117",
      border: "1px solid #2a3440",
      borderRadius: 12,
      padding: "12px 14px",
    },
    resultLabel: {
      color: "#b8c2cc",
      fontWeight: 600,
    },
    resultValue: {
      color: "#ffffff",
      fontWeight: 700,
      textAlign: "right",
    },
    compareCardTitle: {
      fontSize: "1rem",
      fontWeight: 700,
      color: "#ffffff",
      margin: "0 0 12px 0",
    },
    summaryCard: {
      background: "#161b22",
      border: "1px solid #30363d",
      borderRadius: 18,
      padding: 20,
      boxShadow: "0 10px 28px rgba(0,0,0,0.2)",
      marginBottom: 20,
    },
    summaryText: {
      color: "#c8d1da",
      lineHeight: 1.7,
      margin: "0 0 16px 0",
    },
    buttonRow: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "center",
    },
    button: {
      padding: "11px 16px",
      borderRadius: 12,
      border: "none",
      background: "#67b346",
      color: "#ffffff",
      fontWeight: 700,
      cursor: "pointer",
    },
    status: {
      color: "#9da7b3",
      fontSize: 14,
      fontWeight: 600,
    },
    noteCard: {
      background: "#161b22",
      border: "1px solid #30363d",
      borderRadius: 18,
      padding: 20,
      color: "#9da7b3",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.badge}>Cohesity DRAAS Sizing Tool</div>
          <h1 style={styles.title}>Storage Domain Quota Calculator</h1>
          <p style={styles.subtitle}>
            This calculator is designed for Cohesity DRAAS environments where
            data is replicated from an on-premises cluster into a customer
            storage domain on an internal cluster. Enter the desired usable
            capacity and select the protection type to determine the required
            storage domain quota.
          </p>

          <div style={styles.modeRow}>
            <button
              style={styles.modeButton(mode === "single")}
              onClick={() => setMode("single")}
            >
              Single Mode
            </button>
            <button
              style={styles.modeButton(mode === "compare")}
              onClick={() => setMode("compare")}
            >
              Compare Mode
            </button>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Inputs</h2>

            <div style={styles.fieldGroup}>
              <label htmlFor="protection" style={styles.label}>
                Protection Type
              </label>
              <select
                id="protection"
                style={styles.select}
                value={protection}
                onChange={(e) => setProtection(e.target.value)}
              >
                {protectionOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <div style={styles.helper}>
                {selected.description} · Efficiency{" "}
                {formatNumber(results.effPct)}% · Overhead{" "}
                {formatNumber(results.overheadPct)}%
              </div>
            </div>

            {mode === "compare" ? (
              <div style={styles.fieldGroup}>
                <label htmlFor="compareProtection" style={styles.label}>
                  Compare Against
                </label>
                <select
                  id="compareProtection"
                  style={styles.select}
                  value={compareProtection}
                  onChange={(e) => setCompareProtection(e.target.value)}
                >
                  {protectionOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <div style={styles.helper}>{compareSelected.description}</div>
              </div>
            ) : null}

            <div style={styles.fieldGroup}>
              <label htmlFor="capacity" style={styles.label}>
                Desired Usable Capacity
              </label>
              <div style={styles.capacityRow}>
                <input
                  id="capacity"
                  style={styles.input}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter capacity"
                />
                <select
                  style={styles.select}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="TB">TB</option>
                  <option value="GB">GB</option>
                </select>
              </div>
              <div style={styles.helper}>
                Use TB for larger requests and GB for smaller storage domain
                sizing.
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>
              {mode === "single" ? "Results" : "Comparison Results"}
            </h2>

            {mode === "single" ? (
              <>
                <div style={styles.highlight}>
                  <div style={styles.highlightLabel}>
                    Required Storage Domain Quota
                  </div>
                  <div style={styles.highlightValue}>
                    {formatNumber(results.quota)} {unit}
                  </div>
                </div>

                <div style={styles.resultsList}>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>
                      Desired Usable Capacity
                    </span>
                    <span style={styles.resultValue}>
                      {formatNumber(results.usable)} {unit}
                    </span>
                  </div>

                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Efficiency</span>
                    <span style={styles.resultValue}>
                      {formatNumber(results.effPct)}%
                    </span>
                  </div>

                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Protection Overhead</span>
                    <span style={styles.resultValue}>
                      {formatNumber(results.overheadPct)}%
                    </span>
                  </div>

                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Overhead Capacity</span>
                    <span style={styles.resultValue}>
                      {formatNumber(results.overhead)} {unit}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div style={styles.compareGrid}>
                <div style={styles.card}>
                  <h3 style={styles.compareCardTitle}>{selected.label}</h3>
                  <div style={styles.highlight}>
                    <div style={styles.highlightLabel}>Required Quota</div>
                    <div style={styles.highlightValue}>
                      {formatNumber(results.quota)} {unit}
                    </div>
                  </div>

                  <div style={styles.resultsList}>
                    <div style={styles.resultRow}>
                      <span style={styles.resultLabel}>Efficiency</span>
                      <span style={styles.resultValue}>
                        {formatNumber(results.effPct)}%
                      </span>
                    </div>
                    <div style={styles.resultRow}>
                      <span style={styles.resultLabel}>Overhead</span>
                      <span style={styles.resultValue}>
                        {formatNumber(results.overheadPct)}%
                      </span>
                    </div>
                    <div style={styles.resultRow}>
                      <span style={styles.resultLabel}>Overhead Capacity</span>
                      <span style={styles.resultValue}>
                        {formatNumber(results.overhead)} {unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={styles.card}>
                  <h3 style={styles.compareCardTitle}>
                    {compareSelected.label}
                  </h3>
                  <div style={styles.highlight}>
                    <div style={styles.highlightLabel}>Required Quota</div>
                    <div style={styles.highlightValue}>
                      {formatNumber(compareResults.quota)} {unit}
                    </div>
                  </div>

                  <div style={styles.resultsList}>
                    <div style={styles.resultRow}>
                      <span style={styles.resultLabel}>Efficiency</span>
                      <span style={styles.resultValue}>
                        {formatNumber(compareResults.effPct)}%
                      </span>
                    </div>
                    <div style={styles.resultRow}>
                      <span style={styles.resultLabel}>Overhead</span>
                      <span style={styles.resultValue}>
                        {formatNumber(compareResults.overheadPct)}%
                      </span>
                    </div>
                    <div style={styles.resultRow}>
                      <span style={styles.resultLabel}>Overhead Capacity</span>
                      <span style={styles.resultValue}>
                        {formatNumber(compareResults.overhead)} {unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.summaryCard}>
          <h2 style={styles.sectionTitle}>Summary</h2>

          {mode === "single" ? (
            <p style={styles.summaryText}>
              To allow{" "}
              <strong>
                {formatNumber(results.usable)} {unit}
              </strong>{" "}
              using <strong>{selected.label}</strong>, set quota to{" "}
              <strong>
                {formatNumber(results.quota)} {unit}
              </strong>
              . This includes{" "}
              <strong>
                {formatNumber(results.overhead)} {unit}
              </strong>{" "}
              of protection overhead at an efficiency rate of{" "}
              <strong>{formatNumber(results.effPct)}%</strong>.
            </p>
          ) : (
            <p style={styles.summaryText}>
              For{" "}
              <strong>
                {formatNumber(Number(capacity) || 0)} {unit}
              </strong>{" "}
              of usable capacity, <strong>{selected.label}</strong> requires{" "}
              <strong>
                {formatNumber(results.quota)} {unit}
              </strong>
              , while <strong>{compareSelected.label}</strong> requires{" "}
              <strong>
                {formatNumber(compareResults.quota)} {unit}
              </strong>
              .
            </p>
          )}

          <div style={styles.buttonRow}>
            <button style={styles.button} onClick={handleCopyEmail}>
              Copy Email Summary
            </button>
            {copyStatus ? <div style={styles.status}>{copyStatus}</div> : null}
          </div>
        </div>

        <div style={styles.noteCard}>
          <strong>Planning Note:</strong> This calculator is based on protection
          efficiency math for storage domain sizing. Final sizing may vary based
          on platform behavior, metadata, and design considerations.
        </div>
      </div>
    </div>
  );
}
