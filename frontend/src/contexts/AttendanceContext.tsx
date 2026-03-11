import { createContext, useContext, useState, ReactNode } from 'react';

interface AttendanceContextType {
  capturedImage: string | null;
  location: { latitude: number; longitude: number } | null;
  activeSession: {
    subject: string;
    code: string;
    faculty: string;
    isActive: boolean;
  } | null;
  setCapturedImage: (image: string | null) => void;
  setLocation: (location: { latitude: number; longitude: number } | null) => void;
  resetAttendance: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Mock active session - in production, this would come from API
  const [activeSession] = useState({
    subject: 'Advanced Web Technologies',
    code: 'CSE3021',
    faculty: 'Dr. Rajesh Kumar',
    isActive: true,
  });

  const resetAttendance = () => {
    setCapturedImage(null);
    setLocation(null);
  };

  return (
    <AttendanceContext.Provider
      value={{
        capturedImage,
        location,
        activeSession,
        setCapturedImage,
        setLocation,
        resetAttendance,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
