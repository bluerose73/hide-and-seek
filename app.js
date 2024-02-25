//////////////////
//  Solana API  //
//////////////////

// Logs in with current account and a selected role
// role: "hider" or "seeker"
// return value: {
//     "height": int,
//     "width": int,
//     "doors": [[src, dst], [src, dst]],
//     "initialPosition": [x, y]
// }
async function Login(account, role) {
  console.log("calling login")
  resp = await fetch('http://localhost:5000/Login', {
      method: "POST",
      headers: {
          Accept: "application.json",
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          account: account,
          role: role
      }),
      cache: "default"
  });
  resp = await resp.json();
  console.log(resp);
  return resp;
}

// Saves the player's nextPosition to Solana
// position: [x, y]
// return value: null
async function CommitMove(account, position) {
  console.log("calling commit move");
  resp = await fetch('http://localhost:5000/CommitMove', {
      method: "POST",
      headers: {
          Accept: "application.json",
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          account: account,
          position: position
      }),
      cache: "default"
  });
  resp = await resp.json();
  console.log(resp);
  return resp;
}

// Gets the opponent's position
// turn: int. The initial state is turn 0
// return value: [x, y] if success,
//                      else error.
// BONUS: Can you make this call to wait instead of returning an error
// when the opponent hasn't make their move.
// This will get rid of polling
async function GetOpponentPosition(account, turn) {
  console.log("calling get opponent position");
  do {
      resp = await fetch('http://localhost:5000/GetOpponentPosition', {
          method: "POST",
          headers: {
              Accept: "application.json",
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              account: account,
              turn: turn
          }),
          cache: "default"
      });
      resp = await resp.json();
      console.log(resp);
      await sleep(100);
  } while (resp == "waiting");
  return resp;
}

//////////////////
// Graphics API //
//////////////////

// Triggers re-render
function Render() {
  // document.querySelector("#map").innerText = GridToString();
  // document.querySelector("#turn").innerText = turn.toString();
  render();
}

// Show GameOver
function RenderGameOver() {
  // document.querySelector("#map").innerText = "GAME OVER";
  gameover();
}

////////////////////////
// Graphics CallBack  //
////////////////////////

// The click event listener called when a door is clicked (or stay still)
// door: int (0 - 3)
// returns: null
async function EnterDoor(door) {
  let x = position[1], y = position[0];
  let nextPosition = [
      [y, x + 1],
      [y - 1, x],
      [y, x - 1],
      [y + 1, x]
  ][door];
  console.log(nextPosition);
  console.log(door);

  try {
      await CommitMove(gAccount, nextPosition);
      position = nextPosition;
  } catch (error) {
      console.error("commit move error", error);
  }

  await TakeTurn();
}

function includes(edgeList, v1, v2) {
  for (let i = 0; i < edgeList.length; i++) {
    if (edgeList[i][0] === v1 && edgeList[i][1] === v2) {
      return 1;
    }
  }
  return 0;
}

// Gets the doors of current cell
// returns: [int, int, int, int]
function GetDoor() {
  let x = position[1], y = position[0];
  let currentCellId = y * width + x;
  let north = currentCellId - width,
      south = currentCellId + width,
      east = currentCellId + 1,
      west = currentCellId - 1;
  /*
   _____
  |  _  |
  |  _  |
  |_____|
  */
  return [
    includes(edges, currentCellId, east),
    includes(edges, currentCellId, north),
    includes(edges, currentCellId, west),
    includes(edges, currentCellId, south)
  ];
}

// Gets the direction of the opponent
// returns: int (0 - 7)
function GetOpponentDir() {
  const referenceDirs = [
      [1, 0],
      [0.7071, 0.7071],
      [0, 1],
      [-0.7071, 0.7071],
      [-1, 0],
      [-0.7071, -0.7071],
      [0, -1],
      [0.7071, -0.7071],
  ]
  function Dot2d(x, y) {
      return x[0] * y[0] + x[1] * y[1];
  }
  function ArgMax(array) {
      return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
  }

  let dir = [opponentPosition[1] - position[1], position[0] - opponentPosition[0]];
  let dotProducts = referenceDirs.map(x => Dot2d(x, dir));
  return ArgMax(dotProducts);
}

