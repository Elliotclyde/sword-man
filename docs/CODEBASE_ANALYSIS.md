# Phaser.js Game Codebase Analysis

## Overview

This is a dungeon-crawler game built with Phaser.js featuring a player character (soldier) that fights various enemy types. The entire game logic is contained in `/Users/hughhaworth/dev/phaser-project/scenes/MainScene.js` (5,069 lines).

---

## 1. PROJECTILES/ENTITIES IMPLEMENTATION

### Wizard Fireballs (Primary Projectile Example)

**Creation Method: `spawnFireball()` (Lines 3233-3267)**

```javascript
spawnFireball(wizard) {
    // Determine direction based on wizard's facing
    const direction = wizard.flipX ? -1 : 1;
    const FIREBALL_OFFSET = 100;

    // Create a fireball offset in front of the wizard based on facing direction
    const fireballX = wizard.x + direction * FIREBALL_OFFSET;
    const fireball = this.add.sprite(fireballX, wizard.y, "wizard", 105);
    fireball.setScale(2);
    fireball.setDepth(2); // Render above player but below most enemies
    fireball.flipX = wizard.flipX; // Mirror fireball animation direction with wizard
    fireball.play("wizard_fireball");

    // Add physics to fireball
    this.physics.add.existing(fireball);
    fireball.body.setSize(15, 15, true);
    fireball.body.setOffset(44, 44);

    // Set velocity based on direction
    fireball.body.setVelocity(direction * 300, 0);

    // Add to fireballs group
    this.fireballs.add(fireball);

    // Destroy fireball after 5 seconds (in case it goes off screen)
    const fireballTimer = this.time.delayedCall(5000, () => {
        if (fireball && !fireball.destroyed) {
            fireball.destroy();
        }
    });
    // Track this timer for cleanup during level initialization
    if (this.pendingFireballTimers) {
        this.pendingFireballTimers.push(fireballTimer);
    }
}
```

**Key Characteristics:**

- **Source Offset**: Spawned 100px in front of wizard based on facing direction
- **Physics**: 15x15 collision box with offset (44, 44)
- **Velocity**: 300px/s in spawning direction (horizontal only)
- **Animation**: Looping "wizard_fireball" animation
- **Lifecycle**: Destroyed after 5 seconds timeout OR on collision with player
- **Group Management**: Added to `this.fireballs` group for bulk management
- **Depth**: 2 (renders above player at depth 5, below most enemies at depth 5)

**Fireball Animation Definition: (Lines 2034-2045)**

```javascript
this.anims.create({
  key: "wizard_fireball",
  frames: [
    { key: "wizard", frame: 105 },
    { key: "wizard", frame: 106 },
    { key: "wizard", frame: 107 },
    { key: "wizard", frame: 108 },
    { key: "wizard", frame: 109 },
  ],
  frameRate: 10,
  repeat: -1, // Loop infinitely until destroyed
});
```

**Entity Type Tracking:**

```javascript
const entityTypes = {
  PLAYER: "PLAYER",
  ENEMY: "ENEMY",
  WIZARD_FIREBALL: "WIZARD_FIREBALL",
};
```

---

## 2. ANIMATION SYSTEM

### Animation Management Pattern

**All Animations Created in `create()` Method (Lines 1841-2200+)**

#### Player Animations:

```javascript
// Standing animation (looping)
this.anims.create({
    key: "stand",
    frames: this.anims.generateFrameNumbers("soldier", { start: 0, end: 5 }),
    frameRate: 10,
    repeat: -1,
});

// Walking animation (looping)
this.anims.create({
    key: "walk",
    frames: [
        { key: "soldier", frame: 10 }, ...
    ],
    frameRate: 10,
    repeat: -1,
});

// Sword swing (non-repeating, fires completion event)
this.anims.create({
    key: "sword",
    frames: [
        { key: "soldier", frame: 18 }, ...
        { key: "soldier", frame: 23 },
    ],
    frameRate: 10,
    repeat: 0,  // Play once only
});
```

#### Enemy Animations Pattern:

Each enemy type has 4 animation categories:

1. **Stand** - Looping idle animation
2. **Walk** - Looping movement animation
3. **Attack** - Non-repeating attack animation
4. **Die** - Non-repeating death animation

