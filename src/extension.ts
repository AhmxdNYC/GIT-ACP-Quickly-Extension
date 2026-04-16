import * as vscode from 'vscode';
import * as fs from 'fs';
import { createStatusBar, setupStatusBarListeners, updateGitStatus } from './statusBar';
import {
	getShellConfigFilePath,
	autoUpdateAcpCommand,
	createInstructionFile,
	removeAcpCommand,
} from './shellConfig';

export function activate(context: vscode.ExtensionContext): void {
	console.log('ACP-GIT-COMMAND extension is now active.');

	// Status bar
	const gitStatusIndicator = createStatusBar();
	context.subscriptions.push(gitStatusIndicator);
	setupStatusBarListeners(gitStatusIndicator, context);

	// Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.acpCommand', openTerminalAndRunAcp),
		vscode.commands.registerCommand('acp-git-commands.installACPCommand', () => {
			const configPath = getShellConfigFilePath();
			if (configPath) {
				const wasUpdated = autoUpdateAcpCommand(configPath);
				if (wasUpdated) {
					vscode.window.showInformationMessage('ACP command was successfully updated.');
				}
			} else {
				createInstructionFile();
				vscode.window.showWarningMessage(
					'No shell configuration file found. Instructions opened in editor.'
				);
			}
			updateGitStatus(gitStatusIndicator);
		})
	);

	// Auto-install/update shell function on activation
	const configPath = getShellConfigFilePath();
	if (configPath) {
		autoUpdateAcpCommand(configPath);
	} else {
		createInstructionFile();
		vscode.window.showWarningMessage(
			'No shell configuration file found. Instructions opened in editor.'
		);
	}
}

export function deactivate(): void {
	const configPath = getShellConfigFilePath();
	if (configPath && fs.existsSync(configPath)) {
		removeAcpCommand(configPath);
	}
}

function openTerminalAndRunAcp(): void {
	const currentTerminal =
		vscode.window.activeTerminal ??
		vscode.window.createTerminal({ name: vscode.workspace.name ?? 'Workspace' });

	currentTerminal.show();

	// Short delay allows a freshly created terminal to initialize before receiving input
	setTimeout(() => {
		currentTerminal.sendText('acp ', false);
	}, 230);
}
