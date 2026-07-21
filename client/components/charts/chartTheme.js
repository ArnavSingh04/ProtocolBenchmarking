// Shared Chart.js styling fragments driven by the active theme.

export function legendConfig(theme) {
  return {
    position: "top",
    labels: {
      color: theme.text,
      usePointStyle: true,
      pointStyle: "rectRounded",
      padding: 16,
      font: { size: 12, weight: "500" }
    }
  };
}

export function tooltipConfig(theme, extra = {}) {
  return {
    backgroundColor: theme.tooltipBg,
    titleColor: theme.tooltipText,
    bodyColor: theme.tooltipText,
    borderColor: theme.grid,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8,
    boxPadding: 4,
    ...extra
  };
}

export function linearAxis(theme, { title, max } = {}) {
  return {
    beginAtZero: true,
    max,
    grid: { color: theme.grid, drawBorder: false },
    ticks: { color: theme.axis, font: { size: 11 } },
    title: title
      ? { display: true, text: title, color: theme.axis, font: { size: 12 } }
      : { display: false }
  };
}

export function categoryAxis(theme, { title } = {}) {
  return {
    grid: { color: "transparent" },
    ticks: { color: theme.axis, font: { size: 11 } },
    title: title
      ? { display: true, text: title, color: theme.axis, font: { size: 12 } }
      : { display: false }
  };
}

export function radialScale(theme) {
  return {
    r: {
      beginAtZero: true,
      max: 100,
      min: 0,
      ticks: {
        stepSize: 20,
        color: theme.axis,
        backdropColor: "transparent",
        font: { size: 10 }
      },
      grid: { color: theme.grid },
      angleLines: { color: theme.grid },
      pointLabels: { color: theme.text, font: { size: 11 } }
    }
  };
}
