import mongoose from "mongoose";

// defining the event schema
const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
    },
    availableSeats: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const Event = mongoose.model("Event", eventSchema); // creating the event model
export default Event; // exporting the event model
