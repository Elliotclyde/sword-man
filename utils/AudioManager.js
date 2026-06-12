/**
 * AudioManager - Centralized audio management for the game
 * Handles music playback with Web Audio API effects (low-pass filter & cathedral reverb)
 * Supports multiple music tracks via audio sprites
 * Uses game.registry for cross-scene persistence
 */

class AudioManager {
  constructor() {
    this.scene = null;
    this.audioContext = null;
    this.currentMusicKey = null;
    this.backgroundMusic = null;

    // Web Audio nodes
    this.filterNode = null;
    this.dryGainNode = null;
    this.wetGainNode = null;
    this.mixGainNode = null;
    this.masterGainNode = null;
    this.backgroundMusicGainNode = null;
    this.convolverNode = null;
    this.cathedralBuffer = null;

    // Filter properties
    this.currentFilterFrequency = 1150;
    this.isFilterActive = false;
    this.filterWaveStartTime = 0;
    this.currentFilterCycleDuration = 0;
    this.MIN_FILTER_FREQUENCY = 300;
    this.MAX_FILTER_FREQUENCY = 2000;
    this.FILTER_RESONANCE = 1.0;
    this.MIN_CYCLE_DURATION = 10000; // 10 seconds
    this.MAX_CYCLE_DURATION = 22000; // 22 seconds

    // Reverb properties
    this.currentDryWetBalance = 0.5;
    this.currentReverbCycleDuration = 0;
    this.MIN_DRY_WET_BALANCE = 0.3; // 30% wet minimum
    this.MAX_DRY_WET_BALANCE = 0.8; // 80% wet maximum

    // Gain constants
    this.MASTER_GAIN_REDUCTION = 1;
    this.BACKGROUND_MUSIC_VOLUME = 1;
  }

  /**
   * Initialize the AudioManager with a Phaser scene
   * Sets up Web Audio node chain and cathedral reverb
   */
  initialize(scene) {
    this.scene = scene;
    this.audioContext = scene.sound.context;

    // Load cathedral impulse response
    let cathedralSound = scene.sound.get("cathedral-ir");
    if (!cathedralSound) {
      cathedralSound = scene.sound.add("cathedral-ir");
    }

    // Setup Web Audio nodes
    this.setupAudioNodes();

    // Connect the filter chain
    this.connectFilterChain();

    // Initialize randomized cycle durations
    this.currentFilterCycleDuration = this.generateRandomCycleDuration();
    this.currentReverbCycleDuration = this.generateRandomCycleDuration();

    // Store cathedral buffer for reverb
    if (cathedralSound && cathedralSound.audioBuffer) {
      this.cathedralBuffer = cathedralSound.audioBuffer;
      this.convolverNode.buffer = this.cathedralBuffer;
    }

    // Start filter as active
    this.isFilterActive = true;
    this.filterWaveStartTime = scene.time.now;

    // Register this instance globally for other scenes to access
    scene.game.registry.set("audioManager", this);
  }

  /**
   * Create all Web Audio nodes
   */
  setupAudioNodes() {
    // Create filter node
    if (!this.filterNode) {
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.value = this.currentFilterFrequency;
      this.filterNode.Q.value = this.FILTER_RESONANCE;
    }

    // Create convolver for reverb
    if (!this.convolverNode) {
      this.convolverNode = this.audioContext.createConvolver();
    }

    // Create gain nodes
    if (!this.dryGainNode) {
      this.dryGainNode = this.audioContext.createGain();
    }
    if (!this.wetGainNode) {
      this.wetGainNode = this.audioContext.createGain();
    }
    if (!this.mixGainNode) {
      this.mixGainNode = this.audioContext.createGain();
    }
    if (!this.masterGainNode) {
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.value = this.MASTER_GAIN_REDUCTION;
    }
    if (!this.backgroundMusicGainNode) {
      this.backgroundMusicGainNode = this.audioContext.createGain();
      this.backgroundMusicGainNode.gain.value = this.BACKGROUND_MUSIC_VOLUME;
    }
  }

  /**
   * Connect the Web Audio filter chain
   * Music → BG Gain → Filter → [Dry + Convolver] → Mix → Master Gain → Output
   */
  connectFilterChain() {
    // Connect dry and wet paths from filter
    this.filterNode.connect(this.dryGainNode);
    this.filterNode.connect(this.convolverNode);

    // Connect wet path through convolver
    this.convolverNode.connect(this.wetGainNode);

    // Mix dry and wet signals
    this.dryGainNode.connect(this.mixGainNode);
    this.wetGainNode.connect(this.mixGainNode);

    // Output to destination
    this.mixGainNode.connect(this.masterGainNode);
    this.masterGainNode.connect(this.audioContext.destination);
  }

