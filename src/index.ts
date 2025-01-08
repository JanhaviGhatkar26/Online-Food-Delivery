import express from "express";
import initializeApp from "./services/ExpressApp";
import dbConnection from "./services/Database";
import { PORT } from "./config";

const StartServer = async () => {
  const app = express();
  await dbConnection();

  // await App(app);
  await initializeApp(app);
  app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`);
  });
};

StartServer();
console.clear();
