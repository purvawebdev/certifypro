"use client";
import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({ children }) {
  const year = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState("home");
  const [proposals, setProposals] = useState([]);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDesc, setProposalDesc] = useState("");

  const addProposal = () => {
    if (!proposalTitle.trim()) return alert("Enter proposal title");
    setProposals([
      ...proposals,
      {
        id: Date.now(),
        title: proposalTitle,
        desc: proposalDesc,
        createdAt: new Date().toLocaleDateString(),
      },
    ]);
    setProposalTitle("");
    setProposalDesc("");
  };

  const deleteProposal = (id) => {
    setProposals(proposals.filter((p) => p.id !== id));
  };

  const tabs = [
    { id: "home", label: " Home", icon: "🏠" },
    { id: "templates", label: " Templates", icon: "🎨" },
    { id: "history", label: " History", icon: "📊" },
    { id: "proposals", label: " Proposals", icon: "💡" },
    { id: "settings", label: " Settings", icon: "⚙️" },
  ];

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-linear-to-br from-gray-50 to-blue-50 text-gray-800`}
      >
        {/* Skip link for keyboard users */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:p-2 focus:rounded-md focus:shadow"
        >
          Skip to content
        </a>

        {/* Header */}
        <header className="border-b bg-white/60 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                CP
              </div>
              <div>
                <a href="/" className="text-lg font-semibold text-gray-900">
                  CertifyPro
                </a>
                <div className="text-xs text-gray-500 -mt-0.5">
                  Batch certificate generator
                </div>
              </div>
            </div>

            <nav
              aria-label="Main navigation"
              className="hidden md:flex items-center gap-6 text-sm text-gray-600"
            >
              <a href="/" className="hover:text-gray-900">
                Home
              </a>
              <a href="#templates" className="hover:text-gray-900">
                Templates
              </a>
              <a href="#about" className="hover:text-gray-900">
                About
              </a>
              <a href="#help" className="hover:text-gray-900">
                Help
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <a
                href="#"
                className="text-sm text-indigo-600 border border-indigo-600 px-3 py-1 rounded hover:bg-indigo-50"
              >
                Try demo
              </a>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? "text-indigo-600 border-indigo-600 bg-indigo-50"
                      : "text-gray-600 hover:text-gray-900 border-transparent"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main id="content" className="min-h-[calc(100vh-200px)] flex flex-col">
          <div className="max-w-7xl mx-auto w-full px-6 py-10 flex-1">
            {/* Home Tab (Default - Shows Children) */}
            {activeTab === "home" && children}

            {/* Templates Tab */}
            {activeTab === "templates" && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                  Certificate Templates
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                    >
                      <div className="bg-linear-to-br from-indigo-400 to-blue-500 h-40 flex items-center justify-center">
                        <span className="text-white text-3xl">🎓</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900">
                          Template {i}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">
                          Professional certificate design
                        </p>
                        <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 text-sm font-medium">
                          Use Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                  Generation History
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Batch Name
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Certificates
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="px-6 py-3">2025-01-20</td>
                        <td className="px-6 py-3">Winter Course 2025</td>
                        <td className="px-6 py-3">150</td>
                        <td className="px-6 py-3">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                            ✅ Sent
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="px-6 py-3">2025-01-15</td>
                        <td className="px-6 py-3">Advanced Python</td>
                        <td className="px-6 py-3">85</td>
                        <td className="px-6 py-3">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                            ✅ Sent
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Proposals Tab */}
            {activeTab === "proposals" && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                  Proposals & Ideas
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 bg-indigo-50 rounded-lg p-6 border border-indigo-200 h-fit">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      ➕ Add New Proposal
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Proposal title"
                        value={proposalTitle}
                        onChange={(e) => setProposalTitle(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-lg"
                      />
                      <textarea
                        placeholder="Description..."
                        value={proposalDesc}
                        onChange={(e) => setProposalDesc(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-lg h-24 resize-none"
                      />
                      <button
                        onClick={addProposal}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold"
                      >
                        ➕ Add Proposal
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    {proposals.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg">
                          💭 No proposals yet. Add your first idea!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {proposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {proposal.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-2">
                                  {proposal.desc}
                                </p>
                                <p className="text-xs text-gray-500 mt-3">
                                  📅 {proposal.createdAt}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteProposal(proposal.id)}
                                className="text-red-600 hover:text-red-800 font-semibold ml-4"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                  Settings
                </h2>
                <div className="space-y-6">
                  <div className="border-b pb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Account
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full border border-gray-300 p-3 rounded-lg"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 p-3 rounded-lg"
                          placeholder="Your Organization"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Default Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Font
                        </label>
                        <select className="w-full border border-gray-300 p-3 rounded-lg">
                          <option>Times</option>
                          <option>Helvetica</option>
                          <option>Courier</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Font Size
                        </label>
                        <input
                          type="number"
                          className="w-full border border-gray-300 p-3 rounded-lg"
                          defaultValue="24"
                        />
                      </div>
                    </div>
                  </div>

                  <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold">
                    💾 Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                CP
              </div>
              <div>
                <div className="font-medium text-gray-900">CertifyPro</div>
                <div className="text-xs text-gray-500">
                  Create, batch-generate and export certificates quickly.
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              © {year} CertifyPro. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