**Example - Orc Animations:**

```javascript
// Stand animation (looping)
this.anims.create({
    key: "orc_stand",
    frames: this.anims.generateFrameNumbers("orc", { start: 0, end: 5 }),
    frameRate: 10,
    repeat: -1,
});

// Walk animation (looping)
this.anims.create({
    key: "orc_walk",
    frames: [...],
    frameRate: 10,
    repeat: -1,
});

// Attack animation (plays once)
this.anims.create({
    key: "orc_attack",
    frames: [...],
    frameRate: 10,
    repeat: 0,  // Single play
});

// Death animation (plays once)
this.anims.create({
    key: "orc_die",
    frames: [...],
    frameRate: 10,
    repeat: 0,  // Single play
});
```

### Animation Lifecycle Patterns

**Animation Completion Listener Pattern:**

```javascript
// One-time listener (fires once then auto-removes)
enemy.once(`animationcomplete-${typePrefix}_die`, () => {
  // Handle completion
  enemy.stop();
  // Schedule next action
});

// Playing animations
enemy.play("orc_attack");

// Stopping/checking animations
if (enemy.anims.isPlaying) {
  const currentAnimKey = enemy.anims.currentAnim.key;
}
```

**Animation State Management:**

- All animations are created once in `create()` and reused
- Frame rate is consistently 10 fps for all animations
- Looping animations use `repeat: -1`
- One-time animations use `repeat: 0`

---

## 3. COLLISION DAMAGE SYSTEM

### Fireball Collision Handler (Lines 1493-1568)

```javascript
handleFireballHit(player, fireball) {
    if (this.gameIsOver || fireball.destroyed) {
        return;
    }

    // Check if player is currently invulnerable to damage
    if (
        this.playerLastHitTime &&
        this.time.now - this.playerLastHitTime < 1000
    ) {
        // Player is invulnerable, destroy fireball but don't take damage
        fireball.destroy();
        return;
    }

    // Set player invulnerability timer (1000ms / 1 second cooldown)
    this.playerLastHitTime = this.time.now;

    // Create orange fireball particles (visual feedback)
    this.createFireballParticles(player.x, player.y);

    // Create blood particles (visual feedback)
    this.createBloodParticles(player.x, player.y, entityTypes.PLAYER);

    // Reduce player health
    player.health -= 1;

    // Play hurt sound if player is still alive
    if (player.health > 0) {
        this.playSfx("playerhurt");
    }

    // Update health bar display (only update the health value sprite)
    if (this.healthValueBar) {
        const healthFrame = Math.min(7, Math.max(1, 7 - player.health));
        this.healthValueBar.setFrame(healthFrame);
    }

    // Create blood particles at health bar
    this.createHealthBarBloodParticles();

    // Visual feedback - flash player red and set transparency
    player.setTint(0xff0000);
    player.alpha = 0.7;  // Make player semi-transparent

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
```

**Key Features:**

1. **Invulnerability Window**: 1000ms (1 second) between hits
2. **Health System**: Player starts with 6 health, dies at 0
3. **Visual Feedback**:
   - Player tint (red) for 200ms
   - Player alpha reduction to 0.7 for 1000ms
   - Fullscreen red flash effect (10ms)
   - Particle effects on collision
4. **Audio Feedback**: Plays "playerhurt" sound if still alive
5. **Auto-Cleanup**: Fireball is destroyed on collision

### Fireball Collision Setup (Lines 1238-1248)

```javascript
// Set up collision detection for fireballs hitting the player
if (this.playerFireballCollider) {
  this.physics.world.removeCollider(this.playerFireballCollider);
}
this.playerFireballCollider = this.physics.add.overlap(
  this.player,
  this.fireballs,
  this.handleFireballHit, // Callback when overlap occurs
  null,
  this,
);
```

### Enemy Touch Damage System

**Enemy Configuration (Lines 17-64):**

```javascript
const enemyConfigs = {
  [enemyTypes.ORC]: {
    assetKey: "orc",
    frameWidth: 100,
    frameHeight: 100,
    attackAnimKey: "orc_attack",
    canDamageOnTouch: true, // Takes damage from contact
    health: 1,
    defaultTurnBehaviour: true,
  },
  [enemyTypes.WIZARD]: {
    assetKey: "wizard",
    frameWidth: 100,
    frameHeight: 100,
    attackAnimKey: "wizard_attack",
    canDamageOnTouch: false, // Does NOT take damage from contact
    health: 1,
    defaultTurnBehaviour: false,
  },
  // ...more configs
};
```

