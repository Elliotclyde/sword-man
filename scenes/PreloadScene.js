class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    // Show loading overlay immediately
    this.showLoadingScreen();

    // Set up progress event listeners
    this.load.on("progress", (value) => {
      this.updateLoadingProgress(value);
    });

    // ============ MENU ASSETS ============
    this.load.image("castle", "assets/castle.avif");

    // ============ GAME SPRITES ============
    // Soldier.png is 900x700, divided into 100x100 frames
    this.load.spritesheet("soldier", "assets/Soldier.png", {
      frameWidth: 100,
      frameHeight: 100,
    });

    // Orc.png is set up similarly to Soldier.png
    this.load.spritesheet("orc", "assets/Orc.png", {
      frameWidth: 100,
      frameHeight: 100,
    });

    // Wizard.png is set up similarly to Soldier.png
    this.load.spritesheet("wizard", "assets/Wizard.png", {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet("werewolf", "assets/Werewolf.png", {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet("armoredorc", "assets/ArmoredOrc.png", {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet("beholder", "assets/beholder.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Flame.png contains flame animation frames
    this.load.spritesheet("flame", "assets/Flame.png", {
      frameWidth: 100,
      frameHeight: 100,
    });

    // Dungeon.png is 160x160 with 16x16 tiles in a 10x10 grid
    this.load.spritesheet("dungeon", "assets/Dungeon.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    // HealthBars.png contains health bar sprites, 48x20 pixels each
    this.load.spritesheet("healthbars", "assets/HealthBars.png", {
      frameWidth: 48,
      frameHeight: 16,
    });

    // ============ AUDIO ASSETS ============
    // Load background music
    this.load.audioSprite("music", "assets/music.json", "assets/music.mp3");

    // Load cathedral impulse response for reverb
    this.load.audio("cathedral-ir", "assets/cathedral-ir.mp3");

    // Load audio sprite JSON first
    this.load.json("sfx-json");

    // Load audio sprite for game sound effects
    this.load.audioSprite("sfx", "assets/sounds.json", ["assets/sounds.mp3"]);

    // ============ OTHER ASSETS ============
    // Load Bluesky logo
    this.load.image("blueskylogo", "assets/blueskylogo.svg");
  }

  create() {
    // Hide the loading overlay and transition to MenuScene
    this.hideLoadingScreen();
    this.scene.start("MenuScene");
  }

  showLoadingScreen() {
    // Create loading overlay with castle background
    const overlayElement = document.createElement("div");
    overlayElement.id = "loading-overlay";
    overlayElement.style.backgroundImage = "url('assets/castle.avif')";
    overlayElement.style.backgroundSize = "100% 100%";
    overlayElement.style.backgroundPosition = "center";
    overlayElement.style.opacity = "1";

    const spinnerDiv = document.createElement("div");
    spinnerDiv.id = "loading-spinner";

    const spinner = document.createElement("div");
    spinner.className = "spinner";

    const text = document.createElement("div");
    text.id = "loading-text";
    text.textContent = "Loading...";

    const progressBar = document.createElement("div");
    progressBar.id = "loading-progress-bar";
    progressBar.style.width = "200px";
    progressBar.style.height = "8px";
    progressBar.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
    progressBar.style.borderRadius = "4px";
    progressBar.style.overflow = "hidden";
    progressBar.style.marginTop = "10px";

    const progressFill = document.createElement("div");
    progressFill.id = "loading-progress-fill";
    progressFill.style.width = "0%";
    progressFill.style.height = "100%";
    progressFill.style.backgroundColor = "white";
    progressFill.style.transition = "width 0.2s ease-out";

    progressBar.appendChild(progressFill);

    spinnerDiv.appendChild(spinner);
    spinnerDiv.appendChild(text);
    spinnerDiv.appendChild(progressBar);
    overlayElement.appendChild(spinnerDiv);
    document.body.appendChild(overlayElement);
  }

  updateLoadingProgress(value) {
    const progressFill = document.getElementById("loading-progress-fill");
    if (progressFill) {
      progressFill.style.width = `${value * 100}%`;
    }
  }

  hideLoadingScreen() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.style.transition = "opacity 0.5s ease-out";
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
      }, 500);
    }
  }
}

export default PreloadScene;
