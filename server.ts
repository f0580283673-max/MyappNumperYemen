import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const app = express();
const PORT = 3000;

// Initialize Database
const db = new Database("yemen_numbers.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phoneNumber TEXT NOT NULL,
    name TEXT NOT NULL,
    userId TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_phone ON contacts(phoneNumber);
  CREATE INDEX IF NOT EXISTS idx_name ON contacts(name);
`);

app.use(express.json());

// API Routes
app.get("/api/search/number", (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query" });
  
  const results = db.prepare("SELECT name, phoneNumber FROM contacts WHERE phoneNumber = ?").all(q);
  res.json(results);
});

app.get("/api/search/name", (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query" });
  
  const results = db.prepare("SELECT name, phoneNumber FROM contacts WHERE name LIKE ?").all(`%${q}%`);
  res.json(results);
});

app.get("/api/names", (req, res) => {
  const results = db.prepare("SELECT DISTINCT name FROM contacts LIMIT 100").all();
  res.json(results);
});

app.post("/api/upload", (req, res) => {
  const { contacts, userId } = req.body;
  if (!contacts || !Array.isArray(contacts)) return res.status(400).json({ error: "Invalid data" });

  const insert = db.prepare("INSERT INTO contacts (phoneNumber, name, userId) VALUES (?, ?, ?)");
  const insertMany = db.transaction((data) => {
    for (const contact of data) {
      // Basic normalization: remove spaces and non-digits, handle +967
      let phone = contact.phoneNumber.replace(/\s+/g, "").replace(/\D/g, "");
      if (phone.startsWith("967")) phone = "0" + phone.slice(3);
      if (phone.startsWith("00967")) phone = "0" + phone.slice(5);
      
      insert.run(phone, contact.name, userId);
    }
  });

  insertMany(contacts);
  res.json({ success: true, count: contacts.length });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