---

## 4. ENTITY CREATION & LIFECYCLE MANAGEMENT

### Enemy Spawning (Lines 3148-3231)

```javascript
spawnEnemy(type = enemyTypes.ORC) {
    // Create an enemy at a random position, maintaining minimum distance from player
    const MIN_SPAWN_DISTANCE = 200;
    let randomX, randomY, distanceFromPlayer, onPeninsula;

    // Keep generating random positions until valid
    do {
        randomX = Phaser.Math.Between(50, 750);
        randomY = Phaser.Math.Between(50, 550);
        distanceFromPlayer = Phaser.Math.Distance.Between(
            randomX, randomY,
            this.player.x, this.player.y,
        );
        const gridX = Math.round(randomX / scaledTileSize);
        const gridY = Math.round(randomY / scaledTileSize);
        onPeninsula = this.isPeninsulaTile(gridX, gridY);
    } while (distanceFromPlayer < MIN_SPAWN_DISTANCE || onPeninsula);

    // Get configuration for this enemy type
    const config = enemyConfigs[type];
    const enemy = this.add.sprite(randomX, randomY, config.assetKey, 0);
    enemy.setScale(3);
    enemy.setDepth(5);
    enemy.type = type;  // Store for later reference

    // Play the appropriate stand animation based on enemy type
    enemy.play(`${type.toLowerCase()}_stand`);

    // Add physics
    this.physics.add.existing(enemy);
    enemy.body.setCollideWorldBounds(false);

    // Set physics body size and offset based on enemy type
    if (type === enemyTypes.ARMOREDORC) {
        enemy.body.setSize(30, 23, true);
        enemy.body.setOffset(30, 36);
    } else if (type === enemyTypes.BEHOLDER) {
        enemy.body.setSize(60, 60, true);
        enemy.body.setOffset(2, 2);
        enemy.beholderDirection = "down";
    } else {
        enemy.body.setSize(20.4, 19.95, true);
        enemy.body.setOffset(40, 38);
    }

    // Initialize enemy-specific properties
    enemy.isMoving = false;
    enemy.direction = { x: 0, y: 0 };
    enemy.lastEdgeHitTime = 0;
    enemy.lastHorizontalDirection = "right";
    enemy.isDead = false;
    enemy.isAxeSwinging = false;
    enemy.hasRecentlyAttacked = false;
    enemy.isAttacking = false;
    enemy.health = config.health;
    enemy.lastHitTime = 0;
    enemy.turnAroundCheckTimer = null;
    enemy.detectionSideOnCollision = null;

    // Werewolf-specific properties
    if (type === enemyTypes.WEREWOLF) {
        enemy.hasDetectedPlayer = false;
        enemy.huntSpeed = this.WEREWOLF_PATROL_SPEED;
    }

    // Add enemy to group
    this.enemies.add(enemy);

    // Start the enemy behavior cycle
    this.scheduleEnemyBehaviorChange(enemy);

    // If this is a wizard, schedule fireball attacks
    if (type === enemyTypes.WIZARD) {
        enemy.lastAlignedAttackTime = 0;
        enemy.alignmentCheckTime = 0;
        this.scheduleWizardAttack(enemy);
    }
}
```

### Enemy Cleanup Pattern (Lines 1033-1070)

```javascript
// Remove all enemies
this.enemies.children.entries.forEach((enemy) => {
  if (enemy && !enemy.destroyed) {
    // Get enemy type prefix for animation cleanup
    const typePrefix = enemy.type.toLowerCase();

    // Remove all animation completion listeners
    enemy.off(`animationcomplete-${typePrefix}_die`);
    enemy.off(`animationcomplete-${typePrefix}_attack`);

    // Stop any current animations
    if (enemy.anims.isPlaying) {
      enemy.stop();
    }

    // Force destroy the enemy
    enemy.destroy();
  }
});
```

### Projectile Cleanup Pattern (Lines 1078-1097)

