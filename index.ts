import AWS from 'aws-sdk';
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import config from "./aws.config"
import findNearestCamera from "./src/utils/findNearestCameras";
import camObj from './src/types/camObj';
import addLog from './src/utils/addlog';
dotenv.config();

AWS.config.update(config);
const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT;

app.post("/log", async (req: Request, res: Response) => {
  const { rollNo, lat, long } = req.body;
  await addLog(rollNo, lat, long)
    .catch((err) => {
      res.status(400).send({
        success: false,
        msg: "Error while adding log"
      })
    })
  res.status(200).send({
    success: true,
    msg: "Successfully logged"
  })

})

app.get('/get-logs', async (req: Request, res: Response) => {
  const db = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: "logDB",
  };
  db.scan(params, async (err, data) => {
    if (err) {
      res.status(400).send({
        success: false,
        msg: "Error while fetching logs"
      })
    }
    else {
      res.status(200).send({
        success: true,
        msg: "Successfully fetched logs",
        data: data.Items
      })
    }
  });
})

app.get('/get-nearest-cameras', async (req: Request, res: Response) => {
  const { lat, long } = req.body;
  const db = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: "cameraDB",
  };

  db.scan(params, async (err, data) => {

    if (err) {
      console.log(err)
      res.send({
        success: false,
        msg: "Error while fetching data"
      });
    } else {
      const camData: camObj[] = data.Items as camObj[];
      const nearestCameras = await findNearestCamera(camData, Number(lat), Number(long));
      res.status(200).send({
        success: true,
        msg: "Successfully fetched nearest cameras",
        data: nearestCameras
      })
    }
  });
})


app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});