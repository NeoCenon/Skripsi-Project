import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...");
    const io = new Server(res.socket.server, {
      path: "/api/socketio", // wajib cocok dengan client
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("messageFromClient", (msg) => {
        console.log("Received from client:", msg);
        socket.emit("messageFromServer", `Server got: ${msg}`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("Socket.IO server already running");
  }
  res.end();
}
