class MobileControls {
  constructor() {
    this.isMobile = window.innerWidth < 768;
    this.joystickInput = { x: 0, y: 0 };
    this.buttonA = false;
    this.buttonD = false;
    this.buttonAPreviousState = false;
    this.buttonDPreviousState = false;

    // Active touches tracking
    this.activeTouches = new Map(); // { touchId: { x, y } }
    this.touchesOnButtonA = new Set();
    this.touchesOnButtonD = new Set();
    this.activeJoystickTouchId = null;

    // Button enabled state
    this.buttonAEnabled = false;
    this.buttonDEnabled = false;

    // Button style constants
    this.buttonANormalColor = "rgba(61, 37, 59, 0.7)";
    this.buttonAActiveColor = "rgba(120, 80, 115, 0.9)";
    this.buttonADisabledColor = "rgba(120, 120, 120, 0.6)";
    this.buttonDNormalColor = "rgba(193, 154, 107, 0.7)";
    this.buttonDActiveColor = "rgba(230, 190, 150, 0.9)";
    this.buttonDDisabledColor = "rgba(120, 120, 120, 0.6)";

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

    // Prevent browser from intercepting touches on parent containers
    buttonsContainer.style.touchAction = "none";
    joystickContainer.style.touchAction = "none";

    // Create buttons container for A and D
    this.buttonAElement = document.createElement("div");
    this.buttonAElement.style.cssText = `
             width: 30.7vw;
             aspect-ratio: 1;
             background-color: ${this.buttonADisabledColor};
             border-radius: 50%;
             display: flex;
             justify-content: center;
             align-items: center;
             font-size: 10vw;
             font-weight: bold;
             font-family: Courier;
             color: white;
             touch-action: none;
             transition: background-color 0.05s ease-out;
         `;
    this.buttonAElement.textContent = "A";
    buttonsContainer.appendChild(this.buttonAElement);

    this.buttonDElement = document.createElement("div");
    this.buttonDElement.style.cssText = `
             width: 30.9vw;
             aspect-ratio: 1;
             background-color: ${this.buttonDDisabledColor};
             border-radius: 50%;
             display: flex;
             justify-content: center;
             align-items: center;
             font-size: 10vw;
             font-weight: bold;
             font-family: Courier;
             color: white;
             touch-action: none;
             transition: background-color 0.05s ease-out;
         `;
    this.buttonDElement.textContent = "D";
    buttonsContainer.appendChild(this.buttonDElement);

    // Create joystick DOM elements (more reliable on Chrome Android than canvas)
    this.joystickBase = document.createElement("div");
    this.joystickBase.style.cssText = `
             width: 30.7vw;
             height: 30.7vw;
             border-radius: 50%;
             background-color: rgba(34, 34, 34, 1);
             border: 2px solid rgba(200, 200, 200, 0.5);
             position: relative;
             touch-action: none;
             box-sizing: border-box;
         `;
    joystickContainer.appendChild(this.joystickBase);

    this.joystickKnob = document.createElement("div");
    this.joystickKnob.style.cssText = `
             position: absolute;
             border-radius: 50%;
             background-color: rgba(150, 150, 150, 0.7);
             touch-action: none;
             top: 50%;
             left: 50%;
         `;
    this.joystickBase.appendChild(this.joystickKnob);

    this.joystickLine = document.createElement("div");
    this.joystickLine.style.cssText = `
             position: absolute;
             height: 2px;
             background-color: rgba(100, 220, 255, 0.9);
             transform-origin: left center;
             touch-action: none;
             pointer-events: none;
             top: 50%;
             left: 50%;
         `;
    this.joystickBase.appendChild(this.joystickLine);

    // Update sizes based on container
    this.updateJoystickSizes();

    // Draw initial joystick state
    this.drawJoystick();
  }

  updateJoystickSizes() {
    if (!this.joystickBase || !this.joystickKnob) {
      return;
    }
    const rect = this.joystickBase.getBoundingClientRect();
    this.joystickRadius = (rect.width / 2) * 0.8;
    this.joystickCenterX = rect.width / 2;
    this.joystickCenterY = rect.height / 2;

    const knobSize = rect.height * 0.3;
    this.joystickKnob.style.width = `${knobSize}px`;
    this.joystickKnob.style.height = `${knobSize}px`;
  }

