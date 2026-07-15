# Sprinkles and the Rainbow Gem

**Sprinkles and the Rainbow Gem** is a cheerful, child-friendly two-stage browser game about a curious lavender cat exploring the Glittering Cave. Stage 1 is a gentle star-collecting adventure. Stage 2 continues deeper into the colorful Crystal Cave, where six magic balls transform into hats that stack above Sprinkles' head. Finding every hat opens the path to the Rainbow Gem.

The game is fully local. It has no accounts, ads, purchases, data collection, external links, downloads, or internet requirements.

## Open and play

1. Open this folder.
2. Double-click `index.html`.
3. Choose Easy, Normal, or Practice Mode.
4. Select **Start Adventure**, read the short story, and enter the cave.

A current version of Chrome, Edge, Firefox, or Safari is recommended. No installation or local server is needed.

## Controls

| Action | Keyboard | Touchscreen |
| --- | --- | --- |
| Move left | Left Arrow or A | Left arrow button |
| Move right | Right Arrow or D | Right arrow button |
| Jump | Up Arrow, W, or Spacebar | Jump button |
| Pause / resume | P | Pause button, then Keep Exploring |
| Restart level | R | Pause, then Restart Level |
| Sound on / off | Sound button | Sound button |

The title screen also includes a reduced-motion toggle. The game automatically pauses if the browser window loses focus.

## Difficulty modes

- **Easy** is the default. It has five hearts, longer falling-stone warnings, wider lava platforms, and extra checkpoints.
- **Normal** has three hearts, standard-width platforms, moderate falling-stone speed, and standard checkpoints.
- **Practice Mode** has unlimited hearts, very slow obstacles, the longest warnings, extra-wide platforms, extra checkpoints, and visible path arrows.

All modes have unlimited retries. Touching a hazard gently returns Sprinkles to the most recent checkpoint, and collected stars, magic balls, and hats are kept. If the heart counter reaches zero, it simply refills.

## Stage 1: Glittering Cave

1. **Cave Entrance** — movement, a tiny gap, and jump instructions.
2. **Tumbling Stone Trail** — clear warning markers appear before soft round stones fall.
3. **Warm Glow Crossing** — wide stepping stones and one gently moving platform cross the clearly marked lava.
4. **Crystal Garden** — checkpoints, stars, and a crystal key that opens a friendly crystal door.
5. **Rainbow Chamber** — a final easy approach to the Rainbow Gem.

Reaching the gem at the end of Stage 1 records the star total and shows a short story transition. Select **Enter the Crystal Cave** to begin Stage 2 without reloading the page.

## Stage 2: Crystal Cave

1. **Hat Tutorial** — the first safe magic ball demonstrates how balls become hats.
2. **Colorful Crystal Steps** — two simple jumping challenges use wide crystal platforms.
3. **Tumbling Prism Trail** — a magic ball sits near clearly warned falling stones and safe waiting areas.
4. **Rainbow Lava Crossing** — slow, predictable crystal platforms lead to the blue magic ball.
5. **Magic Hat Gallery** — the final purple ball completes the stack and opens the rainbow exit.

The six ball and hat pairs are:

| Ball | Hat style |
| --- | --- |
| Red | Party hat |
| Orange | Flower hat |
| Yellow | Crown |
| Green | Leaf hat |
| Blue | Wizard hat |
| Purple | Star hat |

Collected hats stack above Sprinkles and follow the same Canvas transformation used by the cat, so they stay attached while facing either direction, walking, jumping, falling, landing, and riding a moving platform. Hats are visual only and never change the player collision box.

The Stage 2 HUD shows all six collection slots, the saved Stage 1 star total, hearts, checkpoint status, progress, sound, and pause controls. Practice Mode also highlights the next uncollected ball.

## Files

- `index.html` — accessible screens, buttons, HUD, game canvas, and touch controls.
- `style.css` — responsive layout, title artwork, menus, controls, focus states, and reduced-motion styles.
- `game.js` — stage management, both level configurations, movement, collisions, obstacles, stars, magic balls, hat inventory and rendering, checkpoints, drawing, generated sounds, and UI logic.
- `README.md` — setup, controls, customization, and extension notes.

## Adjust the difficulty

