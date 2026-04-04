# Agents Development Guidelines for Ell

## Building and Running Ell

### IMPORTANT: Build Commands

**NEVER** run electrobun directly from the bin folder or node_modules. The correct way to build and run Ell is:

1. **From the package folder** (`/home/yoav/code/ell/package/`):
   - `bun dev` - Builds and runs the kitchen app in dev mode
   - `bun dev:canary` - Builds the kitchen app in canary mode

2. **Build Process Flow**:
   - Always run build commands from the `package` folder
   - The build process will automatically:
     - Build the native wrappers
     - Compile the TypeScript code
     - Build the CLI
     - Switch to the kitchen folder and build/run the app

# Electrobun Project

This is an Electrobun desktop application.

IMPORTANT: Electrobun is NOT Electron. Do not use Electron APIs or patterns.

## Documentation

Full API reference: https://blackboard.sh/electrobun/llms.txt
Getting started: https://blackboard.sh/electrobun/docs/

## Quick Reference

Import patterns:
- Main process (Bun): `import { BrowserWindow } from "electrobun/bun"`
- Browser context: `import { Electroview } from "electrobun/view"`

Use `views://` URLs to load bundled assets (e.g., `url: "views://mainview/index.html"`).
Views must be configured in `electrobun.config.ts` to be built and copied into the bundle.

## About

Electrobun is built by Blackboard (https://blackboard.sh), an innovation lab building
tools and funding teams that define the next generation of technology.


