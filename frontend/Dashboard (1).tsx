import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Camera, Sparkles, Clock, User2, BookOpen } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { activeSession } = useAttendance();
  const navigate = useNavigate();

  const handleMarkAttendance = () => {
    navigate('/location-consent');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl px-4 py-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              Manipal University
            </h1>
            <div className="flex items-center gap-2">
              <User2 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{user?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {activeSession?.isActive ? (
            <>
              <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
                <div className="p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow">
                        <BookOpen className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-foreground">
                            {activeSession.subject}
                          </h2>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{activeSession.code}</p>
                        <p className="text-xs text-muted-foreground">Faculty: {activeSession.faculty}</p>
                      </div>
                    </div>
                    <Badge className="gradient-accent shadow-accent border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
                    <Clock className="h-4 w-4 text-accent" />
                    <p className="text-xs text-accent font-medium">Session ends in 45 minutes</p>
                  </div>

                  <Button
                    onClick={handleMarkAttendance}
                    className="h-14 w-full text-base font-semibold gradient-primary shadow-glow hover:opacity-90 transition-opacity"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Mark Attendance Now
                  </Button>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                    <h3 className="font-semibold text-foreground">Verification Process</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3 group">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Geofence Verification</p>
                        <p className="text-xs text-muted-foreground">Confirm you're within campus boundaries</p>
                      </div>
                    </div>
                    <div className="flex gap-3 group">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Live Photo Capture</p>
                        <p className="text-xs text-muted-foreground">Real-time selfie for identity verification</p>
                      </div>
                    </div>
                    <div className="flex gap-3 group">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Instant Submission</p>
                        <p className="text-xs text-muted-foreground">Secure upload with timestamp</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center bg-card/50 backdrop-blur">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Active Session</h3>
              <p className="text-sm text-muted-foreground">
                Your instructor hasn't activated attendance yet. Check back during class time.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
