const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const appServer = http.createServer(app);

// const path = require("path");
const path = require("path");
const { swaggerUi, swaggerSpec } = require("./swagger");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const authRoutes = require("./routes/authRoutes");
const customerAccountRoutes = require("./routes/customerAccountRoutes");
const regionRoutes = require("./routes/regionRoutes");
const zoneRoutes = require("./routes/zoneRoutes");
const woredaRoutes = require("./routes/woredaRoutes");
const teamRoutes = require("./routes/teamRoutes");

const cityRoute = require("./routes/cityRouter");
const subcityRouter = require("./routes/subcityRoute");
const addressRoute = require("./routes/adressRouter");
const bodyParser = require("body-parser");
const caseTypeRoute = require("./routes/caseType");
const agendaRoute = require("./routes/agendaRouter");
const statusRoute = require("./routes/statusWithAgendaRouter");
const complaintRoute = require("./routes/complaintRouter");
const disciplinaryRequestRoute = require("./routes/disciplinaryRequestRoute");
const complaintCaseRoute = require("./routes/complaintCaseRoute");
const fileOrganizerRoute = require("./routes/fileOrganizerRouter");
const criminalComplaintCaseRoute = require("./routes/criminalComplaintCaseRoute");

const expertAttachmentRoutes = require("./routes/expertAttachementRouter");

const notificationRoutes = require("./routes/notificationRoutes");

const informExprtRoute = require("./routes/informExpertRoute");

const finalDecisionRoute = require("./routes/councilDecisionRoutes");

const judiciaryDirectorRoutes = require("./routes/judiciaryDirectorRoutes");
const courtOfficeRoutes = require('./routes/courtOfficeRoutes');
const letterRoutes = require("./routes/letterRoutes");
const federalOfficeRoutes = require("./routes/federalOfficeRouter");

const courtCategoryRoute = require("./routes/courtCategoryRoutes");


dotenv.config();
app.use(express.json());
app.use(bodyParser.json());
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, path) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      if (path.endsWith(".pdf")) {
        res.set("Content-Disposition", "inline");
      }
    },
  })
);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:4000",
  "http://localhost:4027",
  "http://196.188.240.103:4030",
  "http://196.188.240.103:4029",
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/region", regionRoutes);
app.use("/api/zone", zoneRoutes);
app.use("/api/woreda", woredaRoutes);
app.use("/api/customer-accounts", customerAccountRoutes);
app.use("/api/teams", teamRoutes);

app.use("/api/city", cityRoute);
app.use("/api/subcity", subcityRouter);
app.use("/api/get-addresses", addressRoute);
app.use("/api/case-type", caseTypeRoute);

app.use("/api/agenda", agendaRoute);
app.use("/api/status-with-agenda", statusRoute);

app.use("/api/complaints", complaintRoute);
app.use("/api/disciplinary-request", disciplinaryRequestRoute);

app.use("/api/expert-attachments", expertAttachmentRoutes);
app.use("/api/inform", informExprtRoute);
app.use("/api/case", complaintCaseRoute);
app.use("/api/file", fileOrganizerRoute);
app.use("/api/judiciary-director", judiciaryDirectorRoutes);
app.use("/api/court-office", courtOfficeRoutes);
app.use("/api/complaint-case", criminalComplaintCaseRoute);
app.use("/api/federal-office", federalOfficeRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/final-decision", finalDecisionRoute);

app.use("/api/letters", letterRoutes);

app.use("/api/court", courtCategoryRoute);

const appPort = process.env.PORT || 4000;
appServer.listen(appPort, () => {
  console.log(`app server is running at http://localhost:${appPort}`);
});

const socketServer = http.createServer();
const io = new Server(socketServer, {
  cors: corsOptions,
});

const onlineUsers = new Map();
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected: ${socket.id}`);
  }

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    console.log(`User ${userId} disconnected`);
  });
});
const socketPort = process.env.SOCKET_PORT || 5000;
socketServer.listen(socketPort, () => {
  console.log(`Socket.IO server is running at http://localhost:${socketPort}`);
});
app.set("socketio", io);

module.exports = { appServer, io, onlineUsers };
