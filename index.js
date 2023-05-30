const express = require("express");
const app = express();
const http = require("http");
const http_server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(http_server);

let url = "mongodb://localhost";
let mongo_client = require("mongodb").MongoClient;
let db;


mongo_client.connect(url, (err, conn)=>{
	
	console.log("Conectando a Mongo");
	
	if (err){
		console.log("Error al conectar con Mongo"); return;
	}

	db = conn.db("multipong");	
	if(db){
		console.log("Conectado a Mongo con exito");
	}
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
 });

 http_server.listen(4242, () => {
    console.log('listening on *:4242');
});

let player1;
let player2;

let scores;

io.on("connection", (socket) => {
	console.log("Conexion del socket");

	if(player1 == undefined){
		player1 = socket;
		player1.emit("player_num", 1);
		
		SendLatestScores(player1);

		player1.on("coords", (msg) => {
			if(player2 == undefined){return;}
			
			player2.emit("coords", msg);
		});

		player1.on("playerScore", (msg) =>{
			scores = msg
			if(player2 == undefined) {return;}
			
			player2.emit("playerScore", msg);
		});
		
		player1.on("TimerStart", (msg)=>{
			if (player2 == undefined) {return;}
			
			player2.emit ("TimerStart", msg);
		});

		player1.on("MatchEnded",()=> {
			Timer();
			InsertLastScore(scores)
			console.log(scores);
		});
		
		player1.on("disconnect", ()=>{
			player1 = undefined;
		});
		console.log("Player 1 ready");
	}
	else if(player2 == undefined){
		player2 = socket;
		player2.emit("player_num", 2);
	
		SendLatestScores(player2);

		player2.on("coords", (msg) => {
			if (player1 == undefined){return;}
			player1.emit("coords", msg);
		});

		player2.on("disconnect", ()=> {
			player2 = undefined;
		});
	
		player1.emit("Start");

		player2.emit("Start");

		console.log("Player 2 ready");
	}else
	{
		console.log("La sala esta llena, te jodes con amor");
	}

	socket.on("disconnect", ()=>{
		console.log("Alguien se ha desconectao");
		});

});

function InsertLastScore(scores){
	lastScore =	JSON.parse(scores)
	db.collection("scores").insertOne({"Score1": lastScore.Score1,"Score2": lastScore.Score2, "dateTime": new Date()}); 
}

function SendLatestScores(playerSocket){

	let scores = db.collection("scores").find();
	
	scores.toArray( (err, data)=>{
		let scores_string = JSON.stringify(data); 
		
		playerSocket.emit("DbScores",scores_string);
	});
}

let timeout;

function Timer(){
	timeout = setTimeout(SendReset,3000);
}
function SendReset(){
	if(player1 != null && player2 != null){
		player1.emit("Reset");
		player2.emit("Reset");
		SendLatestScores(player1);
		SendLatestScores(player2);
		clearTimeout(timeout);
	}
}


