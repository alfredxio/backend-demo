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

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const PlanSchema = new mongoose.Schema({
  name: String,
  price: String,
  validity: String,
  description: String,
});

const User = mongoose.model("User", userSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Plan = mongoose.model("Plan", PlanSchema);

//authenticate
app.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;
  console.log("login requested", email, password);
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
    console.log(err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

//get all users
app.get("/users", async (req, res) => {
  console.log("Get all users requested");
  try {
    const result = await User.find();
    res.send(result);
  } catch (err) {
    console.log(err);
  }
});

// Create a new user
app.post("/users", async (req, res) => {
  try {
    const { email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const newUser = new User({
      ...req.body,
      isActive: false,
      planHistory: [],
      activePlan: null,
      joinedDate: new Date(),
      lastLogin: new Date(),
      id: Math.floor(Math.random() * 10000000), // Generate a random number for id
    });

    const result = await newUser.save();
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user details
app.put("/users/:id", async (req, res) => {
  const { name, phone, email, address } = req.body;
  const user = await User.findById(req.params.id);
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (email) user.email = email;
  if (address) user.address = address;
  const result = await user.save();
  res.send(result);
});

//update complete details
app.put("/userc/:id", async (req, res) => {
  const {
    name,
    email,
    address,
    phone,
    isActive,
    activePlan,
    planEndDate,
    joinedDate,
  } = req.body;
  const user = await User.findById(req.params.id);
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (email) user.email = email;
  if (address) user.address = address;
  if (isActive) user.isActive = isActive;
  if (activePlan) user.activePlan.planName = activePlan;
  if (planEndDate) user.activePlan.planEndDate = planEndDate;
  if (joinedDate) user.joinedDate = joinedDate;
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
app.get("/user/:email", async (req, res) => {
  console.log("asking", req.params.email);
  try {
    const user = await User.findOne({ email: req.params.email });
    const today = new Date();
    if (user?.activePlan?.planEndDate < today) {
      user.isActive = false;
      user.activePlan = null;
      user.planHistory.push(user.activePlan);
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
  const result = await User.findByIdAndDelete(req.params.id);
  res.send(result);
});

//admin-login
app.post("/api/login", async (req, res) => {
  console.log("Login requested");
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username, password });
    if (admin) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//add plan
app.post("/api/plans", async (req, res) => {
  console.log("New plan requested");
  const { name, price, validity, description } = req.body;

  try {
    const newPlan = new Plan({
      name,
      price,
      validity,
      description,
    });

    const savedPlan = await newPlan.save();
    res.status(200).json(savedPlan);
  } catch (error) {
    console.error("Error adding plan:", error);
    res.status(500).json({ error: "Could not save the plan." });
  }
});

//update plan
app.put("/api/plans/:id", async (req, res) => {
  const planId = req.params.id;
  const updatedPlan = req.body;

  try {
    const result = await Plan.findByIdAndUpdate(planId, updatedPlan, {
      new: true,
    });

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "Plan not found" });
    }
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ error: "Could not update the plan." });
  }
});

//delete all plans
app.delete("/api/plans/:id", async (req, res) => {
  const planId = req.params.id;

  try {
    const result = await Plan.findByIdAndDelete(planId);

    if (result) {
      res.status(200).json({ message: "Plan deleted successfully" });
    } else {
      res.status(404).json({ error: "Plan not found" });
    }
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ error: "Could not delete the plan." });
  }
});

//get all plans
app.get("/api/plans", async (req, res) => {
  console.log("Get all plans requested");
  try {
    const result = await Plan.find();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting plans:", error);
    res.status(500).json({ error: "Could not get the plans." });
  }
});

//buy a plan
app.post("/api/buyplan/:id", async (req, res) => {
  const id = req.params.id;
  const { name, price, validity, image } = req.body;

  const user = await User.findById(id);

  const today = new Date();
  const planEndDate = new Date(today);
  planEndDate.setDate(today.getDate() + parseInt(validity, 10));
  user.activePlan = {
    planName: name,
    planStartDate: today,
    planEndDate: planEndDate,
    planAmount: price,
    planId: image,
  };
  user.isActive = true;

  const result = await user.save();
  if (result) res.json({ success: true });
  else res.json({ success: false });
});

app.listen(3000, () => console.log("Server started on port 3000"));
