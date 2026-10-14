const mongoose = require("mongoose");
const bookingSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true },
  vehicleName: { type: String, required: true },
  customerName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, default: "Confirmed" }
}, { timestamps: true });
module.exports = mongoose.model("Booking", bookingSchema);