export default function Loading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative mx-auto mb-4">
          <div className="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
