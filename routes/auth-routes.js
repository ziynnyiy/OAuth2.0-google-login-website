const router = require("express").Router();
const passport = require("passport");
const User = require("../models/user-model");
const bcrypt = require("bcrypt");

router.get("/login", (req, res) => {
  return res.render("login", { user: req.user });
});

router.get("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) return res.send(err);
    return res.redirect("/");
  });
});

// 此為前往註冊頁面的route
router.get("/signup", (req, res) => {
  return res.render("signup", { user: req.user });
});

// 此為 google (OAuth) 驗證的route
router.get(
  "/google",
  // passport.authenticate("google") => 會直接去執行GoogleStrategy
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);

// 此為註冊本地帳戶的 route
router.post("/signup", async (req, res) => {
  let { name, email, password } = req.body;
  if (password.length < 8) {
    req.flash("error_msg", "密碼長度過短，至少需要8個數字或英文字。");
    return res.redirect("/auth/signup");
  }

  // 確認信箱是否被註冊過
  const foundEmail = await User.findOne({ email }).exec();
  if (foundEmail) {
    // req.flash() 後項參數為前項參數的值，而且type為string
    req.flash(
      "error_msg",
      "信箱已被註冊，請使用另一個信箱，或者嘗試使用此信箱登入系統",
    );
    return res.redirect("/auth/signup");
  }

  let hashedPassword = await bcrypt.hash(password, 12);
  let newUser = new User({ name, email, password: hashedPassword });
  await newUser.save();
  req.flash("success_msg", "恭喜註冊成功! 現在可以登入系統了!");
  return res.redirect("/auth/login");
});

// 此為本地登入驗證的route
router.post(
  "/login",
  // passport.authenticate("local") => 會直接去執行LocalStrategy
  passport.authenticate("local", {
    failureRedirect: "/auth/login",
    failureFlash: "登入失敗。帳號或密碼不正確。", // 會被自動套入 req.flash("error")
  }),
  (req, res) => {
    return res.redirect("/profile");
  },
);

// 這個route需要經過google驗證才能使用，所以需要加這個passport的middleware
router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  console.log("進入redirect區域");
  return res.redirect("/profile");
});

module.exports = router;
