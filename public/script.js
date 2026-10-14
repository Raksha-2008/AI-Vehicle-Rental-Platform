const API = "";
const grid = document.getElementById("vehicleGrid");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 3000);
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
async function request(url, options = {}) {
  const response = await fetch(API + url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
function vehicleCard(v) {
  const img = v.image || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80";
  return `<article class="vehicle-card">
    <img src="${escapeHtml(img)}" alt="${escapeHtml(v.name)}" onerror="this.src='https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80'">
    <div class="vehicle-content"><span class="tag">${escapeHtml(v.type)}</span>
      <h3>${escapeHtml(v.name)}</h3><p>📍 ${escapeHtml(v.location)}</p>
      <p>${escapeHtml(v.description || "Available for your next trip.")}</p>
      <div class="price-row"><div class="price">₹${Number(v.pricePerDay).toLocaleString("en-IN")} <small>/ day</small></div>
      <button class="btn primary" onclick="bookVehicle('${escapeHtml(v._id)}','${escapeHtml(v.name)}')">Book now</button></div>
    </div></article>`;
}
async function loadVehicles() {
  grid.innerHTML = '<p>Loading vehicles...</p>';
  try {
    const search = encodeURIComponent(document.getElementById("searchInput").value.trim());
    const type = encodeURIComponent(document.getElementById("typeFilter").value);
    const vehicles = await request(`/api/vehicles?search=${search}&type=${type}`);
    grid.innerHTML = vehicles.length ? vehicles.map(vehicleCard).join("") : '<div class="empty">No vehicles found. Try a different search or add a vehicle.</div>';
  } catch (err) {
    grid.innerHTML = `<div class="empty">${escapeHtml(err.message)} Start the Node.js server and refresh.</div>`;
  }
}
async function bookVehicle(vehicleId, vehicleName) {
  const customerName = prompt(`Booking ${vehicleName}\nEnter your name:`);
  if (!customerName || !customerName.trim()) return;
  const startDate = prompt("Start date (YYYY-MM-DD):", new Date().toISOString().slice(0, 10));
  if (!startDate) return;
  const endDate = prompt("End date (YYYY-MM-DD):", startDate);
  if (!endDate) return;
  try {
    const booking = await request("/api/bookings", { method: "POST", body: JSON.stringify({ vehicleId, customerName: customerName.trim(), startDate, endDate }) });
    showToast(`Booking confirmed! Total: ₹${Number(booking.totalAmount).toLocaleString("en-IN")}`);
    await loadEarnings();
  } catch (err) { showToast(err.message); }
}
document.getElementById("searchBtn").addEventListener("click", loadVehicles);
document.getElementById("refreshBtn").addEventListener("click", loadVehicles);
document.getElementById("searchInput").addEventListener("keydown", e => { if (e.key === "Enter") loadVehicles(); });
document.getElementById("typeFilter").addEventListener("change", loadVehicles);

document.getElementById("vehicleForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target).entries());
  form.pricePerDay = Number(form.pricePerDay);
  try {
    await request("/api/vehicles", { method: "POST", body: JSON.stringify(form) });
    document.getElementById("vehicleMessage").textContent = "Vehicle added successfully.";
    e.target.reset();
    await loadVehicles();
    showToast("Vehicle added.");
  } catch (err) { document.getElementById("vehicleMessage").textContent = err.message; }
});

document.getElementById("aiForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target).entries());
  form.age = Number(form.age);
  try {
    const result = await request("/api/ai/price", { method: "POST", body: JSON.stringify(form) });
    document.getElementById("priceResult").innerHTML = `Suggested daily rental price: <strong>₹${Number(result.estimatedDailyPrice).toLocaleString("en-IN")}</strong><br><small>${escapeHtml(result.method)}</small>`;
  } catch (err) { document.getElementById("priceResult").textContent = err.message; }
});

async function loadEarnings() {
  try {
    const result = await request("/api/earnings");
    document.getElementById("totalEarnings").textContent = `₹${Number(result.totalEarnings).toLocaleString("en-IN")}`;
    document.getElementById("bookingCount").textContent = result.bookingsCount;
    document.getElementById("earningsNote").textContent = result.note;
    const bookings = await request("/api/bookings");
    document.getElementById("bookingList").innerHTML = bookings.length ? bookings.slice(0, 8).map(b =>
      `<div class="booking-item"><div><strong>${escapeHtml(b.vehicleName)}</strong><small>${escapeHtml(b.customerName)} · ${escapeHtml(String(b.startDate).slice(0,10))} to ${escapeHtml(String(b.endDate).slice(0,10))}</small></div><strong>₹${Number(b.totalAmount).toLocaleString("en-IN")}</strong></div>`
    ).join("") : "No bookings yet.";
  } catch (err) { document.getElementById("earningsNote").textContent = err.message; }
}
document.getElementById("loadEarningsBtn").addEventListener("click", loadEarnings);

document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target).entries());
  try {
    const user = await request("/api/register", { method: "POST", body: JSON.stringify(form) });
    document.getElementById("registerMessage").textContent = `Profile created for ${user.name} (${user.role}).`;
    e.target.reset();
    showToast("Profile created.");
  } catch (err) { document.getElementById("registerMessage").textContent = err.message; }
});

loadVehicles();
loadEarnings();