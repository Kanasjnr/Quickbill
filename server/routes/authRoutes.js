const express = require("express");
const passport = require('passport');
const { signUp, signIn, googleAuthCallback} = require("../controllers/authController");

const router = express.Router();

// Google Signup with optional Google authentication
router.get('/googleauth',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/googleauth/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  googleAuthCallback
);

router.post("/signup", signUp);
router.post("/signin", signIn);

module.exports = router;