```javascript
// Remove all fireballs and cancel pending fireball timers
if (this.fireballs) {
  const fireballsToDestroy = [...this.fireballs.children.entries];
  fireballsToDestroy.forEach((fireball) => {
    if (fireball && !fireball.destroyed) {
      fireball.destroy();
    }
  });
  this.fireballs.clear();
}
this.fireballs = this.add.group();

// Cancel all pending fireball timers
if (this.pendingFireballTimers) {
  this.pendingFireballTimers.forEach((timer) => {
    timer.remove(); // Cancel scheduled timer
  });
  this.pendingFireballTimers = [];
}
```

### Level Initialization (Idempotent Pattern)

The `initializeGame()` method (Lines 895-1165) clears ALL game state:

- Removes and destroys all UI elements
- Clears all enemies and fireballs
- Cancels all pending timers
- Resets player position and health
- Clears all groups and colliders

This allows seamless level transitions.

---

## 5. ENEMY ATTACK PATTERNS

### Wizard Attack System

**Timing-Based Dual Attack Patterns:**

#### 1. Scheduled Random Attacks (Lines 3320-3366)

```javascript
scheduleWizardAttack(wizard) {
    // Only schedule attacks if wizard is not dead
    if (!wizard.isDead) {
        // Schedule next attack with randomized interval
        const attackInterval = Phaser.Math.Between(1500, 3000);  // 1.5-3 seconds

        wizard.attackTimer = this.time.delayedCall(attackInterval, () => {
            if (!wizard.destroyed && !wizard.isDead) {
                wizard.isAttacking = true;
                wizard.play("wizard_attack");

                // wizard_attack: 12 frames at frameRate 10 = 1200ms total
                const fireballSpawnTime = 1200 * 0.8;  // 960ms (80% through)

                // Schedule fireball spawn at 80% through animation
                const fireballSpawnTimer = this.time.delayedCall(
                    fireballSpawnTime,
                    () => {
                        if (!wizard.destroyed && !wizard.isDead) {
                            this.spawnFireball(wizard);
                        }
                    },
                );

                // Listen for animation complete event to clear attacking flag
                wizard.once("animationcomplete-wizard_attack", () => {
                    wizard.isAttacking = false;
                });

                // Schedule next attack
                this.scheduleWizardAttack(wizard);
            }
        });
    }
}
```

**Characteristics:**

- Random interval: 1500-3000ms between attacks
- Attack animation duration: 1200ms (12 frames @ 10fps)
- Fireball spawned at: 80% through animation (960ms)
- Uses `isAttacking` flag to prevent animation override
- Recursive scheduling for continuous attacks

#### 2. Direction-Based Aligned Attacks (Lines 3269-3318)

```javascript
checkAndExecuteAlignedAttack(wizard) {
    if (wizard.isDead) return;

    // Check horizontal alignment with moderate tolerance (±50px)
    const yDifference = Math.abs(wizard.y - this.player.y);
    const HORIZONTAL_TOLERANCE = 50;

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
                wizard.facingLocked = true;  // Lock facing direction during attack
                wizard.play("wizard_attack");
                wizard.lastAlignedAttackTime = this.time.now;

                this.playSfx("wizardattack", enemyTypes.WIZARD);

                // Spawn fireball at 80% through animation (960ms)
                this.time.delayedCall(960, () => {
                    if (!wizard.destroyed && !wizard.isDead) {
                        this.spawnFireball(wizard);
                    }
                });

                // Clear attacking flag when animation completes
                wizard.once("animationcomplete-wizard_attack", () => {
                    wizard.isAttacking = false;
                    wizard.facingLocked = false;
                    // Reschedule random attacks after aligned attack completes
                    this.scheduleWizardAttack(wizard);
                });
            }
        }
    }
}
```

**Characteristics:**

- Triggers when player is within ±50px horizontally (on same Y axis)
- 500ms cooldown between aligned attacks
- Immediately cancels scheduled attack to trigger aligned attack
- Locks facing direction during attack animation
- Auto-resumes scheduled attacks after aligned attack completes
- Wizard always faces player during aligned attacks

### General Enemy Behavior System (Lines 4554-4598)

