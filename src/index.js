import cors from "cors";
import express from "express";
import { v4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { connectToMongoDB } from "./connect.js";
import { URL } from "./models/url.js"
import { nanoid } from "nanoid"
// import {}
import * as dotenv from "dotenv";
dotenv.config();


connectToMongoDB("mongodb+srv://sam:sam@cluster0.6fj0e2q.mongodb.net/?retryWrites=true&w=majority").then(() =>
  console.log("Mongodb connected")
);

const app = express();
// config.update({region: region});
// Init S3 client
console.log(region);

const s3 = new S3Client({credentials: {
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey
},
region: region});

// Setup server middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use("/url", urlRoute);

// Route to create presigned urls
app.post("/presigned", async (req, res) => {
  // Prepare S3 command that will be executed
  const params = {
    Bucket: Bucket,
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
    Bucket: Bucket,
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
      const command = new GetObjectCommand({Bucket: Bucket, Key: key});
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
