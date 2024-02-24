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
    document.querySelector("#map").innerText = GridToString();
    document.querySelector("#turn").innerText = turn.toString();
}

// Show GameOver
function RenderGameOver() {
    document.querySelector("#map").innerText = "GAME OVER";
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

    try {
        await CommitMove(gAccount, nextPosition);
        position = nextPosition;
    } catch (error) {
        console.error("commit move error", error);
    }

    await TakeTurn();
}

// Gets the doors of current cell
// returns: [boolean, boolean, boolean, boolean]
function GetDoor() {
    let x = position[1], y = position[0];
    let currentCellId = y * width + x;
    let north = currentCellId - width,
        south = currentCellId + width,
        east = currentCellId + 1,
        west = currentCellId - 1;

    return [
        edges.include([currentCellId, east]),
        edges.include([currentCellId, north]),
        edges.include([currentCellId, west]),
        edges.include([currentCellId, south])
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

    if (opponentPosition == position) {
        RenderGameOver();
    } else {
        turn += 1;
        Render();
    }
}

////////////////////
// Input handling //
////////////////////

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