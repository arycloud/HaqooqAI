import React, { useState } from "react"

interface Provider {
  name: string
  key: string
}

export default function MultiProviderApiKeySettings() {
  const [providers, setProviders] = useState<Provider[]>([
    { name: "OpenAI", key: "" },
    { name: "Anthropic", key: "" },
  ])

  const handleChange = (idx: number, value: string) => {
    const updated = [...providers]
    updated[idx].key = value
    setProviders(updated)
  }

  return (
    <div className="panel border hairline rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-transform">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
        API Providers
      </h2>
      <div className="space-y-3">
        {providers.map((provider, idx) => (
          <div
            key={provider.name}
            className="rounded-xl border hairline bg-[var(--input-color)] p-3 shadow-sm hover:shadow-md transition"
          >
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              {provider.name}
            </p>
            <input
              type="password"
              value={provider.key}
              onChange={(e) => handleChange(idx, e.target.value)}
              placeholder={`Enter ${provider.name} key`}
              className="w-full rounded-lg bg-[var(--sidebar-color)] border hairline px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
