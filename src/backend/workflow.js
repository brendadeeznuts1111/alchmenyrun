/**
 * Cloudflare Workflow for multi-step orchestration
 * Demonstrates durable workflows for complex business logic
 */
export default class OnboardingWorkflow {
  state;
  constructor(state) {
    this.state = state;
  }
  async run(event, step) {
    const data = event.payload;
    // Step 1: Validate user data
    await step.do("validate-user", async () => {
      if (!data.email || !data.name) {
        throw new Error("Email and name are required");
      }
      return { validated: true };
    });
    // Step 2: Create user profile
    const profile = await step.do("create-profile", async () => {
      // In a real implementation, this would create a user in D1
      return {
        userId: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        createdAt: new Date().toISOString(),
      };
    });
    // Step 3: Send welcome email (via queue)
    await step.do("send-welcome-email", async () => {
      // In a real implementation, this would enqueue an email job
      console.log(`Sending welcome email to ${profile.email}`);
      return { emailSent: true };
    });
    // Step 4: Initialize user settings
    await step.do("initialize-settings", async () => {
      // In a real implementation, this would set up default settings
      return {
        settings: {
          theme: "dark",
          notifications: true,
        },
      };
    });
    // Workflow complete
    await step.complete("onboarding-complete", {
      userId: profile.userId,
      message: "User onboarding completed successfully",
    });
  }
}
