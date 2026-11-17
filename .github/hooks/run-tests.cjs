const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const event = JSON.parse(readFileSync(0, 'utf8'));

if (event.stop_hook_active === true) {
	process.stdout.write('{}');
	process.exit(0);
}

const result = spawnSync('npm', ['test'], {
	encoding: 'utf8',
	shell: process.platform === 'win32',
	timeout: 120_000
});

if (result.status === 0) {
	process.stdout.write('{}');
	process.exit(0);
}

const details = [result.stdout, result.stderr, result.error?.message]
	.filter(Boolean)
	.join('\n')
	.trim()
	.slice(-6000);

process.stdout.write(JSON.stringify({
	decision: 'block',
	reason: `npm test failed. Fix the test failures before finishing, then verify with npm test.\n\n${details}`
}));