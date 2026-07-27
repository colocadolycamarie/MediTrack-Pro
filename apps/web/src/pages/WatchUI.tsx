import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Pill, Check, Bell, X, QrCode } from "lucide-react";
import { BackLink } from "@/components/BackLink";

export default function WatchUI() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeScreen, setActiveScreen] = useState<"face" | "alert" | "qr">("face");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Simulate an alert arriving after 5 seconds for the demo
    const alertTimer = setTimeout(() => {
      if (activeScreen === "face") setActiveScreen("alert");
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(alertTimer);
    };
  }, [activeScreen]);

  return (
    <div className="min-h-screen bg-panel-ink flex flex-col items-center justify-center p-4">
      <BackLink href="/" className="absolute top-8 left-8">Back to Landing</BackLink>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-white font-heading tracking-tight mb-2">PULSO Watch UI Preview</h1>
        <p className="text-[#F5F8F6]/50 max-w-md mx-auto">Interactive simulation of the smartwatch companion app. Wait 5 seconds for an alert simulation, or use the controls below.</p>
      </div>

      {/* The Watch Frame */}
      <div className="relative w-[320px] h-[380px] bg-[#1C4A41] rounded-[60px] p-4 border-[8px] border-panel-ink shadow-2xl flex items-center justify-center">
        {/* Hardware button */}
        <button 
          onClick={() => setActiveScreen("face")}
          aria-label="Return to watch face"
          className="absolute -right-[12px] top-1/2 -translate-y-1/2 w-[8px] h-16 bg-[#1A4B41] rounded-r-md cursor-pointer hover:bg-[#136363] active:w-[4px] transition-all"
        />

        {/* Screen */}
        <div className="w-full h-full bg-black rounded-[48px] overflow-hidden relative border-4 border-black">
          <AnimatePresence mode="wait">
            {activeScreen === "face" && (
              <motion.div 
                key="face"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col p-6 text-white"
              >
                <div className="flex justify-between items-center mb-6">
                  <ShieldAlert className="w-5 h-5 text-[#F5F8F6]/40" />
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                </div>
                
                <div className="text-center mb-8 mt-2">
                  <div className="text-5xl font-bold font-mono tracking-tighter mb-1">
                    {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                  </div>
                  <div className="text-[#F5F8F6]/40 font-semibold text-sm uppercase tracking-widest">
                    {currentTime.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'})}
                  </div>
                </div>

                <div className="bg-[#1C4A41] rounded-3xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#F5F8F6]/50 font-bold uppercase tracking-wider">Next Dose</div>
                    <div className="font-bold text-lg">02:14</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeScreen === "alert" && (
              <motion.div 
                key="alert"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col bg-accent text-accent-foreground p-6 justify-between text-center relative overflow-hidden"
              >
                {/* Pulse ring */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-black/20 animate-ping" />
                
                <div className="relative z-10 pt-4">
                  <Bell className="w-10 h-10 mx-auto mb-4 animate-bounce" />
                  <h2 className="text-2xl font-black uppercase tracking-wide leading-tight mb-2">Time to take<br/>medicine</h2>
                  <p className="font-bold opacity-80">Losartan 50mg</p>
                </div>

                <div className="flex gap-3 relative z-10">
                  <button 
                    className="flex-1 bg-black text-white rounded-full py-4 font-bold text-lg active:scale-95 transition-transform shadow-lg"
                    onClick={() => setActiveScreen("face")}
                  >
                    TAKE
                  </button>
                  <button 
                    className="w-16 bg-black/20 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                    onClick={() => setActiveScreen("face")}
                    aria-label="Dismiss alert"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeScreen === "qr" && (
              <motion.div 
                key="qr"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col bg-destructive text-white p-6 justify-center items-center text-center"
              >
                <ShieldAlert className="w-8 h-8 mb-4" />
                <h2 className="text-xl font-black uppercase tracking-wide leading-tight mb-6">Medical Alert<br/>Scan QR</h2>
                <div className="bg-white p-3 rounded-2xl w-32 h-32 flex items-center justify-center">
                  <QrCode className="w-full h-full text-black" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Simulator Controls */}
      <div className="mt-12 flex gap-4 bg-[#1C4A41] p-4 rounded-2xl border border-panel-ink">
        <button 
          onClick={() => setActiveScreen("face")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeScreen === 'face' ? 'bg-white text-black' : 'text-[#F5F8F6]/50 hover:text-[#F5F8F6]'}`}
        >
          Watch Face
        </button>
        <button 
          onClick={() => setActiveScreen("alert")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeScreen === 'alert' ? 'bg-accent text-black' : 'text-[#F5F8F6]/50 hover:text-[#F5F8F6]'}`}
        >
          Trigger Alert
        </button>
        <button 
          onClick={() => setActiveScreen("qr")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeScreen === 'qr' ? 'bg-destructive text-white' : 'text-[#F5F8F6]/50 hover:text-[#F5F8F6]'}`}
        >
          Show QR ID
        </button>
      </div>
    </div>
  );
}
