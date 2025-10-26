import React from 'react';
import { formatDistance } from 'date-fns';
import './index.css';

/* ---------- TYPES ---------- */
type RssItem = {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
};

/* ---------- CONFIG ---------- */
const REPO = 'brendadeeznuts1111/alchmenyrun';
const RSS_RELEASES = `https://github.com/${REPO}/releases.atom`;
const RSS_BLOG     = `https://github.com/${REPO}/releases.atom`; // swap for real blog if you add one
const NPM_PKG      = 'https://www.npmjs.com/package/@alch/tunnel';

/* ---------- FEATURE MATRIX ---------- */
const features = [
  { name: 'Tunnel CRUD (create, read, update, delete)', status: 'shipped', phase: 1 },
  { name: 'Ingress rules & origin config', status: 'shipped', phase: 1 },
  { name: 'WARP routing', status: 'shipped', phase: 1 },
  { name: 'Real Cloudflare API', status: 'shipped', phase: 2 },
  { name: 'Secret redaction & safe logging', status: 'shipped', phase: 2 },
  { name: 'Integration test suite', status: 'shipped', phase: 2 },
  { name: 'Prometheus metrics exporter', status: 'roadmap', phase: 3 },
  { name: 'Zero-downtime config reload', status: 'roadmap', phase: 3 },
  { name: 'Graceful shutdown hooks', status: 'roadmap', phase: 3 },
  { name: 'npm publish @alch/tunnel', status: 'roadmap', phase: 3 },
];

/* ---------- HOOKS ---------- */
function useRss(url: string) {
  const [items, setItems] = React.useState<RssItem[]>([]);
  React.useEffect(() => {
    fetch(url)
      .then(r => r.text())
      .then(str => new window.DOMParser().parseFromString(str, 'text/xml'))
      .then(xml =>
        Array.from(xml.querySelectorAll('entry')).map(e => ({
          title: e.querySelector('title')?.textContent || '',
          link: e.querySelector('link')?.getAttribute('href') || '',
          pubDate: e.querySelector('updated')?.textContent || '',
          description: e.querySelector('summary')?.textContent || '',
        }))
      )
      .then(setItems)
      .catch(() => setItems([]));
  }, [url]);
  return items.slice(0, 5); // latest 5
}

/* ---------- COMPONENTS ---------- */
const Header = () => (
  <header className="bg-gradient-to-r from-orange-500 to-yellow-400 text-white">
    <div className="container mx-auto px-6 py-16">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        Alchemy.run Cloudflare Tunnel
      </h1>
      <p className="text-xl opacity-90">
        Deploy secure, auto-healing tunnels to any service—directly from your IaC pipeline.
      </p>
      <div className="mt-6 space-x-4">
        <a
          className="inline-block bg-white text-orange-600 px-5 py-2 rounded shadow hover:shadow-md transition"
          href={`https://github.com/${REPO}`}
          target="_blank"
          rel="noreferrer"
        >
          GitHub →
        </a>
        <a
          className="inline-block bg-white/20 text-white px-5 py-2 rounded border border-white/30 hover:bg-white/30 transition"
          href={NPM_PKG}
          target="_blank"
          rel="noreferrer"
        >
          npm @alch/tunnel
        </a>
      </div>
    </div>
  </header>
);

const FeatureTable = () => (
  <section className="py-12">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-semibold mb-6">Feature Roadmap</h2>
      <div className="overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 pr-4">Feature</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 pl-4">Phase</th>
            </tr>
          </thead>
          <tbody>
            {features.map(f => (
              <tr key={f.name} className="border-b border-gray-100">
                <td className="py-3 pr-4">{f.name}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                      f.status === 'shipped'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {f.status}
                  </span>
                </td>
                <td className="py-3 pl-4">Phase {f.phase}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

const RssCard = ({ title, items }: { title: string; items: RssItem[] }) => (
  <section className="py-12 bg-gray-50">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-semibold mb-6">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.length ? (
          items.map(i => (
            <a
              key={i.link}
              href={i.link}
              target="_blank"
              rel="noreferrer"
              className="block p-4 bg-white rounded shadow hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-gray-900">{i.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {formatDistance(new Date(i.pubDate), new Date())} ago
              </p>
              {i.description && (
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                  {i.description}
                </p>
              )}
            </a>
          ))
        ) : (
          <p className="text-gray-500">No recent entries.</p>
        )}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-gray-200 py-8">
    <div className="container mx-auto px-6 text-center text-gray-500">
      <p>
        Open-source under MIT. Found a bug?{' '}
        <a
          className="underline hover:text-orange-600"
          href={`https://github.com/${REPO}/issues`}
          target="_blank"
          rel="noreferrer"
        >
          File an issue
        </a>
        .
      </p>
      <p className="mt-2 text-sm">
        Demo deployed via{' '}
        <span className="font-mono">@alch/tunnel</span> v0.1.0
      </p>
    </div>
  </footer>
);

/* ---------- PAGE ---------- */
export default function DemoApp() {
  const releases = useRss(RSS_RELEASES);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <FeatureTable />
        <RssCard title="Latest Releases" items={releases} />
      </main>
      <Footer />
    </div>
  );
}
