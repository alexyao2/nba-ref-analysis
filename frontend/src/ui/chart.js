export function drawLeaderChart(groups, el) {
  const canvas = el.leaderChart;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(Math.max(1, rect.width) * scale);
  canvas.height = Math.floor(260 * scale);
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, rect.width, 260);

  const top = groups.slice(0, 7);
  const maxGames = Math.max(1, ...top.map((group) => group.gamesOfficiated));
  const left = 150;
  const right = 36;
  const rowHeight = 31;
  ctx.font = "12px Inter, sans-serif";
  ctx.fillStyle = "#667085";
  ctx.fillText(`${maxGames} games`, Math.max(left + 10, rect.width - right - 80), 18);

  top.forEach((group, index) => {
    const y = 36 + index * rowHeight;
    const width = Math.max(3, (rect.width - left - right) * (group.gamesOfficiated / maxGames));
    ctx.fillStyle = "#17202a";
    ctx.fillText(group.referee.slice(0, 19), 10, y + 14);
    ctx.fillStyle = index < 2 ? "#244e42" : index < 5 ? "#547089" : "#c88432";
    ctx.fillRect(left, y, width, 18);
    ctx.fillStyle = "#17202a";
    ctx.fillText(String(group.gamesOfficiated), left + width + 8, y + 14);
  });

  if (!top.length) {
    ctx.fillStyle = "#667085";
    ctx.fillText("No referee rows match the current filters.", 18, 42);
  }
}

export function drawSignalChart(records, el) {
  const canvas = el.signalChart;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(Math.max(1, rect.width) * scale);
  canvas.height = Math.floor(260 * scale);
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, rect.width, 260);

  const totals = records.reduce((acc, record) => {
    const role = record.role || "Unknown";
    acc[role] = (acc[role] || 0) + (record.gamesOfficiated || 0);
    return acc;
  }, {});
  const entries = Object.entries(totals).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
  const colors = ["#244e42", "#c88432", "#b55f3e", "#547089"];
  const cx = rect.width / 2;
  const cy = 104;
  const radius = Math.min(78, rect.width / 3.5);
  let start = -Math.PI / 2;

  entries.forEach(([, value], index) => {
    const end = start + (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    start = end;
  });

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#17202a";
  ctx.font = "700 18px Inter, sans-serif";
  ctx.fillText(String(total), cx - 20, cy + 6);

  ctx.font = "12px Inter, sans-serif";
  entries.slice(0, 4).forEach(([role, value], index) => {
    const y = 208 + index * 20;
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(18, y - 9, 10, 10);
    ctx.fillStyle = "#667085";
    ctx.fillText(`${role || "Unknown"} ${Math.round((value / total) * 100)}%`, 36, y);
  });
}
