# Sprinkles and the Rainbow Gem

**Sprinkles and the Rainbow Gem** is a cheerful, child-friendly three-stage browser game about a curious lavender cat exploring the Glittering Cave. Stage 1 is a gentle star-collecting adventure. Stage 2 continues into the colorful Crystal Cave, where six magic balls transform into hats. Stage 3 follows a delicious smell into a magical underground bakery, where six original Canvas-drawn treats make Sprinkles grow and open the path to the Rainbow Gem.

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

All modes have unlimited retries. Touching a hazard gently returns Sprinkles to the most recent checkpoint, and collected stars, magic balls, hats, foods, and growth are kept. If the heart counter reaches zero, it simply refills.

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

Reaching the Stage 2 gem with all six hats shows a second story transition. Select **Enter the Magic Bakery** to begin Stage 3 without resetting the saved stars or hat inventory.

## Stage 3: Magic Bakery Cave

1. **Bakery Welcome** — a safe Strawberry Cupcake teaches the growth mechanic.
2. **Easy Bakery Platforms** — wide cookie and frosting platforms hold the Chocolate-Chip Cookie.
3. **Falling Pastry Pantry** — clearly warned cookie and bread pieces fall near safe waiting areas and the Glazed Doughnut.
4. **Moving Dessert Crossing** — slow cake and cookie platforms cross a sparkling jam pool and lead to the Blueberry Muffin and Croissant.
5. **Grow-and-Open Gate** — a bakery gate opens from the growth-level state at Growth 5; missed food always remains reachable behind the player.
6. **Rainbow Cake Finale** — the Rainbow Birthday Cake Slice creates Growth 6, opens the final exit, and leads to the Rainbow Gem.

The six configurable foods in `GROWTH_FOODS` are Strawberry Cupcake, Chocolate-Chip Cookie, Glazed Doughnut, Blueberry Muffin, Croissant, and Rainbow Birthday Cake Slice. Each unique ID can be collected once. `state.growthLevel` is always derived from the validated number of unique food IDs and is clamped to 0–6.

`GROWTH_LEVELS` contains the seven visual scales: `1.00`, `1.08`, `1.16`, `1.24`, `1.32`, `1.40`, and `1.48`. The artwork scales from the paw/ground anchor and briefly overshoots before settling. Reduced Motion switches immediately to the new target scale with only a short glow.

Visual size and physics are intentionally separate. Every growth configuration currently uses `hitboxScale: 1.00`, so the fair 58 × 62 physics box, collection reach, ceiling clearance, and jump behavior do not expand with the decorative sprite. Growth never changes the Canvas or page dimensions. The camera keeps its existing zoom and only receives a tiny configured horizontal target offset.

The Stage 3 HUD shows food count, growth count, six accessible food slots, and a compact growth meter. On small screens the labels and icons compact without changing the responsive 1280 × 720 presentation.

## Files

- `index.html` — accessible screens, buttons, HUD, game canvas, and touch controls.
- `style.css` — responsive layout, title artwork, menus, controls, focus states, and reduced-motion styles.
- `game.js` — stage management, all three level configurations, movement, collisions, obstacles, stars, magic balls, foods, visual growth, inventory, versioned saves, checkpoints, drawing, generated sounds, and UI logic.
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

The selected stage swaps in values from `STAGE_WORLDS` and `STAGE_SECTIONS`. All three stages use the same movement, camera, platform, obstacle, checkpoint, hazard, sound, input, mobile-control, and pause systems.

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

In Stage 3 only the newest collected hat is drawn on Sprinkles so the growing sprite and upcoming hazards stay readable. All six hats remain preserved in `state.hats`, the saved file, the inventory/results UI, and the final result color chips.

## Change the foods, growth, or bakery gate

- Edit `GROWTH_FOODS` in `game.js` to change a food's `name`, `icon`, Canvas `style`, colors, or world `x`/`y` position. Keep IDs unique and keep each item above a reachable platform.
- Edit `drawFoodShape()` to change the original cupcake, cookie, doughnut, muffin, croissant, or cake artwork.
- Edit `visualScale` values in `GROWTH_LEVELS` to tune appearance. Keep `hitboxScale` independent; it remains `1.00` in the shipped level so decorative growth cannot make tunnels or hazards unfair.
- Edit `BAKERY_GATE_GROWTH` to change the puzzle requirement. Keep it below the six-food exit requirement so the final food stays reachable.
- Edit `buildStage3()` to move platforms, oven checkpoints, falling pastries, gates, or the jam crossing.

## Saved progress and checkpoints

Progress is stored locally under `sprinkles-rainbow-gem-save` using save version 3. It contains no personal information. The loader validates the difficulty, stage number, unique star indices, known hat IDs, known food IDs, checkpoint coordinates, unlock flags, and completion state. Growth is recalculated from unique valid foods instead of trusting a potentially corrupt stored number. Missing fields from older saves receive safe defaults, and invalid JSON falls back to a new adventure without crashing.

