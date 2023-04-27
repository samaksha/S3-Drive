import cors from "cors";
import express from "express";
import { v4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const app = express();

// Init S3 client
const s3 = new S3Client();

// Setup server middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to create presigned urls
app.post("/presigned", async (req, res) => {
  // Prepare S3 command that will be executed
  const params = {
    Bucket: req.body.bucket,
    Key: v4(),
  };
  const command = new PutObjectCommand(params);

  // Generate presigned url (expiration in seconds)
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  res.json({
    code: 200,
    result: presignedUrl,
  });
});

// Start server
app.listen(3000, () => {
  console.log("Application server is running on port 3000...");
});
