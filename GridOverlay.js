/**
 * GridOverlay - Renders a grid overlay on the mobile UI to match the game tile grid
 * The grid shows 20x15 tiles matching the game canvas grid structure
 */
export default class GridOverlay {
  constructor() {
    this.canvas = document.getElementById("grid-overlay");
    this.ctx = this.canvas.getContext("2d");

    // Game grid constants
    this.GRID_COLS = 20;
    this.GRID_ROWS = 15;
    this.GAME_WIDTH = 800;
    this.GAME_HEIGHT = 600;

    // Calculate base tile size in game canvas pixels
    this.baseGameTileSize = this.GAME_WIDTH / this.GRID_COLS; // 40 pixels

    // Initial draw
    this.redraw();

    // Redraw on window resize
    window.addEventListener("resize", () => this.redraw());
  }

  redraw() {
    // Get the mobile controls container dimensions
    const container = document.getElementById("mobile-controls");
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Set canvas size with device pixel ratio for crisp lines
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Calculate tile size in mobile UI pixels
    const tileWidth = width / this.GRID_COLS;
    const tileHeight = height / this.GRID_ROWS;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Set grid line style
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    this.ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= this.GRID_COLS; x++) {
      const xPos = x * tileWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(xPos, 0);
      this.ctx.lineTo(xPos, height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= this.GRID_ROWS; y++) {
      const yPos = y * tileHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(0, yPos);
      this.ctx.lineTo(width, yPos);
      this.ctx.stroke();
    }
  }
}
