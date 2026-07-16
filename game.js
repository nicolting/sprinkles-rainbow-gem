(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // Canvas and interface references
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 2D is not available in this browser.");
  }

  const ui = {
    title: document.getElementById("titleScreen"),
    story: document.getElementById("storyScreen"),
    transition: document.getElementById("stageTransitionScreen"),
    bakeryTransition: document.getElementById("bakeryTransitionScreen"),
    pause: document.getElementById("pauseScreen"),
    victory: document.getElementById("victoryScreen"),
    error: document.getElementById("errorScreen"),
    hud: document.getElementById("hud"),
    touch: document.getElementById("touchControls"),
    message: document.getElementById("messageBubble"),
    announcer: document.getElementById("announcer"),
    hearts: document.getElementById("heartDisplay"),
    stars: document.getElementById("starCount"),
    starTotal: document.getElementById("starTotal"),
    starHud: document.getElementById("starHud"),
    hatHud: document.getElementById("hatHud"),
    hatCount: document.getElementById("hatCount"),
    hatSlots: document.getElementById("hatSlots"),
    savedStars: document.getElementById("savedStars"),
    foodHud: document.getElementById("foodHud"),
    foodCount: document.getElementById("foodCount"),
    growthCount: document.getElementById("growthCount"),
    foodSlots: document.getElementById("foodSlots"),
    growthFill: document.getElementById("growthFill"),
    checkpointStatus: document.getElementById("checkpointStatus"),
    progressText: document.getElementById("progressText"),
    progressFill: document.getElementById("progressFill"),
    progressTrack: document.querySelector(".progress-track"),
    section: document.getElementById("sectionName"),
    victoryStars: document.getElementById("victoryStars"),
    victoryHats: document.getElementById("victoryHats"),
    victoryFoods: document.getElementById("victoryFoods"),
    victoryGrowth: document.getElementById("victoryGrowth"),
    victoryFoodIcons: document.getElementById("victoryFoodIcons"),
    victoryHatColors: document.getElementById("victoryHatColors"),
    victoryCatCanvas: document.getElementById("victoryCatCanvas"),
    transitionStars: document.getElementById("transitionStars"),
    transitionHats: document.getElementById("transitionHats"),
    continueSaved: document.getElementById("continueSavedButton"),
    titleSound: document.getElementById("titleSoundButton"),
    sound: document.getElementById("soundButton"),
    motion: document.getElementById("motionButton")
  };

  // Keep the 1280×720 game world stable while fitting its CSS presentation to
  // the currently visible browser/PWA viewport. visualViewport accounts for
  // mobile browser chrome more accurately than 100vh alone.
  let viewportUpdateFrame = 0;

  function updateViewportLayout() {
    if (viewportUpdateFrame) cancelAnimationFrame(viewportUpdateFrame);

    const viewport = window.visualViewport;
    const viewportWidth = Math.max(1, Math.round(viewport?.width || window.innerWidth));
    const viewportHeight = Math.max(1, Math.round(viewport?.height || window.innerHeight));
    const root = document.documentElement;

    root.style.setProperty("--app-width", `${viewportWidth}px`);
    root.style.setProperty("--app-height", `${viewportHeight}px`);

    viewportUpdateFrame = requestAnimationFrame(() => {
      viewportUpdateFrame = 0;
      const bodyStyle = window.getComputedStyle(document.body);
      const horizontalPadding = parseFloat(bodyStyle.paddingLeft) + parseFloat(bodyStyle.paddingRight);
      const verticalPadding = parseFloat(bodyStyle.paddingTop) + parseFloat(bodyStyle.paddingBottom);
      const controlsVisible = !ui.touch.hidden && window.getComputedStyle(ui.touch).display !== "none";
      const controlsHeight = controlsVisible ? ui.touch.getBoundingClientRect().height : 0;
      const availableWidth = Math.max(1, viewportWidth - horizontalPadding);
      const availableHeight = Math.max(1, viewportHeight - verticalPadding - controlsHeight);
      const scale = Math.max(0.1, Math.min(availableWidth / VIEW.width, availableHeight / VIEW.height, 1.125));

      root.style.setProperty("--game-width", `${Math.floor(VIEW.width * scale)}px`);
      root.style.setProperty("--game-height", `${Math.floor(VIEW.height * scale)}px`);
    });
  }

  // ---------------------------------------------------------------------------
  // Tunable game settings
  // ---------------------------------------------------------------------------
  const VIEW = { width: 1280, height: 720 };
  const STAGE_WORLDS = {
    1: { width: 6900, floorY: 610, lavaStart: 2760, lavaEnd: 4060, gemX: 6650 },
    2: { width: 7200, floorY: 610, lavaStart: 3900, lavaEnd: 5230, gemX: 6820 },
    3: { width: 7600, floorY: 610, lavaStart: 3400, lavaEnd: 5020, gemX: 7360 }
  };
  let WORLD = { ...STAGE_WORLDS[1] };

  const DIFFICULTIES = {
    easy: {
      label: "Easy",
      hearts: 5,
      playerSpeed: 5.25,
      warningTime: 1900,
      rockSpeed: 7.1,
      rockRest: 2600,
      platformBonus: 40,
      movingPlatformRange: 18,
      extraCheckpoints: true,
      guidance: false
    },
    normal: {
      label: "Normal",
      hearts: 3,
      playerSpeed: 5.5,
      warningTime: 1350,
      rockSpeed: 9.1,
      rockRest: 2100,
      platformBonus: 0,
      movingPlatformRange: 26,
      extraCheckpoints: false,
      guidance: false
    },
    practice: {
      label: "Practice Mode",
      hearts: Infinity,
      playerSpeed: 5.25,
      warningTime: 2600,
      rockSpeed: 5.1,
      rockRest: 3300,
      platformBonus: 60,
      movingPlatformRange: 10,
      extraCheckpoints: true,
      guidance: true
    }
  };

  const STAGE_SECTIONS = {
    1: [
      { x: 0, name: "Cave Entrance" },
      { x: 1220, name: "Tumbling Stone Trail" },
      { x: 2720, name: "Warm Glow Crossing" },
      { x: 4060, name: "Crystal Garden" },
      { x: 5350, name: "Rainbow Chamber" }
    ],
    2: [
      { x: 0, name: "Hat Tutorial" },
      { x: 1050, name: "Colorful Crystal Steps" },
      { x: 2450, name: "Tumbling Prism Trail" },
      { x: 3850, name: "Rainbow Lava Crossing" },
      { x: 5350, name: "Magic Hat Gallery" }
    ],
    3: [
      { x: 0, name: "Bakery Welcome" },
      { x: 1050, name: "Easy Bakery Platforms" },
      { x: 2350, name: "Falling Pastry Pantry" },
      { x: 3400, name: "Moving Dessert Crossing" },
      { x: 5020, name: "Grow-and-Open Gate" },
      { x: 6250, name: "Rainbow Cake Finale" }
    ]
  };
  let SECTION_NAMES = STAGE_SECTIONS[1];

  const MAGIC_HAT_TYPES = [
    { id: "red", name: "red", color: "#ff5f75", accent: "#ffd6df", hatStyle: "party", x: 520, y: 530 },
    { id: "orange", name: "orange", color: "#ff9f43", accent: "#ffe1b5", hatStyle: "flower", x: 1510, y: 425 },
    { id: "yellow", name: "yellow", color: "#ffd24d", accent: "#fff5a8", hatStyle: "crown", x: 2200, y: 470 },
    { id: "green", name: "green", color: "#50d890", accent: "#c7ffe1", hatStyle: "leaf", x: 2940, y: 530 },
    { id: "blue", name: "blue", color: "#52b9ff", accent: "#d4f2ff", hatStyle: "wizard", x: 4440, y: 405 },
    { id: "purple", name: "purple", color: "#a778ef", accent: "#eadbff", hatStyle: "star", x: 5650, y: 530 }
  ];

  const GROWTH_FOODS = [
    { id: "cupcake", name: "Strawberry Cupcake", icon: "🧁", style: "cupcake", color: "#ff7eaa", accent: "#ffe7f0", x: 520, y: 530 },
    { id: "cookie", name: "Chocolate-Chip Cookie", icon: "🍪", style: "cookie", color: "#d79555", accent: "#6c3d2b", x: 1570, y: 468 },
    { id: "donut", name: "Glazed Doughnut", icon: "🍩", style: "donut", color: "#f49aca", accent: "#8b5a3c", x: 2780, y: 530 },
    { id: "muffin", name: "Blueberry Muffin", icon: "🫐", style: "muffin", color: "#7787df", accent: "#d9c7ff", x: 3545, y: 458 },
    { id: "croissant", name: "Croissant", icon: "🥐", style: "croissant", color: "#f2b75f", accent: "#fff0b5", x: 4800, y: 410 },
    { id: "cake", name: "Rainbow Birthday Cake Slice", icon: "🍰", style: "cake", color: "#fff0bd", accent: "#ff82af", x: 6490, y: 510 }
  ];

  // Visual growth is anchored at Sprinkles' feet. Physics deliberately stays
  // unchanged so every tunnel and jump remains fair at all six growth levels.
  const GROWTH_LEVELS = [
    { visualScale: 1.00, hitboxScale: 1.00, cameraOffset: 0 },
    { visualScale: 1.08, hitboxScale: 1.00, cameraOffset: 3 },
    { visualScale: 1.16, hitboxScale: 1.00, cameraOffset: 6 },
    { visualScale: 1.24, hitboxScale: 1.00, cameraOffset: 9 },
    { visualScale: 1.32, hitboxScale: 1.00, cameraOffset: 12 },
    { visualScale: 1.40, hitboxScale: 1.00, cameraOffset: 15 },
    { visualScale: 1.48, hitboxScale: 1.00, cameraOffset: 18 }
  ];
  const BAKERY_GATE_GROWTH = 5;
  const SAVE_KEY = "sprinkles-rainbow-gem-save";
  const SAVE_VERSION = 3;

  const BACKGROUND_CRYSTALS = [
    { x: 180, y: 225, size: 52, color: "#7366dd" },
    { x: 730, y: 470, size: 37, color: "#5bd6c4" },
    { x: 1130, y: 250, size: 64, color: "#ad75ef" },
    { x: 1690, y: 440, size: 45, color: "#5fcae7" },
    { x: 2190, y: 285, size: 58, color: "#ea83b4" },
    { x: 2590, y: 465, size: 38, color: "#77e5c3" },
    { x: 3010, y: 260, size: 68, color: "#8a74ed" },
    { x: 3490, y: 390, size: 42, color: "#6acfe1" },
    { x: 3940, y: 235, size: 57, color: "#db81d3" },
    { x: 4340, y: 455, size: 45, color: "#64dbb5" },
    { x: 4810, y: 270, size: 72, color: "#a17af3" },
    { x: 5270, y: 440, size: 40, color: "#65cdeb" },
    { x: 5730, y: 240, size: 62, color: "#f08ab8" },
    { x: 6170, y: 430, size: 50, color: "#70ddc2" },
    { x: 6720, y: 250, size: 82, color: "#b17df1" }
  ];

  // ---------------------------------------------------------------------------
  // Small utility helpers
  // ---------------------------------------------------------------------------
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const overlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function roundedRectPath(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawStarPath(context, x, y, outer, inner = outer * 0.46, points = 5) {
    context.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outer : inner;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.closePath();
  }

  function seededWave(index) {
    return Math.sin(index * 12.9898) * 0.5 + 0.5;
  }

  // ---------------------------------------------------------------------------
  // Friendly, optional sounds made in the browser (no audio files required)
  // ---------------------------------------------------------------------------
  class SoundManager {
    constructor() {
      this.enabled = true;
      this.context = null;
    }

    ensureContext() {
      if (!this.enabled) return null;
      if (!this.context) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        this.context = new AudioContextClass();
      }
      if (this.context.state === "suspended") this.context.resume();
      return this.context;
    }

    tone(frequency, duration = 0.12, type = "sine", volume = 0.06, delay = 0) {
      const audio = this.ensureContext();
      if (!audio) return;
      const start = audio.currentTime + delay;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    }

    jump() { this.tone(430, 0.11, "sine", 0.045); this.tone(600, 0.1, "sine", 0.035, 0.055); }
    collect() { [660, 830, 1040].forEach((note, i) => this.tone(note, 0.12, "triangle", 0.045, i * 0.055)); }
    checkpoint() { [520, 660, 780, 980].forEach((note, i) => this.tone(note, 0.17, "sine", 0.04, i * 0.075)); }
    warning() { this.tone(300, 0.14, "triangle", 0.04); this.tone(300, 0.14, "triangle", 0.04, 0.22); }
    safeReturn() { this.tone(330, 0.18, "sine", 0.035); this.tone(440, 0.2, "sine", 0.03, 0.12); }
    magicBall() { [620, 780, 930].forEach((note, i) => this.tone(note, 0.15, "triangle", 0.045, i * 0.06)); }
    hatTransform() { this.tone(880, 0.18, "sine", 0.035); this.tone(1180, 0.24, "sine", 0.04, 0.09); }
    allHats() { [523, 659, 784, 988, 1175].forEach((note, i) => this.tone(note, 0.34, "triangle", 0.045, i * 0.085)); }
    food() { [620, 760, 920].forEach((note, i) => this.tone(note, 0.14, "sine", 0.04, i * 0.055)); }
    grow() { this.tone(520, 0.22, "triangle", 0.035); this.tone(780, 0.3, "sine", 0.04, 0.09); }
    maxGrowth() { [523, 659, 784, 988, 1318].forEach((note, i) => this.tone(note, 0.34, "triangle", 0.045, i * 0.08)); }
    openExit() { this.tone(440, 0.3, "sine", 0.035); this.tone(660, 0.35, "sine", 0.04, 0.16); }
    victory() { [523, 659, 784, 1047].forEach((note, i) => this.tone(note, 0.42, "triangle", 0.055, i * 0.12)); }
  }

  const sounds = new SoundManager();

  // ---------------------------------------------------------------------------
  // Player and level construction
  // ---------------------------------------------------------------------------
  function createPlayer() {
    return {
      x: 150,
      y: WORLD.floorY - 64,
      w: 58,
      h: 62,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      coyote: 0,
      jumpBuffer: 0,
      invulnerable: 0,
      landSquash: 0,
      collectGlow: 0,
      steps: 0
    };
  }

  function buildLevel(config) {
    const bonus = config.platformBonus;
    const platforms = [
      { x: 0, y: WORLD.floorY, w: 1320, h: 120, kind: "ground" },
      { x: 1390, y: WORLD.floorY, w: 1370, h: 120, kind: "ground" },
      { x: 2800 - bonus / 2, y: 535, w: 280 + bonus, h: 32, kind: "lava" },
      { x: 3130 - bonus / 2, y: 470, w: 270 + bonus, h: 32, kind: "lava", moving: true, baseY: 470, lastY: 470 },
      { x: 3460 - bonus / 2, y: 535, w: 280 + bonus, h: 32, kind: "lava" },
      { x: 3780 - bonus / 2, y: 535, w: 275 + bonus, h: 32, kind: "lava" },
      { x: 4060, y: WORLD.floorY, w: 1240, h: 120, kind: "ground" },
      { x: 5360, y: WORLD.floorY, w: 1540, h: 120, kind: "ground" },
      { x: 5535, y: 500, w: 250 + bonus / 2, h: 28, kind: "crystal" },
      { x: 5900, y: 545, w: 210 + bonus / 2, h: 28, kind: "crystal" }
    ];

    const starPositions = [
      [410, 525], [720, 485], [1030, 530], [1475, 520], [1730, 470],
      [2010, 525], [2340, 485], [2660, 520], [2890, 465], [3220, 395],
      [3540, 465], [3880, 465], [4180, 525], [4460, 475], [4740, 515],
      [5010, 505], [5430, 525], [5680, 430], [6080, 485], [6420, 460]
    ];

    const checkpointDefinitions = [
      { x: 1080, extra: true },
      { x: 2510, extra: false },
      { x: 4130, extra: true },
      { x: 4390, extra: false },
      { x: 5410, extra: true }
    ];

    return {
      platforms,
      stars: starPositions.map(([x, y], index) => ({ x, y, r: 18, collected: false, phase: index * 0.72 })),
      checkpoints: checkpointDefinitions
        .filter((checkpoint) => config.extraCheckpoints || !checkpoint.extra)
        .map((checkpoint) => ({ ...checkpoint, y: WORLD.floorY - 72, active: false })),
      rocks: [1540, 1900, 2260, 2580].map((x, index) => ({
        x,
        y: -85,
        size: index % 2 === 0 ? 58 : 52,
        state: "idle",
        timer: index * 210,
        shadow: 0,
        warned: false
      })),
      key: { x: 4800, y: 520, w: 30, h: 42, collected: false },
      door: { x: 5180, y: 392, w: 46, h: 218, open: false },
      gem: { x: WORLD.gemX, y: 474, w: 74, h: 105 }
    };
  }

  function buildStage2(config) {
    const bonus = config.platformBonus;
    const platforms = [
      { x: 0, y: WORLD.floorY, w: 1120, h: 120, kind: "crystal-ground" },
      { x: 1190, y: WORLD.floorY, w: 1210, h: 120, kind: "crystal-ground" },
      { x: 2470, y: WORLD.floorY, w: 1430, h: 120, kind: "crystal-ground" },
      { x: 1450, y: 495, w: 260 + bonus / 2, h: 28, kind: "rainbow" },
      { x: 2070, y: 535, w: 270 + bonus / 2, h: 28, kind: "rainbow" },
      { x: 2780, y: 545, w: 330 + bonus / 2, h: 28, kind: "rainbow" },
      { x: 3920 - bonus / 2, y: 535, w: 300 + bonus, h: 32, kind: "rainbow" },
      { x: 4300 - bonus / 2, y: 475, w: 310 + bonus, h: 32, kind: "rainbow", moving: true, baseY: 475, lastY: 475 },
      { x: 4690 - bonus / 2, y: 535, w: 320 + bonus, h: 32, kind: "rainbow" },
      { x: 5070 - bonus / 2, y: 500, w: 280 + bonus, h: 32, kind: "rainbow" },
      { x: 5230, y: WORLD.floorY, w: 1970, h: 120, kind: "crystal-ground" },
      { x: 5560, y: 555, w: 250 + bonus / 2, h: 26, kind: "rainbow" },
      { x: 5960, y: 515, w: 260 + bonus / 2, h: 26, kind: "rainbow" }
    ];

    const checkpointDefinitions = [
      { x: 980, extra: true },
      { x: 2320, extra: false },
      { x: 3780, extra: true },
      { x: 5280, extra: false },
      { x: 6020, extra: true }
    ];

    return {
      stage: 2,
      platforms,
      stars: [],
      magicBalls: MAGIC_HAT_TYPES.map((hat, index) => ({ ...hat, r: 21, collected: false, phase: index * 0.85 })),
      checkpoints: checkpointDefinitions
        .filter((checkpoint) => config.extraCheckpoints || !checkpoint.extra)
        .map((checkpoint) => ({ ...checkpoint, y: WORLD.floorY - 72, active: false })),
      rocks: [2640, 3180, 3570].map((x, index) => ({
        x,
        y: -85,
        size: index % 2 === 0 ? 56 : 50,
        state: "idle",
        timer: index * 240,
        shadow: 0,
        warned: false
      })),
      key: null,
      door: { x: 6420, y: 392, w: 50, h: 218, open: false, stageExit: true },
      gem: { x: WORLD.gemX, y: 474, w: 74, h: 105 }
    };
  }

  function buildStage3(config) {
    const bonus = config.platformBonus;
    const platforms = [
      { x: 0, y: WORLD.floorY, w: 1220, h: 120, kind: "bakery-ground" },
      { x: 1280, y: WORLD.floorY, w: 1120, h: 120, kind: "bakery-ground" },
      { x: 1450, y: 525, w: 330 + bonus / 2, h: 28, kind: "cookie" },
      { x: 2050, y: 545, w: 300 + bonus / 2, h: 28, kind: "frosting" },
      { x: 2460, y: WORLD.floorY, w: 940, h: 120, kind: "bakery-ground" },
      { x: 3430 - bonus / 2, y: 525, w: 330 + bonus, h: 34, kind: "cake" },
      { x: 3820 - bonus / 2, y: 475, w: 350 + bonus, h: 34, kind: "cookie", moving: true, baseY: 475, lastY: 475 },
      { x: 4240 - bonus / 2, y: 525, w: 350 + bonus, h: 34, kind: "frosting" },
      { x: 4630 - bonus / 2, y: 465, w: 370 + bonus, h: 34, kind: "cake", moving: true, baseY: 465, lastY: 465 },
      { x: 5020, y: WORLD.floorY, w: 2580, h: 120, kind: "bakery-ground" },
      { x: 6300, y: 550, w: 330 + bonus / 2, h: 28, kind: "cake" },
      { x: 6740, y: 525, w: 280 + bonus / 2, h: 28, kind: "cookie" }
    ];
    const checkpointDefinitions = [
      { x: 1080, extra: true },
      { x: 2320, extra: false },
      { x: 3290, extra: true },
      { x: 5100, extra: false },
      { x: 6250, extra: true }
    ];
    return {
      stage: 3,
      platforms,
      stars: [],
      magicBalls: [],
      foods: GROWTH_FOODS.map((food, index) => ({ ...food, r: 25, collected: false, phase: index * 0.82 })),
      checkpoints: checkpointDefinitions
        .filter((checkpoint) => config.extraCheckpoints || !checkpoint.extra)
        .map((checkpoint) => ({ ...checkpoint, y: WORLD.floorY - 72, active: false })),
      rocks: [2580, 3010].map((x, index) => ({
        x,
        y: -85,
        size: index === 0 ? 60 : 54,
        pastryStyle: index === 0 ? "cookie" : "bread",
        state: "idle",
        timer: index * 260,
        shadow: 0,
        warned: false
      })),
      key: null,
      door: { x: 5940, y: 382, w: 62, h: 228, open: false, bakeryGate: true, growthRequirement: BAKERY_GATE_GROWTH },
      exitDoor: { x: 7110, y: 382, w: 58, h: 228, open: false, stageExit: true, growthRequirement: GROWTH_FOODS.length },
      gem: { x: WORLD.gemX, y: 474, w: 74, h: 105 }
    };
  }

  function buildStage(stageNumber, config) {
    if (stageNumber === 2) return buildStage2(config);
    if (stageNumber === 3) return buildStage3(config);
    return buildLevel(config);
  }

  const input = {
    left: false,
    right: false,
    jump: false
  };

  const state = {
    mode: "title",
    stage: 1,
    difficulty: "easy",
    config: DIFFICULTIES.easy,
    player: createPlayer(),
    level: buildStage(1, DIFFICULTIES.easy),
    hearts: DIFFICULTIES.easy.hearts,
    collected: 0,
    stage1Stars: 0,
    hats: [],
    foods: [],
    growthLevel: 0,
    growthFromScale: 1,
    growthAnimation: 1,
    growthGlow: 0,
    stage2Unlocked: false,
    stage3Unlocked: false,
    stage3Completed: false,
    stage3Checkpoint: { x: 150, name: "Bakery start" },
    stage1CollectedIndices: [],
    checkpointX: 150,
    checkpointName: "Cave start",
    cameraX: 0,
    time: 0,
    lastTime: 0,
    messageTimer: 0,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    particles: [],
    tutorialSeen: new Set(),
    lastSection: "",
    returnFlash: 0,
    hatGlow: 0,
    hatBounce: 0,
    newHatPop: 0,
    transformation: null,
    loadedSave: null
  };

  function uniqueAllowed(values, allowed) {
    if (!Array.isArray(values)) return [];
    return [...new Set(values.filter((value) => allowed.has(value)))];
  }

  function readSavedProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!raw || typeof raw !== "object") return null;
      const hatIds = new Set(MAGIC_HAT_TYPES.map((item) => item.id));
      const foodIds = new Set(GROWTH_FOODS.map((item) => item.id));
      const foods = uniqueAllowed(raw.foods, foodIds).slice(0, GROWTH_FOODS.length);
      const hats = uniqueAllowed(raw.hats, hatIds).slice(0, MAGIC_HAT_TYPES.length);
      const stage = clamp(Number.isInteger(raw.currentStage) ? raw.currentStage : 1, 1, 3);
      const starIndices = Array.isArray(raw.stage1CollectedIndices)
        ? [...new Set(raw.stage1CollectedIndices.filter((value) => Number.isInteger(value) && value >= 0 && value < 20))]
        : [];
      const rawStage3Checkpoint = raw.stage3Checkpoint && typeof raw.stage3Checkpoint === "object" ? raw.stage3Checkpoint : {};
      const stage3Checkpoint = {
        x: Number.isFinite(rawStage3Checkpoint.x) ? rawStage3Checkpoint.x : (stage === 3 && Number.isFinite(raw.checkpointX) ? raw.checkpointX : 150),
        name: typeof rawStage3Checkpoint.name === "string" ? rawStage3Checkpoint.name.slice(0, 80) : (stage === 3 && typeof raw.checkpointName === "string" ? raw.checkpointName.slice(0, 80) : "Bakery start")
      };
      return {
        version: Number.isInteger(raw.version) ? raw.version : 1,
        currentStage: stage,
        difficulty: Object.hasOwn(DIFFICULTIES, raw.difficulty) ? raw.difficulty : "easy",
        soundEnabled: raw.soundEnabled !== false,
        reducedMotion: Boolean(raw.reducedMotion),
        stage1Stars: clamp(Number(raw.stage1Stars) || starIndices.length, 0, 20),
        stage1CollectedIndices: starIndices,
        hats,
        foods,
        growthLevel: foods.length,
        checkpointX: stage === 3 ? stage3Checkpoint.x : (Number.isFinite(raw.checkpointX) ? raw.checkpointX : 150),
        checkpointName: stage === 3 ? stage3Checkpoint.name : (typeof raw.checkpointName === "string" ? raw.checkpointName.slice(0, 80) : ""),
        stage3Checkpoint,
        stage2Unlocked: Boolean(raw.stage2Unlocked || stage >= 2 || hats.length),
        stage3Unlocked: Boolean(raw.stage3Unlocked || stage >= 3 || foods.length),
        stage3Completed: Boolean(raw.stage3Completed)
      };
    } catch (error) {
      console.warn("Saved adventure could not be loaded; starting safely.", error);
      return null;
    }
  }

  function saveProgress(stageOverride = null) {
    try {
      if (state.stage === 1 && state.level?.stars) {
        state.stage1CollectedIndices = state.level.stars
          .map((star, index) => star.collected ? index : -1)
          .filter((index) => index >= 0);
      }
      if (state.stage === 3) state.stage3Checkpoint = { x: state.checkpointX, name: state.checkpointName };
      const currentStage = stageOverride || state.stage;
      const advancing = currentStage !== state.stage;
      const data = {
        version: SAVE_VERSION,
        currentStage,
        difficulty: state.difficulty,
        soundEnabled: sounds.enabled,
        reducedMotion: state.reducedMotion,
        stage1Stars: state.stage1Stars,
        stage1CollectedIndices: state.stage1CollectedIndices,
        hats: [...state.hats],
        foods: [...state.foods],
        growthLevel: clamp(state.foods.length, 0, GROWTH_FOODS.length),
        checkpointX: advancing ? 150 : state.checkpointX,
        checkpointName: advancing ? "" : state.checkpointName,
        stage3Checkpoint: { ...state.stage3Checkpoint },
        stage2Unlocked: state.stage2Unlocked,
        stage3Unlocked: state.stage3Unlocked,
        stage3Completed: state.stage3Completed
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      state.loadedSave = data;
      updateSavedAdventureButton();
    } catch (error) {
      console.warn("Progress could not be saved in this browser.", error);
    }
  }

  function updateSavedAdventureButton() {
    if (!ui.continueSaved) return;
    const saved = readSavedProgress();
    ui.continueSaved.hidden = !saved;
    if (saved) {
      const label = saved.stage3Completed && saved.foods.length === GROWTH_FOODS.length
        ? "Revisit the Magic Bakery"
        : `Continue Stage ${saved.currentStage}`;
      ui.continueSaved.textContent = label;
    }
  }

  function restoreLevelProgress(saved) {
    if (state.stage === 1) {
      const collected = new Set(saved.stage1CollectedIndices);
      state.level.stars.forEach((star, index) => { star.collected = collected.has(index); });
      state.collected = collected.size;
    } else if (state.stage === 2) {
      state.level.magicBalls.forEach((ball) => { ball.collected = saved.hats.includes(ball.id); });
      state.level.door.open = saved.hats.length === MAGIC_HAT_TYPES.length;
    } else {
      state.level.foods.forEach((food) => { food.collected = saved.foods.includes(food.id); });
      state.growthLevel = saved.foods.length;
      state.growthFromScale = GROWTH_LEVELS[state.growthLevel].visualScale;
      state.growthAnimation = 1;
      state.level.door.open = state.growthLevel >= BAKERY_GATE_GROWTH;
      state.level.exitDoor.open = state.growthLevel >= GROWTH_FOODS.length;
    }
    state.checkpointX = clamp(saved.checkpointX || 150, 150, WORLD.width - 240);
    state.checkpointName = saved.checkpointName || (state.stage === 1 ? "Cave start" : state.stage === 2 ? "Crystal Cave start" : "Bakery start");
    state.level.checkpoints.forEach((checkpoint) => { checkpoint.active = checkpoint.x < state.checkpointX; });
    state.player.x = state.checkpointX;
    state.player.y = WORLD.floorY - state.player.h - 4;
    state.cameraX = clamp(state.player.x - 300, 0, WORLD.width - VIEW.width);
  }

  function resumeSavedAdventure() {
    const saved = readSavedProgress();
    if (!saved) return;
    state.difficulty = saved.difficulty;
    state.config = DIFFICULTIES[saved.difficulty];
    const difficultyRadio = document.querySelector(`input[name="difficulty"][value="${saved.difficulty}"]`);
    if (difficultyRadio) difficultyRadio.checked = true;
    sounds.enabled = saved.soundEnabled;
    state.reducedMotion = saved.reducedMotion;
    state.stage1Stars = saved.stage1Stars;
    state.stage1CollectedIndices = [...saved.stage1CollectedIndices];
    state.hats = [...saved.hats];
    state.foods = [...saved.foods];
    state.growthLevel = saved.foods.length;
    state.stage2Unlocked = saved.stage2Unlocked;
    state.stage3Unlocked = saved.stage3Unlocked;
    state.stage3Completed = saved.stage3Completed;
    state.stage3Checkpoint = { ...saved.stage3Checkpoint };
    prepareStage(saved.currentStage, false);
    restoreLevelProgress(saved);
    state.mode = "playing";
    setScreen("game");
    updateSoundButtons();
    updateMotionButton();
    updateHud();
    showMessage(`Welcome back to Stage ${state.stage}! Your progress is safe.`, 2800);
    sounds.ensureContext();
  }

  // ---------------------------------------------------------------------------
  // UI state and accessible feedback
  // ---------------------------------------------------------------------------
  function setScreen(name) {
    const screens = {
      title: ui.title,
      story: ui.story,
      transition: ui.transition,
      bakeryTransition: ui.bakeryTransition,
      pause: ui.pause,
      victory: ui.victory,
      error: ui.error
    };
    Object.entries(screens).forEach(([key, element]) => {
      const visible = key === name;
      element.hidden = !visible;
      element.classList.toggle("is-visible", visible);
    });

    const playing = name === "game";
    ui.hud.hidden = !playing;
    ui.touch.hidden = !playing;
    document.body.classList.toggle("game-is-active", playing);
    updateViewportLayout();
  }

  function announce(text) {
    ui.announcer.textContent = "";
    window.setTimeout(() => { ui.announcer.textContent = text; }, 20);
  }

  function showMessage(text, duration = 2100) {
    ui.message.textContent = text;
    ui.message.hidden = false;
    state.messageTimer = duration;
    announce(text);
  }

  function updateSoundButtons() {
    const icon = sounds.enabled ? "🔊" : "🔇";
    ui.titleSound.firstChild.textContent = `${icon} `;
    const label = ui.titleSound.querySelector("span");
    if (label) label.textContent = sounds.enabled ? "Sound on" : "Sound off";
    ui.titleSound.setAttribute("aria-pressed", String(!sounds.enabled));
    ui.titleSound.setAttribute("aria-label", sounds.enabled ? "Turn sound off" : "Turn sound on");
    ui.sound.textContent = icon;
    ui.sound.setAttribute("aria-pressed", String(!sounds.enabled));
    ui.sound.setAttribute("aria-label", sounds.enabled ? "Turn sound off" : "Turn sound on");
  }

  function toggleSound() {
    sounds.enabled = !sounds.enabled;
    if (sounds.enabled) sounds.ensureContext();
    updateSoundButtons();
    if (state.mode !== "title") saveProgress();
  }

  function updateMotionButton() {
    ui.motion.setAttribute("aria-pressed", String(state.reducedMotion));
    ui.motion.innerHTML = state.reducedMotion
      ? "🌙 <span>Reduced motion</span>"
      : "✨ <span>Full motion</span>";
    document.body.classList.toggle("reduced-motion", state.reducedMotion);
  }

  function updateHud() {
    if (state.hearts === Infinity) {
      ui.hearts.innerHTML = '<span class="practice-heart" aria-hidden="true">♥ ∞</span>';
      ui.hearts.setAttribute("aria-label", "Unlimited hearts in Practice Mode");
      ui.hearts.dataset.overflow = "";
    } else {
      const max = state.config.hearts;
      ui.hearts.innerHTML = Array.from({ length: max }, (_, index) =>
        `<span class="heart-icon ${index >= state.hearts ? "heart-empty" : ""}" aria-hidden="true">♥</span>`
      ).join("");
      ui.hearts.setAttribute("aria-label", `${state.hearts} of ${max} hearts`);
      ui.hearts.dataset.overflow = max > 3 ? `×${state.hearts}` : "";
    }

    const inStage2 = state.stage === 2;
    const inStage3 = state.stage === 3;
    ui.starHud.hidden = state.stage !== 1;
    ui.hatHud.hidden = !inStage2;
    ui.foodHud.hidden = !inStage3;

    if (inStage2) {
      ui.hatCount.textContent = `${state.hats.length} / ${MAGIC_HAT_TYPES.length}`;
      ui.savedStars.textContent = `★ ${state.stage1Stars} stars saved`;
      ui.hatHud.classList.toggle("is-complete", state.hats.length === MAGIC_HAT_TYPES.length && state.hatGlow > 0);
      ui.hatSlots.querySelectorAll("[data-hat]").forEach((slot) => {
        const type = MAGIC_HAT_TYPES.find((hat) => hat.id === slot.dataset.hat);
        const collected = state.hats.includes(slot.dataset.hat);
        slot.classList.toggle("is-collected", collected);
        slot.style.setProperty("--hat-color", type?.color || "#ffffff");
      });
    } else if (state.stage === 1) {
      ui.stars.textContent = String(state.collected);
      ui.starTotal.textContent = `/ ${state.level.stars.length}`;
    } else {
      ui.foodCount.textContent = `${state.foods.length} / ${GROWTH_FOODS.length}`;
      ui.growthCount.textContent = `${state.growthLevel} / ${GROWTH_FOODS.length}`;
      ui.growthFill.style.width = `${(state.growthLevel / GROWTH_FOODS.length) * 100}%`;
      ui.foodHud.classList.toggle("is-complete", state.growthLevel === GROWTH_FOODS.length && state.growthGlow > 0);
      ui.foodSlots.querySelectorAll("[data-food]").forEach((slot) => {
        const food = GROWTH_FOODS.find((item) => item.id === slot.dataset.food);
        const collected = state.foods.includes(slot.dataset.food);
        slot.classList.toggle("is-collected", collected);
        slot.setAttribute("aria-label", `${food?.name || "Magical food"}: ${collected ? "collected" : "not collected"}`);
      });
    }

    ui.checkpointStatus.textContent = state.checkpointName;

    const progress = clamp(Math.round((state.player.x / WORLD.gemX) * 100), 0, 100);
    ui.progressText.textContent = `${progress}%`;
    ui.progressFill.style.width = `${progress}%`;
    ui.progressTrack.setAttribute("aria-valuenow", String(progress));

    const section = [...SECTION_NAMES].reverse().find((item) => state.player.x >= item.x);
    if (section) {
      ui.section.textContent = section.name;
      if (state.lastSection && state.lastSection !== section.name && state.mode === "playing") {
        const finalSection = state.stage === 1 ? "Rainbow Chamber" : state.stage === 2 ? "Magic Hat Gallery" : "Rainbow Cake Finale";
        showMessage(section.name === finalSection ? "Almost there! A rainbow glow is close!" : `Welcome to the ${section.name}!`, 1900);
      }
      state.lastSection = section.name;
    }
  }

  function prepareStage(stageNumber, resetStageProgress = true) {
    state.stage = stageNumber;
    WORLD = { ...STAGE_WORLDS[stageNumber] };
    SECTION_NAMES = STAGE_SECTIONS[stageNumber];
    state.player = createPlayer();
    state.level = buildStage(stageNumber, state.config);
    state.hearts = state.config.hearts;
    if (stageNumber === 1 && resetStageProgress) {
      state.collected = 0;
      state.stage1Stars = 0;
      state.stage1CollectedIndices = [];
      state.hats = [];
      state.foods = [];
      state.growthLevel = 0;
      state.stage2Unlocked = false;
      state.stage3Unlocked = false;
      state.stage3Completed = false;
    }
    if (stageNumber === 2 && resetStageProgress) {
      state.hats = [];
      state.foods = [];
      state.growthLevel = 0;
    }
    if (stageNumber === 3 && resetStageProgress) {
      state.foods = [];
      state.growthLevel = 0;
      state.stage3Checkpoint = { x: 150, name: "Bakery start" };
    }
    state.checkpointX = 150;
    state.checkpointName = stageNumber === 1 ? "Cave start" : stageNumber === 2 ? "Crystal Cave start" : "Bakery start";
    state.cameraX = 0;
    state.time = 0;
    state.messageTimer = 0;
    state.particles = [];
    state.tutorialSeen = new Set();
    state.lastSection = "";
    state.returnFlash = 0;
    state.hatGlow = 0;
    state.hatBounce = 0;
    state.newHatPop = 0;
    state.transformation = null;
    state.growthFromScale = GROWTH_LEVELS[state.growthLevel].visualScale;
    state.growthAnimation = 1;
    state.growthGlow = 0;
    input.left = false;
    input.right = false;
    input.jump = false;
    updateHud();
  }

  function startGame() {
    state.difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || state.difficulty;
    state.config = DIFFICULTIES[state.difficulty];
    prepareStage(1, true);
    state.mode = "playing";
    setScreen("game");
    showMessage(
      state.config.guidance
        ? "Practice path arrows will guide you. Let's explore!"
        : "Use ← → to move and ↑ or Space to jump!",
      3200
    );
    sounds.ensureContext();
    saveProgress();
  }

  function startStage2() {
    prepareStage(2, true);
    state.mode = "playing";
    setScreen("game");
    showMessage(
      state.config.guidance
        ? "Follow the glowing arrows to every magic ball!"
        : "Collect each magic ball to make a hat!",
      3300
    );
    sounds.ensureContext();
    saveProgress();
  }

  function startStage3() {
    prepareStage(3, true);
    state.mode = "playing";
    setScreen("game");
    showMessage(
      state.config.guidance
        ? "Follow the sugar arrows to every magical treat!"
        : "Collect magical food to help Sprinkles grow!",
      3400
    );
    sounds.ensureContext();
    saveProgress();
  }

  function returnToTitle() {
    state.mode = "title";
    state.difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || "easy";
    state.config = DIFFICULTIES[state.difficulty];
    prepareStage(1, true);
    setScreen("title");
    updateSavedAdventureButton();
  }

  function pauseGame() {
    if (state.mode !== "playing") return;
    state.mode = "paused";
    setScreen("pause");
    document.getElementById("restartCheckpointButton").textContent = "Restart from Latest Checkpoint";
    document.getElementById("restartStageButton").textContent = `Restart Stage ${state.stage} from Beginning`;
    document.getElementById("resumeButton").focus();
  }

  function resumeGame() {
    if (state.mode !== "paused") return;
    state.mode = "playing";
    state.lastTime = performance.now();
    setScreen("game");
  }

  function restartFromCheckpoint() {
    state.mode = "playing";
    state.player.x = state.checkpointX;
    state.player.y = WORLD.floorY - state.player.h - 4;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.invulnerable = 1200;
    state.hearts = state.config.hearts;
    state.cameraX = clamp(state.player.x - 300, 0, WORLD.width - VIEW.width);
    setScreen("game");
    showMessage("Checkpoint progress kept! Sprinkles is ready.", 1900);
    updateHud();
    saveProgress();
  }

  function restartCurrentStage() {
    if (state.stage === 3) startStage3();
    else if (state.stage === 2) startStage2();
    else startGame();
  }

  function restartLevel() {
    restartFromCheckpoint();
  }

  // ---------------------------------------------------------------------------
  // Particles and child-friendly feedback
  // ---------------------------------------------------------------------------
  function burst(x, y, colors, count = 14, spread = 5) {
    if (state.reducedMotion) return;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
      const speed = 1.5 + Math.random() * spread;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        size: 3 + Math.random() * 6,
        color: colors[i % colors.length],
        star: i % 3 === 0
      });
    }
  }

  function updateParticles(step) {
    state.particles.forEach((particle) => {
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.vy += 0.12 * step;
      particle.life -= 0.022 * step;
    });
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function drawParticles() {
    for (const particle of state.particles) {
      const screenX = particle.x - state.cameraX;
      if (screenX < -30 || screenX > VIEW.width + 30) continue;
      ctx.save();
      ctx.globalAlpha = clamp(particle.life, 0, 1);
      ctx.fillStyle = particle.color;
      if (particle.star) {
        drawStarPath(ctx, screenX, particle.y, particle.size, particle.size * 0.45, 4);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(screenX, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Physics, collisions, obstacles, collectibles, and checkpoints
  // ---------------------------------------------------------------------------
  function updateMovingPlatforms() {
    for (const platform of state.level.platforms) {
      if (!platform.moving) continue;
      platform.lastY = platform.y;
      const range = state.config.movingPlatformRange;
      platform.y = platform.baseY + Math.sin(state.time * 0.0011) * range;
    }
  }

  function handleHorizontalDoorCollision(previousX) {
    const player = state.player;
    const doors = [state.level.door, state.level.exitDoor].filter(Boolean);
    for (const door of doors) {
      if (door.open || door.y >= player.y + player.h || door.y + door.h <= player.y) continue;
      if (player.x + player.w > door.x && previousX + player.w <= door.x) {
        player.x = door.x - player.w;
        player.vx = 0;
        let message = "A crystal key nearby will open this friendly door!";
        if (state.stage === 2) message = `The rainbow exit needs all six hats. ${MAGIC_HAT_TYPES.length - state.hats.length} still to find!`;
        if (state.stage === 3 && door.bakeryGate) message = `Sprinkles needs to grow a little more! Growth ${state.growthLevel} / ${door.growthRequirement}.`;
        if (state.stage === 3 && door.stageExit) message = `The bakery exit needs every treat. ${GROWTH_FOODS.length - state.foods.length} still to find!`;
        showMessage(message, 2400);
      } else if (player.x < door.x + door.w && previousX >= door.x + door.w) {
        player.x = door.x + door.w;
        player.vx = 0;
      }
    }
  }

  function updatePlayer(step, dt) {
    const player = state.player;
    const previousX = player.x;
    const previousY = player.y;
    const previousBottom = previousY + player.h;
    const acceleration = 0.72 * step;

    if (input.left) {
      player.vx -= acceleration;
      player.facing = -1;
    }
    if (input.right) {
      player.vx += acceleration;
      player.facing = 1;
    }
    if (!input.left && !input.right) player.vx *= Math.pow(0.79, step);
    player.vx = clamp(player.vx, -state.config.playerSpeed, state.config.playerSpeed);

    if (input.jump) player.jumpBuffer = 150;
    input.jump = false;
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyote = player.grounded ? 115 : Math.max(0, player.coyote - dt);

    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -13.1;
      player.grounded = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      sounds.jump();
    }

    // Releasing jump early gives the player a controllable, shorter hop.
    if (!isJumpHeld() && player.vy < -5) player.vy += 0.55 * step;

    player.vy += 0.68 * step;
    player.vy = Math.min(player.vy, 16);
    player.x += player.vx * step;
    player.x = clamp(player.x, 8, WORLD.width - player.w - 8);
    handleHorizontalDoorCollision(previousX);

    player.y += player.vy * step;
    player.grounded = false;

    if (player.vy >= 0) {
      for (const platform of state.level.platforms) {
        const landedAcross = player.x + player.w - 10 > platform.x && player.x + 10 < platform.x + platform.w;
        const reachedTop = previousBottom <= platform.y + 10 && player.y + player.h >= platform.y;
        if (landedAcross && reachedTop) {
          const landingSpeed = player.vy;
          player.y = platform.y - player.h;
          player.vy = 0;
          player.grounded = true;
          player.coyote = 115;
          if (landingSpeed > 6.5) {
            player.landSquash = 1;
            if (state.stage >= 2 && state.hats.length) state.hatBounce = 1;
          }
          break;
        }
      }
    }

    player.landSquash = Math.max(0, player.landSquash - 0.08 * step);
    player.collectGlow = Math.max(0, player.collectGlow - 0.045 * step);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.steps += Math.abs(player.vx) * step;

    if (player.y > VIEW.height + 80) safeReturn("Great try! Sprinkles found a safe path back.");
  }

  function isJumpHeld() {
    return heldKeys.has("ArrowUp") || heldKeys.has("KeyW") || heldKeys.has("Space") || touchHeld.has("jump");
  }

  function updateRocks(step, dt) {
    const playerCenter = state.player.x + state.player.w / 2;
    for (const rock of state.level.rocks) {
      if (rock.state === "idle") {
        if (playerCenter > rock.x - 410 && playerCenter < rock.x + 180) {
          rock.state = "warning";
          rock.timer = state.config.warningTime;
          rock.warned = true;
          sounds.warning();
        }
      } else if (rock.state === "warning") {
        rock.timer -= dt;
        rock.shadow = 1 - rock.timer / state.config.warningTime;
        if (rock.timer <= 0) {
          rock.state = "falling";
          rock.y = 45;
        }
      } else if (rock.state === "falling") {
        rock.y += state.config.rockSpeed * step;
        if (rock.y + rock.size >= WORLD.floorY) {
          rock.y = WORLD.floorY - rock.size;
          rock.state = "rest";
          rock.timer = state.config.rockRest;
          burst(rock.x, WORLD.floorY - 10, ["#e9d9ff", "#b9a8d2", "#ffffff"], 8, 2.8);
        }
      } else if (rock.state === "rest") {
        rock.timer -= dt;
        if (rock.timer <= 0) {
          rock.state = "idle";
          rock.y = -85;
          rock.shadow = 0;
          rock.warned = false;
        }
      }

      if ((rock.state === "falling" || rock.state === "rest") && state.player.invulnerable <= 0) {
        const hitbox = { x: rock.x - rock.size * 0.43, y: rock.y + 5, w: rock.size * 0.86, h: rock.size - 8 };
        const playerBox = { x: state.player.x + 8, y: state.player.y + 6, w: state.player.w - 16, h: state.player.h - 8 };
        if (overlap(hitbox, playerBox)) safeReturn("Bonk-free sparkle return! Sprinkles is ready again.");
      }
    }
  }

  function updateCollectibles() {
    const playerBox = { x: state.player.x + 4, y: state.player.y + 3, w: state.player.w - 8, h: state.player.h - 3 };

    if (state.stage === 1) {
      for (const star of state.level.stars) {
        if (star.collected) continue;
        const box = { x: star.x - 22, y: star.y - 22, w: 44, h: 44 };
        if (overlap(playerBox, box)) {
          star.collected = true;
          state.collected += 1;
          state.player.collectGlow = 1;
          burst(star.x, star.y, ["#ffd95e", "#ffffff", "#ff9ec6"], 12, 4);
          sounds.collect();
          showMessage(state.collected % 5 === 0 ? `${state.collected} stars! Wonderful exploring!` : "Sparkling star collected!", 1200);
        }
      }

      const key = state.level.key;
      if (key && !key.collected && overlap(playerBox, key)) {
        key.collected = true;
        state.level.door.open = true;
        burst(key.x, key.y, ["#7ce8d0", "#ffffff", "#9f83ff", "#ffda62"], 20, 5);
        sounds.checkpoint();
        showMessage("Crystal key found! The door is opening!", 2300);
      }
    } else if (state.stage === 2) {
      for (const ball of state.level.magicBalls) {
        if (ball.collected) continue;
        const box = { x: ball.x - 25, y: ball.y - 25, w: 50, h: 50 };
        if (overlap(playerBox, box)) collectMagicBall(ball);
      }
    } else {
      for (const food of state.level.foods) {
        if (food.collected) continue;
        const box = { x: food.x - 27, y: food.y - 27, w: 54, h: 54 };
        if (overlap(playerBox, box)) collectGrowthFood(food);
      }
    }

    for (const checkpoint of state.level.checkpoints) {
      if (checkpoint.active) continue;
      const box = { x: checkpoint.x - 20, y: checkpoint.y - 10, w: 65, h: 85 };
      if (overlap(playerBox, box)) {
        state.level.checkpoints.forEach((other) => { other.active = other.x <= checkpoint.x; });
        checkpoint.active = true;
        state.checkpointX = checkpoint.x + 55;
        const checkpointPlace = state.stage === 1 ? "Cave" : state.stage === 2 ? "Crystal" : "Bakery oven";
        state.checkpointName = `${checkpointPlace} checkpoint ${state.level.checkpoints.filter((item) => item.active).length}`;
        if (state.stage === 3) state.stage3Checkpoint = { x: state.checkpointX, name: state.checkpointName };
        state.hearts = state.config.hearts;
        burst(checkpoint.x + 18, checkpoint.y + 25, ["#65e5cf", "#9f83ff", "#ffffff"], 24, 5.5);
        sounds.checkpoint();
        showMessage("You found a checkpoint! Hearts restored!", 2500);
        saveProgress();
      }
    }

    if (overlap(playerBox, state.level.gem)) {
      if (state.stage === 1) completeStage1();
      else if (state.stage === 2 && state.hats.length === MAGIC_HAT_TYPES.length) completeStage2();
      else if (state.stage === 3 && state.foods.length === GROWTH_FOODS.length) winGame();
    }
  }

  function collectMagicBall(ball) {
    if (ball.collected || state.hats.includes(ball.id)) return;
    ball.collected = true;
    state.hats.push(ball.id);
    state.player.collectGlow = 1;
    state.newHatPop = 1;
    state.transformation = {
      id: ball.id,
      startX: ball.x,
      startY: ball.y,
      life: state.reducedMotion ? 0.24 : 1
    };
    burst(ball.x, ball.y, [ball.color, ball.accent, "#ffffff", "#ffd868"], 22, 5.5);
    sounds.magicBall();
    sounds.hatTransform();
    const messages = [
      `You found the ${ball.name} hat!`,
      "A new magic hat!",
      "Sprinkles looks wonderful!"
    ];
    showMessage(state.hats.length === 1 ? "Sprinkles will wear every magic hat you find!" : messages[(state.hats.length - 1) % messages.length], 2400);

    if (state.hats.length === MAGIC_HAT_TYPES.length) {
      state.level.door.open = true;
      state.hatGlow = 5200;
      burst(state.player.x + state.player.w / 2, state.player.y - 58, ["#ff6688", "#ffd55f", "#5ee0b7", "#58cfff", "#a475ed"], 48, 7);
      sounds.allHats();
      sounds.openExit();
      showMessage("You found every magic hat! The rainbow exit is open!", 3600);
    }
    updateHud();
    saveProgress();
  }

  function collectGrowthFood(food) {
    if (food.collected || state.foods.includes(food.id)) return;
    const previousLevel = state.growthLevel;
    food.collected = true;
    state.foods.push(food.id);
    state.foods = uniqueAllowed(state.foods, new Set(GROWTH_FOODS.map((item) => item.id))).slice(0, GROWTH_FOODS.length);
    state.growthLevel = clamp(state.foods.length, 0, GROWTH_FOODS.length);
    state.growthFromScale = GROWTH_LEVELS[previousLevel].visualScale;
    state.growthAnimation = state.reducedMotion ? 1 : 0;
    state.growthGlow = state.reducedMotion ? 450 : 1450;
    state.player.collectGlow = 1;
    burst(food.x, food.y, [food.color, food.accent, "#ffffff", "#ffd968"], state.reducedMotion ? 0 : 30, 6);
    sounds.food();
    sounds.grow();

    const messages = [
      "Sprinkles grew one size!",
      `A magical ${food.name}!`,
      "Yummy! Sprinkles grew!",
      "Sprinkles is getting bigger!",
      state.foods.length === 4 ? "Only two treats left!" : "Great collecting!"
    ];
    showMessage(state.foods.length === 1 ? messages[0] : messages[(state.foods.length - 1) % messages.length], 2400);

    if (state.growthLevel >= BAKERY_GATE_GROWTH && !state.level.door.open) {
      state.level.door.open = true;
      burst(state.level.door.x, state.level.door.y + 100, ["#ff9dbd", "#ffe476", "#a1edcf", "#ffffff"], 34, 6);
      sounds.openExit();
      showMessage("Sprinkles is big enough to open the bakery gate!", 3200);
    }
    if (state.growthLevel === GROWTH_FOODS.length) {
      state.level.exitDoor.open = true;
      state.growthGlow = 5200;
      burst(state.player.x + state.player.w / 2, state.player.y - 50, ["#ff6688", "#ffd55f", "#5ee0b7", "#58cfff", "#a475ed"], 54, 8);
      sounds.maxGrowth();
      sounds.openExit();
      showMessage("Sprinkles reached maximum size! The bakery exit is open!", 3900);
    }
    updateHud();
    saveProgress();
  }

  function updateHazards() {
    const player = state.player;
    const feetX = player.x + player.w / 2;
    const overLava = feetX > WORLD.lavaStart && feetX < WORLD.lavaEnd;
    if (overLava && player.y + player.h > WORLD.floorY + 1) {
      safeReturn(state.stage === 3 ? "Jam sparkle bounce! Sprinkles found a safe bakery path." : "Warm sparkle bounce! Sprinkles is ready to try again.");
    }
  }

  function safeReturn(message) {
    const player = state.player;
    if (player.invulnerable > 0) return;

    burst(player.x + player.w / 2, player.y + player.h / 2, ["#ffffff", "#ff9ec6", "#7de4d1", "#a88cff"], 24, 6);
    sounds.safeReturn();

    if (state.hearts !== Infinity) {
      state.hearts -= 1;
      if (state.hearts <= 0) {
        state.hearts = state.config.hearts;
        message = "Sprinkles is ready to try again! Hearts refilled.";
      }
    }

    player.x = state.checkpointX;
    player.y = WORLD.floorY - player.h - 4;
    player.vx = 0;
    player.vy = 0;
    player.invulnerable = 1400;
    state.returnFlash = 1;
    state.cameraX = clamp(player.x - 300, 0, WORLD.width - VIEW.width);
    showMessage(message, 2400);
    updateHud();
  }

  function completeStage1() {
    if (state.mode !== "playing") return;
    state.stage1Stars = state.collected;
    state.stage2Unlocked = true;
    state.mode = "transition";
    ui.transitionStars.textContent = `${state.stage1Stars} / ${state.level.stars.length}`;
    sounds.checkpoint();
    saveProgress(2);
    setScreen("transition");
    announce("Stage 1 complete. Something colorful is waiting deeper in the cave!");
    document.getElementById("enterStage2Button").focus();
  }

  function completeStage2() {
    if (state.mode !== "playing") return;
    state.stage3Unlocked = true;
    state.mode = "bakeryTransition";
    ui.transitionHats.textContent = `${state.hats.length} / ${MAGIC_HAT_TYPES.length}`;
    sounds.checkpoint();
    saveProgress(3);
    setScreen("bakeryTransition");
    announce("Stage 2 complete. A delicious smell leads to a magical underground bakery!");
    document.getElementById("enterStage3Button").focus();
  }

  function winGame() {
    if (state.mode !== "playing") return;
    state.mode = "victory";
    state.stage3Completed = true;
    state.player.collectGlow = 1;
    burst(state.level.gem.x + 35, state.level.gem.y + 40, ["#ff708e", "#ffd65b", "#6de1b7", "#67cfff", "#a47af1"], 60, 8);
    sounds.victory();
    ui.victoryStars.textContent = `${state.stage1Stars} / 20`;
    ui.victoryHats.textContent = `${state.hats.length} / ${MAGIC_HAT_TYPES.length}`;
    ui.victoryFoods.textContent = `${state.foods.length} / ${GROWTH_FOODS.length}`;
    ui.victoryGrowth.textContent = `${state.growthLevel} / ${GROWTH_FOODS.length}`;
    ui.victoryHatColors.innerHTML = MAGIC_HAT_TYPES
      .filter((hat) => state.hats.includes(hat.id))
      .map((hat) => `<span title="${hat.name} hat" style="--hat-color:${hat.color}"></span>`)
      .join("");
    ui.victoryFoodIcons.innerHTML = GROWTH_FOODS
      .map((food) => `<span role="img" aria-label="${food.name}" title="${food.name}">${food.icon}</span>`)
      .join("");
    drawVictorySprinkles();
    saveProgress(3);
    setScreen("victory");
    announce("Sprinkles found every magical treat, grew six times, and continued the Rainbow Gem adventure!");
    document.getElementById("playAgainButton").focus();
  }

  function updateTutorial() {
    const x = state.player.x;
    let tutorials;
    if (state.stage === 1) {
      tutorials = [
          { id: "move", start: 250, end: 430, text: "Wonderful! Keep moving toward the glowing arrow." },
          { id: "jump", start: 830, end: 1000, text: "Press ↑, W, or Space to jump over the tiny gap!" },
          { id: "rocks", start: 1280, end: 1450, text: "Look for the ⚠ sign before a soft stone tumbles down." },
          { id: "lava", start: 2630, end: 2760, text: "The warm glow is clearly marked. Hop across the wide stones!" },
          { id: "key", start: 4480, end: 4650, text: "A crystal key will open the door ahead." }
        ];
    } else if (state.stage === 2) {
      tutorials = [
          { id: "hat-ball", start: 270, end: 470, text: "Collect the magic ball to make a hat!" },
          { id: "hat-jumps", start: 1120, end: 1330, text: "Two colorful hats are waiting on the wide crystal steps." },
          { id: "hat-rocks", start: 2400, end: 2580, text: "Wait on the safe crystal patches when the ⚠ sign appears." },
          { id: "hat-lava", start: 3780, end: 3930, text: "The rainbow platforms move slowly. Take your time!" },
          { id: "hat-exit", start: 6100, end: 6320, text: "Missing a hat? You can always travel back to find it." }
        ];
    } else {
      tutorials = [
        { id: "food-tutorial", start: 240, end: 470, text: "Collect magical food to help Sprinkles grow!" },
        { id: "bakery-jumps", start: 1160, end: 1360, text: "Follow the frosting arrows across the wide bakery platforms." },
        { id: "pastry-warning", start: 2380, end: 2540, text: "Wait on the safe sugar patch when the warning light appears." },
        { id: "dessert-platforms", start: 3300, end: 3460, text: "The cake platforms move slowly and predictably. Take your time!" },
        { id: "growth-gate", start: 5650, end: 5840, text: "The bakery gate opens at Growth 5. You can go back for any missed treat!" },
        { id: "final-food", start: 6250, end: 6400, text: "One final magical treat is waiting near the rainbow exit!" }
      ];
    }
    for (const tutorial of tutorials) {
      if (!state.tutorialSeen.has(tutorial.id) && x >= tutorial.start && x <= tutorial.end) {
        state.tutorialSeen.add(tutorial.id);
        showMessage(tutorial.text, 2700);
        break;
      }
    }
  }

  function update(dt) {
    const step = clamp(dt / (1000 / 60), 0, 2.2);
    state.time += dt;
    updateMovingPlatforms();
    updatePlayer(step, dt);
    updateRocks(step, dt);
    updateCollectibles();
    updateHazards();
    updateParticles(step);
    updateTutorial();

    state.hatGlow = Math.max(0, state.hatGlow - dt);
    state.hatBounce = Math.max(0, state.hatBounce - 0.055 * step);
    state.newHatPop = Math.max(0, state.newHatPop - 0.04 * step);
    state.growthGlow = Math.max(0, state.growthGlow - dt);
    if (state.growthAnimation < 1) {
      state.growthAnimation = Math.min(1, state.growthAnimation + dt / (state.reducedMotion ? 1 : 520));
    }
    if (state.transformation) {
      state.transformation.life -= (state.reducedMotion ? 0.18 : 0.035) * step;
      if (state.transformation.life <= 0) state.transformation = null;
    }

    const cameraOffset = state.stage === 3 ? GROWTH_LEVELS[state.growthLevel].cameraOffset : 0;
    const targetCamera = clamp(state.player.x - 360 - cameraOffset, 0, WORLD.width - VIEW.width);
    state.cameraX = state.reducedMotion ? targetCamera : lerp(state.cameraX, targetCamera, 0.08 * step);
    state.returnFlash = Math.max(0, state.returnFlash - 0.035 * step);

    if (state.messageTimer > 0) {
      state.messageTimer -= dt;
      if (state.messageTimer <= 0) ui.message.hidden = true;
    }

    updateHud();
  }

  // ---------------------------------------------------------------------------
  // Canvas artwork: a bright cave drawn entirely with original shapes
  // ---------------------------------------------------------------------------
  function drawCaveBackground(cameraX = state.cameraX) {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    gradient.addColorStop(0, state.stage === 3 ? "#4b2445" : state.stage === 2 ? "#171451" : "#191042");
    gradient.addColorStop(0.55, state.stage === 3 ? "#70435c" : state.stage === 2 ? "#3b2775" : "#302166");
    gradient.addColorStop(1, state.stage === 3 ? "#2a2447" : state.stage === 2 ? "#172d58" : "#18113e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    // Distant cave glows drift more slowly than the foreground.
    for (let i = 0; i < 11; i += 1) {
      const worldX = i * 720 + 120;
      const x = worldX - cameraX * 0.22;
      const y = 175 + seededWave(i) * 320;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 240);
      const stage2Glow = ["rgba(255, 106, 151, .18)", "rgba(91, 222, 188, .18)", "rgba(95, 194, 255, .18)"][i % 3];
      const bakeryGlow = ["rgba(255, 190, 105, .24)", "rgba(255, 126, 170, .2)", "rgba(165, 225, 201, .18)"][i % 3];
      glow.addColorStop(0, state.stage === 3 ? bakeryGlow : state.stage === 2 ? stage2Glow : (i % 2 ? "rgba(95, 215, 207, .13)" : "rgba(173, 116, 238, .15)"));
      glow.addColorStop(1, "rgba(30, 20, 70, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 240, y - 240, 480, 480);
    }

    // Soft layers make the cave feel deep without using image assets.
    ctx.fillStyle = "rgba(104, 78, 162, .18)";
    ctx.beginPath();
    ctx.moveTo(0, 380);
    for (let x = 0; x <= VIEW.width + 100; x += 100) {
      const worldX = x + cameraX * 0.35;
      ctx.lineTo(x, 365 + Math.sin(worldX * 0.004) * 54 + Math.sin(worldX * 0.011) * 18);
    }
    ctx.lineTo(VIEW.width, VIEW.height);
    ctx.lineTo(0, VIEW.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = state.stage === 3 ? "#2b1834" : "#120c35";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = -80; x <= VIEW.width + 120; x += 110) {
      const worldIndex = Math.floor((x + cameraX * 0.65) / 110);
      const length = 55 + seededWave(worldIndex) * 105;
      ctx.lineTo(x + 55, length);
      ctx.lineTo(x + 110, 0);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(202, 180, 255, .18)";
    for (let i = 0; i < 34; i += 1) {
      const x = ((i * 233 - cameraX * 0.12) % 1500 + 1500) % 1500 - 80;
      const y = 100 + (i * 137) % 430;
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBackgroundCrystals() {
    for (const crystal of BACKGROUND_CRYSTALS) {
      const x = crystal.x - state.cameraX * 0.78;
      if (x < -120 || x > VIEW.width + 120) continue;
      ctx.save();
      ctx.globalAlpha = state.stage === 2 ? 0.62 : state.stage === 3 ? 0.48 : 0.38;
      const rainbowColors = ["#ff6d8d", "#ffb44d", "#ffe05d", "#55df9b", "#59c8ff", "#aa7cf3"];
      const bakeryColors = ["#ffb069", "#ff92b5", "#ffe17b", "#8edbc7", "#b78bef", "#7fc9ee"];
      const color = state.stage === 2
        ? rainbowColors[BACKGROUND_CRYSTALS.indexOf(crystal) % rainbowColors.length]
        : state.stage === 3
          ? bakeryColors[BACKGROUND_CRYSTALS.indexOf(crystal) % bakeryColors.length]
          : crystal.color;
      drawCrystal(x, crystal.y, crystal.size, color, false);
      ctx.restore();
    }
  }

  function drawCrystal(x, y, size, color, glow = true) {
    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
    }
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255,255,255,.65)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.48, y - size * 0.15);
    ctx.lineTo(x + size * 0.3, y + size * 0.52);
    ctx.lineTo(x - size * 0.28, y + size * 0.55);
    ctx.lineTo(x - size * 0.48, y - size * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size * 0.08, y + size * 0.34);
    ctx.lineTo(x + size * 0.48, y - size * 0.15);
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.stroke();
    ctx.restore();
  }

  function drawLava() {
    const x = WORLD.lavaStart - state.cameraX;
    const width = WORLD.lavaEnd - WORLD.lavaStart;
    if (x > VIEW.width || x + width < 0) return;

    ctx.save();
    const glow = ctx.createLinearGradient(0, WORLD.floorY - 12, 0, VIEW.height);
    glow.addColorStop(0, state.stage === 3 ? "#ff9ec2" : "#ffca5c");
    glow.addColorStop(0.16, state.stage === 3 ? "#d94f82" : "#ff8557");
    glow.addColorStop(1, state.stage === 3 ? "#6f285f" : "#a93268");
    ctx.fillStyle = glow;
    ctx.shadowColor = state.stage === 3 ? "#ff8eb8" : "#ff945e";
    ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.moveTo(x, VIEW.height);
    ctx.lineTo(x, WORLD.floorY + 5);
    for (let local = 0; local <= width; local += 26) {
      const wave = Math.sin(local * 0.036 + state.time * 0.002) * 5 + Math.sin(local * 0.011 - state.time * 0.0012) * 4;
      ctx.lineTo(x + local, WORLD.floorY + wave);
    }
    ctx.lineTo(x + width, VIEW.height);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = state.stage === 3 ? "rgba(255, 222, 237, .78)" : "rgba(255, 239, 151, .72)";
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 15]);
    ctx.beginPath();
    for (let local = 0; local <= width; local += 26) {
      const y = WORLD.floorY + Math.sin(local * 0.036 + state.time * 0.002) * 5;
      if (local === 0) ctx.moveTo(x + local, y);
      else ctx.lineTo(x + local, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawPlatforms() {
    for (const platform of state.level.platforms) {
      const x = platform.x - state.cameraX;
      if (x > VIEW.width + 80 || x + platform.w < -80) continue;

      const topGradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + Math.min(platform.h, 90));
      if (platform.kind === "bakery-ground") {
        topGradient.addColorStop(0, "#f7c57a");
        topGradient.addColorStop(0.13, "#c47855");
        topGradient.addColorStop(1, "#593451");
      } else if (platform.kind === "cookie") {
        topGradient.addColorStop(0, "#f5bd6e");
        topGradient.addColorStop(0.2, "#cf7f45");
        topGradient.addColorStop(1, "#6e3d4b");
      } else if (platform.kind === "frosting") {
        topGradient.addColorStop(0, "#fff2f8");
        topGradient.addColorStop(0.2, "#ff9fc5");
        topGradient.addColorStop(1, "#8b4f80");
      } else if (platform.kind === "cake") {
        topGradient.addColorStop(0, "#fff0a8");
        topGradient.addColorStop(0.22, "#ffb265");
        topGradient.addColorStop(0.55, "#dc6a86");
        topGradient.addColorStop(1, "#713e68");
      } else if (platform.kind === "rainbow") {
        topGradient.addColorStop(0, "#a6fff0");
        topGradient.addColorStop(0.18, "#6fc9dd");
        topGradient.addColorStop(0.55, "#7765bb");
        topGradient.addColorStop(1, "#3a2d70");
      } else if (platform.kind === "crystal-ground") {
        topGradient.addColorStop(0, "#7ee8d2");
        topGradient.addColorStop(0.12, "#5c76ad");
        topGradient.addColorStop(1, "#292958");
      } else if (platform.kind === "lava") {
        topGradient.addColorStop(0, "#8e78c8");
        topGradient.addColorStop(0.2, "#6854a1");
        topGradient.addColorStop(1, "#33275f");
      } else if (platform.kind === "crystal") {
        topGradient.addColorStop(0, "#87e2d5");
        topGradient.addColorStop(0.25, "#4f9f9d");
        topGradient.addColorStop(1, "#2b5571");
      } else {
        topGradient.addColorStop(0, "#7a65a6");
        topGradient.addColorStop(0.13, "#5b477f");
        topGradient.addColorStop(1, "#2a204f");
      }
      ctx.fillStyle = topGradient;
      ctx.strokeStyle = "rgba(215, 200, 255, .42)";
      ctx.lineWidth = 3;
      roundedRectPath(ctx, x, platform.y, platform.w, platform.h, platform.kind === "ground" ? 12 : 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,.13)";
      roundedRectPath(ctx, x + 8, platform.y + 7, Math.max(0, platform.w - 16), 6, 3);
      ctx.fill();
      if (state.stage === 3 && platform.kind === "cookie") {
        ctx.fillStyle = "rgba(91, 45, 42, .62)";
        for (let chip = 0; chip < Math.min(8, Math.floor(platform.w / 55)); chip += 1) {
          ctx.beginPath();
          ctx.arc(x + 28 + chip * 51, platform.y + 15 + (chip % 2) * 7, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function drawPracticeGuidance() {
    if (!state.config.guidance) return;
    const arrows = state.stage === 1
      ? [[520, 560], [930, 560], [1480, 560], [2300, 560], [2860, 485], [3200, 420], [3520, 485], [3830, 485], [4300, 560], [4820, 560], [5450, 555], [6050, 550]]
      : state.stage === 2
        ? [[500, 560], [960, 560], [1460, 450], [2100, 490], [2600, 560], [3200, 560], [3970, 485], [4380, 425], [4780, 485], [5120, 450], [5500, 560], [6100, 555], [6680, 555]]
        : [[500, 560], [980, 560], [1470, 475], [2150, 500], [2650, 560], [3250, 560], [3520, 475], [3980, 425], [4380, 475], [4740, 415], [5300, 560], [6100, 560], [6500, 540], [7200, 560]];
    ctx.save();
    ctx.fillStyle = "rgba(255, 245, 151, .82)";
    ctx.strokeStyle = "rgba(84, 58, 145, .75)";
    ctx.lineWidth = 3;
    ctx.font = "900 34px Trebuchet MS";
    ctx.textAlign = "center";
    for (const [worldX, y] of arrows) {
      const x = worldX - state.cameraX;
      if (x > -40 && x < VIEW.width + 40) ctx.strokeText("➜", x, y), ctx.fillText("➜", x, y);
    }
    if (state.stage === 2) {
      const target = state.level.magicBalls.find((ball) => !ball.collected);
      if (target) {
        const targetX = target.x - state.cameraX;
        if (targetX > -80 && targetX < VIEW.width + 80) {
          ctx.strokeStyle = target.color;
          ctx.setLineDash([7, 10]);
          ctx.beginPath();
          ctx.arc(targetX, target.y, 38, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    } else if (state.stage === 3) {
      const target = state.level.foods.find((food) => !food.collected);
      if (target) {
        const targetX = target.x - state.cameraX;
        if (targetX > -80 && targetX < VIEW.width + 80) {
          ctx.strokeStyle = target.color;
          ctx.setLineDash([7, 10]);
          ctx.beginPath();
          ctx.arc(targetX, target.y, 43, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawWorldSigns() {
    const signs = state.stage === 3
      ? [
          { x: 320, y: 475, icon: "FOOD +", label: "MAGICAL FOOD GROWS" },
          { x: 1200, y: 470, icon: "JUMP", label: "WIDE BAKERY STEPS" },
          { x: 2380, y: 475, icon: "!", label: "PASTRY WARNING" },
          { x: 3335, y: 475, icon: "UP / DOWN", label: "MOVING DESSERTS" },
          { x: 5750, y: 475, icon: "5 / 6", label: "GROW TO OPEN GATE" },
          { x: 6970, y: 475, icon: "6 / 6", label: "TREATS OPEN EXIT" }
        ]
      : state.stage === 1
      ? [
          { x: 290, y: 475, icon: "← A   D →", label: "MOVE" },
          { x: 875, y: 472, icon: "↑  SPACE", label: "JUMP" },
          { x: 1325, y: 475, icon: "⚠", label: "FALLING STONES" },
          { x: 2685, y: 475, icon: "♨", label: "WARM GLOW" },
          { x: 4610, y: 475, icon: "◆", label: "FIND THE KEY" }
        ]
      : [
          { x: 330, y: 475, icon: "● → ▲", label: "BALLS BECOME HATS" },
          { x: 1120, y: 470, icon: "↑  SPACE", label: "CRYSTAL STEPS" },
          { x: 2440, y: 475, icon: "⚠", label: "SAFE WAITING SPOT" },
          { x: 3835, y: 475, icon: "♨", label: "RAINBOW GLOW" },
          { x: 6280, y: 475, icon: "6 ▲", label: "HATS OPEN EXIT" }
        ];
    for (const sign of signs) {
      const x = sign.x - state.cameraX;
      if (x < -160 || x > VIEW.width + 160) continue;
      ctx.save();
      ctx.fillStyle = "#f5e8bf";
      ctx.strokeStyle = "#6e4d56";
      ctx.lineWidth = 4;
      roundedRectPath(ctx, x - 74, sign.y - 55, 148, 74, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#594174";
      ctx.font = sign.icon.length > 3 ? "900 19px Trebuchet MS" : "900 30px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(sign.icon, x, sign.y - 25);
      ctx.font = "900 11px Trebuchet MS";
      ctx.fillText(sign.label, x, sign.y - 4);
      ctx.fillStyle = "#715164";
      ctx.fillRect(x - 5, sign.y + 18, 10, 118);
      ctx.restore();
    }
  }

  function drawStars() {
    for (const star of state.level.stars) {
      if (star.collected) continue;
      const x = star.x - state.cameraX;
      if (x < -40 || x > VIEW.width + 40) continue;
      const bob = state.reducedMotion ? 0 : Math.sin(state.time * 0.003 + star.phase) * 7;
      const pulse = state.reducedMotion ? 1 : 1 + Math.sin(state.time * 0.004 + star.phase) * 0.08;
      ctx.save();
      ctx.translate(x, star.y + bob);
      ctx.rotate(state.reducedMotion ? 0 : Math.sin(state.time * 0.0015 + star.phase) * 0.18);
      ctx.scale(pulse, pulse);
      ctx.shadowColor = "#ffe270";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#ffd65c";
      ctx.strokeStyle = "#fff7bf";
      ctx.lineWidth = 3;
      drawStarPath(ctx, 0, 0, star.r);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawMagicBalls() {
    if (state.stage !== 2) return;
    for (const ball of state.level.magicBalls) {
      if (ball.collected) continue;
      const x = ball.x - state.cameraX;
      if (x < -60 || x > VIEW.width + 60) continue;
      const bob = state.reducedMotion ? 0 : Math.sin(state.time * 0.003 + ball.phase) * 8;
      const pulse = state.reducedMotion ? 1 : 1 + Math.sin(state.time * 0.004 + ball.phase) * 0.07;
      ctx.save();
      ctx.translate(x, ball.y + bob);
      ctx.scale(pulse, pulse);
      ctx.shadowColor = ball.color;
      ctx.shadowBlur = 24;
      const orb = ctx.createRadialGradient(-7, -8, 2, 0, 0, ball.r);
      orb.addColorStop(0, "#ffffff");
      orb.addColorStop(0.23, ball.accent);
      orb.addColorStop(1, ball.color);
      ctx.fillStyle = orb;
      ctx.strokeStyle = "rgba(255,255,255,.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.9)";
      for (let i = 0; i < 4; i += 1) {
        const angle = state.time * 0.001 + ball.phase + i * Math.PI / 2;
        const sx = Math.cos(angle) * 31;
        const sy = Math.sin(angle) * 31;
        drawStarPath(ctx, sx, sy, i % 2 ? 3 : 5, 1.4, 4);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawBakeryDecor() {
    if (state.stage !== 3) return;
    ctx.save();
    for (let i = 0; i < 12; i += 1) {
      const worldX = 320 + i * 650;
      const x = worldX - state.cameraX * 0.9;
      if (x < -90 || x > VIEW.width + 90) continue;
      ctx.strokeStyle = "rgba(255, 221, 146, .45)";
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 92); ctx.stroke();
      ctx.fillStyle = "#ffd77b";
      ctx.shadowColor = "#ffb55f";
      ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(x, 110, 18, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 247, 234, .12)";
    for (let i = 0; i < 14; i += 1) {
      const x = ((i * 331 - state.cameraX * 0.25) % 1700 + 1700) % 1700 - 120;
      const y = 210 + (i % 5) * 72;
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.arc(x + 25, y + 4, 20, 0, Math.PI * 2);
      ctx.arc(x - 25, y + 7, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFoodShape(food, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(89, 46, 75, .75)";

    if (food.style === "cupcake") {
      ctx.fillStyle = "#ffcf7d";
      ctx.beginPath(); ctx.moveTo(-20, 4); ctx.lineTo(20, 4); ctx.lineTo(14, 30); ctx.lineTo(-14, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ff8fb8";
      ctx.beginPath(); ctx.arc(0, 0, 21, Math.PI, 0); ctx.quadraticCurveTo(18, -18, 4, -19); ctx.quadraticCurveTo(-4, -29, -12, -17); ctx.quadraticCurveTo(-24, -10, -20, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f05270"; ctx.beginPath(); ctx.arc(2, -25, 7, 0, Math.PI * 2); ctx.fill();
    } else if (food.style === "cookie") {
      ctx.fillStyle = "#dfa05c"; ctx.beginPath(); ctx.arc(0, 0, 27, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#71402d";
      [[-11,-9],[10,-13],[13,8],[-8,13],[0,1]].forEach(([cx, cy]) => { ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill(); });
    } else if (food.style === "donut") {
      ctx.fillStyle = "#be784e"; ctx.beginPath(); ctx.arc(0, 0, 27, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ff9fc8"; ctx.beginPath(); ctx.arc(0, -3, 25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#5c3751"; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
      ["#ffe26d", "#7ee2cb", "#ffffff", "#8fc8ff"].forEach((color, i) => { ctx.fillStyle = color; ctx.fillRect(-17 + i * 10, -12 + (i % 2) * 14, 7, 3); });
    } else if (food.style === "muffin") {
      ctx.fillStyle = "#d8b8ff"; ctx.beginPath(); ctx.moveTo(-19, 2); ctx.lineTo(19, 2); ctx.lineTo(13, 30); ctx.lineTo(-13, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#7d83dc"; ctx.beginPath(); ctx.arc(0, -1, 24, Math.PI, 0); ctx.quadraticCurveTo(20, -22, 2, -22); ctx.quadraticCurveTo(-18, -24, -24, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#424caa"; [[-11,-10],[7,-14],[13,-2],[-4,0]].forEach(([cx,cy]) => { ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2); ctx.fill(); });
    } else if (food.style === "croissant") {
      ctx.fillStyle = "#f2b65d";
      ctx.beginPath(); ctx.arc(0, 4, 28, Math.PI * 1.08, Math.PI * 1.92); ctx.arc(0, 7, 15, Math.PI * 1.9, Math.PI * 1.1, true); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#d98c42"; ctx.lineWidth = 4; [-12, 0, 12].forEach((cx) => { ctx.beginPath(); ctx.arc(cx, 0, 10, 0.4, 2.7); ctx.stroke(); });
    } else {
      ctx.fillStyle = "#fff0bd"; ctx.beginPath(); ctx.moveTo(-24, -22); ctx.lineTo(22, -12); ctx.lineTo(22, 27); ctx.lineTo(-24, 27); ctx.closePath(); ctx.fill(); ctx.stroke();
      ["#ff829f", "#ffd45f", "#68dcb9", "#6bc9f0", "#a67be8"].forEach((color, i) => { ctx.fillStyle = color; ctx.fillRect(-22, -13 + i * 8, 42, 5); });
      ctx.fillStyle = "#fff8f0"; ctx.beginPath(); ctx.moveTo(-24, -22); ctx.quadraticCurveTo(0, -34, 22, -12); ctx.lineTo(19, -4); ctx.quadraticCurveTo(-2, -18, -24, -13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ff678f"; ctx.beginPath(); ctx.arc(2, -27, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawGrowthFoods() {
    if (state.stage !== 3) return;
    for (const food of state.level.foods) {
      if (food.collected) continue;
      const x = food.x - state.cameraX;
      if (x < -70 || x > VIEW.width + 70) continue;
      const bob = state.reducedMotion ? 0 : Math.sin(state.time * 0.003 + food.phase) * 8;
      const pulse = state.reducedMotion ? 1 : 1 + Math.sin(state.time * 0.004 + food.phase) * 0.06;
      ctx.save();
      ctx.shadowColor = food.color;
      ctx.shadowBlur = 22;
      drawFoodShape(food, x, food.y + bob, pulse);
      ctx.fillStyle = "rgba(255,255,255,.9)";
      for (let i = 0; i < 3; i += 1) {
        const angle = state.time * 0.0012 + food.phase + i * Math.PI * 2 / 3;
        drawStarPath(ctx, x + Math.cos(angle) * 38, food.y + bob + Math.sin(angle) * 32, 4, 1.6, 4);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawMagicTransformation() {
    if (!state.transformation) return;
    const type = MAGIC_HAT_TYPES.find((hat) => hat.id === state.transformation.id);
    if (!type) return;
    const progress = 1 - clamp(state.transformation.life, 0, 1);
    const startX = state.transformation.startX - state.cameraX;
    const startY = state.transformation.startY;
    const targetX = state.player.x - state.cameraX + state.player.w / 2;
    const targetY = state.player.y - 44 - state.hats.length * 16;
    const x = state.reducedMotion ? targetX : lerp(startX, targetX, progress);
    const y = state.reducedMotion ? targetY : lerp(startY, targetY, progress) - Math.sin(progress * Math.PI) * 55;
    ctx.save();
    ctx.globalAlpha = clamp(state.transformation.life * 2, 0, 1);
    ctx.shadowColor = type.color;
    ctx.shadowBlur = 20;
    drawHatShape(ctx, type, x, y, 0.9 + progress * 0.25);
    ctx.restore();
  }

  function drawCheckpoints() {
    for (const checkpoint of state.level.checkpoints) {
      const x = checkpoint.x - state.cameraX;
      if (x < -80 || x > VIEW.width + 80) continue;
      if (state.stage === 3) {
        ctx.save();
        ctx.fillStyle = checkpoint.active ? "#ffd27d" : "#8f5870";
        ctx.strokeStyle = checkpoint.active ? "#fff2ba" : "#e8bfd0";
        ctx.lineWidth = 4;
        roundedRectPath(ctx, x - 30, checkpoint.y + 5, 60, 76, 14);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#3d2942";
        roundedRectPath(ctx, x - 20, checkpoint.y + 20, 40, 34, 8);
        ctx.fill();
        ctx.fillStyle = checkpoint.active ? "#ffb061" : "#70465d";
        ctx.beginPath(); ctx.arc(x, checkpoint.y + 37, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff7df";
        ctx.font = "900 11px Trebuchet MS";
        ctx.textAlign = "center";
        ctx.fillText(checkpoint.active ? "OVEN SAVED" : "OVEN CHECKPOINT", x, checkpoint.y - 10);
        ctx.restore();
        continue;
      }
      const color = checkpoint.active ? "#62e4c9" : "#9d82e9";
      const glow = checkpoint.active && !state.reducedMotion ? 1 + Math.sin(state.time * 0.005) * 0.15 : 1;
      ctx.save();
      ctx.translate(x, checkpoint.y + 45);
      ctx.scale(glow, glow);
      drawCrystal(0, 0, 45, color, true);
      ctx.restore();
      ctx.fillStyle = checkpoint.active ? "#d7fff5" : "#e9e1ff";
      ctx.font = "900 12px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(checkpoint.active ? "CHECKPOINT SAVED" : "CHECKPOINT", x, checkpoint.y - 18);
    }
  }

  function drawKeyAndDoor() {
    const key = state.level.key;
    if (key && !key.collected) {
      const x = key.x - state.cameraX;
      if (x > -80 && x < VIEW.width + 80) {
        const bob = state.reducedMotion ? 0 : Math.sin(state.time * 0.004) * 7;
        ctx.save();
        ctx.translate(x, key.y + bob);
        ctx.strokeStyle = "#ffe679";
        ctx.fillStyle = "#83e6d3";
        ctx.lineWidth = 8;
        ctx.shadowColor = "#7cead4";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, -12, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillRect(-4, 1, 8, 28);
        ctx.fillRect(0, 18, 16, 7);
        ctx.restore();
      }
    }

    const doors = [state.level.door, state.level.exitDoor].filter(Boolean);
    for (const door of doors) {
      const doorX = door.x - state.cameraX;
      if (doorX <= -100 || doorX >= VIEW.width + 100) continue;
      const openAmount = door.open ? 1 : 0;
      ctx.save();
      ctx.globalAlpha = door.open ? 0.28 : 0.95;
      ctx.fillStyle = state.stage === 3 ? (door.stageExit ? "#ffcf70" : "#ff91b6") : state.stage === 2 ? "#b18af2" : "#80e4d2";
      ctx.strokeStyle = "#fff7e3";
      ctx.lineWidth = 4;
      ctx.shadowColor = state.stage === 3 ? "#ffb368" : state.stage === 2 ? "#ffcc72" : "#78e8d5";
      ctx.shadowBlur = 18;
      for (let i = 0; i < 4; i += 1) {
        const y = door.y + i * 55 - openAmount * 105;
        ctx.beginPath();
        ctx.moveTo(doorX + door.w / 2, y);
        ctx.lineTo(doorX + door.w, y + 38);
        ctx.lineTo(doorX + door.w / 2, y + 54);
        ctx.lineTo(doorX, y + 38);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      if (state.stage >= 2) {
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff6cd";
        ctx.font = "900 12px Trebuchet MS";
        ctx.textAlign = "center";
        let label = door.open ? "RAINBOW EXIT OPEN" : `${state.hats.length} / 6 HATS`;
        if (state.stage === 3 && door.bakeryGate) label = door.open ? "BAKERY GATE OPEN" : `${state.growthLevel} / ${door.growthRequirement} GROWTH`;
        if (state.stage === 3 && door.stageExit) label = door.open ? "BAKERY EXIT OPEN" : `${state.foods.length} / 6 TREATS`;
        ctx.fillText(label, doorX + door.w / 2, door.y - 20);
      }
      ctx.restore();
    }
  }

  function drawRocks() {
    for (const rock of state.level.rocks) {
      const x = rock.x - state.cameraX;
      if (x < -100 || x > VIEW.width + 100) continue;

      if (rock.state === "warning") {
        const urgency = 1 - rock.timer / state.config.warningTime;
        ctx.save();
        ctx.globalAlpha = 0.55 + urgency * 0.35;
        ctx.strokeStyle = "#ffe37a";
        ctx.fillStyle = "#fff2a5";
        ctx.lineWidth = 5;
        ctx.setLineDash([14, 12]);
        ctx.beginPath();
        ctx.moveTo(x, 90);
        ctx.lineTo(x, WORLD.floorY - 12);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(x, 115, 35 + urgency * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5a3d72";
        ctx.font = "900 42px Trebuchet MS";
        ctx.textAlign = "center";
        ctx.fillText("!", x, 130);
        ctx.font = "900 12px Trebuchet MS";
        ctx.fillText("STONE SOON", x, 166);
        ctx.restore();
      }

      if (rock.state === "falling" || rock.state === "rest") {
        ctx.save();
        ctx.translate(x, rock.y + rock.size / 2);
        ctx.rotate(state.reducedMotion ? 0 : state.time * 0.0018);
        if (state.stage === 3) {
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#fff0c5";
          ctx.shadowColor = "rgba(40, 15, 32, .4)";
          ctx.shadowBlur = 12;
          if (rock.pastryStyle === "cookie") {
            ctx.fillStyle = "#d99755";
            ctx.beginPath(); ctx.arc(0, 0, rock.size / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#6f3e31";
            [[-10,-9],[11,-12],[14,10],[-10,13],[0,1]].forEach(([cx,cy]) => { ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2); ctx.fill(); });
          } else {
            ctx.fillStyle = "#e6aa5d";
            roundedRectPath(ctx, -rock.size / 2, -rock.size * .35, rock.size, rock.size * .7, 20);
            ctx.fill(); ctx.stroke();
            ctx.strokeStyle = "#bd7342";
            ctx.lineWidth = 3;
            [-14, 0, 14].forEach((sx) => { ctx.beginPath(); ctx.moveTo(sx - 5, -13); ctx.lineTo(sx + 5, 13); ctx.stroke(); });
          }
          ctx.restore();
          continue;
        }
        ctx.fillStyle = "#b7a9c9";
        ctx.strokeStyle = "#e8def2";
        ctx.lineWidth = 4;
        ctx.shadowColor = "rgba(20, 10, 40, .35)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        const radius = rock.size / 2;
        for (let i = 0; i < 10; i += 1) {
          const angle = (Math.PI * 2 * i) / 10;
          const r = radius * (0.88 + seededWave(i + rock.x) * 0.12);
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.45)";
        ctx.beginPath();
        ctx.arc(-10, -10, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawRainbowGem() {
    const gem = state.level.gem;
    const x = gem.x - state.cameraX + gem.w / 2;
    const y = gem.y + gem.h / 2;
    if (x < -180 || x > VIEW.width + 180) return;

    ctx.save();
    const pulse = state.reducedMotion ? 1 : 1 + Math.sin(state.time * 0.004) * 0.05;
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ["#ff789b", "#ffd55f", "#72e2b8", "#65cfff", "#a57cf0"].forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 12;
      ctx.globalAlpha = 0.34;
      ctx.beginPath();
      ctx.arc(0, 28, 86 + i * 16, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.shadowColor = "#fff2a6";
    ctx.shadowBlur = 35;
    const gemGradient = ctx.createLinearGradient(-42, -52, 42, 52);
    gemGradient.addColorStop(0, "#ff729b");
    gemGradient.addColorStop(0.25, "#ffd85e");
    gemGradient.addColorStop(0.5, "#69e0bb");
    gemGradient.addColorStop(0.75, "#62cfff");
    gemGradient.addColorStop(1, "#a675ed");
    ctx.fillStyle = gemGradient;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -58);
    ctx.lineTo(43, -18);
    ctx.lineTo(28, 50);
    ctx.lineTo(0, 68);
    ctx.lineTo(-30, 50);
    ctx.lineTo(-44, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#fff7d3";
    ctx.font = "900 15px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("THE RAINBOW GEM", x, gem.y - 42);
  }

  function drawHatShape(context, hat, x, y, scale = 1) {
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    context.lineJoin = "round";
    context.lineCap = "round";
    context.lineWidth = 2.4;
    context.strokeStyle = "rgba(60, 35, 95, .72)";
    context.fillStyle = hat.color;

    if (hat.hatStyle === "party") {
      context.beginPath();
      context.moveTo(-13, 0); context.lineTo(0, -28); context.lineTo(13, 0); context.closePath();
      context.fill(); context.stroke();
      context.fillStyle = hat.accent;
      context.beginPath(); context.arc(0, -30, 5, 0, Math.PI * 2); context.fill();
      context.fillRect(-10, -7, 20, 4);
    } else if (hat.hatStyle === "flower") {
      context.fillStyle = hat.color;
      for (let i = 0; i < 6; i += 1) {
        const angle = i * Math.PI / 3;
        context.beginPath();
        context.ellipse(Math.cos(angle) * 9, -9 + Math.sin(angle) * 7, 7, 4, angle, 0, Math.PI * 2);
        context.fill(); context.stroke();
      }
      context.fillStyle = hat.accent;
      context.beginPath(); context.arc(0, -9, 5, 0, Math.PI * 2); context.fill(); context.stroke();
      context.fillStyle = hat.color;
      roundedRectPath(context, -15, -3, 30, 6, 3); context.fill();
    } else if (hat.hatStyle === "crown") {
      context.beginPath();
      context.moveTo(-15, 0); context.lineTo(-13, -22); context.lineTo(-5, -12);
      context.lineTo(0, -27); context.lineTo(6, -12); context.lineTo(14, -23); context.lineTo(15, 0);
      context.closePath(); context.fill(); context.stroke();
      context.fillStyle = hat.accent;
      [-9, 0, 9].forEach((dotX) => { context.beginPath(); context.arc(dotX, -5, 2.5, 0, Math.PI * 2); context.fill(); });
    } else if (hat.hatStyle === "leaf") {
      context.fillStyle = hat.color;
      context.beginPath(); context.ellipse(-7, -12, 7, 15, -0.7, 0, Math.PI * 2); context.fill(); context.stroke();
      context.beginPath(); context.ellipse(8, -11, 7, 15, 0.7, 0, Math.PI * 2); context.fill(); context.stroke();
      context.strokeStyle = hat.accent;
      context.beginPath(); context.moveTo(-11, -1); context.lineTo(10, -21); context.stroke();
      context.fillStyle = hat.color;
      roundedRectPath(context, -14, -3, 28, 6, 3); context.fill();
    } else if (hat.hatStyle === "wizard") {
      context.beginPath();
      context.moveTo(-15, -3); context.quadraticCurveTo(-5, -22, 4, -31);
      context.quadraticCurveTo(13, -25, 10, -12); context.lineTo(15, -3); context.closePath();
      context.fill(); context.stroke();
      context.fillStyle = hat.accent;
      drawStarPath(context, 2, -17, 4, 1.8, 5); context.fill();
      context.fillStyle = hat.color;
      roundedRectPath(context, -18, -4, 36, 8, 4); context.fill(); context.stroke();
    } else {
      context.fillStyle = hat.color;
      roundedRectPath(context, -16, -4, 32, 8, 4); context.fill(); context.stroke();
      context.fillStyle = hat.accent;
      drawStarPath(context, 0, -14, 14, 6, 5); context.fill(); context.stroke();
    }
    context.restore();
  }

  function drawHatStack(context, hatIds, baseY = -47, stackScale = 0.76) {
    const visibleHats = hatIds.slice(0, 6);
    if (!visibleHats.length) return;
    const spacing = visibleHats.length >= 5 ? 16 : 19;
    const bounce = state.reducedMotion ? 0 : -Math.sin(state.hatBounce * Math.PI) * 4;
    context.save();
    if (state.hatGlow > 0) {
      const glowColors = ["#ff6688", "#ffd55f", "#5ee0b7", "#58cfff", "#a475ed"];
      context.shadowColor = glowColors[Math.floor(state.time / 240) % glowColors.length];
      context.shadowBlur = 18;
    }
    visibleHats.forEach((id, index) => {
      const hat = MAGIC_HAT_TYPES.find((item) => item.id === id);
      if (!hat) return;
      const isNewest = index === visibleHats.length - 1;
      const pop = isNewest ? 1 + state.newHatPop * 0.24 : 1;
      drawHatShape(context, hat, 0, baseY - index * spacing + bounce, stackScale * pop);
    });
    context.restore();
  }

  function getGrowthVisualScale() {
    if (state.stage !== 3) return 1;
    const target = GROWTH_LEVELS[state.growthLevel].visualScale;
    if (state.reducedMotion || state.growthAnimation >= 1) return target;
    const progress = clamp(state.growthAnimation, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const overshoot = Math.sin(progress * Math.PI) * 0.055;
    return lerp(state.growthFromScale, target, eased) + overshoot;
  }

  function drawSprinkles(x, y, player = state.player, scale = 1) {
    const walking = player.grounded && Math.abs(player.vx) > 0.45;
    const bob = !state.reducedMotion && walking ? Math.sin(player.steps * 0.17) * 2.5 : 0;
    const idle = !state.reducedMotion && player.grounded && !walking ? Math.sin(state.time * 0.003) * 1.6 : 0;
    const squashX = 1 + player.landSquash * 0.13;
    const squashY = 1 - player.landSquash * 0.13;
    const blink = Math.floor(state.time / 2700) % 6 === 0 && (state.time % 2700) < 120;
    const legSwing = walking ? Math.sin(player.steps * 0.2) * 5 : 0;

    const visualScale = player === state.player ? getGrowthVisualScale() : 1;
    const renderScale = scale * visualScale;
    ctx.save();
    // Scale around the physics ground anchor, not the sprite center. The hitbox
    // remains 58x62 while the artwork grows upward from the platform surface.
    ctx.translate(x + player.w / 2, y + player.h + bob + idle);
    ctx.scale(player.facing * renderScale * squashX, renderScale * squashY);
    // The drawn paws end at local y=50, so this keeps that exact point on the
    // physics bottom regardless of visual scale.
    ctx.translate(0, -50);

    if (player.invulnerable > 0) ctx.globalAlpha = 0.58 + Math.sin(state.time * 0.02) * 0.22;
    if (player.collectGlow > 0) {
      ctx.shadowColor = "#ffe26f";
      ctx.shadowBlur = 24 * player.collectGlow;
    }
    if (state.stage === 3 && state.growthGlow > 0) {
      const growthColors = ["#ff7da6", "#ffd568", "#76dfbd", "#6bcaf1", "#aa7eea"];
      ctx.shadowColor = growthColors[Math.floor(state.time / 180) % growthColors.length];
      ctx.shadowBlur = state.growthLevel === GROWTH_FOODS.length ? 30 : 20;
    }

    // Tail
    ctx.strokeStyle = "#8a67da";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-22, 9);
    ctx.bezierCurveTo(-48, 10, -49, -22, -34, -25);
    ctx.stroke();

    // Body and legs
    ctx.fillStyle = "#a98be9";
    roundedRectPath(ctx, -24, -4, 48, 45, 18);
    ctx.fill();
    ctx.strokeStyle = "#5b3e9a";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#8f6fd7";
    roundedRectPath(ctx, -21, 30 + legSwing * 0.18, 15, 20, 7);
    ctx.fill();
    roundedRectPath(ctx, 6, 30 - legSwing * 0.18, 15, 20, 7);
    ctx.fill();

    // Ears behind the head
    ctx.fillStyle = "#a98be9";
    ctx.strokeStyle = "#5b3e9a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, -22);
    ctx.lineTo(-17, -48);
    ctx.lineTo(-2, -28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, -29);
    ctx.lineTo(18, -49);
    ctx.lineTo(25, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f49bc4";
    ctx.beginPath();
    ctx.moveTo(-19, -29);
    ctx.lineTo(-16, -41);
    ctx.lineTo(-8, -29);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -30);
    ctx.lineTo(17, -41);
    ctx.lineTo(19, -26);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = "#b79aee";
    ctx.strokeStyle = "#5b3e9a";
    roundedRectPath(ctx, -29, -34, 58, 48, 22);
    ctx.fill();
    ctx.stroke();

    // Forehead sprinkles
    [
      [-12, -28, "#ff779d"], [-4, -31, "#ffd55f"], [5, -29, "#61dbbd"], [13, -25, "#65c9ef"]
    ].forEach(([sx, sy, color], i) => {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(i * 0.7 - 0.8);
      ctx.fillStyle = color;
      roundedRectPath(ctx, -1.5, -4, 3, 8, 2);
      ctx.fill();
      ctx.restore();
    });

    // Face
    ctx.strokeStyle = "#2b214f";
    ctx.fillStyle = "#2b214f";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    if (blink) {
      ctx.beginPath(); ctx.moveTo(-16, -11); ctx.lineTo(-8, -11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, -11); ctx.lineTo(16, -11); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(-12, -11, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(12, -11, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "white";
      ctx.beginPath(); ctx.arc(-11, -12, 1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(13, -12, 1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#ff7eaa";
    ctx.beginPath();
    ctx.moveTo(0, -4); ctx.lineTo(-4, -7); ctx.lineTo(4, -7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#533879";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-4, -2, 5, 0.05, 1.25); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, -2, 5, 1.9, 3.1); ctx.stroke();

    // Rainbow collar and bell
    const collar = ctx.createLinearGradient(-20, 0, 20, 0);
    collar.addColorStop(0, "#ff6d91");
    collar.addColorStop(.25, "#ffd35a");
    collar.addColorStop(.5, "#65dcba");
    collar.addColorStop(.75, "#61c9ed");
    collar.addColorStop(1, "#896de0");
    ctx.strokeStyle = collar;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-20, 10); ctx.quadraticCurveTo(0, 17, 20, 10); ctx.stroke();
    ctx.fillStyle = "#ffe169";
    ctx.beginPath(); ctx.arc(0, 15, 5, 0, Math.PI * 2); ctx.fill();
    if (state.stage >= 2 && state.hats.length) {
      const visibleHats = state.stage === 3 ? state.hats.slice(-1) : state.hats;
      drawHatStack(ctx, visibleHats, -47, state.stage === 3 ? 0.7 : 0.76);
    }
    ctx.restore();
  }

  function drawPlayer() {
    drawSprinkles(state.player.x - state.cameraX, state.player.y);
  }

  function drawVictorySprinkles() {
    const victoryContext = ui.victoryCatCanvas.getContext("2d");
    if (!victoryContext) return;
    victoryContext.clearRect(0, 0, ui.victoryCatCanvas.width, ui.victoryCatCanvas.height);
    victoryContext.save();
    // The smaller celebration scale keeps all six hats inside the result canvas.
    victoryContext.translate(ui.victoryCatCanvas.width / 2, ui.victoryCatCanvas.height - 56);
    victoryContext.scale(1.42, 1.42);

    victoryContext.strokeStyle = "#8a67da";
    victoryContext.lineWidth = 11;
    victoryContext.lineCap = "round";
    victoryContext.beginPath();
    victoryContext.moveTo(-22, 10);
    victoryContext.bezierCurveTo(-48, 8, -48, -23, -32, -27);
    victoryContext.stroke();

    victoryContext.fillStyle = "#a98be9";
    victoryContext.strokeStyle = "#5b3e9a";
    victoryContext.lineWidth = 3;
    roundedRectPath(victoryContext, -25, -2, 50, 48, 19);
    victoryContext.fill(); victoryContext.stroke();

    victoryContext.beginPath();
    victoryContext.moveTo(-24, -22); victoryContext.lineTo(-17, -49); victoryContext.lineTo(-2, -29); victoryContext.closePath();
    victoryContext.fill(); victoryContext.stroke();
    victoryContext.beginPath();
    victoryContext.moveTo(4, -29); victoryContext.lineTo(18, -49); victoryContext.lineTo(25, -21); victoryContext.closePath();
    victoryContext.fill(); victoryContext.stroke();

    victoryContext.fillStyle = "#b79aee";
    roundedRectPath(victoryContext, -29, -35, 58, 49, 22);
    victoryContext.fill(); victoryContext.stroke();
    victoryContext.fillStyle = "#2b214f";
    victoryContext.beginPath(); victoryContext.arc(-12, -11, 3.4, 0, Math.PI * 2); victoryContext.fill();
    victoryContext.beginPath(); victoryContext.arc(12, -11, 3.4, 0, Math.PI * 2); victoryContext.fill();
    victoryContext.fillStyle = "#ff7eaa";
    victoryContext.beginPath(); victoryContext.moveTo(0, -4); victoryContext.lineTo(-4, -7); victoryContext.lineTo(4, -7); victoryContext.closePath(); victoryContext.fill();
    victoryContext.strokeStyle = "#533879";
    victoryContext.lineWidth = 2;
    victoryContext.beginPath(); victoryContext.arc(-4, -2, 5, 0.05, 1.25); victoryContext.stroke();
    victoryContext.beginPath(); victoryContext.arc(4, -2, 5, 1.9, 3.1); victoryContext.stroke();
    // Stage 3 keeps the newest hat visible on Sprinkles while the complete
    // inventory remains represented by the result chips below.
    drawHatStack(victoryContext, state.hats.slice(-1), -47, 0.76);
    victoryContext.restore();
  }

  function drawTitleBackdrop() {
    drawCaveBackground(0);
    ctx.save();
    const glow = ctx.createRadialGradient(330, 400, 20, 330, 400, 290);
    glow.addColorStop(0, "rgba(116, 224, 200, .25)");
    glow.addColorStop(1, "rgba(116, 224, 200, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(20, 100, 620, 600);
    ctx.restore();

    const titlePlayer = {
      ...state.player,
      w: 58,
      h: 62,
      grounded: true,
      vx: 0,
      facing: 1,
      landSquash: 0,
      collectGlow: 0,
      invulnerable: 0,
      steps: 0
    };
    drawSprinkles(260, 410, titlePlayer, 3.2);
    ctx.fillStyle = "rgba(31, 21, 75, .75)";
    ctx.beginPath(); ctx.ellipse(350, 650, 230, 36, 0, 0, Math.PI * 2); ctx.fill();
    [
      [85, 540, 70, "#64d8c6"], [590, 585, 80, "#a47ae8"], [720, 460, 45, "#ef84b8"]
    ].forEach(([x, y, size, color]) => drawCrystal(x, y, size, color, true));
  }

  function drawGame() {
    drawCaveBackground();
    drawBakeryDecor();
    drawBackgroundCrystals();
    drawLava();
    drawPlatforms();
    drawPracticeGuidance();
    drawWorldSigns();
    drawStars();
    drawMagicBalls();
    drawGrowthFoods();
    drawCheckpoints();
    drawKeyAndDoor();
    drawRocks();
    drawRainbowGem();
    drawPlayer();
    drawMagicTransformation();
    drawParticles();

    if (state.returnFlash > 0) {
      ctx.save();
      ctx.globalAlpha = state.returnFlash * 0.23;
      ctx.fillStyle = "#fff5c7";
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      ctx.restore();
    }
  }

  function render() {
    if (state.mode === "title" || state.mode === "story") drawTitleBackdrop();
    else drawGame();
  }

  // ---------------------------------------------------------------------------
  // Controls: keyboard, touch, and visible buttons
  // ---------------------------------------------------------------------------
  const heldKeys = new Set();
  const touchHeld = new Set();

  function syncInput() {
    input.left = heldKeys.has("ArrowLeft") || heldKeys.has("KeyA") || touchHeld.has("left");
    input.right = heldKeys.has("ArrowRight") || heldKeys.has("KeyD") || touchHeld.has("right");
  }

  window.addEventListener("keydown", (event) => {
    const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW", "KeyP", "KeyR"];
    if (gameKeys.includes(event.code) && (state.mode === "playing" || state.mode === "paused")) event.preventDefault();

    if (!event.repeat) {
      if (["ArrowUp", "KeyW", "Space"].includes(event.code) && state.mode === "playing") input.jump = true;
      if (event.code === "KeyP") {
        if (state.mode === "playing") pauseGame();
        else if (state.mode === "paused") resumeGame();
      }
      if (event.code === "KeyR" && (state.mode === "playing" || state.mode === "paused")) restartLevel();
    }
    heldKeys.add(event.code);
    syncInput();
  });

  window.addEventListener("keyup", (event) => {
    heldKeys.delete(event.code);
    syncInput();
  });

  window.addEventListener("blur", () => {
    heldKeys.clear();
    touchHeld.clear();
    syncInput();
    if (state.mode === "playing") {
      saveProgress();
      pauseGame();
    }
  });

  window.addEventListener("resize", updateViewportLayout, { passive: true });
  window.addEventListener("orientationchange", updateViewportLayout, { passive: true });
  window.visualViewport?.addEventListener("resize", updateViewportLayout, { passive: true });
  window.visualViewport?.addEventListener("scroll", updateViewportLayout, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveProgress();
    else updateViewportLayout();
  });

  document.querySelectorAll(".touch-button").forEach((button) => {
    const action = button.dataset.action;
    const press = (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      touchHeld.add(action);
      button.classList.add("is-pressed");
      if (action === "jump" && state.mode === "playing") input.jump = true;
      syncInput();
    };
    const release = (event) => {
      event.preventDefault();
      touchHeld.delete(action);
      button.classList.remove("is-pressed");
      syncInput();
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", (event) => {
      if (event.buttons === 0) release(event);
    });
  });

  document.getElementById("startButton").addEventListener("click", () => {
    state.difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || "easy";
    state.config = DIFFICULTIES[state.difficulty];
    state.mode = "story";
    setScreen("story");
    sounds.ensureContext();
    document.getElementById("continueButton").focus();
  });

  document.getElementById("continueButton").addEventListener("click", startGame);
  document.getElementById("enterStage2Button").addEventListener("click", startStage2);
  document.getElementById("enterStage3Button").addEventListener("click", startStage3);
  ui.continueSaved.addEventListener("click", resumeSavedAdventure);
  document.getElementById("pauseButton").addEventListener("click", pauseGame);
  document.getElementById("resumeButton").addEventListener("click", resumeGame);
  document.getElementById("restartCheckpointButton").addEventListener("click", restartFromCheckpoint);
  document.getElementById("restartStageButton").addEventListener("click", restartCurrentStage);
  document.getElementById("pauseTitleButton").addEventListener("click", returnToTitle);
  document.getElementById("playAgainButton").addEventListener("click", startGame);
  document.getElementById("replayStage1Button").addEventListener("click", startGame);
  document.getElementById("replayStage2Button").addEventListener("click", startStage2);
  document.getElementById("replayStage3Button").addEventListener("click", startStage3);
  document.getElementById("victoryTitleButton").addEventListener("click", returnToTitle);
  document.getElementById("errorRestartButton").addEventListener("click", () => window.location.reload());
  ui.titleSound.addEventListener("click", toggleSound);
  ui.sound.addEventListener("click", toggleSound);

  document.getElementById("howToButton").addEventListener("click", (event) => {
    const panel = document.getElementById("howToPanel");
    panel.hidden = !panel.hidden;
    event.currentTarget.setAttribute("aria-expanded", String(!panel.hidden));
    event.currentTarget.textContent = panel.hidden ? "How to Play" : "Close Guide";
  });

  ui.motion.addEventListener("click", () => {
    state.reducedMotion = !state.reducedMotion;
    updateMotionButton();
    if (state.mode !== "title") saveProgress();
  });

  // ---------------------------------------------------------------------------
  // Main loop and graceful error fallback
  // ---------------------------------------------------------------------------
  function gameLoop(timestamp) {
    try {
      const dt = state.lastTime ? Math.min(40, timestamp - state.lastTime) : 16.67;
      state.lastTime = timestamp;
      if (state.mode === "playing") update(dt);
      else if (["title", "story", "transition", "bakeryTransition", "victory"].includes(state.mode)) state.time += dt;
      render();
      requestAnimationFrame(gameLoop);
    } catch (error) {
      console.error("Sprinkles game error:", error);
      state.mode = "error";
      setScreen("error");
    }
  }

  window.addEventListener("error", (event) => {
    console.error("Unexpected game error:", event.error || event.message);
    state.mode = "error";
    setScreen("error");
  });

  updateSoundButtons();
  updateMotionButton();
  updateHud();
  updateViewportLayout();
  setScreen("title");
  updateSavedAdventureButton();
  requestAnimationFrame(gameLoop);
})();
