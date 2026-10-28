import { io } from "socket.io-client";
import { SOCKET_URL } from "@env";

export const createSocketConnection = () => {
  const url = SOCKET_URL || "https://git-together-theta.vercel.app";
  return io(url, {
    transports: ["websocket"],
  });
};
