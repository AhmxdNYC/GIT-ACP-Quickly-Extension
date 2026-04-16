import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension — activation', () => {
	test('extension is registered in VS Code', () => {
		const ext = vscode.extensions.getExtension('AhmadNYC.acp-git-commands');
		assert.ok(ext, 'Extension should be registered');
	});

	test('extension activates successfully', async () => {
		const ext = vscode.extensions.getExtension('AhmadNYC.acp-git-commands');
		assert.ok(ext, 'Extension not found');
		await ext!.activate();
		assert.ok(ext!.isActive, 'Extension should be active after activate()');
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
		assert.ok(
			commands.includes('extension.acpCommand'),
			'extension.acpCommand should be registered'
		);
	});

	test('acp-git-commands.installACPCommand is registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(
			commands.includes('acp-git-commands.installACPCommand'),
			'installACPCommand should be registered'
		);
	});

	test('each command is registered exactly once', async () => {
		const commands = await vscode.commands.getCommands(true);
		const acpCount = commands.filter((c) => c === 'extension.acpCommand').length;
		const installCount = commands.filter((c) => c === 'acp-git-commands.installACPCommand').length;
		assert.strictEqual(acpCount, 1, 'extension.acpCommand registered more than once');
		assert.strictEqual(installCount, 1, 'installACPCommand registered more than once');
	});
});
