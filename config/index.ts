export const MONGO_URL = `mongodb://localhost:27017/${
  process.env.DB_NAME || "online_food_delivery"
}`;
