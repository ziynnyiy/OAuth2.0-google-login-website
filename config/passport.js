const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const User = require("../models/user-model");
const LocalStategy = require("passport-local");
const bcrypt = require("bcrypt");

passport.serializeUser((user, done) => {
  console.log("Serialize使用者。。。");
  done(null, user._id); // 將 mongoDB的id，存在session
  // 並且將id簽名後，以Cookie的形式給使用者
});

// serializeUser執行完後，passport會自動執行callbackURL的 route
// 進入此route後，passport會自動執行deserializeUser()
passport.deserializeUser(async (_id, done) => {
  console.log(
    "deserialize使用者。。。使用serializeUser儲存的id，去找資料庫內的資料",
  );
  let foundUser = await User.findOne({ _id }); // _id <=> _id: _id
  done(null, foundUser); // 將req.user這個屬性設定為foundUser
});

// middleware-(GoogleStrategy)
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/redirect",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("進入Google Strategy的區域");
      // console.log(profile);
      // console.log("========================");
      let foundUser = await User.findOne({ googleID: profile.id }).exec();
      if (foundUser) {
        console.log("使用者已經註冊過了。無須存入資料庫內。");
        done(null, foundUser); // 如果此函式被執行，會自動執行passport.serializeUser()
      } else {
        console.log("偵測到新用戶。須將資料存入資料庫內。");
        let newUser = new User({
          name: profile.displayName,
          googleID: profile.id,
          thumbnail: profile.photos[0].value,
          email: profile.emails[0].value,
        });
        let savedUser = await newUser.save();
        console.log("成功創建新用戶");
        done(null, savedUser); // 如果此函式被執行，會自動執行passport.serializeUser()
      }
    },
  ),
);

// middleware-(LocalStrategy)
passport.use(
  // username, password 會自動被"login.ejs"內部，發送post request的form內所設定
  // 對應的input 給套入
  new LocalStategy(async (username, password, done) => {
    let foundUser = await User.findOne({ email: username }).exec();
    if (foundUser) {
      let result = await bcrypt.compare(password, foundUser.password);
      if (result) {
        done(null, foundUser); // 如果此函式被執行，會自動執行passport.serializeUser()
      } else {
        done(null, false); // false => 表示沒有被LocalStrategy驗證成功: (密碼錯誤)
      }
    } else {
      done(null, false); // false => 表示沒有被LocalStrategy驗證成功: (查無此人)
    }
  }),
);
