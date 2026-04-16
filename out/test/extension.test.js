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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
suite('Extension — activation', () => {
    test('extension is registered in VS Code', () => {
        const ext = vscode.extensions.getExtension('AhmadNYC.acp-git-commands');
        assert.ok(ext, 'Extension should be registered');
    });
    test('extension activates successfully', async () => {
        const ext = vscode.extensions.getExtension('AhmadNYC.acp-git-commands');
        assert.ok(ext, 'Extension not found');
        await ext.activate();
        assert.ok(ext.isActive, 'Extension should be active after activate()');
    });
});
suite('Extension — commands', () => {
    suiteSetup(async () => {
        const ext = vscode.extensions.getExtension('AhmadNYC.acp-git-commands');
        if (ext && !ext.isActive) {
            await ext.activate();
        }
    });
    test('extension.acpCommand is registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('extension.acpCommand'), 'extension.acpCommand should be registered');
    });
    test('acp-git-commands.installACPCommand is registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('acp-git-commands.installACPCommand'), 'installACPCommand should be registered');
    });
    test('each command is registered exactly once', async () => {
        const commands = await vscode.commands.getCommands(true);
        const acpCount = commands.filter((c) => c === 'extension.acpCommand').length;
        const installCount = commands.filter((c) => c === 'acp-git-commands.installACPCommand').length;
        assert.strictEqual(acpCount, 1, 'extension.acpCommand registered more than once');
        assert.strictEqual(installCount, 1, 'installACPCommand registered more than once');
    });
});
//# sourceMappingURL=extension.test.js.map