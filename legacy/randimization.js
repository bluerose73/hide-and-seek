let rooms = [];

class Room {
    constructor(index, doors) {
        this.index = index;
        this.doors = doors;
    }
    clearDoors(){
        this.doors = [];
        for(let i = 0; i < rooms.length; i++){
            if(rooms[i].doors.includes(this.index)){
                rooms[i].doors = rooms[i].doors.filter(door => door != this.index);
            }
        }
    }
}

/*    3*4
    00-01-02-04
    |  |  |  | 
    05-06-07-08
    |  |  |  | 
    09-10-11-12
 */
    
function generateDoors(width, height) {
    var rooms = Array.from({ length: width * height }, (_, i) => new Room(i, []));
    var doors = [];
    var removed = [];
    // adding all possible doors
    for(let room = 0; room < rooms.length; room++){
        // iterating through doors and adding all adjacent neighbors to doors array
        if(room%width != width-1){
            rooms[room].doors.push(room+1);
            rooms[room+1].doors.push(room);
        }
        // iterating through doors and adding all vertical neighbors to doors array
        if(room < width*(height-1)){
            rooms[room].doors.push(room+width);
            rooms[room+width].doors.push(room);
        }
    }

    // removing doors to make the maze
    for(let room = 0; room < rooms.length; room++){
        if(room == 0 || room == width*height-1){
            continue;
        }
        if(Math.floor(Math.random() * 2) === 0){
            if(removed.length===0){
                rooms[room].clearDoors();
                removed.push(room);

            }else{
                let proximity = [room-width-1, room-width, room-width+1, room-1, room+1, room+width-1, room+width, room+width+1];
                for(let out = 0; out < removed.length; out++){
                    if(proximity.includes(removed[out])){
                        rooms[room].clearDoors();
                        removed.push(room);
                        break;
                    }
                }
            }
        }
    
    }

    // const outcountatiner = document.getElementById("out");
    // removed.push(6);

    // removed.forEach(out => {
    //     outcountatiner.innerHTML += `<p>${out[0]} is out</p>`;
    // });
        

    // making the final doors array and returning it
    for(let room = 0; room < rooms.length; room++){
        for(let door of rooms[room].doors){
            if(room < door){
                doors.push([room, door]);
            }
        }
    }
    return doors;
}

function visualizeBoard(width, height, doors) {
    let board = "";
    let layer1room = 0;
    let layer2room = 0;
    let layer = 0;

    while (layer1room < width * height) {
    if (layer % 2 === 0) {
        let i = 0;
        while (i < width) {
        board += ('00' + layer1room).slice(-2);
        if (((doors.some(pair => pair[0] === layer1room && pair[1] === layer1room + 1)) ||
            (doors.some(pair => pair[0] === layer1room + 1 && pair[1] === layer1room))) &&
            (layer1room % width !== width - 1)) {
            board += "-";
        } else if (layer1room % width !== width - 1) {
            board += "&nbsp;";
        }
        i++;
        layer1room++;
        }
    } else {
        let i = 0;
        while (i < width) {
        if ((doors.some(pair => pair[0] === layer2room && pair[1] === layer2room + width)) ||
            (doors.some(pair => pair[0] === layer2room + width && pair[1] === layer2room))) {
            board += " &nbsp;| &nbsp;";
        } else {
            board += "&nbsp; &nbsp; &nbsp;";
        }
        i++;
        layer2room += 1;
        }
    }
    board += "<br>";
    layer += 1;
    }
    return board;
}

const width = 3;
const height = 4;

// Get the board container element
const boardContainer = document.getElementById("board-container");
// Get the doors container element
const doorsContainer = document.getElementById("doors-container");
// Generate the doors
const doors = generateDoors(width, height);

// Generate the board and append it to the container
boardContainer.innerHTML = visualizeBoard(width, height, doors);

// Output the doors information to the HTML file
doorsContainer.innerHTML = "<h2>Doors Information:</h2>";
doors.forEach(door => {
    doorsContainer.innerHTML += `<p>Door between room ${door[0]} and room ${door[1]}</p>`;
});
