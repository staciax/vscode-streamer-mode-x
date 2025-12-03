# VSCode Streamer Mode X - AI Agent Instructions

## Overview

This is a VSCode extension that protects sensitive files (`.env`, certificates, keys) during screen sharing by intercepting file opens and showing a warning overlay instead of the actual content. 

## Repo Structure & Important Files

## Repo Structure & Important Files

- `src/`: Main extension source code
  - `extension.ts`: Main activation file
  - `commands.ts`: Command implementations
  - `editor.ts`: Custom editor provider for displaying warning overlay
  - `file-decorator.ts`: File decoration provider (badges/colors)
  - `status-bar.ts`: Status bar item management
  - `logger.ts`: Logging utilities
  - `polling.ts`: Polling service for auto-detection
  - `settings.ts`: Configuration management (Update this when adding new settings!)
  - `utils/`: Utility functions
    - `nonce.ts`: Nonce generation for CSP
    - `streamer.ts`: Streamer app detection logic
  - `test/`: Test files
    - `extension.test.ts`: Extension tests
- `media/`: Static assets for the warning overlay
  - `streamer-mode.css`: Overlay styles
  - `streamer-mode.js`: Overlay behavior
  - `vscode.css`: VS Code theme styles
- `README.md`: Project overview
- `esbuild.ts`: Build script using esbuild
- `biome.jsonc`: Biome linting and formatting rules
- `tsconfig.json`: TypeScript configuration
- `package.json`: NPM scripts and extension manifest
- `.vscodeignore`: VS Code extension packaging exclusions
- `bunfig.toml`: Bun runtime configuration

## Bun Commands
- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.
- **Note**: VS Code extension tests require special runner, use `bun run test` not `bun test` directly

## Testing & Automated Checks

Before submitting changes, ensure all checks pass and augment tests when you touch code:

- Add or update unit tests for any code change unless it is truly infeasible; if something prevents adding tests, explain why in the PR.

### Unit Tests
- Framework: Mocha with `@vscode/test-electron`
- Location: `src/test/**/*.test.ts`
- Coverage target: 80%+ (if configured)

### Running Tests
```bash 
bun run pretest   # Compile TypeScript before testing
bun run test      # Run all tests with Mocha
```

### Linting & Formatting
- Run Biome:
  ```bash
  bun lint    # lint check
  bun format  # fix and format
  ```
- Code style follows `biome.jsonc`
- Comments must end with a period.

### Mandatory Local Run Order

For every code change, run the full validation sequence locally:

```bash
bun lint && bun pretest && bun run test
```

## Style, Linting & Type Checking

- Follow BiomeJS rules (`biome.jsonc`)
- Run `bun lint` and fix all errors locally.
- Use `bun run compile` to catch type errors.

## Prerequisites
- Bun 1.3+
- Node.js 24+ recommended.
- VSCode Engine: `^1.95.0`

## Pull Request & Commit Guidelines

- Use **Conventional Commits**:
  - `feat`: new feature
  - `fix`: bug fix
  - `docs`: documentation only
  - `test`: adding or fixing tests
  - `chore`: build, CI, or tooling changes
  - `perf`: performance improvement
  - `refactor`: code changes without feature or fix
  - `build`: changes that affect the build system
  - `ci`: CI configuration
  - `style`: code style (formatting, missing semicolons, etc.)
  - `types`: type-related changes
  - `revert`: reverts a previous commit
- Commit message format:

  ```
  <type>(<scope>): <short summary>

  Optional longer description.
  ```

- Keep summary under 80 characters.
- If your change affects the public API, add a Changeset via:
  ```bash
  bun changeset
  ```

## Review Process & What Reviewers Look For

- ✅ All automated checks pass (build, tests, lint).
- ✅ Tests cover new behavior and edge cases.
- ✅ Code is readable and maintainable.
- ✅ Public APIs have doc comments.
- ✅ Examples updated if behavior changes.
- ✅ Documentation (in `docs/`) updated for user-facing changes.
- ✅ Commit history is clean and follows Conventional Commits.

## Security Notes
- Extension uses Content Security Policy (CSP) with nonces
- Sensitive file patterns configurable via settings
- No telemetry or external network calls