import { useState, useRef, useEffect } from "react";
import { apiRequest } from "../../lib/api";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useTypewriter } from "../../hooks/useTypewriter";

interface RecordViewProps {
  onBack: () => void;
}

export function RecordView({ onBack }: RecordViewProps) {
  const [status, setStatus] = useState<"idle" | "recording" | "transcribing" | "result">("idle");
  const [timer, setTimer] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [mrbrownText, setMrBrownText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const animatedMrBrownText = useTypewriter(mrbrownText, 20);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Web Audio Visualizer refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopStreams();
    };
  }, []);

  const stopStreams = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Start MediaRecorder
      const options = { mimeType: "audio/webm" };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback for Safari/iOS which might not support webm
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        
        // Create local playback url
        const localUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(localUrl);

        if (audioBlob.size < 500) {
          toast.error("Recording was too short. Please speak into the microphone!");
          setStatus("idle");
          return;
        }

        // Send to backend
        await uploadAudio(audioBlob);
      };

      // Set up Web Audio Analyser for Visualizer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      
      source.connect(analyser);

      // Start recording
      mediaRecorder.start(1000);
      setStatus("recording");
      setTimer(0);
      
      // Start duration counter
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);

      // Start visualizer drawing loop
      startVisualizer();

    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Microphone access denied or audio hardware not found");
      setStatus("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    stopStreams();
    setStatus("transcribing");
  };

  const uploadAudio = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("audio", blob, "entry.webm");

    try {
      const data = await apiRequest<{ 
        entry: { transcript: string; mrbrownResponse?: string };
        mrbrownAudio?: string;
      }>("/entries/voice", {
        method: "POST",
        body: formData,
      });

      setTranscript(data.entry.transcript);
      setMrBrownText(data.entry.mrbrownResponse || "");
      setStatus("result");
      toast.success("Transcription saved to your diary!");

      // Play Mr Brown's voice response automatically
      if (data.mrbrownAudio) {
        const audio = new Audio("data:audio/mpeg;base64," + data.mrbrownAudio);
        audio.play().catch((err) => console.error("Mr Brown voice playback failed:", err));
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to transcribe audio");
      setStatus("idle");
    }
  };

  const startVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (status !== "recording") return;

      const width = canvas.width;
      const height = canvas.height;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "rgba(255, 248, 240, 0.2)"; // Semi-transparent cream for tail trail
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 3;
      ctx.strokeStyle = "#D4838F"; // dusty-rose
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 py-16 animate-slide-up-in">
      <div className="relative w-full max-w-[420px]">
        {/* Main cloud/journal card */}
        <div
          className="relative rounded-[32px] px-7 py-8 md:px-9 md:py-10 text-center"
          style={{
            background: "rgba(255, 248, 240, 0.78)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(212, 131, 143, 0.3)",
            boxShadow: "0 8px 32px rgba(139, 34, 82, 0.12)",
          }}
        >
          <span className="absolute right-4 top-3 text-2xl select-none" style={{ transform: "rotate(15deg)" }}>🎀</span>
          <h2 className="font-script text-dusty-rose mb-5" style={{ fontSize: 36, lineHeight: 1 }}>Mr Brown</h2>

          {status === "idle" && (
            <div className="flex flex-col items-center gap-6 animate-fade-in">
              <h3 className="font-display text-ink-brown text-xl">Voice Diary Entry</h3>
              <p className="font-body text-soft-charcoal text-sm max-w-[280px]">
                Take a deep breath and tap the button to start speaking your thoughts.
              </p>

              {/* Record Button */}
              <button
                onClick={startRecording}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-blush text-4xl shadow-md border border-dusty-rose/40 hover:scale-105 active:scale-95 transition-all animate-pulse"
                style={{ background: "rgba(244, 194, 194, 0.6)" }}
              >
                🎙️
              </button>
            </div>
          )}

          {status === "recording" && (
            <div className="flex flex-col items-center gap-5 animate-fade-in">
              <h3 className="font-display text-ink-brown text-lg">Listening...</h3>
              <span className="font-mono text-2xl text-deep-red font-semibold">
                {formatTime(timer)}
              </span>

              {/* Canvas Wave Visualizer */}
              <div 
                className="w-full h-24 rounded-2xl overflow-hidden border border-dusty-rose/20 bg-cream/30"
              >
                <canvas 
                  ref={canvasRef} 
                  width={340} 
                  height={96} 
                  className="w-full h-full block" 
                />
              </div>

              {/* Stop Button */}
              <button
                onClick={stopRecording}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-ribbon-red text-2xl shadow-md border border-red-800/10 hover:scale-105 active:scale-95 transition-all"
                style={{ background: "rgba(196, 30, 58, 0.85)", color: "#fff" }}
              >
                ⏹️
              </button>
            </div>
          )}

          {status === "transcribing" && (
            <div className="flex flex-col items-center gap-6 py-8 animate-fade-in">
              <div className="h-12 w-12 rounded-full border-4 border-dusty-rose/20 border-t-dusty-rose animate-spin" />
              <h3 className="font-display text-ink-brown text-lg">Writing your words...</h3>
              <p className="font-body text-soft-charcoal text-xs animate-pulse">
                Mr Brown is listening closely to transcribe your voice
              </p>
            </div>
          )}

          {status === "result" && (
            <div className="flex flex-col gap-4 text-left animate-fade-in">
              <h3 className="font-display text-ink-brown text-lg text-center mb-1">Keepsake Created</h3>

              {/* User Entry Bubble */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-body text-soft-charcoal/70 pl-2">My thoughts:</span>
                <div
                  className="w-full max-h-[120px] overflow-y-auto px-5 py-3 font-display italic text-ink-brown rounded-2xl border border-dusty-rose/30 shadow-inner"
                  style={{
                    background: "repeating-linear-gradient(#fcfcfc, #fcfcfc 24px, #e8d0d4 25px)",
                    lineHeight: "25px",
                  }}
                >
                  {transcript}
                </div>
              </div>

              {/* Mr Brown's Response Bubble */}
              {mrbrownText && (
                <div className="flex flex-col gap-1.5 mt-2 animate-slide-up-in">
                  <span className="text-xs font-body text-dusty-rose pl-2 font-medium flex items-center gap-1">
                    <span>🎀</span> Mr Brown's Reply:
                  </span>
                  <div
                    className="w-full rounded-2xl px-5 py-4 font-body text-sm text-ink-brown border border-dusty-rose/20 relative"
                    style={{
                      background: "rgba(255, 248, 240, 0.95)",
                      boxShadow: "0 4px 16px rgba(139, 34, 82, 0.04)"
                    }}
                  >
                    <div className="prose prose-sm max-w-none text-ink-brown space-y-2 [&_strong]:font-semibold [&_strong]:text-deep-red animate-fade-in">
                      <ReactMarkdown>{animatedMrBrownText}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Local Audio Playback */}
              {audioUrl && (
                <div className="w-full mt-2">
                  <span className="text-xs font-body text-soft-charcoal/70 pl-2 block mb-1">My original recording:</span>
                  <audio src={audioUrl} controls className="w-full rounded-lg animate-fade-in" style={{ color: "#d4838f" }} />
                </div>
              )}

              <div className="flex flex-col gap-2 w-full mt-4">
                <button 
                  onClick={() => { setStatus("idle"); setTranscript(""); setMrBrownText(""); }} 
                  className="wax-seal w-full py-3"
                >
                  New Entry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onBack}
        className="mt-8 font-body text-sm text-soft-charcoal/70 hover:text-deep-red transition-colors"
        disabled={status === "recording" || status === "transcribing"}
      >
        ← back to dashboard
      </button>
    </div>
  );
}
