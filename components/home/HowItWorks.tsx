import { MousePointerClick, Layers, Search, Instagram, Globe, Music } from "lucide-react";

/**
 * HowItWorks - Premium 3-step explainer with synced animations
 * 
 * Features:
 * - SVG conveyor belt connector (dots flow left->right on desktop, top->bottom on mobile)
 * - All step animations synced to 12s master timeline
 * - Cumulative reveal: Step 1 appears, then Step 2, then Step 3, all stay until reset
 * - All animations respect prefers-reduced-motion
 * - CSS-only, no external animation libraries, ISR-friendly
 */
export default function HowItWorks() {
  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 overflow-hidden">
      
      {/* Header */}
      <div className="relative text-center mb-16 z-10">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 tracking-tight">
          How it works
        </h2>
        <p className="mt-4 text-gray-600 text-lg max-w-xl mx-auto leading-relaxed">
          Build your portfolio in minutes - free to start, upgrade for visibility.
        </p>
      </div>

      {/* Flow Connector - Desktop (Horizontal SVG conveyor belt) */}
      <div className="hidden md:block absolute top-[calc(50%+2rem)] left-1/2 -translate-x-1/2 w-[60%] max-w-2xl z-0" aria-hidden="true">
        <svg 
          viewBox="0 0 100 2" 
          preserveAspectRatio="none" 
          className="w-full h-3"
        >
          <line 
            x1="0" 
            y1="1" 
            x2="100" 
            y2="1" 
            stroke="rgba(209,213,219,0.6)" 
            strokeWidth="1" 
            strokeLinecap="round" 
            strokeDasharray="1 4"
            className="howitworks-dash-flow-h motion-reduce:[animation:none]"
          />
        </svg>
      </div>

      {/* Steps Grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 z-10">
        
        {/* --- STEP 1: CLAIM --- */}
        <div className="group relative flex flex-col items-center text-center">
          
          {/* Card Visual - synced focus pulse */}
          <div 
            className="relative w-24 h-24 mb-6 rounded-3xl bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center 
                       animate-howitworks-card-1 motion-reduce:animate-none
                       group-hover:-translate-y-1 transition-transform duration-700 ease-out motion-reduce:group-hover:translate-y-0"
          >
            {/* Free Badge */}
            <div className="absolute -top-3 -right-3 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200/80">
              Free
            </div>
            
            {/* URL pill - synced to step 1 focus */}
            <div 
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-mono 
                         px-2 py-0.5 rounded-full whitespace-nowrap
                         animate-howitworks-url motion-reduce:animate-none"
              aria-hidden="true"
            >
              sunroad.io/you
            </div>
            
            {/* Icon - synced focus pulse with tap */}
            <div className="relative">
              <div className="absolute inset-0 bg-amber-100 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
              <MousePointerClick 
                className="w-10 h-10 text-gray-800 relative z-10 animate-howitworks-icon-1 motion-reduce:animate-none" 
                strokeWidth={1.5} 
              />
            </div>
          </div>

          <h3 className="text-xl font-display font-semibold text-gray-900 mb-3">
            1. Claim your link
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Get a clean, shareable portfolio URL - free forever.
          </p>
          
          {/* Mobile-only connector - SVG conveyor belt */}
          <div className="md:hidden relative h-16 w-4 my-4 flex justify-center" aria-hidden="true">
            <svg 
              viewBox="0 0 2 100" 
              preserveAspectRatio="none" 
              className="h-full w-3"
            >
              <line 
                x1="1" 
                y1="0" 
                x2="1" 
                y2="100" 
                stroke="rgba(209,213,219,0.6)" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeDasharray="1 4"
                className="howitworks-dash-flow-v motion-reduce:[animation:none]"
              />
            </svg>
          </div>
        </div>

        {/* --- STEP 2: CURATE --- */}
        <div className="group relative flex flex-col items-center text-center">
          
          {/* Card Visual - synced focus pulse */}
          <div 
            className="relative w-24 h-24 mb-6 rounded-3xl bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center 
                       animate-howitworks-card-2 motion-reduce:animate-none
                       group-hover:-translate-y-1 transition-transform duration-700 ease-out delay-75 motion-reduce:group-hover:translate-y-0"
          >
            {/* Free Badge */}
            <div className="absolute -top-3 -right-3 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200/80">
              Free
            </div>

            {/* Stacking layers - synced to step 2 focus */}
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div 
                className="absolute w-8 h-5 bg-blue-100/70 rounded-md
                           animate-howitworks-stack-1 motion-reduce:animate-none"
              />
              <div 
                className="absolute w-8 h-5 bg-pink-100/70 rounded-md
                           animate-howitworks-stack-2 motion-reduce:animate-none"
              />
              <div 
                className="absolute w-8 h-5 bg-amber-100/70 rounded-md
                           animate-howitworks-stack-3 motion-reduce:animate-none"
              />
            </div>

            {/* Icon - synced focus pulse */}
            <Layers 
              className="w-10 h-10 text-gray-800 relative z-10 animate-howitworks-icon-2 motion-reduce:animate-none" 
              strokeWidth={1.5} 
            />
            
            {/* Social chips - larger size */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none" aria-hidden="true">
              {/* Chip 1 - Instagram */}
              <div 
                className="absolute bottom-1 -left-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-full flex items-center justify-center border border-pink-100/50
                           animate-howitworks-drift-1 motion-reduce:animate-none"
              >
                <Instagram className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-500" />
              </div>
              {/* Chip 2 - Globe */}
              <div 
                className="absolute -bottom-0.5 left-5 w-5 h-5 sm:w-6 sm:h-6 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100/50
                           animate-howitworks-drift-2 motion-reduce:animate-none"
              >
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
              </div>
              {/* Chip 3 - Music */}
              <div 
                className="absolute bottom-1 left-10 sm:left-11 w-5 h-5 sm:w-6 sm:h-6 bg-green-50 rounded-full flex items-center justify-center border border-green-100/50
                           animate-howitworks-drift-3 motion-reduce:animate-none"
              >
                <Music className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
              </div>
            </div>
          </div>

          <h3 className="text-xl font-display font-semibold text-gray-900 mb-3">
            2. Add your work
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Upload photos, videos, and links - one page for everything.
          </p>

          {/* Mobile-only connector - SVG conveyor belt */}
          <div className="md:hidden relative h-16 w-4 my-4 flex justify-center" aria-hidden="true">
            <svg 
              viewBox="0 0 2 100" 
              preserveAspectRatio="none" 
              className="h-full w-3"
            >
              <line 
                x1="1" 
                y1="0" 
                x2="1" 
                y2="100" 
                stroke="rgba(209,213,219,0.6)" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeDasharray="1 4"
                className="howitworks-dash-flow-v motion-reduce:[animation:none]"
              />
            </svg>
          </div>
        </div>

        {/* --- STEP 3: CONNECT --- */}
        <div className="group relative flex flex-col items-center text-center">
          
          {/* Card Visual - synced focus pulse */}
          <div 
            className="relative w-24 h-24 mb-6 rounded-3xl bg-white border border-amber-100 shadow-[0_8px_30px_rgb(251,191,36,0.12)] flex items-center justify-center 
                       animate-howitworks-card-3 motion-reduce:animate-none
                       group-hover:-translate-y-1 transition-transform duration-700 ease-out delay-150 motion-reduce:group-hover:translate-y-0"
          >
            {/* Premium Badge */}
            <div className="absolute -top-3 -right-3 bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200/80 shadow-sm">
              Premium
            </div>

            {/* Radar sweep - synced to step 3 focus */}
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div 
                className="absolute w-16 h-16 border border-amber-200 rounded-full 
                           animate-howitworks-radar-outer motion-reduce:animate-none"
              />
              <div 
                className="absolute w-10 h-10 border border-amber-300 rounded-full
                           animate-howitworks-radar-inner motion-reduce:animate-none"
              />
              <div 
                className="absolute top-4 right-4 w-1.5 h-1.5 bg-amber-500 rounded-full
                           animate-howitworks-ping motion-reduce:animate-none"
              />
            </div>
            
            {/* Icon - synced focus pulse */}
            <Search 
              className="w-10 h-10 text-amber-600 relative z-10 animate-howitworks-icon-3 motion-reduce:animate-none" 
              strokeWidth={1.5} 
            />
          </div>

          <h3 className="text-xl font-display font-semibold text-gray-900 mb-3">
            3. Get discovered
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Appear in search results and receive direct inquiries.
          </p>
        </div>

      </div>
    </section>
  );
}
