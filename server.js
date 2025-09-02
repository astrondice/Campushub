const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/src", express.static(path.join(__dirname, "src")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Placeholder: login, signup, competitions, voting APIs

app.listen(PORT, () => console.log(`CampusHub running at http://localhost:${PORT}`));
