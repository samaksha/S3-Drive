import fs from "fs";
import axios from "axios";
import { fileTypeFromBuffer } from "file-type";

(async () => {
  const serverUrl = "http://localhost:3000";

  /**
   * Get presigned url from server.
   * @returns Presigned URL <string>
   */
  const getPresignedUrl = async (bucket) => {
    const url = `${serverUrl}/presigned`;
    const resp = await axios.post(url, { bucket });
    return resp.data.result;
  };

  /**
   * Upload file to S3 using presigned url.
   * @param {*} presignedUrl
   * @param {*} file
   * @param {*} contentType
   */
  const upload = async (presignedUrl, file, contentType) => {
    await axios.put(presignedUrl, file, {
      headers: {
        "Content-Type": contentType,
      },
    });
  };

  const bucket = "";
  const presignedUrl = await getPresignedUrl(bucket);

  const file = fs.readFileSync("./data/sample.png");
  const fileType = await fileTypeFromBuffer(file);
  await upload(presignedUrl, file, fileType.mime);

  console.log("File uploaded successfully");
})();
