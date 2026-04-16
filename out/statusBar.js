"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGitStatus = exports.setupStatusBarListeners = exports.createStatusBar = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
function createStatusBar() {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    item.text = `$(sync~spin) Initializing...`;
    item.show();
    return item;
}
exports.createStatusBar = createStatusBar;
function setupStatusBarListeners(gitStatusIndicator, context) {
    updateGitStatus(gitStatusIndicator);
    const gitWatcher = vscode.workspace.createFileSystemWatcher('**/.git/{HEAD,refs/heads/*,refs/remotes/*,index}');
    gitWatcher.onDidChange(() => updateGitStatus(gitStatusIndicator));
    context.subscriptions.push(gitWatcher);
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => updateGitStatus(gitStatusIndicator)), vscode.window.onDidChangeWindowState((state) => {
        if (state.focused) {
            updateGitStatus(gitStatusIndicator);
        }
    }));
    setupFetchInterval(gitStatusIndicator, context);
}
exports.setupStatusBarListeners = setupStatusBarListeners;
/** Fast path: reads local git state only. Called on every file/editor/focus event. */
function updateGitStatus(gitStatusIndicator) {
    const repoPath = getRepoPath();
    if (!repoPath) {
        gitStatusIndicator.text = `$(issue-opened) No Repo`;
        gitStatusIndicator.tooltip = undefined;
        gitStatusIndicator.color = undefined;
        return;
    }
    (0, child_process_1.exec)('git status -sb', { cwd: repoPath }, (err, stdout) => {
        if (err) {
            gitStatusIndicator.text = `$(alert) Git Error`;
            console.error('Error reading Git status:', err);
        }
        else {
            parseGitStatus(stdout, gitStatusIndicator);
        }
    });
}
exports.updateGitStatus = updateGitStatus;
/** Slow path: fetches from remote first. Called only on the 5-minute interval. */
function fetchAndUpdateGitStatus(gitStatusIndicator) {
    const repoPath = getRepoPath();
    if (!repoPath) {
        return;
    }
    (0, child_process_1.exec)('git fetch && git status -sb', { cwd: repoPath }, (err, stdout) => {
        if (err) {
            gitStatusIndicator.text = `$(alert) Failed to fetch`;
            console.error('Error fetching Git status:', err);
        }
        else {
            parseGitStatus(stdout, gitStatusIndicator);
        }
    });
}
function setupFetchInterval(gitStatusIndicator, context) {
    const fetchInterval = 300_000; // 5 minutes
    const id = setInterval(() => fetchAndUpdateGitStatus(gitStatusIndicator), fetchInterval);
    context.subscriptions.push({ dispose: () => clearInterval(id) });
}
function getRepoPath() {
    const folders = vscode.workspace.workspaceFolders;
    const repoPath = folders?.[0]?.uri.fsPath;
    if (!repoPath || !fs.existsSync(path.join(repoPath, '.git'))) {
        return null;
    }
    return repoPath;
}
function parseGitStatus(stdout, gitStatusIndicator) {
    const status = stdout.trim();
    if (status.includes('diverged') || (status.includes('ahead') && status.includes('behind'))) {
        gitStatusIndicator.text = `$(git-merge) Diverged`;
        gitStatusIndicator.color = '#ff6348';
        gitStatusIndicator.tooltip = 'Branch has diverged from remote. Manual merge required.';
    }
    else if (status.includes('[ahead') && !status.includes('behind')) {
        gitStatusIndicator.text = `$(arrow-up) Ahead`;
        gitStatusIndicator.color = '#ffa502';
        gitStatusIndicator.tooltip = 'Branch is ahead of remote. Run acp to push.';
    }
    else if (status.includes('[behind') && !status.includes('ahead')) {
        gitStatusIndicator.text = `$(arrow-down) Behind`;
        gitStatusIndicator.color = '#ff4757';
        gitStatusIndicator.tooltip = 'Branch is behind remote. Run git pull.';
    }
    else {
        gitStatusIndicator.text = `$(check) Up-to-date`;
        gitStatusIndicator.color = '#2ed573';
        gitStatusIndicator.tooltip = 'Branch is up-to-date with remote.';
    }
}
//# sourceMappingURL=statusBar.js.map