```javascript
scheduleEnemyBehaviorChange(enemy) {
    // Don't change behavior if enemy is swinging axe or dead
    if (!enemy.isAxeSwinging && !enemy.isDead) {
        // Toggle between moving and stationary
        enemy.isMoving = !enemy.isMoving;

        if (enemy.isMoving) {
            // Beholder uses only 4 cardinal directions
            let directions;
            if (enemy.type === enemyTypes.BEHOLDER) {
                directions = [
                    { x: 0, y: -1 },   // up
                    { x: 1, y: 0 },    // right
                    { x: 0, y: 1 },    // down
                    { x: -1, y: 0 },   // left
                ];
            } else {
                // Other enemies use 8 directions
                directions = [
                    { x: 0, y: -1 },     // up
                    { x: 1, y: -1 },     // up-right
                    { x: 1, y: 0 },      // right
                    { x: 1, y: 1 },      // down-right
                    { x: 0, y: 1 },      // down
                    { x: -1, y: 1 },     // down-left
                    { x: -1, y: 0 },     // left
                    { x: -1, y: -1 },    // up-left
                ];
            }
            enemy.direction = Phaser.Utils.Array.GetRandom(directions);
        }
    }

    // Schedule next behavior change with randomized interval
    // If enemy is swinging axe, check again sooner (500ms) to see if it's done
    const behaviorInterval = enemy.isAxeSwinging
        ? 500
        : Phaser.Math.Between(2000, 4000);

    enemy.behaviorTimer = this.time.delayedCall(behaviorInterval, () => {
        if (!enemy.destroyed && !enemy.isDead) {
            this.scheduleEnemyBehaviorChange(enemy);
        }
    });
}
```

**Characteristics:**

- Random interval: 2000-4000ms between behavior changes
- Toggles between moving/stationary states
- Random direction selection when moving
- 4-directional movement for Beholder, 8-directional for others
- Respects "axe swinging" state (checks more frequently: 500ms)
- Recursive scheduling for continuous behavior changes

---

## 6. PARTICLE EFFECT SYSTEMS

### Fireball Particle Effect (Lines 4338-4364)

```javascript
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
            ease: "Quad.out",
            onComplete: () => {
                particle.destroy();  // Auto-cleanup after animation
            },
        });
    }
}
```

**Characteristics:**

- 8-12 random particles spawned at impact location
- Orange color (0xff9500)
- Radiates outward in all directions (0-360°)
- Speed: 50-125 px/s
- Duration: 500ms fade-out with radius expansion
- Auto-destroys particles after tween completes

### Blood Particle Effects (Lines 4261+)

Similar pattern with red color (0xd90f1e), but with more sophisticated 2-stage animation:

- Stage 1: Rise upward (250ms)
- Stage 2: Fall and fade (250ms)
- Creates visual "spray" effect

---

## 7. SUMMARY TABLE: ENTITY LIFECYCLE

| Phase              | Action                                     | Method                                                     | Notes                                            |
| ------------------ | ------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------ |
| **Creation**       | Spawn entity at random position            | `spawnEnemy()`                                             | Min 200px from player, avoids peninsulas         |
| **Initialization** | Create sprite, set physics, play animation | `spawnEnemy()`                                             | Health initialized from config                   |
| **Behavior Loop**  | Random movement/direction changes          | `scheduleEnemyBehaviorChange()`                            | Every 2-4 seconds, or 500ms if attacking         |
| **Attacks**        | Play attack animation, spawn projectiles   | `scheduleWizardAttack()`, `checkAndExecuteAlignedAttack()` | Wizard-specific: 1.5-3s interval or on alignment |
| **Collision**      | Take/deal damage, create particles         | `handleFireballHit()`, `handlePlayerEnemyCollision()`      | Damage & invulnerability logic                   |
| **Death**          | Play death animation, mark as dead         | `handlePlayerEnemyCollision()`                             | Plays death SFX, fade-out after animation        |
| **Cleanup**        | Remove from game world                     | `initializeGame()`                                         | On level transition, cancel all timers           |

---

## 8. KEY PATTERNS FOR NEW PROJECTILES

### Pattern Template for New Projectile Type:

