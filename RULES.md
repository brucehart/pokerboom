Poker Boom Rules

Overview
Poker Boom is a match-style puzzle game where you select exactly five adjacent cards to make poker hands. Scoring hands clear the cards, the board collapses, and new cards fall in. Bombs around the board tick down each move, so you must balance scoring with bomb control.

Goal
Level mode: Reach the target score within the move limit.
Endless mode: Keep scoring as long as you can.

Board
- Size: 10 rows x 5 columns.
- Coordinates: row 0 at the top, column 0 at the left.
- Cards have rank 2-14 (J=11, Q=12, K=13, A=14) and suit (Clubs, Diamonds, Hearts, Spades).

Selecting Cards
- Select exactly 5 cards per move.
- The 5 cards must be connected by 4-direction adjacency (up/down/left/right).
- You cannot reuse a cell in the same path.
- You cannot select scorched cells while their scorch timer is active.

Valid Hands
A selection must be at least a Pair to score (high card is rejected in the current rules). Poker ranking order:
1. Pair
2. Two Pair
3. Three of a Kind
4. Straight (A can be low: A-2-3-4-5)
5. Flush
6. Full House
7. Four of a Kind
8. Straight Flush
9. Royal Flush

Scoring
Base points by hand:
- Pair: 50
- Two Pair: 120
- Three of a Kind: 200
- Straight: 300
- Flush: 350
- Full House: 600
- Four of a Kind: 900
- Straight Flush: 1400
- Royal Flush: 2000

Combo
- Combo starts at 1.
- Each scoring hand increases combo by 1.
- Score gained = base points x combo.
- If any bomb fuse is at 1 when you score, you get a 1.25x clutch bonus.

Board Resolution
After a valid hand:
1. Selected cards flash, then disappear.
2. Gravity pulls cards downward to fill gaps.
3. New cards spawn at the top to fill empty spaces.
4. Bombs then tick down (unless paused by a defuse effect).

Bombs
Bombs live on the perimeter. They are not tiles on the board.
Each bomb has a side (left/right/top/bottom), an index along that side, and a fuse that counts down each move.

Defuse Effects (applied when you score):
- Straight: Pause the bomb tick for this move.
- Flush: Add +2 fuse to the lowest-fuse bomb.
- Full House: Disarm 1 lowest-fuse bomb.
- Four of a Kind: Disarm 1 lowest-fuse bomb and +1 fuse to all armed bombs.
- Straight Flush: Disarm 2 lowest-fuse bombs.
- Royal Flush: Disarm 2 lowest-fuse bombs and +1 fuse to all armed bombs.

Explosion
When a bomb reaches 0:
- Edge scorch: 6-10 cells near that edge become scorched for 3 moves and cannot be selected.
- Board shock: The board shuffles and combo resets to 1.

Level End
- Win: Score reaches the target before moves run out.
- Lose: Moves reach 0 before the target is met.

Controls
- Drag across adjacent cards to build a 5-card path.
- Or tap cards one by one; when you reach 5, the move resolves.
