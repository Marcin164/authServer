require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const argon2 = require("argon2");
const { Schema } = mongoose;

app.use(express.json());
app.use(cors());

let refreshTokens = [];

const userSchema = new Schema({
  email: String,
  password: String,
  name: String,
  isActive: Boolean,
});

const User = mongoose.model("User", userSchema);

app.post("/token", (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken({ name: user.name });
    res.json({ accessToken: accessToken });
  });
});

app.delete("/logout", (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  res.sendStatus(204);
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) "Wrong email or password";

    if (!(await argon2.verify(user.password, password)))
      throw "Wrong email or password";

    const accessToken = generateAccessToken(email);
    const refreshToken = jwt.sign(email, process.env.REFRESH_TOKEN_SECRET);
    refreshTokens.push(refreshToken);
    res
      .status(200)
      .json({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (error) {
    res.status(404).send(error);
  }
});

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
}

mongoose.connect(
  "mongodb+srv://Root:CUErwk1d0cw4WGns@cluster0.ximda.mongodb.net/SoilSensorDB?retryWrites=true&w=majority"
);

app.listen(4000);
