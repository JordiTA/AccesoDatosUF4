const RESOLUTION = {
  w: 680,
  h: 360,
};
const CONFIG = {
  width: RESOLUTION.w,
  height: RESOLUTION.h,
  scene: {
    create: create,
    update: update,
  },
};
let game = new Phaser.Game(CONFIG);

const PLAYER_1_init_x = 16;
const PLAYER_1_init_y = 32;

const PLAYER_2_init_x = RESOLUTION.w -32;
const PLAYER_2_init_y = 32

let viewer = false;
let gameover= false;
let gameoverText= " ";

const PLAYER_1 = {
  x: 16,
  y: 32,
  w: 8,
  h: 48,
};
const PLAYER_2 = {
  x: RESOLUTION.w - 32,
  y: 32,
  w: 8,
  h: 48,
};
const BALL = {
  x: RESOLUTION.w / 2,
  y: RESOLUTION.h / 2,
  w: 12,
  h: 12,
};
const SPEED = 4;
const BALL_SPEED = {   x: SPEED,   y: SPEED, };

const WS = new WebSocket("ws://10.40.2.143:1657/");

let score1 = 0;
let score2 = 0;
let cursors;
let graphics;
let start = false;
let playerNum = 0;

WS.onopen = (event) => {
  console.log("Conexion aceptada");
};

WS.onmessage = (event) => {
 
  let data = JSON.parse(event.data);
  if (data.player_num != undefined) {
    playerNum = data.player_num;
  }else if (data.start != undefined) {
   
    start = true;
  }else if (data.player1_y != undefined) {
    PLAYER_1.y = data.player1_y;
    BALL.x = data.ball_x;
    BALL.y = data.ball_y;
  }else if (data.player2_y != undefined) {
    PLAYER_2.y = data.player2_y;
  }
	else if (data.viewer != undefined){
		viewer = data.viewer;
		}


		if (data.score1 != undefined) {
		score1 = data.score1;
		score_update();
	}
		if (data.score2 != undefined) {
		score2 = data.score2;
	
		score_update();
	}
	if (data.gameover != undefined){
	gameover = data.gameover;
	}
};



function renderPlayerBall() {
  graphics.clear();
  graphics.fillStyle(0xffffff, 1);
  //Player 1
  graphics.fillRect(PLAYER_1.x, PLAYER_1.y, PLAYER_1.w, PLAYER_1.h);

  //player 2
  graphics.fillRect(PLAYER_2.x, PLAYER_2.y, PLAYER_2.w, PLAYER_2.h);

  //Ball
  graphics.fillRect(BALL.x, BALL.y, BALL.w, BALL.h);
}

function create() {
  cursors = this.input.keyboard.createCursorKeys();
  graphics = this.add.graphics();
  graphics.fillStyle(0xffffff, 1);

  renderPlayerBall();
}


function inputManager() {

  if (playerNum == 1) {
    if (cursors.up.isDown) {
      PLAYER_1.y = PLAYER_1.y-5;
    } else if (cursors.down.isDown) {
      PLAYER_1.y = PLAYER_1.y+5;
    }
  } else if (playerNum == 2) {
    if (cursors.up.isDown) {
      PLAYER_2.y = PLAYER_2.y-5;
    } else if (cursors.down.isDown) {
      PLAYER_2.y= PLAYER_2.y+5;
    }
  }
}


function update() {

  if ((!start || playerNum == 0)&& !viewer) return;
  
 if(gameover){

 		if(viewer) gameoverText= "GAME ENDED";

		else if((score1 >=5 && playerNum == 1) || (score2 >=5 && playerNum ==2 )){
		gameoverText= "WINNER";
		
		}
		else{
		gameoverText= "LOSER";
		
		}
		graphics.clear();
		this.add.text(RESOLUTION.w/2, RESOLUTION.h/2,gameoverText);
 }
else{

	 if(playerNum == 1){
    BALL.x += BALL_SPEED.x;
    BALL.y += BALL_SPEED.y;
  }

  inputManager();
  wallBounces();
	paddleBounces();	
  renderPlayerBall();
  sendData();
	
}
}

function sendData() {
  if (playerNum == 1) {
    let pos = '{"player1_y":' + PLAYER_1.y + ",";
    pos += '"ball_x":' + BALL.x + "," + '"ball_y":' + BALL.y + "}";
    WS.send(pos);
  } else if (playerNum == 2) {
    let pos = '{"player2_y":' + PLAYER_2.y + "}";
    WS.send(pos);
  }
	
}

function wallBounces() {
  //Vertical
  if (BALL.y <= 0 || BALL.y > RESOLUTION.h){
	BALL_SPEED.y *= -1;
	}

  //Horizontal
  if (BALL.x <= 0){
		
		score2++;
		restart1();
		restart2();
		score_update();
		send_score();
		
	}
	if(BALL.x >= RESOLUTION.w){

		score1++;
		restart1();
		restart2();
		score_update();
		send_score();
	}
 if(score1 >=5 || score2 >= 5){
	gameover=true
	let isgameover = '{"gameover":true}';

 }
 }



function paddleBounces(){
if(PLAYER_1.x <= BALL.x && PLAYER_1.x + PLAYER_1.w >= BALL.x){
if(PLAYER_1.y <= BALL.y && PLAYER_1.y + PLAYER_1.h >= BALL.y){
BALL_SPEED.x = -BALL_SPEED.x;
}
}
if(PLAYER_2.x <= BALL.x+BALL.w && PLAYER_2.x + PLAYER_2.w >= BALL.x){
if(PLAYER_2.y <= BALL.y && PLAYER_2.y + PLAYER_2.h >= BALL.y){
BALL_SPEED.x = -BALL_SPEED.x;
}
}
}

function restart1 (){

	BALL.x= RESOLUTION.w/2;
	BALL.y= RESOLUTION.h/2;
	
	BALL_SPEED.x*=-1;
	BALL_SPEED.y*=-1;	

	PLAYER_1.x= PLAYER_1_init_x;
	PLAYER_1.y= PLAYER_1_init_y;
}

function restart2 (){
	PLAYER_2.x = PLAYER_2_init_x;
	PLAYER_2.y = PLAYER_2_init_y;
}

function send_score(){

let score = '{"restart":true, "score1":'+score1+', "score2":'+score2+'}';

WS.send(score);
}

function score_update(){
document.getElementById("score-player1").innerHTML = score1.toString();
document.getElementById("score-player2").innerHTML = score2.toString();
}
