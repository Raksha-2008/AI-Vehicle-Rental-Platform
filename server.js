require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const Vehicle = require("./models/Vehicle");
const Booking = require("./models/Booking");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const demoVehicles = [
  { name: "Honda Activa", type: "Scooter", pricePerDay: 450, location: "Mangaluru", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80", description: "Easy city travel, fuel efficient." },
  { name: "Royal Enfield Classic", type: "Bike", pricePerDay: 900, location: "Mangaluru", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80", description: "Comfortable ride for longer trips." },
  { name: "Hyundai i20", type: "Car", pricePerDay: 1800, location: "Mangaluru", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80", description: "A practical car for a family trip." },
  { name: "Maruti Swift", type: "Car", pricePerDay: 1500, location: "Udupi", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80", description: "Compact and comfortable." }
];

let dbConnected = false;
async function startDatabase() {
  if (!process.env.MONGODB_URI) {
    console.log("MONGODB_URI is not set. Starting with temporary demo data.");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
    dbConnected = true;
    console.log("MongoDB connected");
    if (await Vehicle.countDocuments() === 0) await Vehicle.insertMany(demoVehicles);
  } catch (err) {
    console.log("MongoDB connection unavailable; using temporary demo data.");
    console.log("To enable saved data, start MongoDB and set MONGODB_URI in .env.");
  }
}

let memoryVehicles = demoVehicles.map((v, i) => ({ ...v, _id: `demo-${i + 1}`, ownerName: "Demo Owner", available: true }));
let memoryBookings = [];
let memoryUsers = [];

async function listVehicles() {
  return dbConnected ? Vehicle.find().sort({ createdAt: -1 }) : memoryVehicles;
}
async function findVehicle(id) {
  return dbConnected ? Vehicle.findById(id) : memoryVehicles.find(v => v._id === id);
}

app.get("/api/health", (req, res) => res.json({ ok: true, database: dbConnected ? "connected" : "demo-memory" }));

app.get("/api/vehicles", async (req, res) => {
  try {
    let vehicles = await listVehicles();
    const { search = "", type = "" } = req.query;
    vehicles = vehicles.filter(v =>
      `${v.name} ${v.type} ${v.location}`.toLowerCase().includes(String(search).toLowerCase()) &&
      (!type || type === "All" || v.type === type)
    );
    res.json(vehicles);
  } catch (e) { res.status(500).json({ message: "Could not load vehicles." }); }
});

app.post("/api/vehicles", async (req, res) => {
  try {
    const { name, type, pricePerDay, location, image, description, ownerName } = req.body;
    if (!name || !type || !location || !Number(pricePerDay) || Number(pricePerDay) <= 0)
      return res.status(400).json({ message: "Enter vehicle name, type, location, and a valid daily price." });
    const data = { name, type, pricePerDay: Number(pricePerDay), location, image: image || "", description: description || "", ownerName: ownerName || "Vehicle Owner", available: true };
    const vehicle = dbConnected ? await Vehicle.create(data) : { ...data, _id: `demo-${Date.now()}` };
    if (!dbConnected) memoryVehicles.unshift(vehicle);
    res.status(201).json(vehicle);
  } catch (e) { res.status(500).json({ message: "Could not add vehicle." }); }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const { vehicleId, customerName, startDate, endDate } = req.body;
    if (!vehicleId || !customerName || !startDate || !endDate)
      return res.status(400).json({ message: "Please fill all booking details." });
    const start = new Date(startDate), end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start)
      return res.status(400).json({ message: "Please choose valid dates. End date must be on or after start date." });
    const vehicle = await findVehicle(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    const days = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
    const totalAmount = days * Number(vehicle.pricePerDay);
    const bookingData = { vehicleId: String(vehicleId), vehicleName: vehicle.name, customerName, startDate: start, endDate: end, days, totalAmount, status: "Confirmed" };
    const booking = dbConnected ? await Booking.create(bookingData) : { ...bookingData, _id: `booking-${Date.now()}` };
    if (!dbConnected) memoryBookings.unshift(booking);
    res.status(201).json(booking);
  } catch (e) { res.status(500).json({ message: "Could not create booking." }); }
});

app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = dbConnected ? await Booking.find().sort({ createdAt: -1 }) : memoryBookings;
    res.json(bookings);
  } catch (e) { res.status(500).json({ message: "Could not load bookings." }); }
});

app.get("/api/earnings", async (req, res) => {
  try {
    const bookings = dbConnected ? await Booking.find({ status: "Confirmed" }) : memoryBookings.filter(b => b.status === "Confirmed");
    const total = bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
    res.json({ totalEarnings: total, bookingsCount: bookings.length, note: "Demo estimate based on confirmed bookings; no payment processing is included." });
  } catch (e) { res.status(500).json({ message: "Could not calculate earnings." }); }
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) return res.status(400).json({ message: "Name, email and role are required." });
    const normalizedRole = ["Customer", "Owner", "Admin"].includes(role) ? role : "Customer";
    if (dbConnected) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(409).json({ message: "Email already registered." });
      const user = await User.create({ name, email: email.toLowerCase(), role: normalizedRole });
      return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
    }
    if (memoryUsers.some(u => u.email === email.toLowerCase())) return res.status(409).json({ message: "Email already registered." });
    const user = { id: `user-${Date.now()}`, name, email: email.toLowerCase(), role: normalizedRole };
    memoryUsers.push(user);
    res.status(201).json(user);
  } catch (e) { res.status(500).json({ message: "Could not register user." }); }
});

app.post("/api/ai/price", async (req, res) => {
  const { type = "Bike", age = 3, demand = "medium" } = req.body;
  const base = { Scooter: 450, Bike: 800, Car: 1600, SUV: 2600 };
  const multiplier = { low: 0.85, medium: 1, high: 1.2 };
  const estimate = Math.round((base[type] || 800) * Math.max(0.6, 1 - Number(age || 0) * 0.035) * (multiplier[demand] || 1) / 50) * 50;
  res.json({ estimatedDailyPrice: estimate, currency: "INR", method: "Simple demo estimate. Connect ai_model.py for a trained ML model." });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

startDatabase().finally(() => {
  app.listen(PORT, () => console.log(`App running at http://localhost:${PORT}`));
});