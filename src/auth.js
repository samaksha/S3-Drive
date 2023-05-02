// const jwt = require("jsonwebtoken");
import jsonwebtoken from "jsonwebtoken";
const API_SECRET = "this_is_secret";
const { sign, decode, verify } = jsonwebtoken;

const auth = async (request, response, next) => {
  try {
    //   get the token from the authorization header
    // const token = await request.headers.authorization.split(" ")[1];
    console.log("request.cookies" + request.cookies);
    const token = request.cookies.access_token;
    console.log("token" + token);
    //check if the token matches the supposed origin
    const decodedToken = await verify(token, API_SECRET);

    // retrieve the user details of the logged in user
    const user = await decodedToken;

    // pass the the user down to the endpoints here
    request.user = user;

    // pass down functionality to the endpoint
    next();
  } catch (error) {
    // response.status(401).json({
    //   error: new Error("Invalid request!"),
    // });
    console.log("unauth");
    next();
  }
};

export default auth;
