const mongoose = require("mongoose");
const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  pricePerDay: { type: Number, required: true, min: 1 },
  location: { type: String, required: true },
  image: String,
  description: String,
  ownerName: { type: String, default: "Vehicle Owner" },
  available: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model("Vehicle", vehicleSchema);