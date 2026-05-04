## QUIZFLIP KEY LIBRARIES SYNTAX

### Backend Imports

```js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import pdfParse from "pdf-parse";
import { z } from "zod";
```

### Backend Internal Imports

```js
import { connectDb } from "./config/db.js";
import { bootstrapSystem } from "./config/bootstrap.js";
import { app } from "./app.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";
import User from "../models/User.js";
```

### Frontend Imports

```js
import { Suspense, lazy, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../services/api.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js";
import CalendarHeatmap from "react-calendar-heatmap";
import { motion } from "framer-motion";
import { Stage, Layer, Rect, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { useAuth } from "../context/AuthContext.jsx";
```

### Core Function Syntax

```js
const app = express();
app.use(middleware);
app.get("/path", handler);
app.listen(PORT, HOST, callback);

dotenv.config();

await mongoose.connect(MONGO_URI);
const schema = new mongoose.Schema({});
const Model = mongoose.model("Name", schema);

const hash = await bcrypt.hash(password, 10);
const ok = await bcrypt.compare(password, hash);

const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
const decoded = jwt.verify(token, ACCESS_SECRET);

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });
upload.single("file");

const pdf = await pdfParse(fileBuffer);

const schemaZod = z.object({ email: z.string().email(), password: z.string().min(6) });
schemaZod.parse(payload);

const token = signAccessToken(userId, role);
const refresh = signRefreshToken(userId, role);
const session = verifyRefreshToken(refreshToken);

const [state, setState] = useState(initialValue);
useEffect(() => {}, []);
const Page = lazy(() => import("./Page.jsx"));
const navigate = useNavigate();
navigate("/domains");

const client = axios.create({ baseURL: API_URL });
await api.post("/auth/login", payload);
await api.get("/api/health");
```