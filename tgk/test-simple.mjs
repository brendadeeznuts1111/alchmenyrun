import { generateReleasePlan } from './commands/release-plan.js';

const plan = await generateReleasePlan({
  type: 'patch',
  components: ['core'],
  urgency: 'normal'
});

console.log('✅ Release plan generated successfully!');
console.log('Type:', plan.type);
console.log('Components:', plan.components.join(', '));
console.log('Risk Level:', plan.riskLevel);
console.log('Steps:', plan.steps.length);
console.log('Estimated Duration:', plan.estimatedDuration);
console.log('\n📝 First few steps:');
plan.steps.slice(0, 3).forEach((step, i) => {
  console.log(`  ${i + 1}. ${step}`);
});
