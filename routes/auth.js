const express = require("express");
const UserCollection = require("../Models/User");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const JWT_SECRET = "qwertyuiop";

// user Signup
router.post(
  "/signup",
  [
    body("email", "Enter a valid email").isEmail(),
    body("name"),
    body("password"),
  ],
  async (req, res) => {
    //if there are errors, return bad request and error
    const errors = validationResult(req);
    let sucess = false;
    if (!errors.isEmpty()) {
      return res.status(400).json({ sucess: sucess, errors: errors.array() });
    }

    //check email already exist or not
    try {
      let user = await UserCollection.findOne({ email: req.body.email });
      if (user) {
        return res.status(400).json({
          sucess: sucess,
          errors: "sorry a user with this email already exist",
        });
      }
      const salt = await bcrypt.genSalt(10);
      secpass = await bcrypt.hash(req.body.password, salt);

      //create ney user
      user = await UserCollection.create({
        name: req.body.name,
        password: secpass,
        email: req.body.email,
      });

      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      // console.log(authtoken)
      sucess = true;
      res.json({ sucess, authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("some error occured");
    }
  }
);

//uthenticate a user "./api/auth/login"
//ROUte 2
router.post(
  "/login",
  [
    // body('name', 'Enter a valid name').isLength({min:5}),
    body("password", "password cannot be blank").exists(),

    body("email", "Enter a valid email").isEmail(),
  ],
  async (req, res) => {
    //if there are errors, return bad request and error
    console.log("calling",req.body.email)
    const errors = validationResult(req);
    let sucess = false;
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    console.log(email,password)
    try {
      let user = await UserCollection.findOne({ email });
      if (!user) {
        sucess = false;
        return res
          .status(400)
          .json({ sucess: sucess, errors: "eamil id is not registered" });
      }
      const passcompare = await bcrypt.compare(password, user.password);
      if (!passcompare) {
        sucess = false;
        return res
          .status(400)
          .json({ sucess: sucess, errors: "incorrect password" });
      }
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      // console.log(authtoken)
      sucess = true;

      res.json({ sucess, authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("internal server error occured");
    }
  }
);

const fetchuser = (req, res, next) => {
  //get user from the jwt token and add to req object
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ error: "please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    console.log(error)
    res.status(401).send({ error: "dont know" });
  }
};

router.post("/getuser", fetchuser, async (req, res) => {
  try {
    let userId = req.user.id;
  

    const user = await UserCollection.findById(userId).select(
      "-password"
    );
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("internal server error occured");
  }
});

router.post("/addscore",  body("email"),
    body("score"),async (req, res) => {
  try {
   let user = await UserCollection.findOne({ email:req.body.email });
    user.score = req.body.score;
    await user.save()
    res.json({sucess:true, user });
    console.log(user)
  }
  catch(error) {
    console.log(error)
  }
})

router.post(
  "/getallscores",
  async (req, res) => {
    try {
    
      const users=await UserCollection.find()
      res.json(users);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("some error occured");
    }
  }
);

module.exports = router;