//////////////////
// Game State  ///
//////////////////

// Coordinate System
// -----------> x
// |
// |
// |
// v
// y
let width = 0, height = 0;
let edges = []
let position = []
let opponentPosition = []
let turn = 0;
let gAccount = "";
let nextMove = null;

////////////////
// Game Logic //
////////////////

var sleepSetTimeout_ctrl;

function sleep(ms) {
  clearInterval(sleepSetTimeout_ctrl);
  return new Promise(resolve => sleepSetTimeout_ctrl = setTimeout(resolve, ms));
}

function GridToString() {
  let str = ""
  for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
          if (i == position[0] && j == position[1]) {
              str += "@";
          } else if (i == opponentPosition[0] && j == opponentPosition[1]) {
              str += "X";
          } else {
              str += ".";
          }

      }
      str += "\n";
  }
  return str;
}

async function GameStart(account, role) {
  try {
      loginResp = await Login(account, role);
  } catch (error) {
      console.error("login error", error);
      return;
  }
  gAccount = account;
  width = loginResp["width"];
  height = loginResp["height"];
  edges = loginResp["doors"];
  position = loginResp["initialPosition"];
  console.log("position " + position);
  turn = 0;
  await TakeTurn();
}

async function TakeTurn() {
  try {
      opponentPosition = await GetOpponentPosition(gAccount, turn);
  } catch (error) {
      console.error("get opponent move error", error);
      return;
  }

  if (opponentPosition[0] === position[0] || opponentPosition[1] === position[1]) {
      RenderGameOver();
  } else {
      turn += 1;
      console.log(GridToString());
      if (turn === 1) {
        render();
      } else {
        transition();
      }
  }
}

////////////////////
// Input handling //
////////////////////
/*
let accountInput = document.querySelector("#account");

document.querySelector("#seeker").addEventListener("click", (ev) => {
  if (accountInput.value) {
      GameStart(accountInput.value, "seeker");
  }
});

document.querySelector("#hider").addEventListener("click", (ev) => {
  if (accountInput.value) {
      GameStart(accountInput.value, "hider");
  }
});

document.querySelector("#east").addEventListener("click", () => {
  EnterDoor(0);
})
document.querySelector("#north").addEventListener("click", () => {
  EnterDoor(1);
})
document.querySelector("#west").addEventListener("click", () => {
  EnterDoor(2);
})
document.querySelector("#south").addEventListener("click", () => {
  EnterDoor(3);
})
*/

/* consts */
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;
var canvasWidth = 0;
var canvasHeight = 0;

/* states */
/*
    1
  2   0
    3
*/
var playerDir = 0;        // player (rendered)
var doorDir = -1;         // door clicked (not rendered)

/* event listeners */

window.onload = function() {
  var img = new Image;
  img.src = 'scary-doors/000.jpeg';
  img.onload = function () {
    if (screenWidth / screenHeight > img.width / img.height) {
      // more wide than tall
      canvasHeight = screenHeight;
      canvasWidth = screenHeight * (img.width / img.height);
    } else {
      // more tall than wide
      canvasWidth = screenWidth;
      canvasHeight = canvasWidth * (img.height / img.width);
    }
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    render();
  }
}

document.onmousemove = function (e) {
  var x = 0;
  var y = 0;
  [x, y] = canvasCoord(e);
  if (clickedTurnLeft(x, y) || clickedTurnRight(x, y) || clickedEnterLeftDoor(x, y) || 
      clickedEnterFrontDoor(x, y) || clickedEnterRightDoor(x, y)) {
    document.getElementById("canvas").style.cursor = "pointer";
  } else {
    document.getElementById("canvas").style.cursor = "default";
  }
}

function quickDraw(imageId) {
  var img = new Image;
  img.src = `scary-doors/${imageId}.jpeg`;
  img.onload = function() { context.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvasWidth, canvasHeight); };
}

