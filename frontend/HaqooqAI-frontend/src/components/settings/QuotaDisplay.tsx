import React from "react"

interface QuotaDisplayProps {
  used: number
  total: number
}

export function QuotaDisplay({ used, total }: QuotaDisplayProps) {
  const percent = Math.min((used / total) * 100, 100)

  return (
    <div className="panel border hairline rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-transform">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
        API Usage
      </h2>
      <div className="w-full h-3 bg-[var(--input-color)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percent}%`,
            background:
              "linear-gradient(90deg, var(--primary-color), var(--secondary-color))",
          }}
        />
      </div>
      <p className="text-xs text-[var(--text-secondary)] mt-2">
        {used} / {total} requests used
      </p>
    </div>
  )
}
