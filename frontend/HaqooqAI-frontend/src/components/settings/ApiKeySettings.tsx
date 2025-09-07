import React, { useState } from "react"

export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState("")

  return (
    <div className="panel border hairline rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-transform">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
        API Key
      </h2>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your API key"
        className="w-full rounded-lg bg-[var(--input-color)] border hairline px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
      />
      <button
        className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-white shadow-md hover:opacity-90 transition"
        style={{ background: "var(--gradient-primary)" }}
      >
        Save Key
      </button>
    </div>
  )
}
