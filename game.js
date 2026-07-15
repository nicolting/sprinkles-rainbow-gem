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
    checkpointStatus: document.getElementById("checkpointStatus"),
    progressText: document.getElementById("progressText"),
    progressFill: document.getElementById("progressFill"),
    progressTrack: document.querySelector(".progress-track"),
    section: document.getElementById("sectionName"),
    victoryStars: document.getElementById("victoryStars"),
    victoryHats: document.getElementById("victoryHats"),
    victoryHatColors: document.getElementById("victoryHatColors"),
    victoryCatCanvas: document.getElementById("victoryCatCanvas"),
    transitionStars: document.getElementById("transitionStars"),
    titleSound: document.getElementById("titleSoundButton"),
    sound: document.getElementById("soundButton"),
    motion: document.getElementById("motionButton")
  };

  // ---------------------------------------------------------------------------
  // Tunable game settings
  // ---------------------------------------------------------------------------
  const VIEW = { width: 1280, height: 720 };
  const STAGE_WORLDS = {
    1: { width: 6900, floorY: 610, lavaStart: 2760, lavaEnd: 4060, gemX: 6650 },
    2: { width: 7200, floorY: 610, lavaStart: 3900, lavaEnd: 5230, gemX: 6820 }
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

  function buildStage(stageNumber, config) {
    return stageNumber === 2 ? buildStage2(config) : buildLevel(config);
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
    transformation: null
  };

  // ---------------------------------------------------------------------------
  // UI state and accessible feedback
  // ---------------------------------------------------------------------------
  function setScreen(name) {
    const screens = {
      title: ui.title,
      story: ui.story,
      transition: ui.transition,
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
    ui.starHud.hidden = inStage2;
    ui.hatHud.hidden = !inStage2;

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
    } else {
      ui.stars.textContent = String(state.collected);
      ui.starTotal.textContent = `/ ${state.level.stars.length}`;
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
        const finalSection = state.stage === 1 ? "Rainbow Chamber" : "Magic Hat Gallery";
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
      state.hats = [];
    }
    if (stageNumber === 2 && resetStageProgress) state.hats = [];
    state.checkpointX = 150;
    state.checkpointName = stageNumber === 1 ? "Cave start" : "Crystal Cave start";
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
  }

  function returnToTitle() {
    state.mode = "title";
    state.difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || "easy";
    state.config = DIFFICULTIES[state.difficulty];
    prepareStage(1, true);
    setScreen("title");
  }

  function pauseGame() {
    if (state.mode !== "playing") return;
    state.mode = "paused";
    setScreen("pause");
    document.getElementById("restartCheckpointButton").textContent = state.stage === 2
      ? "Restart from Latest Checkpoint"
      : "Restart from Latest Checkpoint";
    document.getElementById("restartStageButton").textContent = state.stage === 2
      ? "Restart Stage 2 from Beginning"
      : "Restart Stage 1 from Beginning";
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
  }

  function restartCurrentStage() {
    if (state.stage === 2) startStage2();
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
    const door = state.level.door;
    if (door.open || door.y >= player.y + player.h || door.y + door.h <= player.y) return;

    if (player.x + player.w > door.x && previousX + player.w <= door.x) {
      player.x = door.x - player.w;
      player.vx = 0;
      showMessage(
        state.stage === 2
          ? `The rainbow exit needs all six hats. ${MAGIC_HAT_TYPES.length - state.hats.length} still to find!`
          : "A crystal key nearby will open this friendly door!",
        2200
      );
    } else if (player.x < door.x + door.w && previousX >= door.x + door.w) {
      player.x = door.x + door.w;
      player.vx = 0;
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
            if (state.stage === 2 && state.hats.length) state.hatBounce = 1;
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
    } else {
      for (const ball of state.level.magicBalls) {
        if (ball.collected) continue;
        const box = { x: ball.x - 25, y: ball.y - 25, w: 50, h: 50 };
        if (overlap(playerBox, box)) collectMagicBall(ball);
      }
    }

    for (const checkpoint of state.level.checkpoints) {
      if (checkpoint.active) continue;
      const box = { x: checkpoint.x - 20, y: checkpoint.y - 10, w: 65, h: 85 };
      if (overlap(playerBox, box)) {
        state.level.checkpoints.forEach((other) => { other.active = other.x <= checkpoint.x; });
        checkpoint.active = true;
        state.checkpointX = checkpoint.x + 55;
        state.checkpointName = `${state.stage === 1 ? "Cave" : "Crystal"} checkpoint ${state.level.checkpoints.filter((item) => item.active).length}`;
        state.hearts = state.config.hearts;
        burst(checkpoint.x + 18, checkpoint.y + 25, ["#65e5cf", "#9f83ff", "#ffffff"], 24, 5.5);
        sounds.checkpoint();
        showMessage("You found a checkpoint! Hearts restored!", 2500);
      }
    }

    if (overlap(playerBox, state.level.gem)) {
      if (state.stage === 1) completeStage1();
      else if (state.hats.length === MAGIC_HAT_TYPES.length) winGame();
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
  }

  function updateHazards() {
    const player = state.player;
    const feetX = player.x + player.w / 2;
    const overLava = feetX > WORLD.lavaStart && feetX < WORLD.lavaEnd;
    if (overLava && player.y + player.h > WORLD.floorY + 1) {
      safeReturn("Warm sparkle bounce! Sprinkles is ready to try again.");
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
    state.mode = "transition";
    ui.transitionStars.textContent = `${state.stage1Stars} / ${state.level.stars.length}`;
    sounds.checkpoint();
    setScreen("transition");
    announce("Stage 1 complete. Something colorful is waiting deeper in the cave!");
    document.getElementById("enterStage2Button").focus();
  }

  function winGame() {
    if (state.mode !== "playing") return;
    state.mode = "victory";
    state.player.collectGlow = 1;
    burst(state.level.gem.x + 35, state.level.gem.y + 40, ["#ff708e", "#ffd65b", "#6de1b7", "#67cfff", "#a47af1"], 60, 8);
    sounds.victory();
    ui.victoryStars.textContent = `${state.stage1Stars} / 20`;
    ui.victoryHats.textContent = `${state.hats.length} / ${MAGIC_HAT_TYPES.length}`;
    ui.victoryHatColors.innerHTML = MAGIC_HAT_TYPES
      .filter((hat) => state.hats.includes(hat.id))
      .map((hat) => `<span title="${hat.name} hat" style="--hat-color:${hat.color}"></span>`)
      .join("");
    drawVictorySprinkles();
    setScreen("victory");
    announce("Sprinkles collected every magic hat and found the Rainbow Gem! The cave is glowing with color again!");
    document.getElementById("playAgainButton").focus();
  }

  function updateTutorial() {
    const x = state.player.x;
    const tutorials = state.stage === 1
      ? [
          { id: "move", start: 250, end: 430, text: "Wonderful! Keep moving toward the glowing arrow." },
          { id: "jump", start: 830, end: 1000, text: "Press ↑, W, or Space to jump over the tiny gap!" },
          { id: "rocks", start: 1280, end: 1450, text: "Look for the ⚠ sign before a soft stone tumbles down." },
          { id: "lava", start: 2630, end: 2760, text: "The warm glow is clearly marked. Hop across the wide stones!" },
          { id: "key", start: 4480, end: 4650, text: "A crystal key will open the door ahead." }
        ]
      : [
          { id: "hat-ball", start: 270, end: 470, text: "Collect the magic ball to make a hat!" },
          { id: "hat-jumps", start: 1120, end: 1330, text: "Two colorful hats are waiting on the wide crystal steps." },
          { id: "hat-rocks", start: 2400, end: 2580, text: "Wait on the safe crystal patches when the ⚠ sign appears." },
          { id: "hat-lava", start: 3780, end: 3930, text: "The rainbow platforms move slowly. Take your time!" },
          { id: "hat-exit", start: 6100, end: 6320, text: "Missing a hat? You can always travel back to find it." }
        ];
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
    if (state.transformation) {
      state.transformation.life -= (state.reducedMotion ? 0.18 : 0.035) * step;
      if (state.transformation.life <= 0) state.transformation = null;
    }

    const targetCamera = clamp(state.player.x - 360, 0, WORLD.width - VIEW.width);
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
    gradient.addColorStop(0, state.stage === 2 ? "#171451" : "#191042");
    gradient.addColorStop(0.55, state.stage === 2 ? "#3b2775" : "#302166");
    gradient.addColorStop(1, state.stage === 2 ? "#172d58" : "#18113e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    // Distant cave glows drift more slowly than the foreground.
    for (let i = 0; i < 11; i += 1) {
      const worldX = i * 720 + 120;
      const x = worldX - cameraX * 0.22;
      const y = 175 + seededWave(i) * 320;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 240);
      const stage2Glow = ["rgba(255, 106, 151, .18)", "rgba(91, 222, 188, .18)", "rgba(95, 194, 255, .18)"][i % 3];
      glow.addColorStop(0, state.stage === 2 ? stage2Glow : (i % 2 ? "rgba(95, 215, 207, .13)" : "rgba(173, 116, 238, .15)"));
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

    ctx.fillStyle = "#120c35";
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
      ctx.globalAlpha = state.stage === 2 ? 0.62 : 0.38;
      const rainbowColors = ["#ff6d8d", "#ffb44d", "#ffe05d", "#55df9b", "#59c8ff", "#aa7cf3"];
      drawCrystal(x, crystal.y, crystal.size, state.stage === 2 ? rainbowColors[BACKGROUND_CRYSTALS.indexOf(crystal) % rainbowColors.length] : crystal.color, false);
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
    glow.addColorStop(0, "#ffca5c");
    glow.addColorStop(0.16, "#ff8557");
    glow.addColorStop(1, "#a93268");
    ctx.fillStyle = glow;
    ctx.shadowColor = "#ff945e";
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
    ctx.strokeStyle = "rgba(255, 239, 151, .72)";
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
      if (platform.kind === "rainbow") {
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
    }
  }

  function drawPracticeGuidance() {
    if (!state.config.guidance) return;
    const arrows = state.stage === 1
      ? [[520, 560], [930, 560], [1480, 560], [2300, 560], [2860, 485], [3200, 420], [3520, 485], [3830, 485], [4300, 560], [4820, 560], [5450, 555], [6050, 550]]
      : [[500, 560], [960, 560], [1460, 450], [2100, 490], [2600, 560], [3200, 560], [3970, 485], [4380, 425], [4780, 485], [5120, 450], [5500, 560], [6100, 555], [6680, 555]];
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
    }
    ctx.restore();
  }

  function drawWorldSigns() {
    const signs = state.stage === 1
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

    const door = state.level.door;
    const doorX = door.x - state.cameraX;
    if (doorX > -100 && doorX < VIEW.width + 100) {
      const openAmount = door.open ? 1 : 0;
      ctx.save();
      ctx.globalAlpha = door.open ? 0.28 : 0.95;
      ctx.fillStyle = state.stage === 2 ? "#b18af2" : "#80e4d2";
      ctx.strokeStyle = "#d9fff9";
      ctx.lineWidth = 4;
      ctx.shadowColor = state.stage === 2 ? "#ffcc72" : "#78e8d5";
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
      if (state.stage === 2) {
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff6cd";
        ctx.font = "900 12px Trebuchet MS";
        ctx.textAlign = "center";
        ctx.fillText(door.open ? "RAINBOW EXIT OPEN" : `${state.hats.length} / 6 HATS`, doorX + door.w / 2, door.y - 20);
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

  function drawSprinkles(x, y, player = state.player, scale = 1) {
    const walking = player.grounded && Math.abs(player.vx) > 0.45;
    const bob = !state.reducedMotion && walking ? Math.sin(player.steps * 0.17) * 2.5 : 0;
    const idle = !state.reducedMotion && player.grounded && !walking ? Math.sin(state.time * 0.003) * 1.6 : 0;
    const squashX = 1 + player.landSquash * 0.13;
    const squashY = 1 - player.landSquash * 0.13;
    const blink = Math.floor(state.time / 2700) % 6 === 0 && (state.time % 2700) < 120;
    const legSwing = walking ? Math.sin(player.steps * 0.2) * 5 : 0;

    ctx.save();
    ctx.translate(x + player.w / 2, y + player.h / 2 + bob + idle);
    ctx.scale(player.facing * scale * squashX, scale * squashY);

    if (player.invulnerable > 0) ctx.globalAlpha = 0.58 + Math.sin(state.time * 0.02) * 0.22;
    if (player.collectGlow > 0) {
      ctx.shadowColor = "#ffe26f";
      ctx.shadowBlur = 24 * player.collectGlow;
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
    if (state.stage === 2 && state.hats.length) drawHatStack(ctx, state.hats);
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
    victoryContext.translate(130, 196);
    victoryContext.scale(1.15, 1.15);

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
    drawHatStack(victoryContext, state.hats, -47, 0.72);
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
    drawBackgroundCrystals();
    drawLava();
    drawPlatforms();
    drawPracticeGuidance();
    drawWorldSigns();
    drawStars();
    drawMagicBalls();
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
    if (state.mode === "playing") pauseGame();
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
  document.getElementById("pauseButton").addEventListener("click", pauseGame);
  document.getElementById("resumeButton").addEventListener("click", resumeGame);
  document.getElementById("restartCheckpointButton").addEventListener("click", restartFromCheckpoint);
  document.getElementById("restartStageButton").addEventListener("click", restartCurrentStage);
  document.getElementById("pauseTitleButton").addEventListener("click", returnToTitle);
  document.getElementById("playAgainButton").addEventListener("click", startGame);
  document.getElementById("replayStage1Button").addEventListener("click", startGame);
  document.getElementById("replayStage2Button").addEventListener("click", startStage2);
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
  });

  // ---------------------------------------------------------------------------
  // Main loop and graceful error fallback
  // ---------------------------------------------------------------------------
  function gameLoop(timestamp) {
    try {
      const dt = state.lastTime ? Math.min(40, timestamp - state.lastTime) : 16.67;
      state.lastTime = timestamp;
      if (state.mode === "playing") update(dt);
      else if (["title", "story", "transition", "victory"].includes(state.mode)) state.time += dt;
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
  setScreen("title");
  requestAnimationFrame(gameLoop);
})();
