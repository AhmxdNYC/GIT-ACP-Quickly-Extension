# Changelog

## [1.0.0] - 2026-04-16

### Added
- Fish shell support — all four commands (`acp`, `acm`, `add`, `cm`) in idiomatic fish syntax
- `acpGitCommands.shellType` setting is now actually read and applied (was previously ignored)
- `tsconfig.json` with strict mode

### Changed
- Rewrote entire extension in TypeScript, split into four modules: `extension`, `statusBar`, `shellConfig`, `shellScripts`
- `git fetch` now runs only on the 5-minute interval — no longer fires on every file save or tab switch
- Updated `package.json` `main` to point to `./out/extension.js` (the compiled bundle)
- Moved `vsce` from `dependencies` to `devDependencies`
- Shell type setting updated from `bash/zsh/powershell` to `bash/zsh/fish`

### Fixed
- Duplicate `cm()` function definition in the shell script template
- Early `return` in `activate()` that silently prevented Quick Push from registering on first install
- `installACPCommand` was registered twice, causing a silent VS Code error
- `onDidChangeActiveTextEditor` was subscribed twice
- Removed unused `axios` and `fast-xml-parser` dependencies

## [0.9.0]

- Quick Push feature (`CMD+OPT+P` / `CTRL+ALT+P`) types `acp` into the active terminal
- Extension now activates only within Git workspaces
- Terminal handling preserved — session not closed on config update

## [0.8.0]

- Quick Status: real-time Git status indicator in the status bar
- Automatic shell config file creation if none exists
- ACP functions removed from shell config on uninstall
- Improved bash support on macOS

## [0.7.0]

- Zsh support re-introduced across all platforms
- `add` command can now stage specific files
- Instructions shown in VS Code editor tab when no config file is found

## [0.6.0]

- Error handling for commands run outside Git repositories

## [0.5.0]

- Version checking to keep the shell script up to date

## [0.4.0]

- Branch sync enforcement — divergence detection, pull-before-push

## [0.3.0]

- Automatic shell function updates on extension version change

## [0.2.0]

- Detached HEAD and upstream branch handling

## [0.1.0]

- Initial release