function playAudio(audioId) {
  const audioFiles = [
    "doors-panned-right",
    "heavy-steps-panned-right",
    "doors",
    "doors",
    "doors-panned-left",
    "steps-panned-left",
    "steps",
    "steps-panned-right"
  ]
  var audio = new Audio(`scary-footsteps/${audioFiles[audioId]}.mp3`);
  audio.play();
}

function canvasCoord(e) {
  const canvasLeft = canvas.offsetLeft + canvas.clientLeft;
  const canvasTop = canvas.offsetTop + canvas.clientTop;
  var x = e.pageX - canvasLeft;
  var y = e.pageY - canvasTop;

  x = x * (4 / canvasWidth) - 2; // [0, canvasWidth] -> [2, -2]
  y = (y * (3 / canvasHeight) - 1.5) * -1; // [0, canvasHeight] -> [1.5, -1.5]
  return [x, y];
}

canvas.addEventListener('click', function(e) {
  var x = 0;
  var y = 0;
  [x, y] = canvasCoord(e);
  
  var edges = getDoors();
  
  if (clickedTurnLeft(x, y)) {
    console.log("Turn left");
    playerDir = (playerDir + 1) % 4;
    render();
  }
  else if (clickedTurnRight(x, y)) {
    console.log("Turn right");
    playerDir = (playerDir + 3) % 4;
    render();
  }
  else if (clickedEnterLeftDoor(x, y) && edges[(playerDir + 1) % 4]) {
      console.log("Enter left");
      doorDir = (playerDir + 1) % 4;
      enterDoor(doorDir);
      // transition();
  }
  else if (clickedEnterFrontDoor(x, y) && edges[playerDir]) {
    console.log("Enter front");
    doorDir = playerDir;
    enterDoor(doorDir);
    // transition();
  }
  else if (clickedEnterRightDoor(x, y) && edges[(playerDir + 3) % 4]) {
    console.log("Enter right");
    doorDir = (playerDir + 3) % 4;
    enterDoor(doorDir);
    // transition();
  } else {
    console.log("Nothing clicked");
  }
}, false);

function clickedTurnLeft(x, y) {
  const x1 = -1.65;
  return x <= x1;
}

function clickedTurnRight(x, y) {
  const x1 = 1.65;
  return x1 <= x;
}

function clickedEnterLeftDoor(x, y) {
  const x1 = -1 / 0.87 * y;
  const x2 = -0.536 * Math.sqrt(1.8 * 1.8 - y * y);
  const x3 = 1 / 2.22 * y;
  return x <= Math.min(x1, x2, x3);
}

function clickedEnterFrontDoor(x, y) {
  const x1 = -0.38 * Math.sqrt(1.8 * 1.8 - y * y);
  const x2 = 0.43 * Math.sqrt(1.8 * 1.8 - y * y);
  const y1 = -0.73 * Math.sqrt(1.8 * 1.8 - x * x);
  const y2 = 0.43 * Math.sqrt(1.8 * 1.8 - x * x);
  return x1 <= x && x <= x2 && y1 <= y && y <= y2;
}

function clickedEnterRightDoor(x, y) {
  const x1 = 1 / 0.76 * y;
  const x2 = 0.61 * Math.sqrt(1.8 * 1.8 - y * y);
  const x3 = -1 / 1.96 * y;
  return x >= Math.max(x1, x2, x3);
}

/*
var sleepSetTimeout_ctrl;
function sleep(ms) {
  clearInterval(sleepSetTimeout_ctrl);
  return new Promise(resolve => sleepSetTimeout_ctrl = setTimeout(resolve, ms))
}
*/

function getImageId() {
  let edges = getDoors();
  let inView = [edges[(playerDir + 1) % 4], edges[playerDir], edges[(playerDir - 1 + 4) % 4]];
  console.log("playerDir " + playerDir + ", inView = " + inView);
  return `${inView[0]}${inView[1]}${inView[2]}`;
}

document.addEventListener("keydown", function(e) {
  if(e.key === " ") {
    gameover();
  }
});


