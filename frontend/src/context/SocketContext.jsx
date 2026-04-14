import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export default function SocketProvider({ children }) {
  const { token } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return undefined;
    }

    const options = {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    };
    const s = io("/", options);
    setSocket(s);
    s.on("liveWin", (win) => {
      setResults(prev => [win, ...prev].slice(0, 15));
    });

    return () => s.close();
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, results }}>
      {children}
    </SocketContext.Provider>
  );
}
