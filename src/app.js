import express from "express";
import Event from "./models/Event.model.js";
import Booking from "./models/Booking.model.js";
import Redis from "ioredis";

const app = express();
app.use(express.json());

// creating the redis client
const redis = new Redis({
  host: "localhost",
  port: 6379,
});

// health route
app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "Booking API" }),
);

// creating a dummy event for testing
app.post("/events", async (req, res) => {
  try {
    const { name, totalSeats } = req.body;
    const event = new Event({ name, totalSeats, availableSeats: totalSeats });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// bad booking route vulnerable to race conditions
app.post("/book/bad", async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    // checking if the events have sear available or not
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.availableSeats <= 0) {
      return res.status(400).json({ error: "Sold out" });
    }

    // simulating slight delay (paymeny gateway processing, ) to increase the chances of race conditions
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Step 3: Deduct the seat and save
    event.availableSeats -= 1;
    await event.save();

    // Step 4: Create the booking record
    const booking = new Booking({ eventId, userId });
    await booking.save();

    res.status(201).json({ success: true, bookingId: booking._id });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
// good booking route with the redis lock
app.post("/book/good", async (req, res) => {
  const { eventId, userId } = req.body;
  const lockKey = `lock:event:${eventId}`;

  try {
    // acquiring the lock with a timeout of 5 seconds to prevent deadlocks
    const lockAcquired = await redis.set(lockKey, "locked", "NX", "PX", 5000);
    if (!lockAcquired) {
      return res
        .status(429)
        .json({ error: "Too many requests, please try again later" });
    }

    // only one request can proceed beyond this point for the same eventId
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    if (event.availableSeats <= 0) {
      await redis.del(lockKey); // Always release lock before returning
      return res.status(400).json({ error: "Sold out" });
    }

    // simulating slight delay (payment gateway processing, etc.) to increase the chances of race conditions
    await new Promise((resolve) => setTimeout(resolve, 50));

    event.availableSeats -= 1;
    await event.save();

    const booking = new Booking({ eventId, userId });
    await booking.save();

    await redis.del(lockKey); // Always release lock after processing
    res.status(201).json({ success: true, bookingId: booking._id });
  } catch (error) {
    console.log("Error acquiring lock or processing booking: ", error);
    await redis.del(lockKey); // Ensure lock is released in case of error
    res.status(500).json({ error: "Internal server error" });
  }
});
// Quick route to check the damage
app.get("/events/:id/stats", async (req, res) => {
  const event = await Event.findById(req.params.id);
  const totalBookings = await Booking.countDocuments({
    eventId: req.params.id,
  });
  res.json({
    initialSeats: event.totalSeats,
    remainingSeats: event.availableSeats,
    actualTicketsSold: totalBookings,
  });
});

export default app;