async function gameover() {
  var monImg = new Image;
  monImg.src = `scary-doors/shadow-monster.png`;
  for (let ratio = 0.3; ratio < 1; ratio *= 1.1) {
    context.drawImage(monImg, 0, 0, monImg.width, monImg.height, 
                      canvasWidth * (0.5 - ratio / 2), 
                      canvasHeight * (0.5 - ratio / 2), 
                      canvasWidth * ratio, 
                      canvasWidth *  ratio);
    await sleep(10);
  }
  quickDraw("black");
}

async function win() {
  
  var monImg = new Image;
  monImg.src = `scary-doors/shadow-monster.png`;
  for (let ratio = 0.3; ratio < 1; ratio *= 1.1) {
    context.drawImage(monImg, 0, 0, monImg.width, monImg.height, 
                      canvasWidth * (0.5 - ratio / 2), 
                      canvasHeight * (0.5 - ratio / 2), 
                      canvasWidth * ratio, 
                      canvasWidth *  ratio);
    await sleep(0);
  }
  quickDraw("black");
}

async function transition() {
  /* load image */
  var img = new Image;
  var imageId = getImageId();
  img.src = `scary-doors/${imageId}.jpeg`;

  /* transition from old state */
  await sleep(1000);
  const anchors = [canvasWidth / 16, canvasWidth / 2, canvasWidth - canvasWidth / 16];
  const xAnchor = anchors[(playerDir - doorDir + 1 + 4) % 4];
  const yAnchor = canvasHeight / 2;
  for (let ratio = 1; ratio < 4; ratio *= 1.05) { // log1.1(3) = 11.5 frames, log1.1(2) = 7.3 frames
    context.drawImage(img, 0, 0, img.width, img.height, 
                      xAnchor - ratio * xAnchor, 
                      yAnchor - ratio * yAnchor, 
                      ratio * canvasWidth, 
                      ratio * canvasHeight);
    await sleep(10);
  }
  
  /* get new state */
  img = new Image;
  imageId = getImageId();
  img.src = `scary-doors/${imageId}.jpeg`;

  var blackImg = new Image;
  blackImg.src = `scary-doors/black.jpeg`;

  /* black out */
  quickDraw('black');
  await sleep(1500);

  /* render graphics */
  context.drawImage(img, 0, blackImg.height * 0.45, blackImg.width, blackImg.height * 0.1, 
                    0, canvasHeight * 0.45, canvasWidth, canvasHeight * 0.1);
  await sleep(1000);

  quickDraw('black');
  await sleep(500);
  
  for (let i = 1; i < 2.2; i *= 1.1) { // log1.1(3) = 11.5 frames, log1.1(2) = 7.3 frames
    var opening = i - 1;
    context.drawImage(img, 0, img.height * (0.5 - opening / 2), img.width, img.height * opening, 
                      0, canvasHeight * (0.5 - opening / 2), canvasWidth, canvasHeight * opening);
    await sleep(20);
    console.log("i = " + i);
  }
  
  
  /* render audio */
  const audioId = (getOpponentDir() - playerDir * 2 + 8) % 8; // playerDir * 2 = 2, oppDir = 7
  console.log(`Playing ${audioId}.mp3`);
  playAudio(audioId);
}

/* interface */

function render() {
  /* get new state */
  var edges = getDoors();
  let inView = [edges[(playerDir + 1) % 4], edges[playerDir], edges[(playerDir - 1 + 4) % 4]];
  console.log("playerDir " + playerDir + ", inView = " + inView);

  /* render graphics */
  let imageId = `${inView[0]}${inView[1]}${inView[2]}`;
  console.log(`Rendering ${imageId}.jpeg`);
  quickDraw(imageId);

  /* render audio */
  const audioId = (getOpponentDir() - playerDir * 2 + 8) % 8; // playerDir * 2 = 2, oppDir = 7
  console.log(`Playing ${audioId}.mp3`);
  playAudio(audioId);
}

/* framework functions */

function getDoors() { // get whether surrounding edges are doors or not
  return GetDoor();
}

function getOpponentDir() { // get opponent direction
  return GetOpponentDir();
}

function enterDoor(dir) { // select a door
  return EnterDoor(dir);
}