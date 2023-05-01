import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
  })
  .then(() => console.log("Database connected"))
  .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("Message", userSchema);

//Using MiddleWare
const app = express();

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Setting up View Engine
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { tokeb } = req.cookies;
  if (tokeb) {
    const decoded = jwt.verify(tokeb, "this is json token");
    console.log(decoded);
    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("logout", { name: req.user.name });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });

  if (!user) return res.redirect("/register");

  // const isMatch = user.password === password;

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch)
    return res.render("login", { email, message: "Incorrect Password" });

  const tokeb = jwt.sign({ _id: user._id }, "this is json token");

  res.cookie("tokeb", tokeb, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });
  const tokeb = jwt.sign({ _id: user._id }, "this is json token");
  console.log("Value of tokeb is", tokeb);

  res.cookie("tokeb", tokeb, {
    httpOnly: true,

    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("tokeb", "", {
    httpOnly: true,

    expires: new Date(Date.now() + 10 * 1000),
  });
  res.redirect("/");
});

app.listen(5000, () => {
  console.log("Server is Workig in Express ");
});

// Notes

/*app.get("/add", async (req, res) => {
  await Messge.create({ name: "Avhi-2", email: "sample-1@gmail.com" });
  res.send("This is add page again");
});

app.get("/success", (req, res) => {
  res.render("success");
});

app.post("/contact", async (req, res) => {
  await Messge.create({ name: req.body.name, email: req.body.email });
  res.redirect("/success");
});

app.get("/users", (req, res) => {
  res.json({
    users,
  });
});

*/
