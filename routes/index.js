var express = require('express');
var router = express.Router();
const userModel = require("./users")
const postModel = require("./posts")
const localStrategy = require('passport-local');
const passport = require('passport');
const upload = require('./multer')

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post("/upload", isLoggedIn, upload.single('file'), async (req, res) => {
  if(!req.file) {
    return res.status(404).send("No files were given")
  }

  let user = await userModel.findOne({
    username: req.session.passport.user
  })
 const postdata = await postModel.create({
    image: req.file.filename,
    imagetext: req.body.filecaption,
    user: user._id
  });
  user.posts.push(postdata._id);
  await user.save();
  res.redirect("/profile")
})

router.get('/profile', isLoggedIn, async function(req, res, next) {
  let user = await userModel.findOne({
    username: req.session.passport.user
  }).populate("posts");
  console.log(user)
  res.render('profile', {user})
})

router.get('/login', function(req, res){
  res.render('login', {error: req.flash('error')})
})

router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

router.get('/feed', function(req, res){
  res.render('feed')
})

router.post('/register', function(req, res, next) {
  const { username, email, fullname } = req.body;
const userdata = new userModel({ username, email, fullname });

userModel.register(userdata, req.body.password)
.then(function(){
  passport.authenticate("local")(req, res, function(){
    res.redirect('/profile');
  })
})
});

router.post('/login', passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), function(req, res){});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) return next();
  res.redirect("/")
}

module.exports = router;
