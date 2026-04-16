import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { ShellType, getShellFunctionScript } from './shellScripts';

const VERSION = '1.0.0';

export function getDetectedShellType(): ShellType | null {
	// Honour the explicit VS Code setting first
	const config = vscode.workspace.getConfiguration('acpGitCommands');
	const settingShell = config.get<string>('shellType');
	if (settingShell === 'bash' || settingShell === 'zsh' || settingShell === 'fish') {
		return settingShell;
	}

	// Fall back to the process environment
	const shellBin = process.env.SHELL ?? '/bin/bash';
	const shellName = path.basename(shellBin);
	if (shellName === 'bash' || shellName === 'zsh' || shellName === 'fish') {
		return shellName;
	}

	return null;
}

export function getShellConfigFilePath(): string | null {
	const shellType = getDetectedShellType();
	if (!shellType) {
		console.log('Unsupported or undetected shell.');
		return null;
	}

	let relativeConfigFile: string;
	switch (shellType) {
		case 'bash':
			relativeConfigFile = '.bash_profile';
			break;
		case 'zsh':
			relativeConfigFile = '.zshrc';
			break;
		case 'fish':
			relativeConfigFile = path.join('.config', 'fish', 'config.fish');
			break;
	}

	const configPath = path.join(os.homedir(), relativeConfigFile);

	if (!fs.existsSync(configPath)) {
		if (shellType === 'fish') {
			const fishDir = path.dirname(configPath);
			if (!fs.existsSync(fishDir)) {
				fs.mkdirSync(fishDir, { recursive: true });
			}
		}
		fs.writeFileSync(configPath, getShellFunctionScript(VERSION, shellType));
		vscode.window.showInformationMessage(
			`${path.basename(relativeConfigFile)} created and initialized with ACP functions. ` +
				`Run \`code ${configPath}\` to inspect it.`
		);
	}

	return configPath;
}

export function autoUpdateAcpCommand(shellConfigFilePath: string): boolean {
	if (fs.existsSync(shellConfigFilePath)) {
		return updateAcpCommand(shellConfigFilePath);
	}
	console.log('Shell config file not found:', shellConfigFilePath);
	return false;
}

export function createInstructionFile(): void {
	const shellType = getDetectedShellType() ?? 'bash';
	const script = getShellFunctionScript(VERSION, shellType);
	const instructions = [
		'# ACP Shell Function — Manual Installation',
		'',
		'Add the following to your shell configuration file (e.g. ~/.zshrc, ~/.bash_profile,',
		'or ~/.config/fish/config.fish), then restart your terminal or run `source <file>`.',
		'',
		'```',
		script,
		'```',
	].join('\n');

	vscode.workspace
		.openTextDocument({ content: instructions, language: 'markdown' })
		.then((doc) => vscode.window.showTextDocument(doc, { preview: false }));
}

export function removeAcpCommand(shellConfigFilePath: string): void {
	try {
		let content = fs.readFileSync(shellConfigFilePath, 'utf8');
		const startMarker = '# BEGIN: ACP Function';
		const endMarker = '# END: ACP Function';
		const startIndex = content.indexOf(startMarker);
		const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length;

		if (startIndex !== -1 && endIndex >= endMarker.length) {
			content = content.substring(0, startIndex) + content.substring(endIndex);
			content = content.replace(/\n{2,}/g, '\n');
			fs.writeFileSync(shellConfigFilePath, content);
			console.log('ACP functions removed from shell config.');
		}
	} catch (error) {
		console.error('Failed to remove ACP functions:', error);
	}
}

function updateAcpCommand(shellConfigFilePath: string): boolean {
	try {
		let content = fs.readFileSync(shellConfigFilePath, 'utf8');

		const versionRegex = /# ACP Version: (\d+\.\d+\.\d+)/;
		const existingVersion = content.match(versionRegex)?.[1] ?? 'none';

		if (existingVersion === VERSION) {
			console.log('ACP command is already up-to-date.');
			return true;
		}

		const shellType = getDetectedShellType() ?? 'bash';
		const newBlock = getShellFunctionScript(VERSION, shellType).trim() + '\n';

		const startMarker = '# BEGIN: ACP Function';
		const endMarker = '# END: ACP Function';
		let startIndex = content.indexOf(startMarker);
		let endIndex = content.indexOf(endMarker, startIndex);

		if (startIndex !== -1 && endIndex !== -1) {
			endIndex += endMarker.length;
			while (startIndex > 0 && content[startIndex - 1] === '\n') {
				startIndex--;
			}
			if (content[endIndex] === '\n') {
				endIndex++;
			}
			content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
		} else {
			content = content.trim() + '\n' + newBlock;
		}

		fs.writeFileSync(shellConfigFilePath, content);

		// Restart the active terminal so the updated config is sourced automatically
		const activeTerminal = vscode.window.activeTerminal;
		if (activeTerminal) {
			const terminalName = activeTerminal.name;
			activeTerminal.dispose();
			vscode.window.createTerminal({ name: terminalName }).show();
		}

		return true;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error('Error updating ACP command:', error);
		vscode.window.showErrorMessage(`Error updating ACP command: ${message}`);
		return false;
	}
}