```javascript
// 1. Define entity type constant
const entityTypes = {
    PLAYER: "PLAYER",
    ENEMY: "ENEMY",
    WIZARD_FIREBALL: "WIZARD_FIREBALL",
    NEW_PROJECTILE: "NEW_PROJECTILE",  // Add this
};

// 2. Create spawn method
spawnNewProjectile(sourceEnemy) {
    const direction = sourceEnemy.flipX ? -1 : 1;
    const OFFSET = 100;

    const projectile = this.add.sprite(
        sourceEnemy.x + direction * OFFSET,
        sourceEnemy.y,
        "spritesheet",
        frameNumber
    );
    projectile.setScale(2);
    projectile.setDepth(2);
    projectile.flipX = sourceEnemy.flipX;
    projectile.play("projectile_animation");

    // Physics setup
    this.physics.add.existing(projectile);
    projectile.body.setSize(15, 15, true);
    projectile.body.setOffset(44, 44);
    projectile.body.setVelocity(direction * 300, 0);

    // Group management
    this.newProjectiles.add(projectile);

    // Timeout cleanup
    const timer = this.time.delayedCall(5000, () => {
        if (projectile && !projectile.destroyed) {
            projectile.destroy();
        }
    });
    if (this.pendingFireballTimers) {
        this.pendingFireballTimers.push(timer);
    }
}

// 3. Create collision handler
handleNewProjectileHit(player, projectile) {
    if (this.gameIsOver || projectile.destroyed) return;

    // Check invulnerability
    if (
        this.playerLastHitTime &&
        this.time.now - this.playerLastHitTime < 1000
    ) {
        projectile.destroy();
        return;
    }

    this.playerLastHitTime = this.time.now;

    // Create visual effects
    this.createProjectileParticles(player.x, player.y);
    this.createBloodParticles(player.x, player.y, entityTypes.PLAYER);

    // Damage
    player.health -= 1;

    // Update UI, play sound, etc.
    if (player.health > 0) {
        this.playSfx("playerhurt");
    }

    // Destroy projectile
    projectile.destroy();

    // Check game over
    if (player.health <= 0) {
        this.gameOver();
    }
}

// 4. Create animation
this.anims.create({
    key: "projectile_animation",
    frames: this.anims.generateFrameNumbers("spritesheet", { start: 0, end: 4 }),
    frameRate: 10,
    repeat: -1,  // or 0 for one-time
});

// 5. Set up collision in create()
if (this.playerNewProjectileCollider) {
    this.physics.world.removeCollider(this.playerNewProjectileCollider);
}
this.playerNewProjectileCollider = this.physics.add.overlap(
    this.player,
    this.newProjectiles,
    this.handleNewProjectileHit,
    null,
    this,
);

// 6. Initialize groups in create()
this.newProjectiles = this.add.group();

// 7. Add cleanup to initializeGame()
if (this.newProjectiles) {
    const projectilesToDestroy = [...this.newProjectiles.children.entries];
    projectilesToDestroy.forEach((projectile) => {
        if (projectile && !projectile.destroyed) {
            projectile.destroy();
        }
    });
    this.newProjectiles.clear();
}
this.newProjectiles = this.add.group();
```

---

## 9. IMPORTANT IMPLEMENTATION NOTES

### Timing Calculations

- Animation frame rate: 10 fps consistently
- Spell cast times calculated as: `animation_frame_count / 10 * 1000` ms
  - Example: 12 frames = 1200ms = 1.2 seconds
- Fireball spawn timing: typically 80% through animation (0.8 \* duration)

### State Management

- Use boolean flags (`isAttacking`, `isDead`, `isAxeSwinging`) to prevent animation conflicts
- Track timers on entities for cleanup: `enemy.behaviorTimer`, `wizard.attackTimer`
- Track global pending timers: `this.pendingFireballTimers`

### Physics Configuration

- Always set collision box size AND offset separately
- Offset values fine-tuned per enemy type for accurate collision
- Velocity is set in pixels per second

### Cleanup Critical Points

- Always check `!entity.destroyed` before accessing destroyed entities
- Cancel timers with `.remove()` method
- Use animation event `animationcomplete-${key}` to fire cleanup callbacks
- Clear groups with `.clear()` and `.children.entries` iteration

### Depth Layering

- Background: -10
- Player: 5
- Fireballs: 2 (above player, below enemies)
- Most enemies: 5
- UI/Particles: 10-15
