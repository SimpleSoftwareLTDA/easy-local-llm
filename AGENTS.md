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

