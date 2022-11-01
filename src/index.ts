import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import findNearestCameras from "./utils/findNearestCameras";
import updatedCamObj from "./types/updatedCamObj";

const prisma = new PrismaClient();
dotenv.config();

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT;

app.get("/", async (req: Request, res: Response) => {
  const cameraDetails = await prisma.cameraDB.findMany({});
  const nearestCameras: updatedCamObj[] = findNearestCameras(cameraDetails);
  res.send(nearestCameras);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});