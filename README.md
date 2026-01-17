Poker Boom (Web)

Poker Boom is a web-based puzzle game inspired by match games. You select exactly five adjacent cards to form a poker hand. Scoring hands clear the cards, the board collapses, and new cards fall in. Bombs on the perimeter add pressure by ticking down each move and triggering penalties when they explode.

Status
- MVP implemented as a static HTML/CSS/JS project.
- 20 levels plus endless mode.
- Mobile-first layout with drag or tap input.

Features
- 5x10 card grid with gravity and refill
- 5-card adjacency selection (4-direction)
- Poker hand evaluation with A-low straight support
- Scoring, combo multiplier, and clutch bonus
- Bomb system with defuse mapping and explosions
- Per-level configuration and level menu
- Endless mode
- Basic telemetry logging to console

Rules
See RULES.md for full game rules, scoring, and bomb mechanics.

Project Structure
- index.html: Layout and UI containers
- styles.css: Visual styling, animations, and responsive layout
- main.js: Game state, logic, hand evaluation, and UI updates
- RULES.md: Rules and gameplay description

How to Run
This project is a static site. Use any local web server.

Example (Python):
  python -m http.server
Then open:
  http://localhost:8000

Gameplay Summary
- Select exactly five adjacent cards (up/down/left/right).
- Your selection must be a scoring hand (Pair or better).
- Score = base points x combo (plus clutch bonus if any bomb is at fuse 1).
- After a valid move, cards disappear, gravity resolves, and bombs tick.
- Stronger hands defuse bombs (see RULES.md for the mapping).

Level Design
- 20 levels with increasing target scores and bomb pressure.
- Endless mode loops bombs and removes move limits.

Config Highlights (in main.js)
- BASE_POINTS: hand scoring table
- DEFUSE_EFFECTS: bomb defuse mapping
- LEVELS: generated level configs
- ENDLESS_LEVEL: endless mode config

Development Notes
- The UI is rendered with DOM elements for simplicity.
- Animations are short and cancellable between phases.
- Input is locked during resolve and bomb phases.

Suggested Next Steps
- Move level configs to JSON and load dynamically
- Add RNG shaping and daily seed challenges
- Add tutorial and accessibility options
- Add unit tests for hand evaluation

License
Not specified.
