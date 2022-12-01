import AWS from 'aws-sdk';
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from 'cors'
import config from "./aws.config"
import findNearestCamera from "./src/utils/findNearestCameras";
import verifyUser from "./src/utils/verifyUser";
import camObj from './src/types/camObj';
import addLog from './src/utils/addlog';
import getTimestamp from './src/utils/getTimestamp';
dotenv.config();

AWS.config.update(config);
const app: Express = express();
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT;

app.get("/", async (req: Request, res: Response) => {
  res.send("Connected to server");
})

app.post("/signin", async (req: Request, res: Response) => {
  const rollNo = req.body.rollNo;
  if (rollNo === '' || rollNo === undefined || rollNo === null) {
    res.status(400).send({
      msg: "Error in signing in",
      err: new Error("Empty fields"),
      success: false
    });
  }
  const db = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: "userDB",
    Key: {
      "rollNo": rollNo
    }
  };

  verifyUser(rollNo)
    .then((response) => {
      db.get(params, async (err, data) => {
        if (err) {
          res.status(400).send({
            msg: "Error in signing in",
            err: err,
            success: false
          });
        }
        else {
          res.status(200).send({
            msg: "Signed in successfully",
            success: true,
            data: data.Item
          });
        }
      })
    })
    .catch(error => {
      res.status(400).send({
        msg: "Unauthorized access",
        err: error,
        success: false
      });
    })
})

app.post("/signup", async (req: Request, res: Response) => {
  const { name, rollNo, phNo } = req.body;
  if (name === '' || rollNo === '' || phNo === '' || name === undefined || rollNo === undefined || phNo === undefined || name === null || rollNo === null || phNo === null) {
    res.status(400).send({
      msg: "Error in signing up",
      err: new Error("Empty fields"),
      success: false
    });
  }
  verifyUser(rollNo)
    .then(response => {
      res.status(400).send({
        msg: "User already exists",
        success: false
      });
    })
    .catch(error => {
      const db = new AWS.DynamoDB.DocumentClient();
      const params = {
        TableName: "userDB",
        Item: {
          name: name,
          rollNo: rollNo,
          phNo: phNo,
          f1: {
            fName1: "",
            fPhNo1: "",
            fRollNo1: ""
          },
          f2: {
            fName2: "",
            fPhNo2: "",
            fRollNo2: ""
          },
          timestamp: getTimestamp()
        }
      };

      db.put(params, (err, data) => {
        if (err) {
          res.status(400).send({
            msg: "Error in signing up",
            err: err,
            success: false
          });
        }
        else {
          res.status(200).send({
            msg: "Signed up successfully",
            success: true
          });
        }
      })
    })
})

app.post("/add-friends", async (req: Request, res: Response) => {
  const { rollNo, fName1, fRollNo1, fPhNo1, fName2, fRollNo2, fPhNo2 } = req.body;
  if (rollNo === '' || fName1 === '' || fRollNo1 === '' || fPhNo1 === '' || fName2 === '' || fRollNo2 === '' || fPhNo2 === '' || rollNo === undefined || fName1 === undefined || fRollNo1 === undefined || fPhNo1 === undefined || fName2 === undefined || fRollNo2 === undefined || fPhNo2 === undefined || rollNo === null || fName1 === null || fRollNo1 === null || fPhNo1 === null || fName2 === null || fRollNo2 === null || fPhNo2 === null) {
    res.status(400).send({
      msg: "Error in adding friends",
      err: new Error("Empty fields"),
      success: false
    });
  }
  verifyUser(rollNo)
    .then(response => {
      const db = new AWS.DynamoDB.DocumentClient();
      const params = {
        TableName: "userDB",
        Key: {
          rollNo: rollNo
        },
        UpdateExpression: 'set friends= :f',
        ExpressionAttributeValues: {
          ':f': {
            "f1": {
              "fName1": fName1,
              "fRollNo1": fRollNo1,
              "fPhNo1": fPhNo1
            },
            "f2": {
              "fName2": fName2,
              "fRollNo2": fRollNo2,
              "fPhNo2": fPhNo2
            }
          }
        }
      };
      db.update(params, async (err, data) => {
        if (err) {
          res.status(400).send({
            msg: "Error in adding friends",
            success: false
          })
        }
        else {
          res.status(200).send({
            msg: "Friends added successfully",
            success: true
          })
        }
      })
    })
    .catch(error => {
      res.status(400).send({
        msg: "Unauthorized access",
        err: error,
        success: false
      });
    })
})

app.post("/log", async (req: Request, res: Response) => {
  const { rollNo, lat, long } = req.body;
  if (rollNo === '' || lat === '' || long === '' || rollNo === undefined || lat === undefined || long === undefined || rollNo === null || lat === null || long === null) {
    res.status(400).send({
      msg: "Error in adding log",
      err: new Error("Empty fields"),
      success: false
    });
  }
  verifyUser(rollNo)
    .then(response => {
      addLog(rollNo, lat, long)
        .catch((err) => {
          res.status(400).send({
            success: false,
            msg: "Error while adding log"
          })
        })
      res.status(200).send({
        success: true,
        msg: "Successfully logged",
        data: response
      })
    })
    .catch(err => {
      res.status(400).send({
        success: false,
        msg: "Unauthorized access"
      })
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

app.post('/get-nearest-cameras', async (req: Request, res: Response) => {
  const { lat, long } = req.body;
  const db = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: "cameraDB",
  };

  db.scan(params, async (err, data) => {

    if (err) {
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

app.post('/get-profile', async (req: Request, res: Response) => {
  const { rollNo } = req.body;
  if (rollNo === '' || rollNo === undefined || rollNo === null)
    res.status(400).send({
      success: false,
      msg: "Error while fetching profile"
    })
  const db = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: "userDB",
    Key: {
      rollNo: rollNo
    }
  };
  db.get(params, async (err, data) => {
    if (err) {
      res.status(400).send({
        success: false,
        msg: "Error while fetching profile"
      })
    }
    else {
      res.status(200).send({
        success: true,
        msg: "Successfully fetched profile",
        data: data.Item
      })
    }
  });
})


app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
