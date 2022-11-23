import AWS from 'aws-sdk';
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import config from "./aws.config"
import findNearestCamera from "./src/utils/findNearestCameras";
import camObj from './src/types/camObj';
dotenv.config();

AWS.config.update(config);
const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT;

app.get("/", async (req: Request, res: Response) => {
  const docClient = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: "cameraDB",
  };

  docClient.scan(params, (err, data) => {

    if (err) {
      console.log(err)
      res.send({
        success: false,
        message: err
      });
    } else {
      const camData: camObj[] = data.Items as camObj[];
      const nearestCameras = findNearestCamera(camData);
      res.send(nearestCameras)
    }
  });
})


app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});