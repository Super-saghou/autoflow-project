import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import Device from './models/Device.js';
import { exec } from 'child_process';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

// Middleware pour parser JSON
app.use(express.json());

// API pour ajouter un device et lancer playbook
app.post("/api/devices", async (req, res) => {
  const { name, ip } = req.body;
  try {
    const device = new Device({ name, ip });
    await device.save();

    exec(`python3 run_playbook.py ${ip}`, (error, stdout, stderr) => {
      if (error) {
        console.error("Playbook error:", error.message);
        return res.status(500).json({ message: "Playbook failed", error: error.message });
      }
      res.json({ message: "Device saved and playbook executed", output: stdout });
    });

  } catch (error) {
    console.error("Error saving device:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// API pour récupérer tous les devices
app.get("/api/devices", async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: "Error fetching devices" });
  }
});

// API login
app.post('/api/login', (req, res) => {
  console.log('Login request received:', req.body);
  const { username, password } = req.body;
  if (username === "sarra" && password === "sarra") {
    return res.json({ message: "Login successful" });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
});

// Servir les fichiers statiques depuis le dossier public
app.use(express.static(path.join(__dirname, 'public')));

// Route pour servir index.html sur la racine (frontend SPA)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestion des routes inconnues (404 JSON)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
