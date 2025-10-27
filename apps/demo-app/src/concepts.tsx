import React from "react";

interface Feature {
  name: string;
  status: "shipped" | "beta" | "planned";
  phase: number;
}

const features: Feature[] = [
  { name: "Cloudflare Workers", status: "shipped", phase: 1 },
  { name: "D1 Databases", status: "shipped", phase: 1 },
  { name: "KV Namespaces", status: "shipped", phase: 1 },
  { name: "R2 Buckets", status: "shipped", phase: 1 },
  { name: "Durable Objects", status: "shipped", phase: 1 },
  { name: "Queues", status: "shipped", phase: 1 },
  { name: "JobQueue (Advanced)", status: "shipped", phase: 1 },
  { name: "Profile-based auth & multi-account", status: "shipped", phase: 1 },
  { name: "WorkerLoader (Dynamic)", status: "shipped", phase: 1 },
  { name: "React Hooks Integration", status: "beta", phase: 2 },
  { name: "SSR Support", status: "beta", phase: 2 },
  { name: "Multi-tenant Architecture", status: "planned", phase: 3 },
  { name: "Advanced Caching", status: "planned", phase: 3 },
  { name: "Workflow Orchestration", status: "planned", phase: 3 },
];

const getStatusColor = (status: Feature["status"]) => {
  switch (status) {
    case "shipped":
      return "bg-green-100 text-green-800";
    case "beta":
      return "bg-yellow-100 text-yellow-800";
    case "planned":
      return "bg-gray-100 text-gray-800";
  }
};

export function ConceptsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Alchemy.run Feature Matrix
          </h1>
          <p className="text-xl text-gray-600">
            Complete Cloudflare Infrastructure as Code
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Phase 1: Core Infrastructure 🏗️
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {features
              .filter((f) => f.phase === 1)
              .map((feature, index) => (
                <div
                  key={index}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <span className="text-gray-900">{feature.name}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}
                  >
                    {feature.status}
                  </span>
                </div>
              ))}
          </div>

          <div className="px-6 py-4 bg-blue-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Phase 2: React Integration ⚛️
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {features
              .filter((f) => f.phase === 2)
              .map((feature, index) => (
                <div
                  key={index}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <span className="text-gray-900">{feature.name}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}
                  >
                    {feature.status}
                  </span>
                </div>
              ))}
          </div>

          <div className="px-6 py-4 bg-purple-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Phase 3: Advanced Architecture 🚀
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {features
              .filter((f) => f.phase === 3)
              .map((feature, index) => (
                <div
                  key={index}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <span className="text-gray-900">{feature.name}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}
                  >
                    {feature.status}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="https://github.com/brendadeeznuts1111/alchmenyrun"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition mr-4"
          >
            View Documentation
          </a>
          <a
            href="https://github.com/brendadeeznuts1111/alchmenyrun/blob/main/docs/PROFILES_GUIDE.md"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Profiles Guide
          </a>
        </div>
      </div>
    </div>
  );
}
