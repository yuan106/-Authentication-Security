//jshint esversion:6
require("dotenv").config(); //dotenv
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5"); //hashing passwords
// const bcrypt = require("bcrypt");
// const saltRounds = 10; //bcypt
const session = require("express-session"); //https://www.npmjs.com/package/express-session
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

// console.log(process.env.API_KEY);
// console.log(md5("123456"));

app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

//set up Session
app.use(
  session({
    secret: "Our Little Secret.",
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true },
  })
);

app.use(passport.initialize()); // initialize passport in order to use it
app.use(passport.session()); // use passport to also set up session

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  //new mongoose.Schema: encryption
  email: String,
  password: String,
});
//encryption
// const secret = "this is secret";
// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

userSchema.plugin(passportLocalMongoose); // set up passportlocal mongoose

const User = new mongoose.model("User", userSchema);

//https://www.npmjs.com/package/passport-local-mongoose
// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  //logout: http://www.passportjs.org/docs/logout/
  req.logout();
  res.redirect("/");
});

app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password, function (
    err,
    user
  ) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  //http://www.passportjs.org/docs/login/
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
