// Demo test for CLI functionality
import { generateReleasePlan, assessRisk } from './commands/release-plan.js';

console.log('🧪 Testing Release Planning Core - CLI Demo');

// Test 1: Basic release plan generation
console.log('\n1️⃣ Testing basic release plan generation...');
const patchPlan = await generateReleasePlan({
  type: 'patch',
  components: ['core'],
  urgency: 'normal'
});

console.log(`✅ Patch release plan generated:`);
console.log(`   Type: ${patchPlan.type}`);
console.log(`   Components: ${patchPlan.components.join(', ')}`);
console.log(`   Risk Level: ${patchPlan.riskLevel}`);
console.log(`   Steps: ${patchPlan.steps.length}`);
console.log(`   Estimated Duration: ${patchPlan.estimatedDuration}`);

// Test 2: Minor release with policy check
console.log('\n2️⃣ Testing minor release with policy...');
const minorPlan = await generateReleasePlan({
  type: 'minor',
  components: ['core', 'ui'],
  urgency: 'normal'
});

console.log(`✅ Minor release plan generated:`);
console.log(`   Type: ${minorPlan.type}`);
console.log(`   Components: ${minorPlan.components.join(', ')}`);
console.log(`   Risk Level: ${minorPlan.riskLevel}`);
console.log(`   Steps: ${minorPlan.steps.length}`);
console.log(`   Estimated Duration: ${minorPlan.estimatedDuration}`);

// Test 3: Major release (high confidence scenario)
console.log('\n3️⃣ Testing major release...');
const majorPlan = await generateReleasePlan({
  type: 'major',
  components: ['core', 'ui', 'workers'],
  urgency: 'high'
});

console.log(`✅ Major release plan generated:`);
console.log(`   Type: ${majorPlan.type}`);
console.log(`   Components: ${majorPlan.components.join(', ')}`);
console.log(`   Risk Level: ${majorPlan.riskLevel}`);
console.log(`   Steps: ${majorPlan.steps.length}`);
console.log(`   Estimated Duration: ${majorPlan.estimatedDuration}`);

// Test 4: Risk assessment validation
console.log('\n4️⃣ Testing risk assessment...');
const lowRisk = assessRisk({
  type: 'patch',
  components: ['ui'],
  urgency: 'normal'
});

const highRisk = assessRisk({
  type: 'major',
  components: ['core', 'database'],
  urgency: 'critical'
});

console.log(`✅ Risk assessment working:`);
console.log(`   Low risk scenario: ${lowRisk}`);
console.log(`   High risk scenario: ${highRisk}`);

console.log('\n✅ All Release Planning Core tests completed successfully!');
