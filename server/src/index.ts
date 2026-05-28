import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { createGameState, applyMove, rollDice, getNextPlayerIndex, assignColors } from "./engine";
import { GameState, Player } from "./types";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 3001;
const rooms: Record<string, GameState> = {};

app.use(cors());

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("create-room", (callback) => {
    const roomId = socket.id;
    const gameState = createGameState(roomId);
    rooms[roomId] = gameState;
    socket.join(roomId);
    callback({ roomId }); // Send back the roomId to the client
  });

  socket.on("join-room", ({ roomId, playerName }, callback) => {
    const gameState = rooms[roomId];
    if (!gameState) {
      callback({ error: "Room not found" });
      return;
    }

    if (gameState.players.length >= 4) {
      callback({ error: "Room is full" });
      return;
    }

    const color = assignColors(4)[gameState.players.length];
    const player: Player = {
      id: socket.id,
      name: playerName,
      color,
      tokens: [],
      isBot: false,
    };

    gameState.players.push(player);
    socket.join(roomId);
    io.to(roomId).emit("update-game", gameState);
    callback({ success: true });
  });

  socket.on("roll-dice", ({ roomId }) => {
    const gameState = rooms[roomId];
    if (!gameState) return;

    const dice = rollDice();
    gameState.dice = dice;
    gameState.diceRolled = true;
    io.to(roomId).emit("update-game", gameState);
  });

  socket.on("move-token", ({ roomId, tokenId }) => {
    const gameState = rooms[roomId];
    if (!gameState || !gameState.diceRolled) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const { players, extraTurn } = applyMove(
      gameState.players,
      currentPlayer.color,
      tokenId,
      gameState.dice!
    );

    gameState.players = players;
    gameState.dice = null;
    gameState.diceRolled = false;

    if (!extraTurn) {
      gameState.currentPlayerIndex = getNextPlayerIndex(
        gameState.players,
        gameState.currentPlayerIndex
      );
    }

    io.to(roomId).emit("update-game", gameState);
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      const gameState = rooms[roomId];
      gameState.players = gameState.players.filter(
        (player) => player.id !== socket.id
      );
      io.to(roomId).emit("update-game", gameState);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
