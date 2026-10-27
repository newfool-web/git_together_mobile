import { io } from "socket.io-client";
import { SOCKET_URL } from "@env";

export const createSocketConnection = () => {
  const url = SOCKET_URL || "http://10.0.2.2:3000";
  return io(url, {
    transports: ["websocket"],
  });
};
