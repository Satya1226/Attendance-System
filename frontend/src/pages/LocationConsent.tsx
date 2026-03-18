import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Shield, ArrowLeft, Radar } from 'lucide-react';
import { toast } from 'sonner';

const LocationConsent = () => {
  const [isRequesting, setIsRequesting] = useState(false);
  const { setLocation, activeSession } = useAttendance();
  const navigate = useNavigate();

  const requestLocation = () => {
    setIsRequesting(true);

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setIsRequesting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        toast.success('Location accessed successfully');
        navigate('/camera');
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Unable to access location. Please enable location services.');
        setIsRequesting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Geofence Verification
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {activeSession && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{activeSession.subject}</p>
                  <p className="text-xs text-muted-foreground font-mono">{activeSession.code}</p>
                </div>
                <Badge className="gradient-accent shadow-accent border-0 text-xs">Step 1/3</Badge>
              </div>
            </Card>
          )}

          <div className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-glow relative">
              <MapPin className="h-10 w-10 text-primary-foreground" />
              <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Enable Geofencing</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Verify your location within campus boundaries
              </p>
            </div>
          </div>

          <Card className="p-6 bg-card/50 backdrop-blur border-primary/10">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Radar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Precise Verification</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    GPS coordinates confirm you're within the designated campus zone
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Privacy Protected</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Location data is encrypted and only used for attendance validation
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={requestLocation}
              disabled={isRequesting}
              className="h-14 w-full text-base font-semibold gradient-primary shadow-glow hover:opacity-90 transition-opacity"
            >
              {isRequesting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Verifying Location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-5 w-5" />
                  Grant Location Access
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="h-12 w-full text-base"
            >
              Go Back
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LocationConsent;
