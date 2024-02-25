# This is a mock Solana game backend

from flask import Flask, request
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

# 3 * 3 map
#   0 - 1 - 2
#   |       |
#   3 - 4 - 5
#   |       |
#   6 - 7 - 8
# In a real game,
# the map should be randomly generated
doors = [[0, 1], [1, 0], 
         [1, 2], [2, 1], 
         [3, 4], [4, 3], 
         [4, 5], [5, 4], 
         [6, 7], [7, 6], 
         [5, 8], [8, 5], 
         [0, 3], [3, 0], 
         [3, 6], [6, 3], 
         [2, 5], [5, 2], 
         [5, 8], [8, 5]]
rooms = []
class Room:
    def __init__(self, matchCode):
        # history two players' moves
        self.history = []

        # players' wallet account
        self.roleToAccount = {
            "seeker": None,
            "hider": None
        }
        self.matchCode = matchCode

@app.post("/Login")
def Login():
    payload = request.json
    role, account = payload["role"], payload["account"]
    assert role in ["hider", "seeker"]

    matchCode = payload.get("matchCode", "HackIllinois")
    curRoom = None
    global rooms
    for room in rooms:
        if room.matchCode == matchCode:
            curRoom = room
    
    if curRoom == None:
        curRoom = Room(matchCode)
        if len(rooms) > 10:
            rooms = rooms[-10:]
        rooms.append(curRoom)

    roleToAccount = curRoom.roleToAccount
    history = curRoom.history

    if roleToAccount[role] != None:
        return "role already taken", 400
    roleToAccount[role] = account

    initialPosition = [0, 0] if role == "hider" else [2, 2]
    history.append({
        "account": account,
        "position": initialPosition
    })
    
    return {
        "height": 3,
        "width": 3,
        "doors": doors,
        "initialPosition": initialPosition
    }

@app.post("/GetOpponentPosition")
def GetOpponentPosition():
    payload = request.json
    turn, account = payload["turn"], payload["account"]

    matchCode = payload.get("matchCode", "HackIllinois")
    curRoom = None
    global rooms
    for room in rooms:
        if room.matchCode == matchCode:
            curRoom = room
    if curRoom == None:
        return '"Room Not Found"', 404
    history = curRoom.history

    opponent_moves = [move for move in history
                      if move["account"] != account]
    
    if len(opponent_moves) == turn + 1:
        return opponent_moves[-1]["position"]
    else:
        return '"waiting"'

@app.post("/CommitMove")
def CommitMove():
    payload = request.json
    account, position = payload["account"], payload["position"]

    matchCode = payload.get("matchCode", "HackIllinois")
    curRoom = None
    global rooms
    for room in rooms:
        if room.matchCode == matchCode:
            curRoom = room
    if curRoom == None:
        return '"Room Not Found"', 404
    history = curRoom.history

    # TODO: Verify if the move is legal

    history.append({"account": account, "position": position})
    app.logger.info("history = %s" % history)

    return '"committed"'