// Simple test script to verify release planning functionality
const { execSync } = require('child_process');

console.log('🧪 Testing Release Planning Core');

try {
  // Test 1: Basic release plan generation
  console.log('1️⃣ Testing basic release plan generation...');
  const result1 = execSync('node -e "
import { generateReleasePlan } from \"./commands/release-plan.js\";
generateReleasePlan({
  type: \"patch\",
  components: [\"core\"],
  urgency: \"normal\"
}).then(plan => {
  console.log(\"✅ Patch release plan generated:\");
  console.log(\"   Type:\", plan.type);
  console.log(\"   Components:\", plan.components.join(\", \"));
  console.log(\"   Risk Level:\", plan.riskLevel);
  console.log(\"   Steps:\", plan.steps.length);
  console.log(\"   Estimated Duration:\", plan.estimatedDuration);
}).catch(err => console.error(\"❌ Error:\", err.message));
"', { stdio: 'inherit', cwd: '/Users/nolarose/alchmenyrun/tgk' });

  console.log('\n✅ Release planning tests completed!');
} catch (error) {
  console.error('❌ Test failed:', error.message);
}
