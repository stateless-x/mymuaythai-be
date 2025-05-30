import { runner as gymTestRunner } from './gym.test';

async function runAllTests() {
  console.log('🧪 MyMuayThai Backend Test Suite\n');
  console.log('================================\n');

  try {
    // Run gym tests
    const gymResults = await gymTestRunner.run();

    console.log('\n================================');
    console.log('📊 Overall Test Results:');
    console.log(`✅ Total Passed: ${gymResults.passed}`);
    console.log(`❌ Total Failed: ${gymResults.failed}`);
    console.log(`📈 Success Rate: ${((gymResults.passed / (gymResults.passed + gymResults.failed)) * 100).toFixed(1)}%`);

    if (gymResults.failed > 0) {
      console.log('\n⚠️  Some tests failed. Please check the output above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test suite failed to run:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
runAllTests(); 