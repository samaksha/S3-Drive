import { Router, response } from "express";
import express from "express";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import auth from "./auth.js";
import { USERS, URL } from "./models/url.js";
import cors from "cors";
// import { connectToMongoDB } from "./dbconnect.js";
const corsfunc = cors;
const { sign, decode, verify } = jsonwebtoken;
const app = express();
const router = Router();
const API_SECRET = "this_is_secret";

// router.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, DELETE, PATCH, OPTIONS"
//   );
//   next();
// });

// router.use(corsfunc());
// app.use(corsfunc());

// body parser configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

router.get("/", (request, response, next) => {
  // console.log(request);
  response.json({ message: "Hey! This is your server response!" });
  next();
});

// register endpoint
router.post("/register", async (request, response) => {
  // hash the password
  console.log(request.body.password);
  try {
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    console.log(hashedPassword);
    const user = await USERS.create({
      email: request.body.email,
      password: hashedPassword,
    });

    console.log("working");
    return response
      .status(201)
      .send({ message: "User Created Successfully", user: user });
  } catch (e) {
    response.status(500).send({
      message: "Password was not hashed successfully",
      e,
    });
  }
});

// login endpoint
router.post("/login", (request, response) => {
  // check if email exists
  // request.header("Access-Control-Allow-Origin", "*");
  USERS.findOne({ email: request.body.email })

    // if email exists
    .then((user) => {
      // compare the password entered and the hashed password found
      bcrypt
        .compare(request.body.password, user.password)

        // if the passwords match
        .then((passwordCheck) => {
          // console.log(passwordCheck,request.body.password,user.password);
          // check if password matches
          if (!passwordCheck) {
            console.log("how");
            return response.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }

          //   create JWT token
          const token = sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            API_SECRET,
            { expiresIn: "24h" }
          );

          //   return success response
          response
            .status(200)
            .cookie("access_token", token, {
              httpOnly: true,
            })
            .send({
              message: "Login Successful",
              email: user.email,
              token,
            });
        })
        // catch error if password do not match
        .catch((error) => {
          response.status(500).send({
            message: "server error",
            error,
          });
        });
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

router.get("/user", auth, (req, res) => {
  if (req.user) {
    console.log("auth-user-success");
    return res.status(200).send({ message: "auth success" });
  } else return res.status(400);
});

// free endpoint
router.get("/free-endpoint", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

// authentication endpoint
router.get("/auth-endpoint", auth, (request, response) => {
  console.log(request.user);
  response.send({ message: "You are authorized to access me" });
});

router.get("/free", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

router.post("/logout", (request, response) => {
  return response
    .clearCookie("access_token")
    .status(200)
    .json({ message: "Successfully logged out" });
});

export default router;
