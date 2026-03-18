import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, RotateCcw, ArrowLeft, ScanFace } from 'lucide-react';
import { toast } from 'sonner';

const CameraCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { setCapturedImage, location, activeSession } = useAttendance();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location) {
      toast.error('Location access required first');
      navigate('/location-consent');
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [location, navigate]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    setIsCapturing(true);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
      toast.success('Photo captured successfully');
      navigate('/preview');
    }

    setIsCapturing(false);
  };

  const retryCamera = () => {
    stopCamera();
    startCamera();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/location-consent')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Live Capture
          </h1>
          <Button variant="ghost" size="icon" onClick={retryCamera}>
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          {activeSession && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{activeSession.subject}</p>
                  <p className="text-xs text-muted-foreground font-mono">{activeSession.code}</p>
                </div>
                <Badge className="gradient-accent shadow-accent border-0 text-xs">Step 2/3</Badge>
              </div>
            </Card>
          )}

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-muted border-2 border-primary/20">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-4 border-primary/30 rounded-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-accent/50 rounded-3xl" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur px-4 py-2 rounded-full">
                <div className="flex items-center gap-2">
                  <ScanFace className="h-4 w-4 text-primary animate-pulse" />
                  <p className="text-xs text-foreground font-medium">Position your face in the frame</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={capturePhoto}
              disabled={isCapturing || !stream}
              className="h-14 w-full text-base font-semibold gradient-primary shadow-glow hover:opacity-90 transition-opacity"
            >
              <Camera className="mr-2 h-5 w-5" />
              {isCapturing ? 'Capturing...' : 'Capture Photo'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Make sure your face is clearly visible and well-lit
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CameraCapture;
