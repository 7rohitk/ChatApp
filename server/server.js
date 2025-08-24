import express from "express";  // Framework to handle HTTP requests
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// The entry point of your backend


// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server, {
  cors: { origin: "*" }
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }


// Socket.io connection handler
io.on("connection", (socket) => {  
  const userId = socket.handshake.query.userId; // Gets userId from frontend connection request.
  console.log("User Connected", userId);

  if (userId) userSocketMap[userId] = socket.id; 
  // Emit online users to all connected clients
io.emit("getOnlineUsers", Object.keys(userSocketMap));  // Sends updated online user list to everyone.

socket.on("disconnect", () => {  
  console.log("User Disconnected", userId);
  delete userSocketMap[userId];
  io.emit("")
})

});



// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors()); 
//Routes setup 
app.use("/api/status", (req, res)=> res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)



//Connect to mongoDB
await connectDB();


const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on PORT: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
//export server for vercel
export default server;
