# Development Guide for Agentic Coding Agents

This document provides essential information for agentic coding agents working on this Phaser.js game project.

## Project Overview

This is an HTML5 game built with Phaser.js.

The game features a player character (soldier) that can move around, dash, and attack enemies. The game has multiple levels with increasing difficulty.

## Build/Lint/Test Commands

### Running the Game

```bash
# Serve the project locally
npx http-server

# Then visit http://localhost:8080 in your browser
```

### No Build Process

This project does not have a traditional build process. It uses ES6 modules directly in the browser, so no bundling is required.

### Linting

we use prettier religiously. Please smash `npx prettier . --write` after any change. 

### Testing

This project does not have automated tests. Manual testing through the browser is the primary testing approach.

### Single Test Execution

As there are no automated tests, testing involves manually playing the game to verify functionality.

## Code Style Guidelines

### Imports

1. Use ES6 import/export syntax exclusively
2. Import statements should be at the top of the file
3. Use relative paths for local imports
4. Example:

```javascript
import config from "./config.js";
import MainScene from "./scenes/MainScene.js";
```

### Formatting

1. Use 4 spaces for indentation (no tabs)
2. Use semicolons at the end of statements
3. Opening braces on the same line as the statement
4. Spaces around operators (=, +, -, \*, /, etc.)
5. No trailing whitespace at the end of lines
6. Files should end with a newline character

### Naming Conventions

1. Use camelCase for variables and functions
2. Use PascalCase for classes
3. Use UPPER_CASE for constants
4. Use descriptive names that indicate purpose
5. Prefix boolean variables with is/has/can when appropriate
6. Use plural names for collections/arrays

### Types

1. This is a JavaScript project without TypeScript
2. Use JSDoc comments for function documentation when helpful
3. Be explicit about function parameters and return values in comments

### Error Handling

1. Use conditional checks before accessing object properties
2. Handle edge cases gracefully
3. Use early returns to avoid deep nesting
4. Log errors to the console when appropriate for debugging

### Code Organization

1. Group related functionality together
2. Keep functions focused on a single responsibility
3. Use comments to explain complex logic
4. Remove dead/commented code
5. Initialize all variables at the top of their scope

### Phaser-Specific Guidelines

1. Follow the existing pattern for scene creation and lifecycle methods
2. Use the existing animation creation patterns
3. Follow the established conventions for sprite creation and manipulation
4. Use the existing input handling patterns
5. Maintain consistent scaling and positioning approaches

### Game Logic Patterns

1. Use the existing initializeGame method pattern for resetting game state
2. Follow the established collision handling patterns
3. Use the existing timer/delayedCall patterns for timed events
4. Maintain the existing health and damage system patterns
5. Follow the level progression system already implemented

### Asset Management

1. Keep asset loading in the preload method of scenes
2. Use consistent naming for asset keys
3. Follow the existing pattern for spritesheet frame definitions

## Project Structure

```
phaser-project/
├── assets/           # Game assets (images, spritesheets)
├── scenes/           # Game scenes
├── config.js         # Phaser game configuration
├── game.js           # Game entry point
├── index.html        # HTML entry point
└── README.md         # Project documentation
```

## Important Notes for Agents

1. This project runs directly in the browser without a build step
2. Changes to code are immediately visible after refreshing the browser
3. Pay attention to the existing code patterns and maintain consistency
4. The game uses arcade physics
5. Be careful when modifying animation timings or gameplay mechanics
6. Maintain the existing code comments that explain complex systems
7. Preserve the idempotent nature of the initializeGame method
8. Follow the established patterns for entity cleanup and destruction
