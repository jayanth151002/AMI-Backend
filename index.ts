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
import http from 'http'
import { Server, Socket } from 'socket.io';
dotenv.config();

AWS.config.update(config);
const app: Express = express();
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
})

io.on("connection", (socket: Socket) => {
  console.log("Connected to client");
});

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
  const { name, rollNo, id } = req.body;
  if (name === '' || rollNo === '' || name === undefined || rollNo === undefined || name === null || rollNo === null || id === '' || id === undefined || id === null) {
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
          id: id,
          frndData: {
            fName: [],
            fPhNo: [],
            fRollNo: []
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

app.post("/add-friend", async (req: Request, res: Response) => {
  const { rollNo, fName, fRollNo, fPhNo } = req.body;
  if (rollNo === '' || fName === '' || fRollNo === '' || fPhNo === '' || rollNo === undefined || fName === undefined || fRollNo === undefined || fPhNo === undefined || rollNo === null || fName === null || fRollNo === null || fPhNo === null) {
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
        }
      };
      db.get(params, async (err, data) => {
        console.log(data)
        if (err) {
          res.status(400).send({
            success: false,
            msg: "Error while fetching profile"
          })
        }
        else {
          if (data?.Item?.frndData.fName.length === 3) {
            res.status(400).send({
              success: false,
              msg: "Maximum number of friends added"
            })
          }
          else if (data?.Item?.frndData.fRollNo.includes(fRollNo)) {
            res.status(400).send({
              success: false,
              msg: "Friend already added"
            })
          }
          else {
            const params = {
              TableName: "userDB",
              Key: {
                rollNo: rollNo
              },
              UpdateExpression: 'set frndData= :f',
              ExpressionAttributeValues: {
                ':f': {
                  "fName": [...data?.Item?.frndData.fName, fName],
                  "fRollNo": [...data?.Item?.frndData.fRollNo, fRollNo],
                  "fPhNo": [...data?.Item?.frndData.fPhNo, fPhNo]
                }
              }
            };
            db.update(params, async (err, data) => {
              if (err) {
                res.status(400).send({
                  err: err,
                  msg: "Error while adding friends",
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
          }
        }
      });
    })
    .catch(error => {
      res.status(400).send({
        msg: "Unauthorized access",
        err: error,
        success: false
      });
    })
})

app.post("/edit-friend", async (req: Request, res: Response) => {
  const { rollNo, frndData } = req.body;
  if (rollNo === '' || frndData === '' || rollNo === undefined || frndData === undefined || rollNo === null || frndData === null) {
    res.status(400).send({
      msg: "Error in editing friends",
      err: "new Error()",
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
        UpdateExpression: 'set frndData= :f',
        ExpressionAttributeValues: {
          ':f': {
            "fName": frndData.fName,
            "fRollNo": frndData.fRollNo,
            "fPhNo": frndData.fPhNo
          }
        }
      };
      db.update(params, async (err, data) => {
        if (err) {
          res.status(400).send({
            err: err,
            msg: "Error while editing friends",
            success: false
          })
        }
        else {
          res.status(200).send({
            msg: "Friends edited successfully",
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
        .then((log) => {
          io.emit("connected", { profile: response, log: log });
          res.status(200).send({
            success: true,
            msg: "Successfully logged",
            data: response
          })
        })
        .catch((err) => {
          res.status(400).send({
            success: false,
            msg: "Error while adding log"
          })
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
  if (lat === '' || long === '' || lat === undefined || long === undefined || lat === null || long === null) {
    res.status(400).send({
      success: false,
      msg: "Error while fetching nearest cameras"
    })
  }
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

server.listen(port, () => console.log(`Listening on port ${port}`));
