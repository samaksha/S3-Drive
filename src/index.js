import cors from "cors";
import express from "express";
import { v4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { connectToMongoDB } from "./dbconnect.js";
import { URL } from "./models/url.js"
import { nanoid } from "nanoid"
// import { }
import path from 'path'
import * as dotenv from "dotenv";
var dirName = path.resolve();
dotenv.config({path : path.join(dirName,'/src/','.env')});

connectToMongoDB(process.env.DB_URL).then(() =>
  console.log("Mongodb connected")
);

const app = express();
// config.update({region: region});
// Init S3 client
// console.log(process.env.AWS_REGION);

const s3 = new S3Client({credentials: {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
},
region: process.env.AWS_REGION});

// Setup server middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// register endpoint
// app.post("/register", (request, response) => {
//   // hash the password
//   bcrypt
//     .hash(request.body.password, 10)
//     .then((hashedPassword) => {
//       // create a new user instance and collect the data
//       const user = new User({
//         email: request.body.email,
//         password: hashedPassword,
//       });

//       // save the new user
//       user
//         .save()
//         // return success if the new user is added to the database successfully
//         .then((result) => {
//           response.status(201).send({
//             message: "User Created Successfully",
//             result,
//           });
//         })
//         // catch erroe if the new user wasn't added successfully to the database
//         .catch((error) => {
//           response.status(500).send({
//             message: "Error creating user",
//             error,
//           });
//         });
//     })
//     // catch error if the password hash isn't successful
//     .catch((e) => {
//       response.status(500).send({
//         message: "Password was not hashed successfully",
//         e,
//       });
//     });
// });

// // login endpoint
// app.post("/login", (request, response) => {
//   // check if email exists
//   User.findOne({ email: request.body.email })

//     // if email exists
//     .then((user) => {
//       // compare the password entered and the hashed password found
//       bcrypt
//         .compare(request.body.password, user.password)

//         // if the passwords match
//         .then((passwordCheck) => {

//           // check if password matches
//           if(!passwordCheck) {
//             return response.status(400).send({
//               message: "Passwords does not match",
//               error,
//             });
//           }

//           //   create JWT token
//           const token = jwt.sign(
//             {
//               userId: user._id,
//               userEmail: user.email,
//             },
//             "RANDOM-TOKEN",
//             { expiresIn: "24h" }
//           );

//           //   return success response
//           response.status(200).send({
//             message: "Login Successful",
//             email: user.email,
//             token,
//           });
//         })
//         // catch error if password do not match
//         .catch((error) => {
//           response.status(400).send({
//             message: "Passwords does not match",
//             error,
//           });
//         });
//     })
//     // catch error if email does not exist
//     .catch((e) => {
//       response.status(404).send({
//         message: "Email not found",
//         e,
//       });
//     });
// });

// // free endpoint
// app.get("/free-endpoint", (request, response) => {
//   response.json({ message: "You are free to access me anytime" });
// });

// // authentication endpoint
// app.get("/auth-endpoint", auth, (request, response) => {
//   response.send({ message: "You are authorized to access me" });
// });


app.post("/presigned", async (req, res) => {
  // Prepare S3 command that will be executed
  const params = {
    Bucket: process.env.AWS_REGION,
    Key: v4(),
  };
  const command = new PutObjectCommand(params);
  // console.log(s3);
  // Generate presigned url (expiration in seconds)
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  const id = nanoid(10)
  await URL.create({
    shortId: id,
    redirectURL: params.Key,
  });

  res.json({
    code: 200,
    result: {presignedUrl: presignedUrl, shortId: id},
  });
});


app.get("/upload/:id", async (req, res) => {
  const shortId = req.params.id;
  const entry = await URL.findOne(
    {
      shortId,
    }
  );
  if(!entry) return res.json({code:400});
  // console.log(entry.redirectURL);
  var resURL = await getPresignedUrls(entry.redirectURL);
  console.log(resURL);
  if(!resURL || resURL.presignedUrls == 0) res.json({code:400}); 
  res.redirect(resURL.presignedUrls[0]);
});

const getKeys = async () => {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_REGION,
  });
  try {
  const { Contents = [] } = await s3.send(command);
  // const result = await s3.send(command);
  // console.log(result);
  // console.log(contents);
  return Contents.map((files) => files.Key);
  }
  catch(err)
  {
    console.log(err);
    return [];
  }
}

const getPresignedUrls = async(redirectURL) => {
  try {
    const fileKeys = await getKeys();
    const filteredFileKeys = fileKeys.filter((key) => {if(key == redirectURL) return key});
    console.log(filteredFileKeys);

    const presignedUrls = await Promise.all(filteredFileKeys.map((key) => {
      const command = new GetObjectCommand({Bucket: process.env.AWS_REGION, Key: key});
      const result =  getSignedUrl(s3, command, {expiresIn: 900});
      return (result);
    }));

    return { presignedUrls };
  }
  catch(err) {
    console.log(err);
    return {err};
  }
};


// Start server
app.listen(3000, () => {
  console.log("Application server is running on port 3000...");
});
