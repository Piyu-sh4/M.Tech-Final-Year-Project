/**
 * tests/teardown.js — Global test teardown
 * Runs once after all test suites complete.
 */
module.exports = async function globalTeardown() {
  console.log('[TEST TEARDOWN] All tests complete. DB cleaned up by afterAll() hooks in each suite.');
};
