import "./App.css";
import { useState, useEffect } from "react";
import Game from "./pages/Game/Game";
import { Client } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import LoginPage from "./pages/Login/LoginPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import { Routes, Route, useNavigate } from "react-router";
import Header from "./components/Header";
import useCurrentUser from "./hooks/useCurrentUser";
import Lobby from "./pages/Lobby/Lobby";
import SignUpPage from "./pages/SignUp/SignUpPage";

function App() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [stompClient, setStompClient] = useState(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading || user !== null) return;
    if (location.pathname.includes("signup")) return;
    navigate("/login");
  }, [isLoading, user, location.pathname]);

  useEffect(() => {
    if (!user) return;
    const client = new Client({
      brokerURL: `ws://45.4.172.7:8081/chess-0.0.1-SNAPSHOT/websocket`,
      onConnect: () => {
        console.log("Connected");
        const subscription = client.subscribe(
          `/topic/user/${user?.id}`,
          (message) => queryClient.invalidateQueries()
        );
        setSubscription(subscription);
      },
    });
    client.activate();
    setStompClient(client);
    return () => {
      subscription?.unsubscribe();
      client.deactivate();
    };
  }, [user?.id]);

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [location.pathname]);

  return (
    <div className="App w-full pt-[80px] h-full bg-gradient-to-t from-gray-700 to-gray-900 flex justify-center">
      <Header />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/lobby" element={<Lobby stompClient={stompClient} />} />
        <Route
          path={"/"}
          element={<Dashboard setGame={setSelectedGame} game={selectedGame} />}
        />
        <Route
          path={"/dashboard/*"}
          element={
            <Dashboard
              setGame={setSelectedGame}
              game={selectedGame}
            />
          }
        >
          
        </Route>
        <Route
          path="/game/:gameId"
          element={
            user ? (
              <Game
                stompClient={stompClient}
                game={selectedGame}
                setGame={setSelectedGame}
                user={user}
              />
            ) : null
          }
        />
      </Routes>
    </div>
  );
}

export default App;
