class LoadingScene extends Phaser.Scene {
  constructor() {
    super("LoadingScene");
  }

  preload() {
    // Load castle background for loading overlay
    this.load.image("castle", "assets/castle.png");
  }

  create() {
    // Create loading overlay with castle background
    const overlayElement = document.createElement("div");
    overlayElement.id = "loading-overlay";
    overlayElement.style.backgroundImage = "url('assets/castle.png')";
    overlayElement.style.backgroundSize = "cover";
    overlayElement.style.backgroundPosition = "center";

    const spinnerDiv = document.createElement("div");
    spinnerDiv.id = "loading-spinner";

    const spinner = document.createElement("div");
    spinner.className = "spinner";

    const text = document.createElement("div");
    text.id = "loading-text";
    text.textContent = "Loading...";

    spinnerDiv.appendChild(spinner);
    spinnerDiv.appendChild(text);
    overlayElement.appendChild(spinnerDiv);
    document.body.appendChild(overlayElement);

    // Get reference to MainScene
    const mainScene = this.scene.get("MainScene");

    // Track preload progress
    let preloadComplete = false;
    let createComplete = false;

    // Listen for preload completion in MainScene
    mainScene.events.on("preload", () => {
      preloadComplete = true;
      this.checkAndTransition(preloadComplete, createComplete, overlayElement);
    });

    // Listen for create completion in MainScene
    mainScene.events.on("create", () => {
      createComplete = true;
      this.checkAndTransition(preloadComplete, createComplete, overlayElement);
    });

    // Start MainScene - this will trigger preload
    this.scene.start("MainScene");
  }

  checkAndTransition(preloadComplete, createComplete, overlayElement) {
    if (preloadComplete && createComplete) {
      // Fade out the loading overlay
      const overlay = document.getElementById("loading-overlay");
      if (overlay) {
        overlay.style.transition = "opacity 0.5s ease-out";
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.remove();
        }, 500);
      }

      // Stop the LoadingScene
      this.scene.stop("LoadingScene");
    }
  }
}

export default LoadingScene;
