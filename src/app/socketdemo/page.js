'use client';
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function SocketDemoPage() {
  const [serverMsg, setServerMsg] = useState("");

  useEffect(() => {
    // Trigger Socket.IO server startup
    fetch("/api/socketio");

    const socket = io({
      path: "/api/socketio", // sesuai dengan server path
    });

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      socket.emit("messageFromClient", "Halo dari client!");
    });

    socket.on("messageFromServer", (msg) => {
      setServerMsg(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Socket.IO Demo</h1>
      <p>Server Message: {serverMsg}</p>
    </div>
  );
}
