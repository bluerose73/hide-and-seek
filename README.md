# hide-and-seek

Hide and seek game.

Built at HackIllinois 2024.

## How to Play

Open index.html with your browser.

Invite your friend and play hide-and-seek! Make sure two players enter the same match code.

## Development with a Local Server

1. Install Python dependencies

```bash
pip install flask flask_cors
```

2. Run mock server

```bash
cd flask-backend
flask --app backend run
```

3. Open hider.html and seeker.html

4. Input account number and select your role!

   

## Run game with local Flask server

1. Restart Flask server
**Always restart the server before the match**

```bash
flask --app backend run
```

2. Run game on browser

Open or reload ```bash seeker.html``` and ```bash hider.html``` on your browser

**Always open or reload exactly once**. If doing so more than once, go back to step 1.
