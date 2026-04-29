const API = "/api/devices";
const state = { devices: [], currentUser: null, filters: { search: "", type: "All", room: "All", status: "All", validation: "All" } };

const $ = (id) => document.getElementById(id);
const icons = { Light: "💡", Thermostat: "🌡️", Alarm: "🚨", Camera: "📷", Lock: "🔐", Fan: "🌀" };
const titles = {
  dashboard: ["Smart Home IoT Dashboard", "Dashboard overview"],
  devices: ["Device Management", "Manage all smart devices"],
  trouble: ["System Diagnostics", "Troubleshooting center"],
  add: ["Device Registration", "Add a new device"]
};

function getUser() {
  try { return JSON.parse(localStorage.getItem("homeiq_user") || "{}"); } catch { return {}; }
}
function getToken() { return localStorage.getItem("homeiq_token") || ""; }
function requireSession() { if (!getToken()) window.location.href = "/login.html"; }
function saveTheme() { localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light"); }
function loadTheme() { if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark"); updateThemeButton(); }
function updateThemeButton() { $("themeToggle").textContent = document.body.classList.contains("dark") ? "☀️ Light" : "🌙 Dark"; }
function initials(name) {
  return String(name || "User").split(" ").filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("") || "U";
}
function saveUser(user) {
  state.currentUser = user || {};
  localStorage.setItem("homeiq_user", JSON.stringify(state.currentUser));
}
function loadUserBadge() {
  const user = state.currentUser || getUser();
  if ($("profileBtn")) $("profileBtn").innerHTML = '<span class="mini-avatar">' + initials(user.name) + '</span><span>' + (user.name || "User") + '</span>';
  if ($("profileInitials")) $("profileInitials").textContent = initials(user.name);
  if ($("profileDisplayName")) $("profileDisplayName").textContent = user.name || "User";
  if ($("profileDisplayEmail")) $("profileDisplayEmail").textContent = user.email || "No email saved";
}
function logout() {
  localStorage.removeItem("homeiq_token");
  localStorage.removeItem("homeiq_user");
  window.location.href = "/login.html";
}
function setPage(page) {
  const selected = titles[page] ? page : "dashboard";
  document.querySelectorAll(".page").forEach(section => section.classList.remove("active-page"));
  document.querySelectorAll(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.page === selected));
  $(`page-${selected}`).classList.add("active-page");
  $("pageEyebrow").textContent = titles[selected][0];
  $("pageTitle").textContent = titles[selected][1];
}
function routeFromHash() { setPage((location.hash || "#dashboard").replace("#", "")); }

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) { logout(); throw new Error("Session expired"); }
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}
function queryString() {
  const params = new URLSearchParams();
  Object.entries(state.filters).forEach(([key, value]) => { if (value && value !== "All") params.set(key, value); });
  return params.toString();
}
async function loadDevices() {
  try {
    const data = await request(`${API}?${queryString()}`);
    state.devices = data.devices || [];
    renderAll();
    $("sideHealth").textContent = "Connected";
  } catch (error) {
    $("sideHealth").textContent = "API Error";
    $("deviceGrid").innerHTML = `<p>${error.message}. Start server using <b>npm run dev</b>.</p>`;
    $("recentDeviceGrid").innerHTML = `<p>Backend not connected.</p>`;
  }
}