  attachTouchListeners() {
    document.addEventListener("touchstart", (e) => this.handleTouchStart(e), {
      passive: false,
    });
    document.addEventListener("touchmove", (e) => this.handleTouchMove(e), {
      passive: false,
    });
    document.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
      passive: false,
    });
    document.addEventListener("touchcancel", (e) => this.handleTouchCancel(e), {
      passive: false,
    });
  }

  isTouchOnElement(touchX, touchY, element) {
    const rect = element.getBoundingClientRect();
    return (
      touchX >= rect.left &&
      touchX <= rect.right &&
      touchY >= rect.top &&
      touchY <= rect.bottom
    );
  }

  updateTouchesOnButtons() {
    const buttonAElement = this.buttonAElement;
    const buttonDElement = this.buttonDElement;

    if (!buttonAElement || !buttonDElement) {
      return;
    }

    this.touchesOnButtonA.clear();
    this.touchesOnButtonD.clear();

    this.activeTouches.forEach((touch, touchId) => {
      if (this.isTouchOnElement(touch.x, touch.y, buttonAElement)) {
        this.touchesOnButtonA.add(touchId);
      }
      if (this.isTouchOnElement(touch.x, touch.y, buttonDElement)) {
        this.touchesOnButtonD.add(touchId);
      }
    });

    this.updateButtonVisualState();
  }

  updateButtonVisualState() {
    if (this.buttonAElement) {
      if (!this.buttonAEnabled) {
        this.buttonAElement.style.backgroundColor = this.buttonADisabledColor;
      } else {
        this.buttonAElement.style.backgroundColor =
          this.touchesOnButtonA.size > 0
            ? this.buttonAActiveColor
            : this.buttonANormalColor;
      }
    }
    if (this.buttonDElement) {
      if (!this.buttonDEnabled) {
        this.buttonDElement.style.backgroundColor = this.buttonDDisabledColor;
      } else {
        this.buttonDElement.style.backgroundColor =
          this.touchesOnButtonD.size > 0
            ? this.buttonDActiveColor
            : this.buttonDNormalColor;
      }
    }
  }

  handleTouchStart(e) {
    e.preventDefault();

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this.activeTouches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      });

      if (
        this.activeJoystickTouchId === null &&
        this.joystickBase &&
        this.isTouchOnElement(touch.clientX, touch.clientY, this.joystickBase)
      ) {
        this.activeJoystickTouchId = touch.identifier;
        this.updateJoystickFromScreenPosition(touch.clientX, touch.clientY);
      }
    }

    this.updateTouchesOnButtons();
  }

  handleTouchMove(e) {
    e.preventDefault();

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this.activeTouches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      });

      if (touch.identifier === this.activeJoystickTouchId) {
        this.updateJoystickFromScreenPosition(touch.clientX, touch.clientY);
      }
    }

    if (this.activeJoystickTouchId !== null) {
      let found = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.activeJoystickTouchId) {
          found = true;
          break;
        }
      }
      if (!found) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.activeJoystickTouchId) {
            this.updateJoystickFromScreenPosition(touch.clientX, touch.clientY);
            break;
          }
        }
      }
    }

    this.updateTouchesOnButtons();
  }

  handleTouchEnd(e) {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this.activeTouches.delete(touch.identifier);

      if (touch.identifier === this.activeJoystickTouchId) {
        this.activeJoystickTouchId = null;
        this.joystickInput = { x: 0, y: 0 };
        this.drawJoystick();
      }
    }

    this.updateTouchesOnButtons();
  }

  handleTouchCancel(e) {
    e.preventDefault();
    this.activeTouches.clear();
    this.touchesOnButtonA.clear();
    this.touchesOnButtonD.clear();
    this.activeJoystickTouchId = null;
    this.joystickInput = { x: 0, y: 0 };
    this.drawJoystick();
  }

  updateJoystickFromScreenPosition(clientX, clientY) {
    if (!this.joystickBase) {
      return;
    }
    const rect = this.joystickBase.getBoundingClientRect();
    this.updateJoystickPosition(clientX - rect.left, clientY - rect.top, rect);
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
    if (!this.joystickBase || !this.joystickKnob || !this.joystickLine) {
      return;
    }

    const baseWidth = this.joystickBase.offsetWidth;
    const baseHeight = this.joystickBase.offsetHeight;
    const centerX = baseWidth / 2;
    const centerY = baseHeight / 2;
    const radius = baseHeight / 2;

    const knobOffsetX = this.joystickInput.x * (radius * 0.5);
    const knobOffsetY = this.joystickInput.y * (radius * 0.5);

    // Position knob: centered at (centerX, centerY) + joystick offset
    this.joystickKnob.style.transform = `translate(calc(-50% + ${knobOffsetX}px), calc(-50% + ${knobOffsetY}px))`;

    // Position direction line from center toward knob
    if (this.joystickInput.x !== 0 || this.joystickInput.y !== 0) {
      const distance = Math.sqrt(
        knobOffsetX * knobOffsetX + knobOffsetY * knobOffsetY,
      );
      const angle = Math.atan2(knobOffsetY, knobOffsetX);
      this.joystickLine.style.width = `${distance}px`;
      this.joystickLine.style.transform = `rotate(${angle}rad)`;
      this.joystickLine.style.display = "block";
    } else {
      this.joystickLine.style.display = "none";
    }
  }

  handleResize() {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile && this.joystickBase) {
      this.updateJoystickSizes();
      this.drawJoystick();
    }
  }

  getJoystickInput() {
    return this.joystickInput;
  }

  isButtonPressed(button) {
    if (button === "buttonA") {
      return this.buttonA && this.buttonAEnabled;
    }
    if (button === "buttonD") {
      return this.buttonD && this.buttonDEnabled;
    }
    return false;
  }

  isButtonJustPressed(button) {
    if (button === "buttonA") {
      const justPressed = this.buttonA && !this.buttonAPreviousState;
      return justPressed && this.buttonAEnabled;
    }
    if (button === "buttonD") {
      const justPressed = this.buttonD && !this.buttonDPreviousState;
      return justPressed && this.buttonDEnabled;
    }
    return false;
  }

  updateButtonStates() {
    // This should be called once per frame to update previous states
    // IMPORTANT: Update previous states FIRST (from last frame's button states)
    this.buttonAPreviousState = this.buttonA;
    this.buttonDPreviousState = this.buttonD;

    // THEN update button states based on whether any touches are on them
    // Only register touch if button is enabled
    this.buttonA = this.buttonAEnabled && this.touchesOnButtonA.size > 0;
    this.buttonD = this.buttonDEnabled && this.touchesOnButtonD.size > 0;
  }

  enableButtonA() {
    this.buttonAEnabled = true;
    this.updateButtonVisualState();
  }

  disableButtonA() {
    this.buttonAEnabled = false;
    this.buttonA = false;
    this.touchesOnButtonA.clear();
    this.updateButtonVisualState();
  }

  enableButtonD() {
    this.buttonDEnabled = true;
    this.updateButtonVisualState();
  }

  disableButtonD() {
    this.buttonDEnabled = false;
    this.buttonD = false;
    this.touchesOnButtonD.clear();
    this.updateButtonVisualState();
  }
}

export default MobileControls;
