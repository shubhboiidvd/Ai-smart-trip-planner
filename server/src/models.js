import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  { time: String, title: String, description: String },
  { _id: false },
);
const packingSchema = new mongoose.Schema({
  tripId: mongoose.Schema.Types.ObjectId,
  category: String,
  name: String,
  isChecked: { type: Boolean, default: false },
  isWeatherSpecific: { type: Boolean, default: false },
  isCustom: { type: Boolean, default: false },
});
const itinerarySchema = new mongoose.Schema({
  tripId: mongoose.Schema.Types.ObjectId,
  dayNumber: Number,
  date: String,
  weatherForecast: String,
  activities: [activitySchema],
});
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
  },
  { timestamps: true },
);
const tripSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    destination: String,
    startDate: String,
    endDate: String,
    tripTypes: [String],
    provider: String,
    weatherSummary: String,
  },
  { timestamps: true },
);
export const User = mongoose.model("User", userSchema);
export const Trip = mongoose.model("Trip", tripSchema);
export const PackingItem = mongoose.model("PackingItem", packingSchema);
export const ItineraryDay = mongoose.model("ItineraryDay", itinerarySchema);