Open `game.js` and find the `DIFFICULTIES` object near the top. Each mode has named values for:

- `hearts`
- `playerSpeed`
- `warningTime`
- `rockSpeed`
- `rockRest`
- `platformBonus`
- `movingPlatformRange`
- `extraCheckpoints`
- `guidance`

For example, increasing `warningTime` makes the yellow falling-stone warning stay visible longer. Increasing `platformBonus` widens the lava platforms.

World measurements are grouped in `STAGE_WORLDS`. Section names are grouped in `STAGE_SECTIONS`.

The selected stage swaps in values from `STAGE_WORLDS` and `STAGE_SECTIONS`. Both stages continue to use the same movement, camera, platform, rock, checkpoint, hazard, sound, and pause systems.

## Change magic hats and balls

Open `game.js` and find `MAGIC_HAT_TYPES`. Each entry keeps one hat's settings together:

- `id` and `name` identify the collectible.
- `color` and `accent` control the ball and hat colors.
- `hatStyle` selects `party`, `flower`, `crown`, `leaf`, `wizard`, or `star`.
- `x` and `y` position the magic ball in Stage 2.

To move a ball, change only its `x` and `y`. Keep the ball above a platform and outside the lava range. To change a design, edit its colors or choose another existing `hatStyle`.

To add an additional hat:

1. Add one entry to `MAGIC_HAT_TYPES`.
2. Add a matching HUD slot in `index.html` with the same `data-hat` value.
3. Adjust the Stage 2 completion total or continue using `MAGIC_HAT_TYPES.length` where it is already automatic.
4. If introducing a new visual style, add one branch to `drawHatShape()`.
5. Test that the taller stack remains readable and that the new ball is reachable.

The shipped version intentionally limits the visible stack to six hats.

## Hat inventory and checkpoints

The current collection is stored in `state.hats` as an ordered array of hat IDs. Each Stage 2 ball also has a `collected` flag. The collection function checks both values, so a ball cannot be collected twice or duplicate a hat.

Hazard returns and **Restart from Latest Checkpoint** move only the player and restore hearts; they do not rebuild the level, so ball flags and `state.hats` remain intact. **Restart Stage 2 from Beginning** rebuilds Stage 2 and clears its hats but preserves `state.stage1Stars`. Returning to the title or replaying Stage 1 begins a new full adventure.

## Change Sprinkles' appearance

Sprinkles is drawn with Canvas shapes in the `drawSprinkles()` function in `game.js`. Search for the comments **Tail**, **Body and legs**, **Ears behind the head**, **Head**, **Forehead sprinkles**, **Face**, and **Rainbow collar and bell**.

The easiest changes are the color values:

- Body: `#a98be9`
- Head: `#b79aee`
- Outline: `#5b3e9a`
- Inner ears: `#f49bc4`

The small title-screen portrait is styled separately in the `.cat-portrait` section of `style.css`.

## Add another stage

Stage 1 is produced by `buildLevel(config)` and Stage 2 by `buildStage2(config)`. The `buildStage()` selector sends the existing shared systems the correct configuration. To add another stage:

1. Add world measurements to `STAGE_WORLDS` and section labels to `STAGE_SECTIONS`.
2. Create a stage builder with platforms, collectibles, checkpoints, rocks, door, and goal.
3. Add the builder to `buildStage()`.
4. Add a story transition or stage-selection button.
5. Extend the stage-aware collectible and drawing branches only for genuinely new mechanics.

Keep platforms generous and test every jump in all three difficulty modes.

## Known limitations

- The game contains two scrolling stages; it does not save progress after the tab or browser is closed.
- Sounds are simple tones generated by the Web Audio API, so their character can vary slightly by browser and device.
- Emoji are used only in interface buttons and labels and may look a little different across operating systems.
- Very old browsers without Canvas, modern JavaScript, or Web Audio support are not supported. The game itself still works silently if Web Audio is unavailable.

## Future ideas

1. Add a Stage 3 sky-cavern with friendly fireflies and color-matching cloud bridges.
2. Add optional collectible badges and a local, privacy-friendly magic wardrobe.
3. Add more Sprinkles animations, such as tipping the hat stack at checkpoints and a longer gem celebration.
