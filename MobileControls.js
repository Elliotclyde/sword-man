class MobileControls {
  constructor() {
    this.isMobile = window.innerWidth < 768;
    this.joystickInput = { x: 0, y: 0 };
    this.buttonA = false;
    this.buttonB = false;
    this.buttonAPreviousState = false;
    this.buttonBPreviousState = false;

    // Active touches tracking
    this.activeTouches = new Map(); // { touchId: { x, y } }
    this.touchesOnButtonA = new Set();
    this.touchesOnButtonB = new Set();
    this.activeJoystickTouchId = null;

    // Button style constants
    this.buttonANormalColor = "rgba(255, 100, 100, 0.7)";
    this.buttonAActiveColor = "rgba(255, 150, 150, 0.9)";
    this.buttonBNormalColor = "rgba(100, 150, 255, 0.7)";
    this.buttonBActiveColor = "rgba(150, 180, 255, 0.9)";

    if (this.isMobile) {
      this.initializeUI();
      this.attachTouchListeners();
      window.addEventListener("resize", () => this.handleResize());
    }
  }

  initializeUI() {
    const buttonsContainer = document.getElementById("buttons-container");
    const joystickContainer = document.getElementById("joystick-container");

    if (!buttonsContainer || !joystickContainer) {
      console.warn("Mobile control containers not found in DOM");
      return;
    }

    // Create buttons container for A and B
    this.buttonAElement = document.createElement("div");
    this.buttonAElement.style.cssText = `
            width: 80%;
            aspect-ratio: 1;
            background-color: ${this.buttonANormalColor};
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 48px;
            font-weight: bold;
            color: white;
            touch-action: none;
            transition: background-color 0.05s ease-out;
        `;
    this.buttonAElement.textContent = "A";
    buttonsContainer.appendChild(this.buttonAElement);

    this.buttonBElement = document.createElement("div");
    this.buttonBElement.style.cssText = `
            width: 80%;
            aspect-ratio: 1;
            background-color: ${this.buttonBNormalColor};
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 48px;
            font-weight: bold;
            color: white;
            touch-action: none;
            transition: background-color 0.05s ease-out;
        `;
    this.buttonBElement.textContent = "B";
    buttonsContainer.appendChild(this.buttonBElement);

    // Create joystick canvas
    this.joystickCanvas = document.createElement("canvas");
    this.joystickCanvas.style.cssText = `
            width: 100%;
            height: 100%;
            touch-action: none;
        `;
    joystickContainer.appendChild(this.joystickCanvas);

    // Get canvas context
    this.ctx = this.joystickCanvas.getContext("2d");

    // Update canvas size based on container
    this.updateCanvasSizes();

    // Draw initial joystick state
    this.drawJoystick();
  }

  updateCanvasSizes() {
    const joystickContainer = document.getElementById("joystick-container");
    if (joystickContainer) {
      const rect = joystickContainer.getBoundingClientRect();
      this.joystickCanvas.width = rect.width * window.devicePixelRatio;
      this.joystickCanvas.height = rect.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.joystickRadius = (rect.width / 2) * 0.8; // 80% of half container width
      this.joystickCenterX = rect.width / 2;
      this.joystickCenterY = rect.height / 2;
    } else {
      console.warn(
        "Mobile control joystick container not found in updateCanvasSizes",
      );
    }
  }

  attachTouchListeners() {
    const buttonsContainer = document.getElementById("buttons-container");
    const joystickContainer = document.getElementById("joystick-container");

    if (!buttonsContainer || !joystickContainer) {
      return;
    }

    // Use global touch listeners for more accurate tracking
    document.addEventListener("touchstart", (e) => this.handleTouchStart(e), {
      passive: false,
    });
    document.addEventListener("touchmove", (e) => this.handleTouchMove(e), {
      passive: false,
    });
    document.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
      passive: false,
    });
  }

  /**
   * Check if a touch point is within the bounds of an element
   */
  isTouchOnElement(touchX, touchY, element) {
    const rect = element.getBoundingClientRect();
    return (
      touchX >= rect.left &&
      touchX <= rect.right &&
      touchY >= rect.top &&
      touchY <= rect.bottom
    );
  }

  /**
   * Update which touches are on each button
   */
  updateTouchesOnButtons() {
    const buttonsContainer = document.getElementById("buttons-container");
    const buttonAElement = this.buttonAElement;
    const buttonBElement = this.buttonBElement;

    if (!buttonsContainer || !buttonAElement || !buttonBElement) {
      return;
    }

    this.touchesOnButtonA.clear();
    this.touchesOnButtonB.clear();

    this.activeTouches.forEach((touch, touchId) => {
      if (this.isTouchOnElement(touch.x, touch.y, buttonAElement)) {
        this.touchesOnButtonA.add(touchId);
      }
      if (this.isTouchOnElement(touch.x, touch.y, buttonBElement)) {
        this.touchesOnButtonB.add(touchId);
      }
    });

    this.updateButtonVisualState();
  }

  /**
   * Update visual state of buttons based on touch status
   */
  updateButtonVisualState() {
    if (this.buttonAElement) {
      this.buttonAElement.style.backgroundColor =
        this.touchesOnButtonA.size > 0
          ? this.buttonAActiveColor
          : this.buttonANormalColor;
    }
    if (this.buttonBElement) {
      this.buttonBElement.style.backgroundColor =
        this.touchesOnButtonB.size > 0
          ? this.buttonBActiveColor
          : this.buttonBNormalColor;
    }
  }

  /**
   * Handle all touch starts
   */
  handleTouchStart(e) {
    const buttonsContainer = document.getElementById("buttons-container");
    const joystickContainer = document.getElementById("joystick-container");

    // Record all new touches
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (!this.activeTouches.has(touch.identifier)) {
        this.activeTouches.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
        });
      }
    }

    // Try to assign joystick if not already assigned
    if (!this.activeJoystickTouchId && joystickContainer) {
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (
          this.isTouchOnElement(touch.clientX, touch.clientY, joystickContainer)
        ) {
          this.activeJoystickTouchId = touch.identifier;
          const rect = joystickContainer.getBoundingClientRect();
          this.updateJoystickPosition(
            touch.clientX - rect.left,
            touch.clientY - rect.top,
            rect,
          );
          break;
        }
      }
    }

    // Update button touches
    this.updateTouchesOnButtons();
  }

  /**
   * Handle all touch moves
   */
  handleTouchMove(e) {
    const joystickContainer = document.getElementById("joystick-container");

    // Update positions of all active touches
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (this.activeTouches.has(touch.identifier)) {
        this.activeTouches.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
        });
      }
    }

    // Update joystick position if this is the active joystick touch
    if (this.activeJoystickTouchId && joystickContainer) {
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.activeJoystickTouchId) {
          const touch = e.touches[i];
          const rect = joystickContainer.getBoundingClientRect();
          this.updateJoystickPosition(
            touch.clientX - rect.left,
            touch.clientY - rect.top,
            rect,
          );
          break;
        }
      }
    }

    // Re-check which touches are on buttons (they may have moved)
    this.updateTouchesOnButtons();
  }

  /**
   * Handle all touch ends
   */
  handleTouchEnd(e) {
    // Remove ended touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this.activeTouches.delete(touch.identifier);

      // Clear joystick if this was the active touch
      if (touch.identifier === this.activeJoystickTouchId) {
        this.activeJoystickTouchId = null;
        this.joystickInput = { x: 0, y: 0 };
        this.drawJoystick();
      }
    }

    // Update button touches
    this.updateTouchesOnButtons();
  }

  updateJoystickPosition(touchX, touchY, containerRect) {
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    const dx = touchX - centerX;
    const dy = touchY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      this.joystickInput = { x: 0, y: 0 };
    } else {
      // Calculate direction with 8-way input (cardinal + diagonal)
      let x = 0;
      let y = 0;

      // Use angle-based detection for smooth 8-direction input
      const angle = Math.atan2(dy, dx);
      const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;

      // Divide circle into 8 segments
      const segmentSize = (Math.PI * 2) / 8;
      const segment = Math.floor(normalizedAngle / segmentSize);

      // Map segment to direction
      switch (segment) {
        case 0: // Right
          x = 1;
          break;
        case 1: // Right-Down
          x = 1;
          y = 1;
          break;
        case 2: // Down
          y = 1;
          break;
        case 3: // Left-Down
          x = -1;
          y = 1;
          break;
        case 4: // Left
          x = -1;
          break;
        case 5: // Left-Up
          x = -1;
          y = -1;
          break;
        case 6: // Up
          y = -1;
          break;
        case 7: // Right-Up
          x = 1;
          y = -1;
          break;
      }

      this.joystickInput = { x, y };
    }

    this.drawJoystick();
  }

  drawJoystick() {
    if (!this.joystickCanvas || !this.ctx) {
      return;
    }

    const width = this.joystickCanvas.width / window.devicePixelRatio;
    const height = this.joystickCanvas.height / window.devicePixelRatio;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = this.joystickRadius || (width / 2) * 0.8;

    // Clear canvas
    this.ctx.fillStyle = "rgba(34, 34, 34, 1)";
    this.ctx.fillRect(0, 0, width, height);

    // Draw outer circle
    this.ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw inner circle/current position
    const currentX = centerX + this.joystickInput.x * (radius * 0.5);
    const currentY = centerY + this.joystickInput.y * (radius * 0.5);

    this.ctx.fillStyle = "rgba(150, 150, 150, 0.7)";
    this.ctx.beginPath();
    this.ctx.arc(currentX, currentY, radius * 0.3, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw direction line
    if (this.joystickInput.x !== 0 || this.joystickInput.y !== 0) {
      this.ctx.strokeStyle = "rgba(100, 200, 100, 0.8)";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(currentX, currentY);
      this.ctx.stroke();
    }
  }

  handleResize() {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile && this.joystickCanvas) {
      this.updateCanvasSizes();
      this.drawJoystick();
    }
  }

  getJoystickInput() {
    return this.joystickInput;
  }

  isButtonPressed(button) {
    if (button === "buttonA") {
      return this.buttonA;
    }
    if (button === "buttonB") {
      return this.buttonB;
    }
    return false;
  }

  isButtonJustPressed(button) {
    if (button === "buttonA") {
      const justPressed = this.buttonA && !this.buttonAPreviousState;
      return justPressed;
    }
    if (button === "buttonB") {
      const justPressed = this.buttonB && !this.buttonBPreviousState;
      return justPressed;
    }
    return false;
  }

  updateButtonStates() {
    // This should be called once per frame to update previous states
    // IMPORTANT: Update previous states FIRST (from last frame's button states)
    this.buttonAPreviousState = this.buttonA;
    this.buttonBPreviousState = this.buttonB;

    // THEN update button states based on whether any touches are on them
    this.buttonA = this.touchesOnButtonA.size > 0;
    this.buttonB = this.touchesOnButtonB.size > 0;
  }
}

export default MobileControls;
