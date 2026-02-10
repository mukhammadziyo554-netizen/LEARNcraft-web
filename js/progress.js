function startStage() {
  document.getElementById("progressDashboard").classList.remove("hidden");
}

const checkboxes = document.querySelectorAll('#trackerTable input[type="checkbox"]');
const stagePercentEl = document.getElementById("stagePercent");
const weeklyPercentEl = document.getElementById("weeklyPercent");
const progressFill = document.getElementById("progressFill");
const streakEl = document.getElementById("streakCount");

let streak = 0;
let progressHistory = [];

checkboxes.forEach(box => {
  box.addEventListener("change", updateProgress);
});

function updateProgress() {
  const total = checkboxes.length;
  const checked = document.querySelectorAll('#trackerTable input[type="checkbox"]:checked').length;

  const percent = Math.round((checked / total) * 100);
  stagePercentEl.textContent = percent + "%";
  progressFill.style.width = percent + "%";
  weeklyPercentEl.textContent = percent + "%";

  if (checked > 0) streak++;
  else streak = 0;

  streakEl.textContent = streak;
}
