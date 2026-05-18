# Codebase Documentation Index

This index guides you through the comprehensive analysis of the Phaser.js game codebase.

## Quick Start

**New to the codebase?** Start here:

1. Read this file (2 min)
2. Skim QUICK_REFERENCE.md (3 min)
3. Review ARCHITECTURE.md diagrams (5 min)
4. Deep dive into specific sections as needed

---

## Document Overview

### 1. QUICK_REFERENCE.md

**Best for:** Fast lookups, implementation checklists, constant values

**Contains:**

- All key method names with line numbers
- Function signatures and purposes
- Important constant values
- State flags and their meanings
- Pattern templates for common tasks
- Timing calculations

**Time to read:** 5 minutes
**Use when:** You need to find something specific quickly

---

### 2. CODEBASE_ANALYSIS.md

**Best for:** Understanding systems in detail, learning patterns

**Sections:**

1. **Projectiles/Entities** - Wizard fireball implementation, lifecycle
2. **Animation System** - How animations are created and managed
3. **Collision Damage** - Damage system, invulnerability windows
4. **Entity Creation & Lifecycle** - Spawning, initialization, cleanup
5. **Enemy Attack Patterns** - Timing-based and direction-based attacks
6. **Particle Effects** - Visual feedback systems
7. **Entity Lifecycle Summary** - Table of all phases
8. **New Projectile Template** - Copy-paste pattern for new projectiles
9. **Implementation Notes** - Critical best practices

**Time to read:** 30 minutes (full), 10 minutes (sections)
**Use when:** You're implementing something new or need to understand a system

---

### 3. ARCHITECTURE.md

**Best for:** Understanding overall system design, visual learner

**Contains:**

- Entity type hierarchy (ASCII tree)
- Complete game loop flow diagram
- Wizard attack state machine diagram
- Collision system architecture
- Depth layering visualization
- Animation state management diagram
- Group management patterns
- Health & damage system flow
- Fireball attack timeline

**Time to read:** 15 minutes
**Use when:** You need visual understanding of how systems work together

---

## Navigation by Task

### "I need to implement a new projectile type"

1. QUICK_REFERENCE.md → "Critical Patterns: Creating a New Projectile Type"
2. CODEBASE_ANALYSIS.md → Section 8 (template)
3. Reference: spawnFireball() at line 3233, handleFireballHit() at line 1493

### "I need to understand how animations work"

1. QUICK_REFERENCE.md → Animation section
2. CODEBASE_ANALYSIS.md → Section 2 (Animation System)
3. ARCHITECTURE.md → Animation State Management section

### "I need to add a new enemy attack type"

1. CODEBASE_ANALYSIS.md → Section 5 (Enemy Attack Patterns)
2. ARCHITECTURE.md → Wizard Attack State Machine diagram
3. Reference: scheduleWizardAttack() at line 3320

### "I need to understand collision/damage"

1. QUICK_REFERENCE.md → Collision Damage section
2. CODEBASE_ANALYSIS.md → Section 3 (Collision Damage System)
3. ARCHITECTURE.md → Health & Damage System section

### "I need to understand entity cleanup"

1. QUICK_REFERENCE.md → Groups & Cleanup section
2. CODEBASE_ANALYSIS.md → Section 4 (Entity Cleanup Pattern)
3. ARCHITECTURE.md → Group Management Pattern section

### "I need to understand the complete game flow"

1. ARCHITECTURE.md → Game Loop Flow section
2. QUICK_REFERENCE.md → entire document
3. CODEBASE_ANALYSIS.md → Section 4 (initializeGame method)

---

## Key Code Locations

### Critical Methods

| What               | File         | Method                           | Line |
| ------------------ | ------------ | -------------------------------- | ---- |
| Fireball creation  | MainScene.js | `spawnFireball()`                | 3233 |
| Fireball collision | MainScene.js | `handleFireballHit()`            | 1493 |
| Animation creation | MainScene.js | `create()`                       | 1841 |
| Enemy spawning     | MainScene.js | `spawnEnemy()`                   | 3148 |
| Enemy behavior     | MainScene.js | `scheduleEnemyBehaviorChange()`  | 4554 |
| Wizard attacks     | MainScene.js | `scheduleWizardAttack()`         | 3320 |
| Aligned attacks    | MainScene.js | `checkAndExecuteAlignedAttack()` | 3269 |
| Particles          | MainScene.js | `createFireballParticles()`      | 4338 |
| Level init         | MainScene.js | `initializeGame()`               | ~895 |
| Update loop        | MainScene.js | `update()`                       | 3887 |

### Important Groups & Tracking

- `this.fireballs` - Tracks all active fireballs
- `this.enemies` - Tracks all active enemies
- `this.pendingFireballTimers` - Tracks timers for cleanup
- `enemy.behaviorTimer` - Per-enemy behavior scheduling timer
- `wizard.attackTimer` - Per-wizard attack scheduling timer

### State Flags to Check

