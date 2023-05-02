import cors from "cors";
import express from "express";
import { v4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { connectToMongoDB } from "./dbconnect.js";
import { USERS, URL } from "./models/url.js";
import { nanoid } from "nanoid";
// import { }
import path from "path";
import * as dotenv from "dotenv";
var dirName = path.resolve();
dotenv.config({ path: path.join(dirName, "/src/", ".env") });
import api from "./api.js";
import auth from "./auth.js";
import cookieParser from "cookie-parser";

connectToMongoDB(process.env.DB_URL).then(() =>
  console.log("Mongodb connected")
);

const app = express();
// config.update({region: region});
// Init S3 client

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://s3-drive-git-master-kumarsamaksha21.vercel.app"
  );
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// Setup server middlewares
// app.use(cors());
// app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", api);

app.post("/presigned", auth, async (req, res) => {
  // Prepare S3 command that will be executed
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: v4(),
  };
  const command = new PutObjectCommand(params);
  // Generate presigned url (expiration in seconds)
  try {
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const id = nanoid(10);
    await URL.create({
      shortId: id,
      redirectURL: params.Key,
    });

    if (req.user) {
      const user = await USERS.findOne({ email: req.user.userEmail });
      user.links.push({ id: id, key: params.Key });
      await user.save();
      console.log("pushed link");
    }

    return res.json({
      code: 200,
      result: { presignedUrl: presignedUrl, shortId: id },
    });
  } catch (err) {
    console.log(err);
    return res.json({ code: 400 });
  }
});

app.get("/uploads", auth, async (req, res) => {
  try {
    if (req.user) {
      const user = await USERS.findOne({ email: req.user.userEmail });
      if (user) {
        const result = user.links.map((p) => p.id);

        return res.status(200).send({ links: result });
      }
    } else return res.status(400);
  } catch (err) {
    return res.status(400).send();
  }
});

app.get("/upload/:id", async (req, res) => {
  const shortId = req.params.id;
  const entry = await URL.findOne({ shortId });

  if (!entry) return res.json({ code: 400 });

  var resURL = await getPresignedUrls(entry.redirectURL);

  if (!resURL || resURL.presignedUrls.length == 0)
    return res.json({ code: 400 });

  return res.redirect(resURL.presignedUrls[0]);
});

const getKeys = async () => {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME,
  });
  try {
    const { Contents = [] } = await s3.send(command);
    return Contents.map((files) => files.Key);
  } catch (err) {
    return [];
  }
};

const getPresignedUrls = async (redirectURL) => {
  try {
    const fileKeys = await getKeys();
    const filteredFileKeys = fileKeys.filter((key) => {
      if (key == redirectURL) return key;
    });

    const presignedUrls = await Promise.all(
      filteredFileKeys.map((key) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        });
        const result = getSignedUrl(s3, command, { expiresIn: 900 });
        return result;
      })
    );

    return { presignedUrls };
  } catch (err) {
    return { err };
  }
};

// Start server
app.listen(3000, () => {
  console.log("Application server is running on port 3000...");
});
