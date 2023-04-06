const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth-routes"); // router
require("./config/passport"); // require() => 等同直接執行這個相對路徑的檔案
const session = require("express-session");
const passport = require("passport");
const profileRoutes = require("./routes/profile-routes");
const flash = require("connect-flash");

// 連結 mongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/GoogleDB")
  .then(() => {
    console.log("Connecting to mongoDB....");
  })
  .catch((e) => {
    console.log(e);
  });

// 設定Middlewares以及排版引擎
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // 因localhost並不在 HTTPS 的協議範圍內
  }),
);
app.use(passport.initialize()); // 啟動passport: 讓passport開始運行認證功能
app.use(passport.session()); // 讓passport使用session: (passport.serializeUser)
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  // res.locals設定的屬性可以直接在ejs上做使用 !
  next();
});

// 設定routes
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);

app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

app.listen(8080, () => {
  console.log("Server running on port 8080");
});
