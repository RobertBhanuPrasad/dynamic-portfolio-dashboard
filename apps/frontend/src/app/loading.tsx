export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-600 font-medium animate-pulse">Loading portfolio data...</p>
    </div>
  );
}
