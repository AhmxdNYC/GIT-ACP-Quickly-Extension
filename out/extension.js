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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const statusBar_1 = require("./statusBar");
const shellConfig_1 = require("./shellConfig");
function activate(context) {
    console.log('ACP-GIT-COMMAND extension is now active.');
    // Status bar
    const gitStatusIndicator = (0, statusBar_1.createStatusBar)();
    context.subscriptions.push(gitStatusIndicator);
    (0, statusBar_1.setupStatusBarListeners)(gitStatusIndicator, context);
    // Commands
    context.subscriptions.push(vscode.commands.registerCommand('extension.acpCommand', openTerminalAndRunAcp), vscode.commands.registerCommand('acp-git-commands.installACPCommand', () => {
        const configPath = (0, shellConfig_1.getShellConfigFilePath)();
        if (configPath) {
            const wasUpdated = (0, shellConfig_1.autoUpdateAcpCommand)(configPath);
            if (wasUpdated) {
                vscode.window.showInformationMessage('ACP command was successfully updated.');
            }
        }
        else {
            (0, shellConfig_1.createInstructionFile)();
            vscode.window.showWarningMessage('No shell configuration file found. Instructions opened in editor.');
        }
        (0, statusBar_1.updateGitStatus)(gitStatusIndicator);
    }));
    // Auto-install/update shell function on activation
    const configPath = (0, shellConfig_1.getShellConfigFilePath)();
    if (configPath) {
        (0, shellConfig_1.autoUpdateAcpCommand)(configPath);
    }
    else {
        (0, shellConfig_1.createInstructionFile)();
        vscode.window.showWarningMessage('No shell configuration file found. Instructions opened in editor.');
    }
}
exports.activate = activate;
function deactivate() {
    const configPath = (0, shellConfig_1.getShellConfigFilePath)();
    if (configPath && fs.existsSync(configPath)) {
        (0, shellConfig_1.removeAcpCommand)(configPath);
    }
}
exports.deactivate = deactivate;
function openTerminalAndRunAcp() {
    const currentTerminal = vscode.window.activeTerminal ??
        vscode.window.createTerminal({ name: vscode.workspace.name ?? 'Workspace' });
    currentTerminal.show();
    // Short delay allows a freshly created terminal to initialize before receiving input
    setTimeout(() => {
        currentTerminal.sendText('acp ', false);
    }, 230);
}
//# sourceMappingURL=extension.js.map