import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { body, param, query } from "express-validator";
import { User, Trip, PackingItem, ItineraryDay } from "./models.js";
import { auth, handleValidation, asyncRoute } from "./middleware.js";
import { getWeather } from "./services/weatherService.js";
import {
  generateTripPlan,
  regenerateItineraryDay,
} from "./services/aiService.js";

const app = express();
app.use(cors());
app.use(express.json());
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  message: { message: "AI rate limit reached. Try again shortly." },
});
const issueToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
const tripValidation = [
  body("destination").trim().isLength({ min: 2, max: 100 }),
  body("startDate").isISO8601(),
  body("tripLength").isInt({ min: 1, max: 30 }),
  body("tripTypes").isArray({ min: 1 }),
];

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.post(
  "/api/auth/register",
  [
    body("name").trim().isLength({ min: 2 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
  ],
  handleValidation,
  asyncRoute(async (req, res) => {
    const { name, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(409).json({ message: "Email already registered" });
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    res
      .status(201)
      .json({
        token: issueToken(user._id),
        user: { id: user._id, name: user.name, email: user.email },
      });
  }),
);
app.post(
  "/api/auth/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  handleValidation,
  asyncRoute(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
      return res.status(401).json({ message: "Invalid email or password" });
    res.json({
      token: issueToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  }),
);
app.post(
  "/api/trips",
  auth,
  aiLimiter,
  tripValidation,
  handleValidation,
  asyncRoute(async (req, res) => {
    const {
      destination,
      startDate,
      tripLength,
      tripTypes,
      provider = "openai",
    } = req.body;
    const end = new Date(startDate);
    end.setDate(end.getDate() + tripLength - 1);
    let weather = {
      summary: "Weather unavailable. Pack flexible layers.",
      daily: [],
    };
    try {
      weather = await getWeather(
        destination,
        startDate,
        end.toISOString().slice(0, 10),
      );
    } catch {}
    const plan = await generateTripPlan(
      destination,
      tripLength,
      tripTypes,
      weather.summary,
      provider,
    );
    const trip = await Trip.create({
      userId: req.userId,
      destination,
      startDate,
      endDate: end.toISOString().slice(0, 10),
      tripTypes,
      provider,
      weatherSummary: weather.summary,
    });
    const packing = plan.packingList.flatMap((group) =>
      group.items.map((item) => ({
        tripId: trip._id,
        category: group.category,
        ...item,
      })),
    );
    await PackingItem.insertMany(packing);
    await ItineraryDay.insertMany(
      plan.itinerary.map((day) => ({
        tripId: trip._id,
        dayNumber: day.dayNumber,
        date: new Date(
          new Date(startDate).getTime() + (day.dayNumber - 1) * 86400000,
        )
          .toISOString()
          .slice(0, 10),
        weatherForecast:
          weather.daily[day.dayNumber - 1]?.text || weather.summary,
        activities: day.activities,
      })),
    );
    res.status(201).json(await fullTrip(trip._id, req.userId));
  }),
);
async function fullTrip(id, userId) {
  const trip = await Trip.findOne({ _id: id, userId }).lean();
  if (!trip) return null;
  const [packingList, itinerary] = await Promise.all([
    PackingItem.find({ tripId: id }).lean(),
    ItineraryDay.find({ tripId: id }).sort("dayNumber").lean(),
  ]);
  return { ...trip, packingList, itinerary };
}
app.get(
  "/api/trips",
  auth,
  asyncRoute(async (req, res) =>
    res.json(await Trip.find({ userId: req.userId }).sort("-startDate").lean()),
  ),
);
app.get(
  "/api/trips/:id",
  auth,
  asyncRoute(async (req, res) => {
    const trip = await fullTrip(req.params.id, req.userId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.json(trip);
  }),
);
app.delete(
  "/api/trips/:id",
  auth,
  asyncRoute(async (req, res) => {
    await Trip.deleteOne({ _id: req.params.id, userId: req.userId });
    await PackingItem.deleteMany({ tripId: req.params.id });
    await ItineraryDay.deleteMany({ tripId: req.params.id });
    res.status(204).end();
  }),
);
app.patch(
  "/api/trips/:id/packing/:itemId",
  auth,
  asyncRoute(async (req, res) => {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    const item = await PackingItem.findOneAndUpdate(
      { _id: req.params.itemId, tripId: trip._id },
      { isChecked: req.body.isChecked },
      { new: true },
    );
    res.json(item);
  }),
);
app.post(
  "/api/trips/:id/packing",
  auth,
  [
    body("name").trim().isLength({ min: 1, max: 100 }),
    body("category").optional().trim(),
  ],
  handleValidation,
  asyncRoute(async (req, res) => {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res
      .status(201)
      .json(
        await PackingItem.create({
          tripId: trip._id,
          name: req.body.name,
          category: req.body.category || "Custom",
          isCustom: true,
        }),
      );
  }),
);
app.post(
  "/api/trips/:id/itinerary/regenerate-day",
  auth,
  aiLimiter,
  [
    body("dayNumber").isInt({ min: 1 }),
    body("provider").optional().isIn(["openai", "anthropic", "gemini"]),
  ],
  handleValidation,
  asyncRoute(async (req, res) => {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    const day = await ItineraryDay.findOne({
      tripId: trip._id,
      dayNumber: req.body.dayNumber,
    });
    const generated = await regenerateItineraryDay(
      trip.destination,
      req.body.dayNumber,
      trip.tripTypes,
      day?.weatherForecast,
      req.body.provider || trip.provider,
    );
    res.json(
      await ItineraryDay.findOneAndUpdate(
        { _id: day._id },
        { activities: generated.activities },
        { new: true },
      ),
    );
  }),
);
app.get(
  "/api/weather",
  auth,
  [
    query("destination").notEmpty(),
    query("startDate").isISO8601(),
    query("endDate").isISO8601(),
  ],
  handleValidation,
  asyncRoute(async (req, res) => {
    try {
      res.json(
        await getWeather(
          req.query.destination,
          req.query.startDate,
          req.query.endDate,
        ),
      );
    } catch {
      res.status(502).json({ message: "Weather unavailable" });
    }
  }),
);
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Unexpected server error" });
});
const port = process.env.PORT || 4000;
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tripsage")
  .then(() =>
    app.listen(port, () => console.log(`TripSage API listening on ${port}`)),
  )
  .catch((error) => {
    console.error("MongoDB connection failed", error.message);
    process.exit(1);
  });
