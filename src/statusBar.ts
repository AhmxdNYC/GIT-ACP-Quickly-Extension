import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

export function createStatusBar(): vscode.StatusBarItem {
	const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	item.text = `$(sync~spin) Initializing...`;
	item.show();
	return item;
}

export function setupStatusBarListeners(
	gitStatusIndicator: vscode.StatusBarItem,
	context: vscode.ExtensionContext
): void {
	updateGitStatus(gitStatusIndicator);

	const gitWatcher = vscode.workspace.createFileSystemWatcher(
		'**/.git/{HEAD,refs/heads/*,refs/remotes/*,index}'
	);
	gitWatcher.onDidChange(() => updateGitStatus(gitStatusIndicator));
	context.subscriptions.push(gitWatcher);

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(() => updateGitStatus(gitStatusIndicator)),
		vscode.window.onDidChangeWindowState((state) => {
			if (state.focused) {
				updateGitStatus(gitStatusIndicator);
			}
		})
	);

	setupFetchInterval(gitStatusIndicator, context);
}

/** Fast path: reads local git state only. Called on every file/editor/focus event. */
export function updateGitStatus(gitStatusIndicator: vscode.StatusBarItem): void {
	const repoPath = getRepoPath();
	if (!repoPath) {
		gitStatusIndicator.text = `$(issue-opened) No Repo`;
		gitStatusIndicator.tooltip = undefined;
		gitStatusIndicator.color = undefined;
		return;
	}

	exec('git status -sb', { cwd: repoPath }, (err, stdout) => {
		if (err) {
			gitStatusIndicator.text = `$(alert) Git Error`;
			console.error('Error reading Git status:', err);
		} else {
			parseGitStatus(stdout, gitStatusIndicator);
		}
	});
}

/** Slow path: fetches from remote first. Called only on the 5-minute interval. */
function fetchAndUpdateGitStatus(gitStatusIndicator: vscode.StatusBarItem): void {
	const repoPath = getRepoPath();
	if (!repoPath) {
		return;
	}

	exec('git fetch && git status -sb', { cwd: repoPath }, (err, stdout) => {
		if (err) {
			gitStatusIndicator.text = `$(alert) Failed to fetch`;
			console.error('Error fetching Git status:', err);
		} else {
			parseGitStatus(stdout, gitStatusIndicator);
		}
	});
}

function setupFetchInterval(
	gitStatusIndicator: vscode.StatusBarItem,
	context: vscode.ExtensionContext
): void {
	const fetchInterval = 300_000; // 5 minutes
	const id = setInterval(() => fetchAndUpdateGitStatus(gitStatusIndicator), fetchInterval);
	context.subscriptions.push({ dispose: () => clearInterval(id) });
}

function getRepoPath(): string | null {
	const folders = vscode.workspace.workspaceFolders;
	const repoPath = folders?.[0]?.uri.fsPath;
	if (!repoPath || !fs.existsSync(path.join(repoPath, '.git'))) {
		return null;
	}
	return repoPath;
}

function parseGitStatus(stdout: string, gitStatusIndicator: vscode.StatusBarItem): void {
	const status = stdout.trim();

	if (status.includes('diverged') || (status.includes('ahead') && status.includes('behind'))) {
		gitStatusIndicator.text = `$(git-merge) Diverged`;
		gitStatusIndicator.color = '#ff6348';
		gitStatusIndicator.tooltip = 'Branch has diverged from remote. Manual merge required.';
	} else if (status.includes('[ahead') && !status.includes('behind')) {
		gitStatusIndicator.text = `$(arrow-up) Ahead`;
		gitStatusIndicator.color = '#ffa502';
		gitStatusIndicator.tooltip = 'Branch is ahead of remote. Run acp to push.';
	} else if (status.includes('[behind') && !status.includes('ahead')) {
		gitStatusIndicator.text = `$(arrow-down) Behind`;
		gitStatusIndicator.color = '#ff4757';
		gitStatusIndicator.tooltip = 'Branch is behind remote. Run git pull.';
	} else {
		gitStatusIndicator.text = `$(check) Up-to-date`;
		gitStatusIndicator.color = '#2ed573';
		gitStatusIndicator.tooltip = 'Branch is up-to-date with remote.';
	}
}
