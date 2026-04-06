const entityTypes = {
    PLAYER: "PLAYER",
    ENEMY: "ENEMY",
    WIZARD_FIREBALL: "WIZARD_FIREBALL"
};

// Enemy type definitions for extensibility
const enemyTypes = {
    ORC: "ORC",
    WIZARD: "WIZARD",
    WEREWOLF: "WEREWOLF",
    ARMOREDORC: "ARMOREDORC"
};

// Enemy configuration: sprite asset, frame dimensions, and attack animation
const enemyConfigs = {
    [enemyTypes.ORC]: {
        assetKey: 'orc',
        frameWidth: 100,
        frameHeight: 100,
        attackAnimKey: 'orc_attack',
        canDamageOnTouch: true,
        health: 1
    },
    [enemyTypes.WIZARD]: {
        assetKey: 'wizard',
        frameWidth: 100,
        frameHeight: 100,
        attackAnimKey: 'wizard_attack',
        canDamageOnTouch: false,
        health: 1
    },
    [enemyTypes.WEREWOLF]: {
        assetKey: 'werewolf',
        frameWidth: 100,
        frameHeight: 100,
        attackAnimKey: 'werewolf_attack',
        canDamageOnTouch: true,
        health: 1
    },
     [enemyTypes.ARMOREDORC]: {
         assetKey: 'armoredorc',
         frameWidth: 100,
         frameHeight: 100,
         attackAnimKey: 'armoredorc_attack',
         canDamageOnTouch: true,
         health: 3
     }
};

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');

         // Define game levels with enemy configurations
          this.levels = [
              { 
                  level: 1, 
                  enemies: [
                      { type: enemyTypes.ORC, count: 1 },
                  ], 
                  playerStartX: 100, 
                  playerStartY: 100 
              },
             { 
                 level: 2, 
                 enemies: [
                     { type: enemyTypes.ORC, count: 5}
                 ], 
                 playerStartX: 600, 
                 playerStartY: 500 
             },
             { 
                 level: 3, 
                 enemies: [
                     { type: enemyTypes.ORC, count: 5 },
                     { type: enemyTypes.WIZARD, count: 1 }
                 ], 
                 playerStartX: 100, 
                 playerStartY: 100 
             },
             { 
                 level: 4, 
                 enemies: [
                     { type: enemyTypes.ARMOREDORC, count: 2 },
                 ], 
                 playerStartX: 600, 
                 playerStartY: 100 
             },
             {
                 level: 5,
                 enemies: [
                     { type: enemyTypes.ORC, count: 5 },
                     { type: enemyTypes.WEREWOLF, count: 2 }
                 ],
                 playerStartX: 100,
                 playerStartY: 100
             },
             {
                 level: 6,
                 enemies: [
                     { type: enemyTypes.ARMOREDORC, count: 5 },
                     { type: enemyTypes.WIZARD, count: 2 }
                 ],
                 playerStartX: 100,
                 playerStartY: 100
             }
         ];

         // Werewolf detection and movement constants
         this.WEREWOLF_DETECTION_RANGE = 300;    // pixels - when werewolf notices player
         this.WEREWOLF_PATROL_SPEED = 100;       // pixels/second
         this.WEREWOLF_HUNT_SPEED = 160;         // pixels/second - faster when hunting

         // Current level index
         this.currentLevelIndex = 0;

    }

    preload() {
        // Load assets here
        // Soldier.png is 900x700, divided into 100x100 frames
        this.load.spritesheet('soldier', 'assets/Soldier.png', {
            frameWidth: 100,
            frameHeight: 100
        });

        // Orc.png is set up similarly to Soldier.png
        this.load.spritesheet('orc', 'assets/Orc.png', {
            frameWidth: 100,
            frameHeight: 100
        });

        // Wizard.png is set up similarly to Soldier.png
        this.load.spritesheet('wizard', 'assets/Wizard.png', {
            frameWidth: 100,
            frameHeight: 100
        });

         this.load.spritesheet('werewolf', 'assets/Werewolf.png', {
             frameWidth: 100,
             frameHeight: 100
         });

          this.load.spritesheet('armoredorc', 'assets/ArmoredOrc.png', {
              frameWidth: 100,
              frameHeight: 100
          });

          // Dungeon.png is 160x160 with 16x16 tiles in a 10x10 grid
          this.load.spritesheet('dungeon', 'assets/Dungeon.png', {
              frameWidth: 16,
              frameHeight: 16
          });

           // HealthBars.png contains health bar sprites, 48x20 pixels each
           this.load.spritesheet('healthbars', 'assets/HealthBars.png', {
               frameWidth: 48,
               frameHeight: 16
           });

           // Load background music
           this.load.audio('darksichord', 'assets/darksichord.wav');
        }

    // Idempotent initialization method that properly resets all game state
    initializeLevel() {

        // Reset game over flag
        this.gameIsOver = false;

        // Remove win/lose text if it exists
        if (this.resultText) {
            this.resultText.setVisible(false);
            this.resultText.destroy();
            this.resultText = null;
        }

        // Remove play again button if it exists
        if (this.playAgainButton) {
            this.playAgainButton.setVisible(false);
            this.playAgainButton.destroy();
            this.playAgainButton = null;
        }

        // Remove space key listener if it exists
        if (this.spaceKeyListener) {
            this.spaceKeyListener.removeAllListeners();
            this.spaceKeyListener.destroy();
            this.spaceKeyListener = null;
        }

        // Remove black overlay if it exists
        if (this.blackOverlay) {
            this.blackOverlay.destroy();
            this.blackOverlay = null;
        }

        // Reset player if it exists
        if (this.player) {
            const currentLevel = this.levels[this.currentLevelIndex];
            this.player.setPosition(currentLevel.playerStartX, currentLevel.playerStartY);
            this.player.clearTint();
            this.player.alpha = 1; // Reset player transparency
            if (this.player.body) {
                this.player.body.setVelocity(0, 0);
            }
        }

        // Hide hit effect if it exists
        if (this.hitEffect) {
            this.hitEffect.setVisible(false);
        }

        // Reset game started flag
        this.isGameStarted = false;

        // Reset space bar and x key to clear any pending inputs
        if (this.spaceBar) {
            this.spaceBar.reset();
        }
        if (this.xKey) {
            this.xKey.reset();
        }

         // Remove existing health bar if it exists
         if (this.healthBar) {
             this.healthBar.destroy();
             this.healthBar = null;
         }

         // Remove existing health value bar if it exists
         if (this.healthValueBar) {
             this.healthValueBar.destroy();
             this.healthValueBar = null;
         }

         // Remove existing level text if it exists
         if (this.levelText) {
             this.levelText.destroy();
             this.levelText = null;
         }

        // Completely remove all existing enemies with multiple cleanup approaches
        if (this.enemies) {
             // Method 1: Destroy each enemy individually with special handling for dying enemies
             const enemiesToDestroy = [...this.enemies.children.entries]; // Create a copy to avoid iteration issues
             enemiesToDestroy.forEach(enemy => {
                 if (enemy && !enemy.destroyed) {
                     // Clear any timers associated with the enemy
                     if (enemy.behaviorTimer) {
                         enemy.behaviorTimer.remove(false);
                     }

                     // Clear wizard attack timer if it exists
                     if (enemy.attackTimer) {
                         enemy.attackTimer.remove(false);
                     }

                     // If enemy has an ongoing tween (fade out), complete it immediately
                      if (enemy.fadeTween) {
                          enemy.fadeTween.complete();
                          enemy.fadeTween = null;
                      }

                      // Remove all animation completion listeners (use enemy type to get correct animation keys)
                      const typePrefix = enemy.type ? enemy.type.toLowerCase() : 'orc';
                      enemy.off(`animationcomplete-${typePrefix}_die`);
                      enemy.off(`animationcomplete-${typePrefix}_attack`);

                      // Stop any current animations
                      if (enemy.anims) {
                          enemy.anims.stop();
                      }

                      // Reset alpha in case it was modified by a tween
                      enemy.alpha = 1;

                      // Force destroy the enemy
                      enemy.destroy();
                  }
              });

             // Method 2: Clear the group
             this.enemies.clear();
        }
         this.enemies = this.add.group();

         // Remove all fireballs
         if (this.fireballs) {
             const fireballsToDestroy = [...this.fireballs.children.entries];
             fireballsToDestroy.forEach(fireball => {
                 if (fireball && !fireball.destroyed) {
                     fireball.destroy();
                 }
             });
             this.fireballs.clear();
         }
         this.fireballs = this.add.group();

         // Spawn new enemies based on current level configuration
         const levelConfig = this.levels[this.currentLevelIndex];
         levelConfig.enemies.forEach(enemySpec => {
             for (let i = 0; i < enemySpec.count; i++) {
                 this.spawnEnemy(enemySpec.type);
             }
         });

          // Track last horizontal direction (default to right)
          this.lastHorizontalDirection = 'right';
          this.isPlayerSwinging = false; // Track if player is currently swinging sword
          this.isDashing = false; // Track if player is currently dashing
          this.dashEndTime = 0; // Track when the dash ends
          this.lastDashTime = 0; // Track when the last dash was used
          this.lastDashDirection = 0; // Track angle of last dash for particle emission
          this.lastDashParticleTime = 0; // Track last particle emission time during dash

          // Track last attack time
          this.lastAttackTime = 0; // Track when the last dash was used

         // Track last time player was hit
         this.playerLastHitTime = 0; // Track when the player was last hit by an enemy


          if (this.playerEnemyCollider){
            this.physics.world.removeCollider(this.playerEnemyCollider);
          }
          // Set up collision detection for player taking damage from enemies
          //this.physics.add.overlap(this.player, this.enemies, this.handlePlayerDamage, null, this);
          this.playerEnemyCollider = this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

          // Set up collision detection for fireballs hitting the player
          if (this.playerFireballCollider) {
              this.physics.world.removeCollider(this.playerFireballCollider);
          }
          this.playerFireballCollider = this.physics.add.overlap(this.player, this.fireballs, this.handleFireballHit, null, this);

    // Create health bar sprite display (health value - underneath)
    this.healthValueBar = this.add.sprite(750, 550, 'healthbars', 1);
    this.healthValueBar.setScale(3); // Scale to 3x size
    this.healthValueBar.setOrigin(1, 1); // Align to bottom right
    this.healthValueBar.setScrollFactor(0); // Keep fixed on screen
    this.healthValueBar.setDepth(10); // Render above player and enemies
    this.healthValueBar.setAlpha(0.7); // Make slightly transparent

    // Frame mapping: 6 health -> frame 1, 5 health -> frame 2, ... 0 health -> frame 7
    const healthFrame = Math.min(7, Math.max(1, 7 - this.player.health));
    this.healthValueBar.setFrame(healthFrame);

    // Create health bar border sprite display (border - on top)
    this.healthBar = this.add.sprite(750, 550, 'healthbars', 0);
    this.healthBar.setScale(3); // Scale to 3x size
    this.healthBar.setOrigin(1, 1); // Align to bottom right
    this.healthBar.setScrollFactor(0); // Keep fixed on screen
    this.healthBar.setDepth(11); // Render on top of health value
    this.healthBar.setAlpha(0.7); // Make slightly transparent

    // Create level text on bottom left
    this.levelText = this.add.text(50, 550, `Level: ${this.currentLevelIndex + 1}`, {
        fontSize: '32px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    });
    this.levelText.setOrigin(0, 1); // Align to bottom left
    this.levelText.setScrollFactor(0); // Keep fixed on screen
    this.levelText.setDepth(10); // Render above player and enemies
    this.levelText.setAlpha(0.7); // Make slightly transparent

          // Create fullscreen red overlay for hit effect (hidden by default)
          this.hitEffect = this.add.rectangle(0, 0, 800, 600, 0xff0000, 0.7);
          this.hitEffect.setOrigin(0, 0);
          this.hitEffect.setDepth(100); // Ensure it's on top
          this.hitEffect.setVisible(false);

           // Check win condition in case there are initially no enemies
           this.checkWinCondition();
           
             // Start background music only on the first level (level index 0)
             if (this.currentLevelIndex === 0 && (!this.backgroundMusic || !this.backgroundMusic.isPlaying)) {
                 this.backgroundMusic = this.sound.add('darksichord', {
                     loop: true,
                     volume: 0.5
                 });
                 this.backgroundMusic.play();
             }
            
            // Enable attacking now that the game is initialized
            this.isGameStarted = true;
     }

        checkWinCondition() {
            // Check if all enemies are defeated
            const livingEnemies = this.enemies.children.entries.filter(enemy => !enemy.destroyed);
            if (livingEnemies.length === 0) {
                // Check if there are more levels
                if (this.currentLevelIndex < this.levels.length - 1) {
                    // Advance to next level
                    this.currentLevelIndex++;
                    this.initializeLevel();
                } else {
                    // All levels completed, win the game
                    this.winGame();
                }
            }
        }

     handleFireballHit(player, fireball) {
         if (this.gameIsOver || fireball.destroyed) {
             return;
         }

         // Check if player is currently invulnerable to damage
         if (this.playerLastHitTime && this.time.now - this.playerLastHitTime < 1000) {
             // Player is invulnerable, destroy fireball but don't take damage
             fireball.destroy();
             return;
         }

         // Set player invulnerability timer
         this.playerLastHitTime = this.time.now;

         // Create orange fireball particles
         this.createFireballParticles(player.x, player.y);

         // Create blood particles
         this.createBloodParticles(player.x, player.y, entityTypes.PLAYER);

        // Reduce player health
        player.health -= 1;

          // Update health bar display (only update the health value sprite)
          if (this.healthValueBar) {
              // Frame mapping: 6 health -> frame 1, 5 health -> frame 2, ... 0 health -> frame 7
              const healthFrame = Math.min(7, Math.max(1, 7 - player.health));
              this.healthValueBar.setFrame(healthFrame);
          }

          // Create blood particles at health bar
          this.createHealthBarBloodParticles();

         // Visual feedback - flash player red and set transparency
        player.setTint(0xff0000);
        player.alpha = 0.7; // Make player semi-transparent

        // Show fullscreen red effect for 10ms
        this.hitEffect.setVisible(true);
        this.time.delayedCall(10, () => {
            if (this.hitEffect) {
                this.hitEffect.setVisible(false);
            }
        });

        // Gradually restore alpha over the invulnerability period
        this.time.delayedCall(1000, () => {
            if (player && !player.destroyed) {
                player.alpha = 1;
            }
        });

        this.time.delayedCall(200, () => {
            if (player && !player.destroyed) {
                player.clearTint();
            }
        });

        // Destroy the fireball
        fireball.destroy();

         // Check for game over
         if (player.health <= 0) {
             player.alpha = 1;
             this.gameOver();
         }
     }

     winGame() {
    if(this.gameIsOver){
      return;
    }
          this.gameIsOver = true;
          
          // Stop background music
          if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
              this.backgroundMusic.stop();
              this.backgroundMusic = null;
          }
          
          // Display win text
         let winMessage = 'YOU WIN!';
         if (this.currentLevelIndex < this.levels.length - 1) {
             winMessage = `LEVEL ${this.levels[this.currentLevelIndex].level} COMPLETE!`;
         }

        this.resultText = this.add.text(400, 250, winMessage, {
            fontSize: '64px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 6
        });
        this.resultText.setOrigin(0.5);
        this.resultText.setDepth(10);

        // Create Play Again button
        this.playAgainButton = this.add.text(400, 350, 'Play Again', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#c19a6b',
            padding: {
                left: 20,
                right: 20,
                top: 10,
                bottom: 10
            }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Function to restart the game
        const restartGame = () => {
            // Hide the elements immediately
            if (this.resultText) {
                this.resultText.setVisible(false);
            }
            if (this.playAgainButton) {
                this.playAgainButton.setVisible(false);
            }

            // Remove the space key listener if it exists
            if (this.spaceKeyListener) {
                this.spaceKeyListener.removeAllListeners();
                this.spaceKeyListener.destroy();
                this.spaceKeyListener = null;
            }
             this.player.health = 6;
             this.isGameStarted = false;

             // Stop and clear any lingering music before restart
             if (this.backgroundMusic) {
                 this.backgroundMusic.stop();
                 this.backgroundMusic = null;
             }

             // Use a delayed call to ensure the event handler completes before reinitializing
             this.time.delayedCall(10, () => {
                 this.currentLevelIndex = 0; // Reset to first level
                 this.initializeLevel();
             });
        };

        this.playAgainButton.on('pointerdown', restartGame);

        // Add keyboard listener for space key to restart the game
        this.spaceKeyListener = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKeyListener.on('down', restartGame);

        // Stop player movement
        if (this.player && this.player.body) {
            this.player.body.setVelocity(0, 0);
        }

          // Stop all enemies (in case any are still alive) and destroy them
          const enemiesToDestroy = [...this.enemies.children.entries]; // Create a copy to avoid iteration issues
          enemiesToDestroy.forEach(enemy => {
              if (!enemy.destroyed) {
                  // Clear any pending behavior timers
                  if (enemy.behaviorTimer) {
                      enemy.behaviorTimer.remove(false);
                  }
                   // Clear wizard attack timer if it exists
                   if (enemy.attackTimer) {
                       enemy.attackTimer.remove(false);
                   }
                   // Complete any fade tweens immediately
                   if (enemy.fadeTween) {
                       enemy.fadeTween.complete();
                       enemy.fadeTween = null;
                   }
                   // Remove all animation listeners (use enemy type to get correct animation keys)
                   const typePrefix = enemy.type ? enemy.type.toLowerCase() : 'orc';
                   enemy.off(`animationcomplete-${typePrefix}_die`);
                   enemy.off(`animationcomplete-${typePrefix}_attack`);
                   // Stop any current animations
                   if (enemy.anims) {
                       enemy.anims.stop();
                   }
                   // Reset alpha in case it was modified by a tween
                   enemy.alpha = 1;
                   // Destroy the enemy
                   enemy.destroy();
               }
           });
           // Clear the enemies group
           this.enemies.clear();
    }

    create() {
        // Set up pause key
        this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escapeKey.on('down', () => this.togglePause());

        // Create a 20x20 grid of random dungeon tiles
        const tileSize = 16; // Each tile is 16x16
        const gridWidth = 20;
        const gridHeight = 20;
        const scaleX = 800 / (gridWidth * tileSize); // Scale to fit the game width
        const scaleY = 600 / (gridHeight * tileSize); // Scale to fit the game height
        const scale = Math.max(scaleX, scaleY); // Use the larger scale to fill the screen

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                // Pick a random frame from the 1x1 to 4x4 area (frames 0-15)
                const randomFrame = Phaser.Math.Between(6, 9);
                const tile = this.add.sprite(x * tileSize * scale, y * tileSize * scale, 'dungeon', randomFrame);
                tile.setScale(scale);
                tile.setOrigin(0, 0); // Position from top-left corner
                tile.setDepth(-10); // Render tiles under everything
            }
        }

        // Create game objects here
        // Create standing animation (frames 0-5 from the top row)
        this.anims.create({
            key: 'stand',
            frames: this.anims.generateFrameNumbers('soldier', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        // Create walking animation (frames 10-16 from the second row)
        this.anims.create({
            key: 'walk',
            frames: [
                { key: 'soldier', frame: 10 },
                { key: 'soldier', frame: 11 },
                { key: 'soldier', frame: 12 },
                { key: 'soldier', frame: 13 },
                { key: 'soldier', frame: 14 },
                { key: 'soldier', frame: 15 },
                { key: 'soldier', frame: 16 }
            ],
            frameRate: 10,
            repeat: -1
        });

        // Create sword swing animation (frames 18-23)
        this.anims.create({
            key: 'sword',
            frames: [
                { key: 'soldier', frame: 18 },
                { key: 'soldier', frame: 19 },
                { key: 'soldier', frame: 20 },
                { key: 'soldier', frame: 21 },
                { key: 'soldier', frame: 22 },
                { key: 'soldier', frame: 23 }
            ],
            frameRate: 10,
            repeat: 0
        });

         // Create ORC animations using orc spritesheet
         this.anims.create({
             key: 'orc_stand',
             frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 5 }),
             frameRate: 10,
             repeat: -1
         });

         this.anims.create({
             key: 'orc_walk',
             frames: [
                 { key: 'orc', frame: 10 },
                 { key: 'orc', frame: 11 },
                 { key: 'orc', frame: 12 },
                 { key: 'orc', frame: 13 },
                 { key: 'orc', frame: 14 },
                 { key: 'orc', frame: 15 },
                 { key: 'orc', frame: 16 }
             ],
             frameRate: 10,
             repeat: -1
         });

         this.anims.create({
             key: 'orc_die',
             frames: [
                 { key: 'orc', frame: 40 },
                 { key: 'orc', frame: 41 },
                 { key: 'orc', frame: 42 },
                 { key: 'orc', frame: 43 }
             ],
             frameRate: 10,
             repeat: 0
         });

         this.anims.create({
             key: 'orc_attack',
             frames: [
                 { key: 'orc', frame: 24 },
                 { key: 'orc', frame: 25 },
                 { key: 'orc', frame: 26 },
                 { key: 'orc', frame: 27 },
                 { key: 'orc', frame: 28 },
                 { key: 'orc', frame: 29 }
             ],
             frameRate: 10,
             repeat: 0
         });

         // Create WIZARD animations using wizard spritesheet
         this.anims.create({
             key: 'wizard_stand',
             frames: this.anims.generateFrameNumbers('wizard', { start: 0, end: 5 }),
             frameRate: 10,
             repeat: -1
         });

         this.anims.create({
             key: 'wizard_walk',
             frames: [
                 { key: 'wizard', frame: 15 },
                 { key: 'wizard', frame: 16 },
                 { key: 'wizard', frame: 17 },
                 { key: 'wizard', frame: 18 },
                 { key: 'wizard', frame: 19 },
                 { key: 'wizard', frame: 20 },
                 { key: 'wizard', frame: 21 }
             ],
             frameRate: 10,
             repeat: -1
         });

         this.anims.create({
             key: 'wizard_die',
             frames: [
                 { key: 'wizard', frame: 135 },
                 { key: 'wizard', frame: 136 },
                 { key: 'wizard', frame: 137 },
                 { key: 'wizard', frame: 138 }
             ],
             frameRate: 10,
             repeat: 0
         });

          this.anims.create({
              key: 'wizard_attack',
              frames: [
                  { key: 'wizard', frame: 75 },
                  { key: 'wizard', frame: 76 },
                  { key: 'wizard', frame: 77},
                  { key: 'wizard', frame: 78 },
                  { key: 'wizard', frame: 79 },
                  { key: 'wizard', frame: 80 },
                  { key: 'wizard', frame: 81 },
                  { key: 'wizard', frame: 82 },
                  { key: 'wizard', frame: 83},
                  { key: 'wizard', frame: 84 },
                  { key: 'wizard', frame: 85 },
                  { key: 'wizard', frame: 86 }
              ],
               frameRate: 10,
              repeat: 0
          });

          this.anims.create({
               key: 'wizard_fireball',
               frames: [
                   { key: 'wizard', frame: 105 },
                   { key: 'wizard', frame: 106 },
                   { key: 'wizard', frame: 107 },
                   { key: 'wizard', frame: 108 },
                   { key: 'wizard', frame: 109 }
               ],
               frameRate: 10,
               repeat: -1
           });

         // WEREWOLF animations
         this.anims.create({
             key: 'werewolf_stand',
             frames: this.anims.generateFrameNumbers('werewolf', { start: 0, end: 5 }),
             frameRate: 10,
             repeat: -1
         });

         this.anims.create({
             key: 'werewolf_walk',
             frames: this.anims.generateFrameNumbers('werewolf', { start: 13, end: 20 }),
             frameRate: 10,
             repeat: -1
         });

         this.anims.create({
             key: 'werewolf_attack',
             frames: this.anims.generateFrameNumbers('werewolf', { start: 26, end: 34 }),
             frameRate: 10,
             repeat: 0
          });

          this.anims.create({
              key: 'werewolf_die',
              frames: this.anims.generateFrameNumbers('werewolf', { start: 65, end: 69 }),
              frameRate: 10,
              repeat: 0
          });

          this.anims.create({
              key: 'armoredorc_stand',
              frames: this.anims.generateFrameNumbers('armoredorc', { start: 0, end: 5 }),
              frameRate: 10,
              repeat: -1
          });

          this.anims.create({
              key: 'armoredorc_walk',
              frames: this.anims.generateFrameNumbers('armoredorc', { start: 9, end: 16 }),
              frameRate: 10,
              repeat: -1
          });

          this.anims.create({
              key: 'armoredorc_attack',
              frames: this.anims.generateFrameNumbers('armoredorc', { start: 18, end: 24 }),
              frameRate: 10,
              repeat: 0
          });

          this.anims.create({
              key: 'armoredorc_die',
              frames: this.anims.generateFrameNumbers('armoredorc', { start: 63, end: 66 }),
              frameRate: 10,
              repeat: 0
          });

          this.anims.create({
              key: 'player_die',
              frames: [

                 { key: 'soldier', frame: 54 },
                 { key: 'soldier', frame: 55 },
                 { key: 'soldier', frame: 56 },
                 { key: 'soldier', frame: 57 }
             ],
             frameRate: 2,
             repeat: 0
         });

         // Create a sprite from the soldier spritesheet
         // Use frame 0 (the first 100x100px from top-left)
         this.player = this.add.sprite(400, 300, 'soldier', 0);
         this.player.setScale(3);
         this.player.setDepth(0); // Player renders under orks
         this.player.health = 6;

         this.physics.add.existing(this.player);
         this.player.body.setCollideWorldBounds(true);
         this.player.body.setSize(20.4, 19.95, true);
         this.player.body.setOffset(40, 38);

         // Add input controls
          this.cursors = this.input.keyboard.createCursorKeys();
          this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
          this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
          this.isGameStarted = true; // Track if game has started, set to false after level completion

        // Initialize the game state using our idempotent method
        this.initializeLevel();
    }

     togglePause() {
         if (this.gameIsOver) return;

         this.isPaused = !this.isPaused;

         if (this.isPaused) {
             // Pause physics
             this.physics.pause();

             // Stop player and all enemies
             if (this.player && this.player.body) {
                 this.player.body.setVelocity(0, 0);
             }
             this.enemies.children.entries.forEach(enemy => {
                 if (!enemy.destroyed && enemy.body) {
                     enemy.body.setVelocity(0, 0);
                 }
             });

             // Pause background music
             if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
                 this.backgroundMusic.pause();
             }

             // Create pause overlay
             this.pauseOverlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.6);
             this.pauseOverlay.setOrigin(0, 0);
             this.pauseOverlay.setDepth(300);
             this.pauseOverlay.setScrollFactor(0);

             // Create pause text (reserved for menu)
             this.pauseText = this.add.text(400, 300, 'PAUSED', {
                 fontSize: '64px',
                 fill: '#ffffff',
                 stroke: '#000000',
                 strokeThickness: 6
             });
             this.pauseText.setOrigin(0.5);
             this.pauseText.setDepth(310);
             this.pauseText.setScrollFactor(0);
         } else {
             // Resume physics
             this.physics.resume();

              // Resume background music
              if (this.backgroundMusic && this.backgroundMusic.isPaused) {
                  this.backgroundMusic.resume();
              }

             // Remove pause overlay and text
             if (this.pauseOverlay) {
                 this.pauseOverlay.destroy();
                 this.pauseOverlay = null;
             }
             if (this.pauseText) {
                 this.pauseText.destroy();
                 this.pauseText = null;
             }
         }
     }

    spawnEnemy(type = enemyTypes.ORC) {
        // Create an enemy at a random position, maintaining minimum distance from player
        const MIN_SPAWN_DISTANCE = 200; // Minimum distance from player
        let randomX, randomY, distanceFromPlayer;

        // Keep generating random positions until we find one far enough from the player
        do {
            randomX = Phaser.Math.Between(50, 750);
            randomY = Phaser.Math.Between(50, 550);
            distanceFromPlayer = Phaser.Math.Distance.Between(
                randomX, randomY,
                this.player.x, this.player.y
            );
        } while (distanceFromPlayer < MIN_SPAWN_DISTANCE);

         // Get configuration for this enemy type
         const config = enemyConfigs[type];
         const enemy = this.add.sprite(randomX, randomY, config.assetKey, 0);
         enemy.setScale(3);
         enemy.setDepth(5); // Enemies render on top of player by default
         enemy.setRotation(0); // Ensure rotation is reset to normal
         enemy.type = type; // Store the enemy type for later reference

         // Play the appropriate stand animation based on enemy type
         enemy.play(`${type.toLowerCase()}_stand`);

          this.physics.add.existing(enemy);
          enemy.body.setCollideWorldBounds(false);
          enemy.body.setSize(20.4, 19.95, true);
          enemy.body.setOffset(40, 38);

         // Initialize enemy-specific properties
           enemy.isMoving = false;
           enemy.direction = { x: 0, y: 0 };
           enemy.lastEdgeHitTime = 0;
           enemy.lastHorizontalDirection = 'right';
           enemy.isDead = false;
           enemy.isAxeSwinging = false; // Track if enemy is currently attacking
            enemy.hasRecentlyAttacked = false;
            enemy.isAttacking = false; // Track if wizard is currently attacking
            enemy.health = config.health; // Initialize health from config
            enemy.lastHitTime = 0; // Track when enemy was last hit by player
          
          // Werewolf-specific properties
          if (type === enemyTypes.WEREWOLF) {
              enemy.hasDetectedPlayer = false;  // Track if player has been spotted
              enemy.huntSpeed = this.WEREWOLF_PATROL_SPEED; // Current movement speed
          }

         // Add enemy to group
         this.enemies.add(enemy);

         // Start the enemy behavior cycle
         this.scheduleEnemyBehaviorChange(enemy);

         // If this is a wizard, schedule fireball attacks
          if (type === enemyTypes.WIZARD) {
              enemy.lastAlignedAttackTime = 0;  // Track cooldown for direct attacks
              enemy.alignmentCheckTime = 0;    // Track last alignment check time
              this.scheduleWizardAttack(enemy);
          }

     }


     spawnFireball(wizard) {
       
         // Determine direction based on wizard's facing
         const direction = wizard.flipX ? -1 : 1;
         const FIREBALL_OFFSET = 100;
         
         // Create a fireball offset in front of the wizard based on facing direction
         const fireballX = wizard.x + (direction * FIREBALL_OFFSET);
         const fireball = this.add.sprite(fireballX, wizard.y, 'wizard', 105);
         fireball.setScale(2);
         fireball.setDepth(2); // Render above player but below most enemies
         fireball.flipX = wizard.flipX; // Mirror fireball animation direction with wizard
         fireball.play('wizard_fireball');

        // Add physics to fireball
        this.physics.add.existing(fireball);
        fireball.body.setSize(15, 15, true);
        fireball.body.setOffset(44, 44);

        // Set velocity based on direction
        fireball.body.setVelocity(direction * 300, 0);

        // Add to fireballs group
        this.fireballs.add(fireball);

        // Destroy fireball after 5 seconds (in case it goes off screen)
        this.time.delayedCall(5000, () => {
            if (fireball && !fireball.destroyed) {
                fireball.destroy();
            }
        });
        
     }

     checkAndExecuteAlignedAttack(wizard) {
         if (wizard.isDead) return;
         
         // Check horizontal alignment with moderate tolerance (±50px)
         const yDifference = Math.abs(wizard.y - this.player.y);
         const HORIZONTAL_TOLERANCE = 50; // pixels
         
         if (yDifference < HORIZONTAL_TOLERANCE) {
             // Player is horizontally aligned!
             
             // Check if enough time has passed since last aligned attack (500ms cooldown)
             if (this.time.now - wizard.lastAlignedAttackTime >= 500) {
                 // Make wizard face toward player
                 const playerIsToTheLeft = this.player.x < wizard.x;
                 wizard.flipX = playerIsToTheLeft;
                 
                 // Cancel current scheduled attack timer to interrupt pattern
                 if (wizard.attackTimer) {
                     wizard.attackTimer.remove();
                     wizard.attackTimer = null;
                 }
                 
                 // Trigger immediate attack
                 if (!wizard.isAttacking) {
                     wizard.isAttacking = true;
                     wizard.facingLocked = true; // Lock facing direction during attack
                     wizard.play('wizard_attack');
                     wizard.lastAlignedAttackTime = this.time.now; // Set cooldown
                     
                     // Spawn fireball at 80% through animation (960ms)
                     this.time.delayedCall(960, () => {
                         if (!wizard.destroyed && !wizard.isDead) {
                             this.spawnFireball(wizard);
                         }
                     });
                     
                     // Clear attacking flag when animation completes
                     wizard.once('animationcomplete-wizard_attack', () => {
                         wizard.isAttacking = false;
                         wizard.facingLocked = false; // Unlock facing direction after attack
                         // Reschedule random attacks after aligned attack completes
                         this.scheduleWizardAttack(wizard);
                     });
                 }
             }
         }
     }

     scheduleWizardAttack(wizard) {

      
        // Only schedule attacks if wizard is not dead
        if (!wizard.isDead) {
            // Schedule next attack with randomized interval 
            const attackInterval = Phaser.Math.Between(1500, 3000);

            wizard.attackTimer = this.time.delayedCall(attackInterval, () => {
                if (!wizard.destroyed && !wizard.isDead) {
                    // Set attacking flag to prevent stand animation from overriding
                    wizard.isAttacking = true;

                    // Play attack animation
                    wizard.play('wizard_attack');

                    // Calculate when to spawn fireball (% through the animation)
                    // wizard_attack: 12 frames at frameRate 10 = 1200ms total duration
                    const fireballSpawnTime = 1200 * 0.8;

                    // Schedule fireball spawn at 75% through animation
                    this.time.delayedCall(fireballSpawnTime, () => {
                        if (!wizard.destroyed && !wizard.isDead) {
                            this.spawnFireball(wizard);
                        }
                    });

                    // Listen for animation complete event to clear attacking flag
                    wizard.once('animationcomplete-wizard_attack', () => {
                        wizard.isAttacking = false;
                    });

                    // Schedule next attack
                    this.scheduleWizardAttack(wizard);
                }
            });
        }
        
    }

     update() {
        if (this.gameIsOver || this.isPaused){
           return;
        }
           // Update game logic here
          let isMoving = false;
         let movingRight = false;
          let movingLeft = false;
          let movingVertical = false;

          // Check if dash is still active
          const isDashActive = this.time.now < this.dashEndTime;
          const dashSpeedMultiplier = isDashActive ? 3.5 : 1; // 3.5x speed while dashing

          // Emit particles continuously during dash (every 50ms)
          if (isDashActive && this.lastDashParticleTime > 0) {
              if (this.time.now - this.lastDashParticleTime >= 50) {
                  this.emitDashParticles(this.player.x, this.player.y, this.lastDashDirection);
                  this.lastDashParticleTime = this.time.now;
              }
          }

          if (this.cursors.left.isDown) {
              this.player.body.setVelocityX(-160 * dashSpeedMultiplier);
              isMoving = true;
              movingLeft = true;
              this.lastHorizontalDirection = 'left';
          } else if (this.cursors.right.isDown) {
              this.player.body.setVelocityX(160 * dashSpeedMultiplier);
              isMoving = true;
              movingRight = true;
              this.lastHorizontalDirection = 'right';
          } else {
              this.player.body.setVelocityX(0);
          }

          if (this.cursors.up.isDown) {
              this.player.body.setVelocityY(-160 * dashSpeedMultiplier);
              isMoving = true;
              movingVertical = true;

         } else if (this.cursors.down.isDown) {
             this.player.body.setVelocityY(160 * dashSpeedMultiplier);
             isMoving = true;
             movingVertical = true;
         } else {
             this.player.body.setVelocityY(0);
         }

          // Handle X key for dash
          if (Phaser.Input.Keyboard.JustDown(this.xKey)) {
              // Check if enough time has passed since last dash (0.5 second cooldown)
              if (this.time.now - this.lastDashTime >= 500) {
                  // Start dash for 150ms
                  this.dashEndTime = this.time.now + 150;
                  this.lastDashTime = this.time.now;
                  this.startDashEffect();
              }
          }


          // Handle space bar for sword swing
        if (Phaser.Input.Keyboard.JustDown(this.spaceBar) && this.time.now - this.lastAttackTime >= 700 && this.isGameStarted) {
             this.lastAttackTime = this.time.now;
             this.player.play('sword');
             this.isPlayerSwinging = true;

             // Set up callback to revert animation after sword swing completes
             this.player.once('animationcomplete-sword', () => {
                 this.isPlayerSwinging = false;
                 // Resume normal animations
                 if (isMoving) {
                     this.player.play('walk');
                 } else {
                     this.player.play('stand');
                 }
             });
         }

        // Only update animations if not currently playing sword animation
        if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'sword') {
            // Determine animation direction based on current or last horizontal input
            let shouldFaceLeft = false;
            if (movingLeft) {
                shouldFaceLeft = true;
            } else if (movingRight) {
                shouldFaceLeft = false;
            } else if (movingVertical) {
                // Use last horizontal direction for vertical movement
                shouldFaceLeft = this.lastHorizontalDirection === 'left';
            } else {
                // When idle, use last horizontal direction
                shouldFaceLeft = this.lastHorizontalDirection === 'left';
            }

            // Apply flip based on direction
            this.player.setFlipX(shouldFaceLeft);

            // Play walking animation when moving
            if (isMoving) {
                if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'walk') {
                    this.player.play('walk');
                }
            } else {
                // Play standing animation when idle
                if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'stand') {
                    this.player.play('stand');
                }
            }
        }

         // Update all enemies
         this.enemies.children.entries.forEach(enemy => {
             if (enemy.destroyed) return;

              // Update enemy movement
              if (!enemy.isDead) {
                  if (enemy.isMoving) {
                      const speed = enemy.huntSpeed || 160; // Use werewolf hunt speed if available, default to 160
                      enemy.body.setVelocity(enemy.direction.x * speed, enemy.direction.y * speed);
                  } else {
                      enemy.body.setVelocity(0, 0);
                  }
              }

              // Update enemy animations and direction
              let enemyShouldFaceLeft = false;

              // Update horizontal direction based on movement
              if (enemy.direction.x > 0) {
                  // Moving right
                  enemyShouldFaceLeft = false;
                  enemy.lastHorizontalDirection = 'right';
              } else if (enemy.direction.x < 0) {
                  // Moving left
                  enemyShouldFaceLeft = true;
                  enemy.lastHorizontalDirection = 'left';
              } else if (enemy.direction.y !== 0) {
                  // Moving vertically only, use last horizontal direction
                  enemyShouldFaceLeft = enemy.lastHorizontalDirection === 'left';
              } else {
                  // Not moving, use last horizontal direction
                  enemyShouldFaceLeft = enemy.lastHorizontalDirection === 'left';
               }


                // Apply flip based on direction (unless facing is locked during attack animation)
                if (!enemy.facingLocked) {
                    enemy.setFlipX(enemyShouldFaceLeft);
                }

                   // Handle werewolf-specific movement logic
                   if (enemy.type === enemyTypes.WEREWOLF && !enemy.isDead && !enemy.isAxeSwinging) {
                       this.updateWerewolfMovement(enemy);
                   }

                   // Handle wizard-specific alignment attacks (every 200ms for balanced frequency)
                   if (enemy.type === enemyTypes.WIZARD && !enemy.isDead) {
                       if (this.time.now - enemy.alignmentCheckTime >= 200) {
                           this.checkAndExecuteAlignedAttack(enemy);
                           enemy.alignmentCheckTime = this.time.now;
                       }
                   }



                 // Play animations
                 if (!enemy.isDead && !enemy.isAxeSwinging) {


                   // Check if player is nearby (within 100 pixels) - but only for non-wizard enemies
                   const distanceToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

                   if (distanceToPlayer < 100 && enemy.type !== enemyTypes.WIZARD) {
                       // Player is nearby, play attack animation (but not for wizards)
                       const typePrefix = enemy.type.toLowerCase();
                       const attackAnimKey = `${typePrefix}_attack`;
                       if (!enemy.anims.isPlaying || enemy.anims.currentAnim.key !== attackAnimKey) {
                           enemy.play(attackAnimKey);
                           enemy.isAxeSwinging = true;

                           // Set up callback to revert animation after attack completes
                           enemy.once(`animationcomplete-${attackAnimKey}`, () => {
                               enemy.isAxeSwinging = false;
                               // Resume normal animations
                               if (enemy.isMoving) {
                                   enemy.play(`${typePrefix}_walk`);
                               } else {
                                   enemy.play(`${typePrefix}_stand`);
                               }
                           });
                       }
                   } else if (enemy.type !== enemyTypes.WIZARD && !enemy.isAttacking) {
                        // Player is not nearby, use normal animations (skip for attacking wizards)
                        const typePrefix = enemy.type.toLowerCase();
                        if (enemy.isMoving) {
                            const walkAnimKey = `${typePrefix}_walk`;
                            if (!enemy.anims.isPlaying || enemy.anims.currentAnim.key !== walkAnimKey) {
                                enemy.play(walkAnimKey);
                            }
                        } else {
                            const standAnimKey = `${typePrefix}_stand`;
                            if (!enemy.anims.isPlaying || enemy.anims.currentAnim.key !== standAnimKey) {
                                enemy.play(standAnimKey);
                            }
                        }
                    } else if (enemy.type === enemyTypes.WIZARD && !enemy.isAttacking) {
                        // Wizard not attacking, use normal animations
                        const typePrefix = enemy.type.toLowerCase();
                        if (enemy.isMoving) {
                            const walkAnimKey = `${typePrefix}_walk`;
                            if (!enemy.anims.isPlaying || enemy.anims.currentAnim.key !== walkAnimKey) {
                                enemy.play(walkAnimKey);
                            }
                        } else {
                            const standAnimKey = `${typePrefix}_stand`;
                            if (!enemy.anims.isPlaying || enemy.anims.currentAnim.key !== standAnimKey) {
                                enemy.play(standAnimKey);
                            }
                        }
                    }
              }

              // Check enemy collisions with screen edges and reverse direction
              const enemyWidth = enemy.body.width / 2;
              const enemyHeight = enemy.body.height / 2;
              const enemyBodyOffsetX = enemy.body.offset.x;
              const enemyBodyOffsetY = enemy.body.offset.y;
              const currentTime = this.time.now;
              const timeSinceLastEdgeHit = currentTime - enemy.lastEdgeHitTime;
              const SCREEN_BUFFER = 40; // 40 pixel buffer to keep enemies on screen

              // Only allow direction reversal if more than 50ms has passed since last edge hit
              if (timeSinceLastEdgeHit > 50) {
                  if (enemy.x + enemyBodyOffsetX - enemyWidth < SCREEN_BUFFER) {
                      // Hit left edge buffer, move right
                      enemy.direction.x = Math.abs(enemy.direction.x);
                      enemy.lastEdgeHitTime = currentTime;
                  } else if (enemy.x + enemyBodyOffsetX + enemyWidth > 800 - SCREEN_BUFFER) {
                      // Hit right edge buffer, move left
                      enemy.direction.x = -Math.abs(enemy.direction.x);
                      enemy.lastEdgeHitTime = currentTime;
                  }

                  if (enemy.y + enemyBodyOffsetY - enemyHeight < SCREEN_BUFFER) {
                      // Hit top edge buffer, move down
                      enemy.direction.y = Math.abs(enemy.direction.y);
                      enemy.lastEdgeHitTime = currentTime;
                  } else if (enemy.y + enemyBodyOffsetY + enemyHeight > 600 - SCREEN_BUFFER) {
                      // Hit bottom edge buffer, move up
                      enemy.direction.y = -Math.abs(enemy.direction.y);
                      enemy.lastEdgeHitTime = currentTime;
                  }
              }
         });

         // Update fireballs - remove ones that go off-screen
         this.fireballs.children.entries.forEach(fireball => {
             if (fireball.destroyed) return;

             // Check if fireball has gone off-screen
             if (fireball.x < -50 || fireball.x > 850 || fireball.y < -50 || fireball.y > 650) {
                 fireball.destroy();
             }
         });
     }

     createBloodParticles(x, y, entityType) {
         let bloodColor;
         switch (entityType) {
             case entityTypes.PLAYER:
                 bloodColor = 0xff0000;
                 break;
             case entityTypes.ENEMY:
                 bloodColor = 0x330000;
                 break;
             default:
                 bloodColor = 0xff0000;
         }

         const particleCount = Phaser.Math.Between(8, 12);
         for (let i = 0; i < particleCount; i++) {
             const particle = this.add.circle(x, y, 2, bloodColor, 1);
             particle.setDepth(15);
             
             const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
             const speed = Phaser.Math.Between(50, 125);
             const targetX = x + Math.cos(angle) * speed * 0.5;
             const targetY = y + Math.sin(angle) * speed * 0.5;
             
             this.tweens.add({
                 targets: particle,
                 x: targetX,
                 y: targetY,
                 alpha: 0,
                 radius: Phaser.Math.Between(4, 8),
                 duration: 500,
                 ease: 'Quad.out',
                 onComplete: () => {
                     particle.destroy();
                  }
              });
          }
      }

       startDashEffect() {
           // Calculate dash angle from current velocity
           const velocityX = this.player.body.velocity.x;
           const velocityY = this.player.body.velocity.y;
           
           // If moving, calculate angle from velocity; otherwise use last horizontal direction
           let dashAngle;
           if (Math.abs(velocityX) > 0 || Math.abs(velocityY) > 0) {
               dashAngle = Math.atan2(velocityY, velocityX);
           } else {
               // Fallback to last horizontal direction
               dashAngle = this.lastHorizontalDirection === 'left' ? Math.PI : 0;
           }

           // Store dash direction for particle emission
           this.lastDashDirection = dashAngle;

           // Apply white tint flash (50ms)
           this.player.setTint(0xffffff);
           this.tweens.add({
               targets: this.player,
               delay: 50,
               onComplete: () => {
                   this.player.clearTint();
               }
           });

           // Initialize particle emission tracking
           this.lastDashParticleTime = this.time.now;
       }


      endDashEffect() {
          // Clear any lingering tint
          this.player.clearTint();
          
          // Stop particle emission
          this.lastDashParticleTime = 0;
      }

     createFireballParticles(x, y) {
         const orangeColor = 0xff9500;
         const particleCount = Phaser.Math.Between(8, 12);
         
         for (let i = 0; i < particleCount; i++) {
             const particle = this.add.circle(x, y, 2, orangeColor, 1);
             particle.setDepth(15);
             
             const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
             const speed = Phaser.Math.Between(50, 125);
             const targetX = x + Math.cos(angle) * speed * 0.5;
             const targetY = y + Math.sin(angle) * speed * 0.5;
             
             this.tweens.add({
                 targets: particle,
                 x: targetX,
                 y: targetY,
                 alpha: 0,
                 radius: Phaser.Math.Between(4, 8),
                 duration: 500,
                 ease: 'Quad.out',
                 onComplete: () => {
                     particle.destroy();
                 }
             });
          }
      }

       createHealthBarBloodParticles() {
           const healthBarX = 680; // 70px to the left of original 750
           const healthBarY = 500;
           const healthBarWidth = 150;
           const color = 0xd90f1e;
           const count = 15;
           
           for (let i = 0; i < count; i++) {
               const initialX = Phaser.Math.Between(healthBarX - healthBarWidth / 2,healthBarX + healthBarWidth / 2)
               // Create particle at health bar
               const particle = this.add.circle(initialX, healthBarY, 3, color, 1);
               particle.setDepth(15);
               particle.alpha = 0.7;
               
               // Random upward cone angle (45° to 135° = π/4 to 3π/4)
               const angle = Phaser.Math.FloatBetween(Math.PI / 4, Math.PI * 3 / 4);
               const speed = Phaser.Math.Between(80, 150);
               
               // Stage 1: Upward motion (250ms)
               const midX = initialX + Math.cos(angle) * speed * 0.3;
               const midY = healthBarY - Math.sin(angle) * speed * 0.3; // negative for upward
               
                // Stage 2: Fall motion (250ms)
                const finalX = midX + Math.cos(angle) * speed * 0.4;
                const finalY = midY + 150; // fall downward off-screen
                const finalSize = Phaser.Math.Between(6, 10); // randomized final size
               
               // Stage 1: Rise upward
               this.tweens.add({
                   targets: particle,
                   x: midX,
                   y: midY,
                   duration: 250,
                   ease: 'Quad.out'
               });
               
               // Stage 2: Fall and fade
               this.tweens.add({
                   targets: particle,
                   x: finalX,
                   y: finalY,
                   alpha: 0,
                   radius: finalSize,
                   duration: 250,
                   delay: 250,
                   ease: 'Quad.out',
                   onComplete: () => particle.destroy()
               });
           }
       }

       createDashSpeedLines(playerX, playerY, dashAngle) {
           // Create 4-6 thin white lines radiating from player during dash
           const lineCount = 5;
           const lineLength = 50;
           const lineWidth = 1;
           const whiteColor = 0xffffff;

          for (let i = 0; i < lineCount; i++) {
              // Alternate between horizontal and vertical lines for star pattern
              const isHorizontal = i % 2 === 0;
              let line;

              if (isHorizontal) {
                  // Horizontal line
                  line = this.add.line(playerX, playerY, -lineLength, 0, lineLength, 0, whiteColor, 1);
              } else {
                  // Vertical line
                  line = this.add.line(playerX, playerY, 0, -lineLength, 0, lineLength, whiteColor, 1);
              }

              line.setDepth(5);
              line.setLineWidth(lineWidth);
              line.setOrigin(0.5, 0.5);

              // Rotate line based on dash angle for visual flow
              const angleOffset = (i / lineCount) * Math.PI;
              line.rotation = dashAngle + angleOffset;

              // Fade out over 150ms (matching dash duration)
              this.tweens.add({
                  targets: line,
                  alpha: 0,
                  duration: 150,
                  ease: 'Quad.out',
                  onComplete: () => {
                      line.destroy();
                  }
              });
          }
      }

      emitDashParticles(playerX, playerY, dashAngle) {
          // Emit 2-3 white particles backward from dash direction (opposite to velocity)
          const particleCount = Phaser.Math.Between(2, 3);
          const whiteColor = 0xffffff;
          const backwardAngle = dashAngle + Math.PI; // Opposite direction

          for (let i = 0; i < particleCount; i++) {
              const particle = this.add.circle(playerX, playerY, 2, whiteColor, 1);
              particle.setDepth(4); // Below player but above most other elements

              // Add slight randomness to spread particles
              const angleVariation = Phaser.Math.FloatBetween(-Math.PI / 6, Math.PI / 6);
              const emitAngle = backwardAngle + angleVariation;
              const speed = Phaser.Math.Between(60, 100);

              // Calculate target position (particles move backward)
              const distance = speed * 0.3;
              const targetX = playerX + Math.cos(emitAngle) * distance;
              const targetY = playerY + Math.sin(emitAngle) * distance;

              // Animate particles: move and fade out over 300ms
              this.tweens.add({
                  targets: particle,
                  x: targetX,
                  y: targetY,
                  alpha: 0,
                  duration: 300,
                  ease: 'Quad.out',
                  onComplete: () => {
                      particle.destroy();
                  }
              });
          }
      }

      updateWerewolfMovement(werewolf) {
          // Calculate distance to player
          const distanceToPlayer = Phaser.Math.Distance.Between(
              werewolf.x, werewolf.y,
              this.player.x, this.player.y
          );

          // Check if player is within detection range
          const playerDetected = distanceToPlayer < this.WEREWOLF_DETECTION_RANGE;

          if (playerDetected) {
              werewolf.hasDetectedPlayer = true;
          }

          if (werewolf.hasDetectedPlayer) {
              // HUNT MODE: Always move toward player relentlessly
              const angle = Math.atan2(
                  this.player.y - werewolf.y,
                  this.player.x - werewolf.x
              );
              werewolf.direction.x = Math.cos(angle);
              werewolf.direction.y = Math.sin(angle);
              werewolf.isMoving = true;
              werewolf.huntSpeed = this.WEREWOLF_HUNT_SPEED; // Faster when hunting
          } else {
              // PATROL MODE: Use normal random patrol behavior (like orcs)
              // This is handled by the existing scheduleEnemyBehaviorChange() method
              werewolf.huntSpeed = this.WEREWOLF_PATROL_SPEED; // Normal speed while patrolling
          }
      }

      scheduleEnemyBehaviorChange(enemy) {

          // Don't change behavior if enemy is swinging axe or dead
          if (!enemy.isAxeSwinging && !enemy.isDead) {
              // Toggle between moving and stationary
              enemy.isMoving = !enemy.isMoving;

              if (enemy.isMoving) {
                  // Pick a random direction (8 directions including diagonals)
                  const directions = [
                      { x: 0, y: -1 },  // up
                      { x: 1, y: -1 },  // up-right
                      { x: 1, y: 0 },   // right
                      { x: 1, y: 1 },   // down-right
                      { x: 0, y: 1 },   // down
                      { x: -1, y: 1 },  // down-left
                      { x: -1, y: 0 },  // left
                      { x: -1, y: -1 }  // up-left
                  ];
                  enemy.direction = Phaser.Utils.Array.GetRandom(directions);
              }
          }

          // Schedule next behavior change with randomized interval (2000-4000ms)
          // If enemy is swinging axe, check again sooner (500ms) to see if it's done
          const behaviorInterval = enemy.isAxeSwinging ? 500 : Phaser.Math.Between(2000, 4000);

          // Store timer reference on enemy for proper cleanup
          enemy.behaviorTimer = this.time.delayedCall(behaviorInterval, () => {
              if (!enemy.destroyed && !enemy.isDead) {
                  this.scheduleEnemyBehaviorChange(enemy);
              }
          });
      }

       handlePlayerEnemyCollision(player, enemy) {
         if (this.gameIsOver){
           return;
         }

            const enemyIsToTheLeft = enemy.x < player.x;
            // Only trigger if player is currently swinging sword and enemy is not already dead
            if (this.isPlayerSwinging && !enemy.isDead) {
                // Check if enemy was recently hit (within sword animation duration of 600ms)
                if (enemy.lastHitTime && this.time.now - enemy.lastHitTime < 600) {
                    // Enemy was already hit during this swing, don't hit again
                    return;
                }

                // Check if enemy is on the correct side based on player's facing direction
                const playerFacingLeft = player.flipX;

                // If player is facing left, only hit enemies to the left
                // If player is facing right, only hit enemies to the right
                 if ((playerFacingLeft && !enemyIsToTheLeft) || (!playerFacingLeft && enemyIsToTheLeft)) {
                     // Enemy is on the wrong side, don't hit it
                     return;
                 }

                 // Mark that enemy was just hit
                 enemy.lastHitTime = this.time.now;

                 // Create blood particles
                 this.createBloodParticles(enemy.x, enemy.y, entityTypes.ENEMY);

                  // Reduce enemy health by 1
                  enemy.health -= 1;

                  // Check if enemy is dead
                  if (enemy.health <= 0) {
                     // Mark enemy as dead
                     enemy.isDead = true;

                     // Lower enemy's depth so it renders under the player after death
                     enemy.setDepth(-1);

                     // Stop enemy movement
                     enemy.body.setVelocity(0, 0);

                     // Play death animation
                     const typePrefix = enemy.type.toLowerCase();
                     enemy.play(`${typePrefix}_die`);

                     // After death animation completes, start fade out
                     enemy.once(`animationcomplete-${typePrefix}_die`, () => {
                         // Stop animation so the last frame stays visible
                         enemy.stop();

                         // Create a tween to fade out over 2 seconds
                         enemy.fadeTween = this.tweens.add({
                             targets: enemy,
                             alpha: 0,
                             duration: 2000,
                             ease: 'Linear',
                             onComplete: () => {
                                 // Clean up the tween reference
                                if (enemy.fadeTween) {
                                    enemy.fadeTween = null;
                                }
                                enemy.destroy();
                                // Check if all enemies are defeated
                                 this.checkWinCondition();
                             }
                          });
                      });
                  } else {
                      // Enemy survived the hit - add damage feedback (red tint)
                     enemy.setTint(0xff0000);
                     enemy.alpha = 0.7;
                     this.time.delayedCall(100, () => {
                         if (enemy && !enemy.destroyed) {
                             enemy.clearTint();
                             enemy.alpha = 1;
                         }
                     });
                  }
            }
            else{
             // Only cause damage if enemy is not dead and not already swinging axe
             // Also skip damage for enemies that don't damage on touch (based on enemyConfig)
             const enemyConfig = enemyConfigs[enemy.type];
             if (!enemy.isDead && !enemy.hasRecentlyAttacked && enemyConfig.canDamageOnTouch) {
                // Check if player is currently invulnerable to damage
                if (this.playerLastHitTime && this.time.now - this.playerLastHitTime < 1000) {
                    // Player is invulnerable, don't take damage
                    return;
                }

                const enemyFacingLeft = enemy.flipX;
                // If enemy is facing left, only hit player to the left
                // If enemy is facing right, only hit player to the right
                if ((enemyFacingLeft && enemyIsToTheLeft) || (!enemyFacingLeft && !enemyIsToTheLeft)) {
                    // Enemy is on the wrong side, don't hit it
                    return;
                }
                    enemy.hasRecentlyAttacked = true;
                    this.time.delayedCall(500, () => {
                      enemy.hasRecentlyAttacked = false;
                    })

         // Set player invulnerability timer
         this.playerLastHitTime = this.time.now;

         // Create blood particles
         this.createBloodParticles(player.x, player.y, entityTypes.PLAYER);

          // Reduce player health
          player.health -= 1;

            // Update health bar display (only update the health value sprite)
            if (this.healthValueBar) {
                // Frame mapping: 6 health -> frame 1, 5 health -> frame 2, ... 0 health -> frame 7
                const healthFrame = Math.min(7, Math.max(1, 7 - player.health));
                this.healthValueBar.setFrame(healthFrame);
            }

            // Create blood particles at health bar
            this.createHealthBarBloodParticles();

                     // Update health display
                    if (this.healthText) {
                        this.healthText.setText('Health: ' + player.health);
                    }

                   // Visual feedback - flash player red and set transparency
                   player.setTint(0xff0000);
                   player.alpha = 0.7; // Make player semi-transparent

                   // Show fullscreen red effect for 10ms
                   this.hitEffect.setVisible(true);
                   this.time.delayedCall(10, () => {
                       if (this.hitEffect) {
                           this.hitEffect.setVisible(false);
                       }
                   });

                   // Gradually restore alpha over the invulnerability period
                   this.time.delayedCall(1000, () => {
                       if (player && !player.destroyed) {
                           player.alpha = 1;
                       }
                   });

                   this.time.delayedCall(200, () => {
                       if (player && !player.destroyed) {
                           player.clearTint();
                       }
                   });

          // Check for game over
          if (player.health <= 0) {
              player.alpha = 1;
              this.gameOver();
          }
           }

         }
       }

      gameOver() {
          if(this.gameIsOver){
              return;
          }
          this.gameIsOver = true;

          // Stop background music
          if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
              this.backgroundMusic.stop();
              this.backgroundMusic = null;
          }

          // Stop player movement
         if (this.player && this.player.body) {
             this.player.body.setVelocity(0, 0);
         }

         // Stop all enemies
         const enemiesToStop = [...this.enemies.children.entries];
         enemiesToStop.forEach(enemy => {
             if (!enemy.destroyed) {
                 if (enemy.body) {
                     enemy.body.setVelocity(0, 0);
                 }
             }
         });

        // Create black overlay for fade effect
        this.blackOverlay = this.add.rectangle(0, 0, 800, 600, 0x000000);
        this.blackOverlay.setOrigin(0, 0);
        this.blackOverlay.setAlpha(0);
        this.blackOverlay.setDepth(200);

        // Play player death animation
        this.player.play('player_die');

        // Fade screen to black over 2 seconds
        this.tweens.add({
            targets: this.blackOverlay,
            alpha: 0.5,
            duration: 2000,
            ease: 'Linear',
            onComplete: () => {
                // Stop the death animation
                this.player.stop();

                   // Clean up enemies
                   const enemiesToDestroy = [...this.enemies.children.entries];
                   enemiesToDestroy.forEach(enemy => {
                       if (!enemy.destroyed) {
                           if (enemy.behaviorTimer) {
                               enemy.behaviorTimer.remove(false);
                           }
                           if (enemy.attackTimer) {
                               enemy.attackTimer.remove(false);
                           }
                           if (enemy.fadeTween) {
                               enemy.fadeTween.complete();
                               enemy.fadeTween = null;
                           }
                           // Use enemy type to get correct animation keys
                           const typePrefix = enemy.type ? enemy.type.toLowerCase() : 'orc';
                           enemy.off(`animationcomplete-${typePrefix}_die`);
                           enemy.off(`animationcomplete-${typePrefix}_attack`);
                           if (enemy.anims) {
                               enemy.anims.stop();
                           }
                           enemy.alpha = 1;
                           enemy.destroy();
                       }
                   });
                   this.enemies.clear();

                // Display game over text
                this.resultText = this.add.text(400, 250, 'GAME OVER', {
                    fontSize: '64px',
                    fill: '#ff0000',
                    stroke: '#000000',
                    strokeThickness: 6
                });
                this.resultText.setOrigin(0.5);
                this.resultText.setDepth(210);

                // Create Play Again button
                this.playAgainButton = this.add.text(400, 350, 'Play Again', {
                    fontSize: '32px',
                    fill: '#ffffff',
                    backgroundColor: '#c19a6b',
                    padding: {
                        left: 20,
                        right: 20,
                        top: 10,
                        bottom: 10
                    }
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                this.playAgainButton.setDepth(210);

                 // Function to restart the game
                const restartGame = () => {
                     if (this.spaceKeyListener) {
                         this.spaceKeyListener.removeAllListeners();
                         this.spaceKeyListener.destroy();
                         this.spaceKeyListener = null;
                     }
                     if (this.blackOverlay) {
                         this.blackOverlay.destroy();
                         this.blackOverlay = null;
                     }
    this.player.health = 6;
                     this.isGameStarted = false;
                     this.time.delayedCall(10, () => {
                         this.currentLevelIndex = 0;
                         this.initializeLevel();
                     });
                 };

                this.playAgainButton.on('pointerdown', restartGame);

                // Add keyboard listener for space key to restart the game
                this.spaceKeyListener = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
                this.spaceKeyListener.on('down', restartGame);
            }
        });
    }
}

export default MainScene;