  /**
   * Connect music source to filter chain
   */
  connectMusicSourceToFilter() {
    if (this.backgroundMusic && this.backgroundMusic.source) {
      try {
        this.backgroundMusic.source.disconnect();
      } catch (e) {
        // Connection might not exist yet
      }

      // Connect source through the chain
      this.backgroundMusic.source.connect(this.backgroundMusicGainNode);
      this.backgroundMusicGainNode.connect(this.filterNode);

      // Initialize dry/wet balance
      this.updateDryWetBalance();
    }
  }

  /**
   * Play a music track by key (from audio sprite)
   * Only switches music if the requested track differs from current
   */
  playMusic(musicKey) {
    // If already playing the same track, do nothing (let it continue looping)
    if (
      this.currentMusicKey === musicKey &&
      this.backgroundMusic &&
      this.backgroundMusic.isPlaying
    ) {
      return;
    }

    // Stop current music if playing
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop();
    }

    // Create new music audio sprite
    this.backgroundMusic = this.scene.sound.addAudioSprite("music");
    this.currentMusicKey = musicKey;

    // Play the music track with loop: false for manual looping
    this.backgroundMusic.play(musicKey, { loop: false });

    // Connect to filter chain
    this.connectMusicSourceToFilter();

    // Listen for completion to manually loop
    this.backgroundMusic.once("complete", () => {
      this.handleAudioLoopReset(musicKey);
    });
  }

  /**
   * Handle audio loop reset - manually loop while preserving Web Audio chain
   * Checks if current level has custom music, otherwise keeps playing current track
   */
  handleAudioLoopReset(musicKey) {
    if (!this.backgroundMusic) {
      return;
    }

    // Check if we should switch to custom music for current level
    let trackToPlay = musicKey;
    if (this.scene && this.scene.currentLevelIndex !== undefined) {
      const currentLevel =
        this.scene.levels && this.scene.levels[this.scene.currentLevelIndex];
      if (currentLevel && currentLevel.customMusic) {
        trackToPlay = currentLevel.customMusic;
      }
    }

    // If track changed, switch to new track instead of looping current
    if (trackToPlay !== musicKey) {
      this.playMusic(trackToPlay);
      return;
    }

    // Safely disconnect old source
    try {
      if (this.backgroundMusic.source) {
        this.backgroundMusic.source.disconnect();
      }
    } catch (e) {
      // Already disconnected
    }

    // Restart the music
    this.backgroundMusic.play();

    if (!this.backgroundMusic.source) {
      return;
    }

    try {
      // Disconnect new source before Phaser auto-connects it
      this.backgroundMusic.source.disconnect();

      // Disconnect gain node to prevent duplicate paths
      try {
        this.backgroundMusicGainNode.disconnect(this.filterNode);
      } catch (e) {
        // Not connected yet
      }

      // Reconnect to filter chain
      this.backgroundMusic.source.connect(this.backgroundMusicGainNode);
      this.backgroundMusicGainNode.connect(this.filterNode);

      // Reset all gain values
      this.backgroundMusicGainNode.gain.value = this.BACKGROUND_MUSIC_VOLUME;
      this.masterGainNode.gain.value = this.MASTER_GAIN_REDUCTION;
      this.dryGainNode.gain.value = 1.0;
      this.wetGainNode.gain.value = 1.0;
      this.mixGainNode.gain.value = 1.0;

      // Reapply automation values
      this.filterNode.frequency.value = this.currentFilterFrequency;
      this.updateDryWetBalance();

      // Set up listener for next loop
      this.backgroundMusic.once("complete", () => {
        this.handleAudioLoopReset(trackToPlay);
      });
    } catch (e) {
      // Error reconnecting
    }
  }

  /**
   * Update filter and reverb automation with triangle wave
   * Called every frame from scene update
   */
  update(deltaTime) {
    if (!this.isFilterActive || !this.filterNode) {
      return;
    }

    const elapsedTime = this.scene.time.now - this.filterWaveStartTime;

    // Update filter frequency triangle wave
    this.updateFilterFrequency(elapsedTime, deltaTime);

    // Update reverb dry/wet balance triangle wave
    this.updateReverbBalance(elapsedTime, deltaTime);
  }

  /**
   * Update filter frequency with triangle wave oscillation
   */
  updateFilterFrequency(elapsedTime, deltaTime) {
    const filterWaveProgress =
      (elapsedTime % this.currentFilterCycleDuration) /
      this.currentFilterCycleDuration;

    // Check if cycle completed and regenerate duration
    if (
      elapsedTime > 0 &&
      elapsedTime % this.currentFilterCycleDuration < deltaTime
    ) {
      this.currentFilterCycleDuration = this.generateRandomCycleDuration();
    }

    // Calculate target frequency based on triangle wave
    let targetFrequency;
    if (filterWaveProgress < 0.5) {
      // Ascending: MIN → MAX
      const rampProgress = filterWaveProgress * 2;
      targetFrequency =
        this.MIN_FILTER_FREQUENCY +
        (this.MAX_FILTER_FREQUENCY - this.MIN_FILTER_FREQUENCY) * rampProgress;
    } else {
      // Descending: MAX → MIN
      const rampProgress = (filterWaveProgress - 0.5) * 2;
      targetFrequency =
        this.MAX_FILTER_FREQUENCY -
        (this.MAX_FILTER_FREQUENCY - this.MIN_FILTER_FREQUENCY) * rampProgress;
    }

    this.filterNode.frequency.value = targetFrequency;
    this.currentFilterFrequency = targetFrequency;
  }

  /**
   * Update reverb dry/wet balance with triangle wave oscillation
   */
  updateReverbBalance(elapsedTime, deltaTime) {
    const reverbWaveProgress =
      (elapsedTime % this.currentReverbCycleDuration) /
      this.currentReverbCycleDuration;

    // Check if cycle completed and regenerate duration
    if (
      elapsedTime > 0 &&
      elapsedTime % this.currentReverbCycleDuration < deltaTime
    ) {
      this.currentReverbCycleDuration = this.generateRandomCycleDuration();
    }

    // Calculate target balance based on triangle wave
    let targetDryWetBalance;
    if (reverbWaveProgress < 0.5) {
      // Ascending: MIN → MAX
      const rampProgress = reverbWaveProgress * 2;
      targetDryWetBalance =
        this.MIN_DRY_WET_BALANCE +
        (this.MAX_DRY_WET_BALANCE - this.MIN_DRY_WET_BALANCE) * rampProgress;
    } else {
      // Descending: MAX → MIN
      const rampProgress = (reverbWaveProgress - 0.5) * 2;
      targetDryWetBalance =
        this.MAX_DRY_WET_BALANCE -
        (this.MAX_DRY_WET_BALANCE - this.MIN_DRY_WET_BALANCE) * rampProgress;
    }

    this.currentDryWetBalance = targetDryWetBalance;
    this.updateDryWetBalance();
  }

  /**
   * Update dry/wet gain balance for reverb
   * Uses square root curve for natural transitions
   */
  updateDryWetBalance() {
    if (!this.dryGainNode || !this.wetGainNode) {
      return;
    }

    const clampedBalance = Math.max(0, Math.min(1, this.currentDryWetBalance));

    // Use square root curve for natural transitions
    const wetAmount = Math.sqrt(clampedBalance);
    const dryAmount = Math.sqrt(1 - clampedBalance);

    // Normalize so total volume stays consistent
    const totalAmount = wetAmount + dryAmount;

    if (totalAmount > 0) {
      this.dryGainNode.gain.value = dryAmount / totalAmount;
      this.wetGainNode.gain.value = wetAmount / totalAmount;
    } else {
      // Fallback to equal mix
      this.dryGainNode.gain.value = 0.5;
      this.wetGainNode.gain.value = 0.5;
    }
  }

  /**
   * Generate a random cycle duration between 10-22 seconds
   */
  generateRandomCycleDuration() {
    return Phaser.Math.Between(
      this.MIN_CYCLE_DURATION,
      this.MAX_CYCLE_DURATION,
    );
  }

  /**
   * Stop music playback
   */
  stop() {
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop();
    }
  }

  /**
   * Destroy the AudioManager and cleanup Web Audio nodes
   */
  destroy() {
    // Stop music
    this.stop();

    // Disconnect all nodes
    try {
      if (this.filterNode) {
        this.filterNode.disconnect();
      }
      if (this.dryGainNode) {
        this.dryGainNode.disconnect();
      }
      if (this.wetGainNode) {
        this.wetGainNode.disconnect();
      }
      if (this.convolverNode) {
        this.convolverNode.disconnect();
      }
      if (this.mixGainNode) {
        this.mixGainNode.disconnect();
      }
      if (this.masterGainNode) {
        this.masterGainNode.disconnect();
      }
      if (this.backgroundMusicGainNode) {
        this.backgroundMusicGainNode.disconnect();
      }
    } catch (e) {
      // Nodes already disconnected
    }

    // Clean up references
    this.scene = null;
    this.audioContext = null;
    this.backgroundMusic = null;
    this.filterNode = null;
    this.dryGainNode = null;
    this.wetGainNode = null;
    this.mixGainNode = null;
    this.masterGainNode = null;
    this.backgroundMusicGainNode = null;
    this.convolverNode = null;
    this.cathedralBuffer = null;
  }
}

export default AudioManager;
