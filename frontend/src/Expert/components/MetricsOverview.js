import React from "react"
const MetricsOverviewV5 = ({ stats }) => {
  return React.createElement(
    "div",
    { className: "v5-metrics-grid" },
    React.createElement(
      "div",
      { className: "v5-metric-card" },
      React.createElement(
        "div",
        { className: "v5-metric-icon" },
        React.createElement(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            width: "24",
            height: "24",
          },
          React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
          React.createElement("polyline", { points: "14 2 14 8 20 8" }),
          React.createElement("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
          React.createElement("line", { x1: "16", y1: "17", x2: "8", y2: "17" }),
          React.createElement("polyline", { points: "10 9 9 9 8 9" }),
        ),
      ),
      React.createElement(
        "div",
        { className: "v5-metric-content" },
        React.createElement("div", { className: "v5-metric-value" }, stats.totalTemplates),
        React.createElement("div", { className: "v5-metric-subtitle" }, "Templates disponibles"),
      ),
    ),

    React.createElement(
      "div",
      { className: "v5-metric-card" },
      React.createElement(
        "div",
        { className: "v5-metric-icon" },
        React.createElement(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            width: "24",
            height: "24",
          },
          React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
          React.createElement("polyline", { points: "12 6 12 12 16 14" }),
        ),
      ),
      React.createElement(
        "div",
        { className: "v5-metric-content" },
        React.createElement("div", { className: "v5-metric-value" }, stats.pendingTemplates),
        React.createElement("div", { className: "v5-metric-subtitle" }, "Templates à vérifier"),
      ),
    ),

    React.createElement(
      "div",
      { className: "v5-metric-card" },
      React.createElement(
        "div",
        { className: "v5-metric-icon" },
        React.createElement(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            width: "24",
            height: "24",
          },
          React.createElement("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
          React.createElement("polyline", { points: "22 4 12 14.01 9 11.01" }),
        ),
      ),
      React.createElement(
        "div",
        { className: "v5-metric-content" },
        React.createElement("div", { className: "v5-metric-value" }, stats.validatedTemplates),
        React.createElement("div", { className: "v5-metric-subtitle" }, "Templates validés"),
      ),
    ),

    React.createElement(
      "div",
      { className: "v5-metric-card" },
      React.createElement(
        "div",
        { className: "v5-metric-icon" },
        React.createElement(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            width: "24",
            height: "24",
          },
          React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
          React.createElement("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
          React.createElement("line", { x1: "9", y1: "9", x2: "15", y2: "15" }),
        ),
      ),
      React.createElement(
        "div",
        { className: "v5-metric-content" },
        React.createElement("div", { className: "v5-metric-value" }, stats.rejectedTemplates),
        React.createElement("div", { className: "v5-metric-subtitle" }, "Templates rejetés"),
      ),
    ),
  )
}

export default MetricsOverviewV5
