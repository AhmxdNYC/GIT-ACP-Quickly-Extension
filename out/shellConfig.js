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
exports.removeAcpCommand = exports.createInstructionFile = exports.autoUpdateAcpCommand = exports.getShellConfigFilePath = exports.getDetectedShellType = void 0;
const vscode = __importStar(require("vscode"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const shellScripts_1 = require("./shellScripts");
const VERSION = '1.0.0';
function getDetectedShellType() {
    // Honour the explicit VS Code setting first
    const config = vscode.workspace.getConfiguration('acpGitCommands');
    const settingShell = config.get('shellType');
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
exports.getDetectedShellType = getDetectedShellType;
function getShellConfigFilePath() {
    const shellType = getDetectedShellType();
    if (!shellType) {
        console.log('Unsupported or undetected shell.');
        return null;
    }
    let relativeConfigFile;
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
        fs.writeFileSync(configPath, (0, shellScripts_1.getShellFunctionScript)(VERSION, shellType));
        vscode.window.showInformationMessage(`${path.basename(relativeConfigFile)} created and initialized with ACP functions. ` +
            `Run \`code ${configPath}\` to inspect it.`);
    }
    return configPath;
}
exports.getShellConfigFilePath = getShellConfigFilePath;
function autoUpdateAcpCommand(shellConfigFilePath) {
    if (fs.existsSync(shellConfigFilePath)) {
        return updateAcpCommand(shellConfigFilePath);
    }
    console.log('Shell config file not found:', shellConfigFilePath);
    return false;
}
exports.autoUpdateAcpCommand = autoUpdateAcpCommand;
function createInstructionFile() {
    const shellType = getDetectedShellType() ?? 'bash';
    const script = (0, shellScripts_1.getShellFunctionScript)(VERSION, shellType);
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
exports.createInstructionFile = createInstructionFile;
function removeAcpCommand(shellConfigFilePath) {
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
    }
    catch (error) {
        console.error('Failed to remove ACP functions:', error);
    }
}
exports.removeAcpCommand = removeAcpCommand;
function updateAcpCommand(shellConfigFilePath) {
    try {
        let content = fs.readFileSync(shellConfigFilePath, 'utf8');
        const versionRegex = /# ACP Version: (\d+\.\d+\.\d+)/;
        const existingVersion = content.match(versionRegex)?.[1] ?? 'none';
        if (existingVersion === VERSION) {
            console.log('ACP command is already up-to-date.');
            return true;
        }
        const shellType = getDetectedShellType() ?? 'bash';
        const newBlock = (0, shellScripts_1.getShellFunctionScript)(VERSION, shellType).trim() + '\n';
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
        }
        else {
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error updating ACP command:', error);
        vscode.window.showErrorMessage(`Error updating ACP command: ${message}`);
        return false;
    }
}
//# sourceMappingURL=shellConfig.js.map