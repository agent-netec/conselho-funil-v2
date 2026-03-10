export default function AppLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-[#0D0B09]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-1 w-32 overflow-hidden bg-white/[0.06]">
          <div className="h-full w-1/3 bg-[#E6B447] animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
        <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A]">
          LOADING
        </p>
      </div>
    </div>
  );
}
