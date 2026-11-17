// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const bodyMarkup = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? '';
const currencyFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 2
});

describe('Money2bar dashboard', () => {
	beforeEach(async () => {
		localStorage.clear();
		document.body.innerHTML = bodyMarkup.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
		vi.resetModules();
		await import('../script.js');
	});

	it('starts with zero totals and an empty chart', () => {
		expect(document.querySelector('#total-income').textContent).toBe(currencyFormatter.format(0));
		expect(document.querySelector('#total-expenses').textContent).toBe(currencyFormatter.format(0));
		expect(document.querySelector('#net-balance').textContent).toBe(currencyFormatter.format(0));
		expect(document.querySelector('#chart-empty').hidden).toBe(false);
	});

	it('updates totals and saves valid monthly amounts', () => {
		const incomeInput = document.querySelector('#income-january');
		const expenseInput = document.querySelector('#expenses-january');

		incomeInput.value = '50000';
		incomeInput.dispatchEvent(new Event('input', { bubbles: true }));
		expenseInput.value = '12000';
		expenseInput.dispatchEvent(new Event('input', { bubbles: true }));

		expect(document.querySelector('#total-income').textContent).toBe(currencyFormatter.format(50000));
		expect(document.querySelector('#total-expenses').textContent).toBe(currencyFormatter.format(12000));
		expect(document.querySelector('#net-balance').textContent).toBe(currencyFormatter.format(38000));
		expect(JSON.parse(localStorage.getItem('money2bar:monthly-data:v1')).january).toEqual({ income: 50000, expenses: 12000 });
	});

	it('rejects negative values without changing the totals', () => {
		const incomeInput = document.querySelector('#income-january');
		incomeInput.value = '-1';
		incomeInput.dispatchEvent(new Event('input', { bubbles: true }));

		expect(incomeInput.getAttribute('aria-invalid')).toBe('true');
		expect(document.querySelector('#total-income').textContent).toBe(currencyFormatter.format(0));
		expect(localStorage.getItem('money2bar:monthly-data:v1')).toBeNull();
	});

	it('confirms a valid username for chart downloads', () => {
		const usernameInput = document.querySelector('#username');
		usernameInput.value = 'jane';
		usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
		document.querySelector('.username-submit').click();

		expect(document.querySelector('#username-status').textContent).toBe(
			'Success! Your username will appear on the downloaded chart.'
		);
	});

	it('switches tabs and exposes the chart fallback when Chart.js is unavailable', () => {
		document.querySelector('#chart-tab').click();

		expect(document.querySelector('#chart-tab').getAttribute('aria-selected')).toBe('true');
		expect(document.querySelector('#data-panel').hidden).toBe(true);
		expect(document.querySelector('#chart-panel').hidden).toBe(false);
		expect(document.querySelector('#chart-unavailable').hidden).toBe(false);
	});
});
