import "dotenv/config";
import app from "./app.js";
import dbConnection  from "./config/dbConnection.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await dbConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();