Food collection and checkpoint activation save immediately. The game also saves when it loses focus, becomes hidden, pauses, or is minimized as an installed web app. Resuming restores the correct food flags, growth target, hats, gate state, checkpoint position, hearts, and camera. **Restart Stage 3 from Beginning** clears only Stage 3 foods and growth; Stage 1 stars and Stage 2 hats remain.

The title screen displays **Continue Stage…** when a local save exists. Selecting **Start Adventure** intentionally creates a new full adventure.

## Change Sprinkles' appearance

Sprinkles is drawn with Canvas shapes in the `drawSprinkles()` function in `game.js`. Search for the comments **Tail**, **Body and legs**, **Ears behind the head**, **Head**, **Forehead sprinkles**, **Face**, and **Rainbow collar and bell**.

The easiest changes are the color values:

- Body: `#a98be9`
- Head: `#b79aee`
- Outline: `#5b3e9a`
- Inner ears: `#f49bc4`

The small title-screen portrait is styled separately in the `.cat-portrait` section of `style.css`.

## Add another stage

Stage 1 is produced by `buildLevel(config)`, Stage 2 by `buildStage2(config)`, and Stage 3 by `buildStage3(config)`. The `buildStage()` selector sends the existing shared systems the correct configuration. To add another stage:

1. Add world measurements to `STAGE_WORLDS` and section labels to `STAGE_SECTIONS`.
2. Create a stage builder with platforms, collectibles, checkpoints, rocks, door, and goal.
3. Add the builder to `buildStage()`.
4. Add a story transition or stage-selection button.
5. Extend the stage-aware collectible and drawing branches only for genuinely new mechanics.

Keep platforms generous and test every jump in all three difficulty modes.

## Known limitations

- Emoji are used for compact food inventory labels and can vary slightly by operating system; the playable foods themselves are original Canvas drawings.
- Stage 3 deliberately shows only the newest hat on the growing character. The full collection remains saved and appears in results.
- Sounds are simple tones generated by the Web Audio API, so their character can vary slightly by browser and device.
- Very old browsers without Canvas, modern JavaScript, or Web Audio support are not supported. The game itself still works silently if Web Audio is unavailable.

## Mobile viewport and installed-app testing

The game keeps its internal Canvas world at 1280 × 720 and scales only its displayed size. The visible frame uses the smaller of the available width and height ratios, after reserving space for touch controls, so physics and collision coordinates do not change. Mobile sizing uses `window.visualViewport` when available, with `100dvh` and `100vh` fallbacks for browser and installed-app viewport differences.

To test mobile layout locally, serve the folder over HTTP, open it with responsive developer tools, and check both portrait and landscape orientations. During gameplay, confirm that the HUD, canvas, left/right controls, and jump button remain visible without page scrolling. Menus and help panels may scroll inside the game frame on unusually short screens.

For Stage 3, use the transition normally or select **Replay Stage 3** after completing the adventure. Check Growth 0 and Growth 6 in portrait and landscape, ride both moving dessert platforms, activate the Growth 5 gate, collect the final cake, pause/resume, touch an oven checkpoint, refresh, and use **Continue Stage 3**. Confirm that the page dimensions do not change while Sprinkles grows.

For installed-PWA testing, open the deployed HTTPS page on a phone, add it to the Home Screen, launch it from the new icon, rotate the device, switch to another app, and return. The current stage and scale should remain intact. Safe-area padding keeps the control row above notches and home indicators.

The root GitHub Pages service worker and the wrapper service worker use a game-specific versioned cache. All Stage 3 code and markup are in the existing `index.html`, `style.css`, and `game.js` core assets, so no cross-origin artwork is required. The v4 activation step deletes only older caches whose names start with this game's cache prefix.

After a deployment, reload once while online so the updated service worker can replace its cache. Verify Stage 3 online, then switch the browser offline and reload to check the cached core. If an older layout remains, close all installed-game windows and reopen the app. As a final fallback, remove the Home Screen app, clear the site's browser data, visit the deployed URL again, and reinstall it.

Known mobile limitation: very short portrait screens necessarily show a smaller 16:9 play area. The game remains usable and centered, but landscape provides a larger view. Mobile browser toolbar animations can briefly resize the frame while the toolbar expands or collapses.

## Future ideas

1. Stage 4 could enter a Moonlight Garden where collected fireflies illuminate safe flower bridges.
2. Stage 4 could visit a Bubble-Lake Grotto with floating bubble platforms and a gentle color-matching puzzle.
3. Stage 4 could climb a Cloud Library where magical story pages create temporary paths through the sky cave.
