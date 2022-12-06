const express = require('express');
const app = express();
const http = require('http');
const http_server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(http_server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
  });

http_server.listen(4242, () => {
  console.log('listening on *:4242');
});

let player1;
let player2;

io.on("connection", (socket) => {
	console.log("Socket connected");
	if (player1 == undefined){
		player1 = socket;
		player1.emit("player_num", 1);
		
		player1.on ("coords", (msg) => {
			if (player2 == undefined)
				return;
				
			player2.emit("coords", msg);
		});
		console.log("Player1");
	}
	else if (player2 == undefined){
		player2 = socket;
		console.log("Player2");
		player2.emit("player_num", 2);
	}
	else{ 
		console.log("Sala llena te jodes");
		return;
	}
	socket.on("disconnect", () => {
		console.log("Disconnected!");
	});
	
	socket.on("p1_coords", (msg) => {
		//console.log("Cordendas: "+msg);
	});
});
