const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(
  "mongodb+srv://rohit45raj:Rohit_Raj_45@cluster0.c55os8w.mongodb.net/recharge",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

const userSchema = new mongoose.Schema({
  id: Number,
  name: String,
  email: String,
  password: String,
  phone: String,
  address: String,
  isActive: Boolean,
  planHistory: [
    {
      planName: String,
      planId: String,
      planStartDate: Date,
      planEndDate: Date,
      planAmount: Number,
    },
  ],
  activePlan: {
    planName: String,
    planId: String,
    planStartDate: Date,
    planEndDate: Date,
    planAmount: Number,
  },
  joinedDate: Date,
  lastLogin: Date,
});

const User = mongoose.model("User", userSchema);

// Create a new user
app.post("/users", async (req, res) => {
  console.log(req.body);
  try {
    const newUser = new User({
      ...req.body,
      isActive: false,
      planHistory: [],
      activePlan: null,
      joinedDate: new Date(),
      lastLogin: new Date(),
      id: Math.floor(Math.random() * 1000000), // Generate a random number for id
    });
    const result = await newUser.save();
    res.send(result);
  } catch (err) {
    console.log(err);
  }
});

//authenticate
app.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    if (user.password === password) {
      return res.json({ success: true, message: "Authentication successful" });
    } else {
      return res.json({ success: false, message: "Authentication failed" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


// Update user details
app.put("/users/:id", async (req, res) => {
  const { name, phone, email, address } = req.body;
  const user = await User.findOne({ id: req.params.id });
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (email) user.email = email;
  if (address) user.address = address;
  const result = await user.save();
  res.send(result);
});

// Add a new plan
app.post("/users/:id/plans", async (req, res) => {
  const user = await User.findOne({ id: req.params.id });
  user.planHistory.push(req.body);
  user.activePlan = req.body;
  const result = await user.save();
  res.send(result);
});

// Fetch user details
app.get("/users/:id", async (req, res) => {
  console.log("asking", req.params.id);
  try {
    const user = await User.findOne({ id: req.params.id });
    const today = new Date();
    if (user.activePlan.planEndDate < today) {
      user.isActive = false;
      user.activePlan = null;
      const result = await user.save();
      res.send(result);
    } else {
      res.send(user);
    }
  } catch (err) {
    console.log(err);
  }
});

//delete user
app.delete("/users/:id", async (req, res) => {
  const result = await User.deleteOne({ id: req.params.id });
  res.send(result);
});

app.listen(3000, () => console.log("Server started on port 3000"));
