import express from "express";
import dotenv from "dotenv";
import { connectDB } from './config/db.js';
dotenv.config();
const app = express();
app.get("/products", (req, res) => {});
app.use((req, res) => {
    res.send('Welcome to Autoflow');
    console.log(req);
  }); 


app.listen(5000, () => {
    connectDB();
    console.log("Server started at http://localhost:5000");

});
// 1pA39c9rUl7I0SR8 