async function loadProfile() {
  try {
    const data = await request("/api/auth/me");
    saveUser(data.user || {});
    loadUserBadge();
  } catch (error) {
    console.warn("Could not refresh profile", error.message);
    loadUserBadge();
  }
}
function fillProfileForm() {
  const user = state.currentUser || getUser();
  if ($("profileName")) $("profileName").value = user.name || "";
  if ($("profileEmail")) $("profileEmail").value = user.email || "";
  if ($("profilePhone")) $("profilePhone").value = user.phone || "";
  if ($("profileHomeLocation")) $("profileHomeLocation").value = user.homeLocation || "";
  if ($("currentPassword")) $("currentPassword").value = "";
  if ($("newPassword")) $("newPassword").value = "";
  if ($("profileMessage")) { $("profileMessage").textContent = ""; $("profileMessage").className = "profile-message"; }
  loadUserBadge();
}
function openProfileModal() {
  fillProfileForm();
  const modal = $("profileModal");
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => $("profileName")?.focus(), 50);
}
function closeProfileModal() {
  const modal = $("profileModal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}
async function submitProfile(e) {
  e.preventDefault();
  const button = e.target.querySelector("button[type='submit']");
  const message = $("profileMessage");
  const payload = Object.fromEntries(new FormData(e.target).entries());
  if (!payload.newPassword) {
    delete payload.newPassword;
    delete payload.currentPassword;
  }
  try {
    button.disabled = true;
    button.textContent = "Saving...";
    const data = await request("/api/auth/me", { method: "PUT", body: JSON.stringify(payload) });
    if (data.token) localStorage.setItem("homeiq_token", data.token);
    saveUser(data.user || payload);
    loadUserBadge();
    message.textContent = data.message || "Profile updated successfully";
    message.className = "profile-message success";
    setTimeout(closeProfileModal, 800);
  } catch (error) {
    message.textContent = error.message;
    message.className = "profile-message error";
  } finally {
    button.disabled = false;
    button.textContent = "Save changes";
  }
}

function renderStats() {
  const total = state.devices.length;
  const online = state.devices.filter(d => d.status === "Online").length;
  const offline = state.devices.filter(d => d.status === "Offline").length;
  const pending = state.devices.filter(d => d.validation === "Pending").length;
  const unvalidated = state.devices.filter(d => d.validation !== "Validated").length;
  const lowBattery = state.devices.filter(d => d.battery !== undefined && Number(d.battery || 0) < 40).length;
  const batteryDevices = state.devices.filter(d => d.battery !== undefined && d.battery !== null);
  const avg = batteryDevices.length ? Math.round(batteryDevices.reduce((sum, d) => sum + Number(d.battery || 0), 0) / batteryDevices.length) : 0;
  $("totalDevices").textContent = total;
  $("onlineDevices").textContent = online;
  $("pendingDevices").textContent = pending;
  $("avgBattery").textContent = `${avg}%`;
  $("offlineDevices").textContent = offline;
  $("lowBatteryDevices").textContent = lowBattery;
  $("unvalidatedDevices").textContent = unvalidated;
  $("deviceCount").textContent = `${total} found`;
}
function renderRooms() {
  const select = $("roomFilter");
  const current = select.value || "All";
  const rooms = [...new Set(state.devices.map(d => d.room))].filter(Boolean).sort();
  select.innerHTML = `<option>All</option>` + rooms.map(room => `<option>${room}</option>`).join("");
  select.value = rooms.includes(current) ? current : "All";
}
function featurePills(device) {
  const pills = [];
  if (device.battery !== undefined && device.battery !== null) pills.push(`<span class="pill">Battery ${device.battery}%</span>`);
  if (device.type === "Thermostat") pills.push(`<span class="pill">${device.temperature || 24}°C</span>`);
  if (device.type === "Light") pills.push(`<span class="pill">Brightness ${device.brightness || 80}%</span>`);
  if (device.type === "Fan") pills.push(`<span class="pill">Speed ${device.speed || "Medium"}</span>`);
  if (device.type === "Lock") pills.push(`<span class="pill">${device.locked ? "Locked" : "Unlocked"}</span>`);
  return pills.join("");
}
function deviceCard(device, compact = false) {
  const statusClass = device.status.toLowerCase();
  const validationClass = device.validation.toLowerCase();
  const tempControl = device.type === "Thermostat" ? `<button onclick="changeTemp('${device._id}', ${(device.temperature || 24) - 1})">- Temp</button><button onclick="changeTemp('${device._id}', ${(device.temperature || 24) + 1})">+ Temp</button>` : "";
  const actions = compact ? `<a class="card-link" href="#devices">Manage</a>` : `<div class="actions"><button onclick="togglePower('${device._id}', ${!device.power})">${device.power ? "Turn OFF" : "Turn ON"}</button><button onclick="setValidation('${device._id}', 'Validated')">Validate</button>${tempControl}<button class="danger" onclick="removeDevice('${device._id}')">Delete</button></div>`;
  return `<article class="device-card">
    <div class="device-top"><div class="device-title"><h3>${icons[device.type] || "📡"} ${device.name}</h3><p>${device.type} • ${device.room}</p></div><span class="pill ${statusClass}">${device.status}</span></div>
    <div class="device-meta"><span class="pill ${validationClass}">${device.validation}</span><span class="pill">${device.power ? "ON" : "OFF"}</span>${featurePills(device)}</div>
    ${actions}
  </article>`;
}
function renderDevices() {
  $("deviceGrid").innerHTML = state.devices.length ? state.devices.map(d => deviceCard(d)).join("") : `<p>No devices found. Add a device or load samples.</p>`;
  $("recentDeviceGrid").innerHTML = state.devices.length ? state.devices.slice(0, 4).map(d => deviceCard(d, true)).join("") : `<p>No devices yet. Add your first device.</p>`;
}
function renderIssues() {
  const issues = state.devices.filter(d => d.status === "Offline" || d.validation !== "Validated" || (d.battery !== undefined && d.battery < 40));
  $("issuesList").innerHTML = issues.length ? issues.map(d => `<div class="issue"><strong>${icons[d.type] || "📡"} ${d.name}</strong><span>${d.status === "Offline" ? "Device is offline. " : ""}${d.validation !== "Validated" ? "Validation needed. " : ""}${d.battery !== undefined && d.battery < 40 ? "Low battery." : ""}</span></div>`).join("") : `<div class="issue"><strong>No issues</strong><span>All devices look healthy.</span></div>`;
}
function renderAll() { renderStats(); renderRooms(); renderDevices(); renderIssues(); }

async function togglePower(id, power) { await request(`${API}/${id}`, { method: "PUT", body: JSON.stringify({ power }) }); loadDevices(); }
async function changeTemp(id, temperature) { await request(`${API}/${id}`, { method: "PUT", body: JSON.stringify({ temperature }) }); loadDevices(); }
async function setValidation(id, validation) { await request(`${API}/${id}`, { method: "PUT", body: JSON.stringify({ validation }) }); loadDevices(); }
async function removeDevice(id) { if (confirm("Delete this device?")) { await request(`${API}/${id}`, { method: "DELETE" }); loadDevices(); } }
window.togglePower = togglePower;
window.changeTemp = changeTemp;
window.setValidation = setValidation;
window.removeDevice = removeDevice;

function renderDynamicFields() {
  const type = $("deviceTypeSelect")?.value || "Light";
  const box = $("dynamicFields");
  if (!box) return;
  const fields = {
    Light: `<label>Brightness %<input name="brightness" type="number" min="0" max="100" value="80" /></label>`,
    Thermostat: `<label>Initial temperature °C<input name="temperature" type="number" min="10" max="35" value="24" /></label>`,
    Fan: `<label>Fan speed<select name="speed"><option>Low</option><option selected>Medium</option><option>High</option></select></label>`,
    Alarm: `<label>Battery %<input name="battery" type="number" min="0" max="100" value="90" /></label>`,
    Camera: `<label>Battery %<input name="battery" type="number" min="0" max="100" value="90" /></label>`,
    Lock: `<label>Battery %<input name="battery" type="number" min="0" max="100" value="90" /></label><label>Lock state<select name="locked"><option value="true">Locked</option><option value="false">Unlocked</option></select></label>`
  };
  box.innerHTML = fields[type] || "";
}

$("themeToggle").addEventListener("click", () => { document.body.classList.toggle("dark"); updateThemeButton(); saveTheme(); });
$("logoutBtn").addEventListener("click", logout);
$("profileBtn")?.addEventListener("click", openProfileModal);
$("closeProfileBtn")?.addEventListener("click", closeProfileModal);
$("cancelProfileBtn")?.addEventListener("click", closeProfileModal);
$("profileModal")?.addEventListener("click", (e) => { if (e.target.id === "profileModal") closeProfileModal(); });
$("profileForm")?.addEventListener("submit", submitProfile);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeProfileModal(); });
$("deviceTypeSelect").addEventListener("change", renderDynamicFields);
$("deviceForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  if (data.locked !== undefined) data.locked = data.locked === "true";
  data.power = false;
  data.status = "Offline";
  await request(API, { method: "POST", body: JSON.stringify(data) });
  e.target.reset();
  renderDynamicFields();
  location.hash = "#devices";
  loadDevices();
});
$("seedBtn").addEventListener("click", async () => { await request(`${API}/seed`, { method: "POST" }); loadDevices(); });
["searchInput", "typeFilter", "roomFilter", "statusFilter", "validationFilter"].forEach(id => {
  $(id).addEventListener("input", () => { const key = id.replace("Input", "").replace("Filter", ""); state.filters[key] = $(id).value; loadDevices(); });
});
window.addEventListener("hashchange", routeFromHash);
requireSession();
loadTheme();
loadUserBadge();
loadProfile();
renderDynamicFields();
routeFromHash();
loadDevices();
setInterval(loadDevices, 15000);
