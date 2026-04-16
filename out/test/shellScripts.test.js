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
const shellScripts_1 = require("../shellScripts");
const VERSION = '1.0.0';
suite('shellScripts — bash/zsh', () => {
    const script = (0, shellScripts_1.getShellFunctionScript)(VERSION, 'bash');
    test('contains BEGIN and END markers', () => {
        assert.ok(script.includes('# BEGIN: ACP Function'));
        assert.ok(script.includes('# END: ACP Function'));
    });
    test('embeds the correct version', () => {
        assert.ok(script.includes(`ACP Version: ${VERSION}`));
    });
    test('defines acp function', () => {
        assert.ok(script.includes('function acp()'));
    });
    test('defines acm function', () => {
        assert.ok(script.includes('function acm()'));
    });
    test('defines add function', () => {
        assert.ok(script.includes('function add()'));
    });
    test('defines cm function exactly once', () => {
        const count = (script.match(/function cm\(\)/g) ?? []).length;
        assert.strictEqual(count, 1, 'cm() should be defined exactly once — not duplicated');
    });
    test('acp checks for git repo before doing anything', () => {
        const acpBody = script.slice(script.indexOf('function acp()'));
        assert.ok(acpBody.includes('git rev-parse --is-inside-work-tree'));
    });
    test('acp checks for detached HEAD', () => {
        const acpBody = script.slice(script.indexOf('function acp()'));
        assert.ok(acpBody.includes('git symbolic-ref'));
    });
    test('acp checks upstream before pushing', () => {
        const acpBody = script.slice(script.indexOf('function acp()'));
        assert.ok(acpBody.includes('@{u}'));
    });
    test('acp requires a commit message', () => {
        const acpBody = script.slice(script.indexOf('function acp()'));
        assert.ok(acpBody.includes('No commit message provided'));
    });
    test('zsh script is identical to bash', () => {
        const zshScript = (0, shellScripts_1.getShellFunctionScript)(VERSION, 'zsh');
        assert.strictEqual(script, zshScript);
    });
});
suite('shellScripts — fish', () => {
    const script = (0, shellScripts_1.getShellFunctionScript)(VERSION, 'fish');
    test('contains BEGIN and END markers', () => {
        assert.ok(script.includes('# BEGIN: ACP Function'));
        assert.ok(script.includes('# END: ACP Function'));
    });
    test('embeds the correct version', () => {
        assert.ok(script.includes(`ACP Version: ${VERSION}`));
    });
    test('uses fish function syntax (no parentheses)', () => {
        assert.ok(script.includes('\nfunction acp\n') || script.includes('\nfunction acp '));
        assert.ok(!script.includes('function acp()'), 'fish should not use bash-style function()');
    });
    test('uses fish end keyword instead of closing brace', () => {
        assert.ok(script.includes('\nend\n'));
        assert.ok(!script.includes('}\n'), 'fish should not use bash-style closing braces');
    });
    test('uses set_color instead of ANSI escape codes', () => {
        assert.ok(script.includes('set_color red'));
        assert.ok(script.includes('set_color green'));
        assert.ok(!script.includes('\\x1b['), 'fish should not use raw ANSI escape codes');
    });
    test('uses fish set -l for local variables', () => {
        assert.ok(script.includes('set -l '));
    });
    test('uses count $argv instead of $#', () => {
        assert.ok(script.includes('count $argv'));
        assert.ok(!script.includes('$#'), 'fish should not use $# for argument count');
    });
    test('uses string join to build commit message', () => {
        assert.ok(script.includes("string join ' ' $argv"));
    });
    test('defines all four functions', () => {
        assert.ok(script.includes('\nfunction acp'));
        assert.ok(script.includes('\nfunction acm'));
        assert.ok(script.includes('\nfunction add'));
        assert.ok(script.includes('\nfunction cm'));
    });
    test('cm defined exactly once', () => {
        const count = (script.match(/\nfunction cm\b/g) ?? []).length;
        assert.strictEqual(count, 1, 'cm should be defined exactly once');
    });
});
suite('shellScripts — version marker', () => {
    test('bash version marker is parseable by the update regex', () => {
        const script = (0, shellScripts_1.getShellFunctionScript)(VERSION, 'bash');
        const match = script.match(/# ACP Version: (\d+\.\d+\.\d+)/);
        assert.ok(match, 'version marker not found');
        assert.strictEqual(match[1], VERSION);
    });
    test('fish version marker is parseable by the update regex', () => {
        const script = (0, shellScripts_1.getShellFunctionScript)(VERSION, 'fish');
        const match = script.match(/# ACP Version: (\d+\.\d+\.\d+)/);
        assert.ok(match, 'version marker not found');
        assert.strictEqual(match[1], VERSION);
    });
});
//# sourceMappingURL=shellScripts.test.js.map