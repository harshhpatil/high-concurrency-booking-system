import fetch from "node-fetch";

const API_URL = "http://localhost:5000";

async function testRaceCondition() {
  console.log("creating a concert with 10 seats...");

  // creating the event
  const eventResponse = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Avengers Premiere", totalSeats: 10 }),
  });

  const event = await eventResponse.json();
  console.log(
    "event created successfully, event id:",
    event._id,
    "available seats:",
    event.availableSeats,
  );

  // simulating 50 concurrent booking requests for the same event
  const requests = Array.from({ length: 50 }).map((_, index) => {
    return fetch(`${API_URL}/book/good`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event._id,
        userId: `User_${index}`,
      }),
    });
  });

  // executing all using the promise.all to simulate concurrency
  console.log("simulating 50 concurrent booking requests...");
  //   const responses = await Promise.all(requests);

  // checking the damage to the database
  console.log("checking the damage to the database");
  // Fetch the final stats from our new route
  const statsRes = await fetch(`${API_URL}/events/${event._id}/stats`);
  const stats = await statsRes.json();

  console.log(`\n🚨 --- THE DAMAGE REPORT --- 🚨`);
  console.log(`Initial Seats Available : ${stats.initialSeats}`);
  console.log(`Remaining Seats in DB   : ${stats.remainingSeats}`);
  console.log(`Total Bookings Created  : ${stats.actualTicketsSold}`);

  if (stats.actualTicketsSold > stats.initialSeats) {
    console.log(
      `\n🔥 RACE CONDITION CONFIRMED: You oversold the event by ${stats.actualTicketsSold - stats.initialSeats} tickets!`,
    );
  } else {
    console.log(
      `\n✅ No race condition. (If you see this, increase the timeout delay in app.js!)`,
    );
  }
}

testRaceCondition();
