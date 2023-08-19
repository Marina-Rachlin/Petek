import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import u_router from "./routes/users.js";
import multer from "multer";

const app = express();
app.use(cors());

dotenv.config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const __dirname = path.resolve();
app.use("/", express.static(__dirname + "/public"));

app.listen(process.env.PORT || 3030, () => {
  console.log(`run on ${process.env.PORT || 3030}`);
});

app.use("/users", u_router);
