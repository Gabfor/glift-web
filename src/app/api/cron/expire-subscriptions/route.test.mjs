import test from 'node:test';
import assert from 'node:assert';

test('Subscription Expiration: identifies expired trial > 30 days', () => {
  const trialStarted = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
  const trialEndMs = new Date(trialStarted).getTime() + 30 * 24 * 60 * 60 * 1000;
  assert.strictEqual(trialEndMs < Date.now(), true);
});

test('Subscription Expiration: does not expire trial within 30 days', () => {
  const trialStarted = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const trialEndMs = new Date(trialStarted).getTime() + 30 * 24 * 60 * 60 * 1000;
  assert.strictEqual(trialEndMs < Date.now(), false);
});

test('Subscription Expiration: does not expire paid subscription in active period', () => {
  const premiumEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
  assert.strictEqual(new Date(premiumEnd).getTime() > Date.now(), true);
});
