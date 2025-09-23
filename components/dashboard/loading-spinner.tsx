export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-sunroad-cream flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-sunroad-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-sunroad-brown-600 font-body">Loading your profile...</p>
      </div>
    </div>
  )
}
