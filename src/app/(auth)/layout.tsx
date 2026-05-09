export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col md:flex-row">

      {/* Desktop left panel */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 flex-col items-center justify-center p-12 gap-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl mx-auto mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sawari-app.png" alt="Sawari Book" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Sawari Book</h1>
          <p className="text-slate-400 text-lg">Track Every Ride. Know Your Profit.</p>
          <p className="text-slate-500 text-sm mt-2" dir="rtl">سواریاں ریکارڈ کریں، منافع جانیں</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-sm">
          {[
            { icon: "🚗", label: "Ride Tracking"     },
            { icon: "⛽", label: "Fuel Management"   },
            { icon: "💰", label: "Monthly Settlement" },
            { icon: "📊", label: "Reports & Analytics"},
          ].map(({ icon, label }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-3 flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <span className="text-xs text-slate-300 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <main className="flex-1 flex flex-col justify-center px-6 py-8 md:px-12 max-w-md md:max-w-lg mx-auto w-full">
        {children}
      </main>

    </div>
  );
}