- `entity.destroyed` - Entity is cleaned up
- `entity.isDead` - Entity is dead (playing death anim)
- `entity.isAttacking` - Entity is attacking
- `entity.isAxeSwinging` - Entity is swinging weapon
- `entity.isMoving` - Entity is moving vs stationary

---

## Common Patterns

### Pattern: Create a New Entity

```javascript
const entity = this.add.sprite(x, y, assetKey, frameNumber);
entity.setScale(3);
entity.setDepth(depthValue);
entity.play("animationKey");

// Physics
this.physics.add.existing(entity);
entity.body.setSize(width, height, true);
entity.body.setOffset(offsetX, offsetY);

// Tracking
this.entityGroup.add(entity);

// Behavior
this.scheduleEntityBehavior(entity);
```

### Pattern: Create Collision Handler

```javascript
handleCollision(entityA, entityB) {
    if (this.gameIsOver || entityB.destroyed) return;

    // Check conditions
    if (conditions_not_met) return;

    // Apply effects
    this.createParticles(entityA.x, entityA.y);

    // Damage
    entityA.health -= 1;

    // Cleanup
    entityB.destroy();

    // Check game state
    if (entityA.health <= 0) {
        this.handleDeath(entityA);
    }
}
```

### Pattern: Handle Animation Completion

```javascript
entity.once(`animationcomplete-${key}`, () => {
  // Check entity still exists
  if (entity && !entity.destroyed) {
    // Handle completion
    entity.isAttacking = false;

    // Schedule next action
    this.scheduleNextAction(entity);
  }
});
```

### Pattern: Cleanup with Timers

```javascript
const timer = this.time.delayedCall(milliseconds, () => {
  if (!entity || entity.destroyed) return;
  entity.destroy();
});

// Track for cleanup
if (this.pendingFireballTimers) {
  this.pendingFireballTimers.push(timer);
}
```

---

## Important Values

### Velocities

- Fireball: 300 px/s
- Default enemy: 160 px/s
- Werewolf hunt speed: Lower than default
- Player dash: 160 × 3.5 = 560 px/s

### Timing

- Animation frame rate: 10 fps
- Wizard attack interval: 1500-3000ms
- Enemy behavior change: 2000-4000ms
- Player invulnerability: 1000ms
- Fireball timeout: 5000ms
- Aligned attack cooldown: 500ms
- Alignment tolerance: ±50px

### Physics Sizes (width × height)

- Player: 20.4 × 19.95 (offset: 40, 38)
- Fireball: 15 × 15 (offset: 44, 44)
- ORC: 20.4 × 19.95 (offset: 40, 38)
- WIZARD: 20.4 × 19.95 (offset: 40, 38)
- WEREWOLF: 20.4 × 19.95 (offset: 40, 38)
- ARMOREDORC: 30 × 23 (offset: 30, 36)
- BEHOLDER: 60 × 60 (offset: 2, 2)

### Health Points

- Player: 6 HP (dies at 0)
- ORC: 1 HP
- WIZARD: 1 HP
- WEREWOLF: 1 HP
- ARMOREDORC: 3 HP
- BEHOLDER: 7 HP

### Depth Values

- Background: -10
- Dead enemies: -1
- Player & most enemies: 5
- Fireballs: 2
- UI: 10-15

---

## Development Workflow

### When Adding a New Projectile

1. Define type in `entityTypes` (top of file)
2. Create spawn method based on fireball template
3. Create animation in `create()`
4. Create collision handler based on fireball template
5. Set up collision in `create()`
6. Initialize group in `create()`
7. Add cleanup to `initializeGame()`
8. Test collision and timing

**Reference:** CODEBASE_ANALYSIS.md Section 8

### When Adding Enemy Behavior

1. Add property to enemy in `spawnEnemy()`
2. Create scheduling method (look at `scheduleEnemyBehaviorChange()`)
3. Create action method
4. Add animation if needed in `create()`
5. Add cleanup in `initializeGame()`

**Reference:** CODEBASE_ANALYSIS.md Section 5

### When Debugging

1. Check `!entity.destroyed` checks (prevents errors)
2. Check timers are being tracked
3. Check animation events are using `.once()`
4. Check state flags prevent animation conflicts
5. Check groups are being cleaned up properly

---

## File Statistics

- **MainScene.js**: 5,069 lines (entire game)
- **CODEBASE_ANALYSIS.md**: 872 lines, 26 KB
- **QUICK_REFERENCE.md**: 150+ lines, 3.8 KB
- **ARCHITECTURE.md**: 550+ lines, 15 KB

---

## Next Steps

1. **First time?** → Read QUICK_REFERENCE.md completely
2. **Implementing?** → Use CODEBASE_ANALYSIS.md Section 8 template
3. **Debugging?** → Check QUICK_REFERENCE.md state flags section
4. **Confused?** → Look at ARCHITECTURE.md diagram for that system
5. **Deep dive?** → Read full CODEBASE_ANALYSIS.md

---

**Last Updated:** May 18, 2026
**Total Game Lines:** 5,069 (MainScene.js)
**Documentation Coverage:** All systems analyzed
