import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, User, ArrowLeft, CheckCircle2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const Preview = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { capturedImage, location, activeSession, resetAttendance } = useAttendance();
  const navigate = useNavigate();

  if (!capturedImage || !location) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8000/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
          name: user?.name,
          image: capturedImage,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('Attendance submitted successfully!');
        resetAttendance();
        navigate('/dashboard');
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit attendance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    resetAttendance();
    navigate('/camera');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/camera')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Review & Submit
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {activeSession && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{activeSession.subject}</p>
                  <p className="text-xs text-muted-foreground font-mono">{activeSession.code}</p>
                </div>
                <Badge className="gradient-accent shadow-accent border-0 text-xs">Step 3/3</Badge>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden border-2 border-primary/20">
            <img
              src={capturedImage}
              alt="Captured attendance photo"
              className="aspect-[4/3] w-full object-cover"
            />
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Verification Details</h2>
                <CheckCircle2 className="h-5 w-5 text-accent" />
              </div>
              
              <div className="space-y-4">
                {activeSession && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <BookOpen className="h-5 w-5 flex-shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{activeSession.subject}</p>
                      <p className="text-xs text-muted-foreground font-mono">{activeSession.code}</p>
                      <p className="text-xs text-muted-foreground mt-1">Faculty: {activeSession.faculty}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <User className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <MapPin className="h-5 w-5 flex-shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">GPS Coordinates</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">Timestamp</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-14 w-full text-base font-semibold gradient-primary shadow-glow hover:opacity-90 transition-opacity"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Submit Attendance
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleRetake}
              disabled={isSubmitting}
              className="h-12 w-full text-base"
            >
              Retake Photo
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Preview;
