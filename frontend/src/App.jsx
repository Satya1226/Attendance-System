import TableauDashboard from './TableauDashboard';
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Clock, Database, ChevronDown, ChevronUp, BookOpen, Calendar, Users, Play, Square, MapPin, CheckCircle, XCircle, ArrowLeft, LogOut, Lock, User } from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';


const AttendanceSystem = () => {
// Authentication state
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [loginForm, setLoginForm] = useState({ email: '', password: '' });
const [loginError, setLoginError] = useState('');
const [currentTeacher, setCurrentTeacher] = useState(null);
// ADD THESE NEW LINES BELOW:
const [showRegister, setShowRegister] = useState(false);
const [registerForm, setRegisterForm] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  department: ''
});
const [registerError, setRegisterError] = useState('');
const [registerSuccess, setRegisterSuccess] = useState(false);

// Existing states
const [currentSessionId, setCurrentSessionId] = useState(null);
const [sessionStartTime, setSessionStartTime] = useState(null);
const [activeTab, setActiveTab] = useState('setup');
const [classData, setClassData] = useState({
  subject: '',
  section: '',
  date: new Date().toISOString().split('T')[0]
});
const [sessionActive, setSessionActive] = useState(false);
const [qrDataURL, setQrDataURL] = useState('');
const [qrPayload, setQrPayload] = useState('');
const [history, setHistory] = useState([]);
const [refreshInterval, setRefreshInterval] = useState(7);
const [countdown, setCountdown] = useState(7);
const [isRunning, setIsRunning] = useState(false);
const [showHistory, setShowHistory] = useState(false);
const [sessions, setSessions] = useState([]);
const [selectedSession, setSelectedSession] = useState(null);
const [teacherLocation, setTeacherLocation] = useState(null);
const [students, setStudents] = useState([]);
const [failedStudents, setFailedStudents] = useState([]);
const [locationLoading, setLocationLoading] = useState(false);

const intervalRef = useRef(null);
const countdownRef = useRef(null);



  // Login handler with Supabase
const handleLogin = async (e) => {
  e.preventDefault();
  setLoginError('');
  setLocationLoading(true);
  
  try {
    // Query Supabase for teacher with matching email and password
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', loginForm.email)
      .eq('password', loginForm.password)
      .single();
    
    if (error || !data) {
      setLoginError('Invalid email or password');
      setLocationLoading(false);
      return;
    }
    
    // Login successful
    setCurrentTeacher(data);
    setIsAuthenticated(true);
    setLoginForm({ email: '', password: '' });
    setLocationLoading(false);
    
  } catch (error) {
    console.error('Login error:', error);
    setLoginError('An error occurred. Please try again.');
    setLocationLoading(false);
  }
};

// Logout handler
const handleLogout = () => {
  if (sessionActive) {
    if (!window.confirm('You have an active session. Are you sure you want to logout?')) {
      return;
    }
    endSession();
  }
  setIsAuthenticated(false);
  setCurrentTeacher(null);
  setLoginForm({ email: '', password: '' });
  setSelectedSession(null);
  setSessions([]);
  setActiveTab('setup');
};

// ADD THIS ENTIRE NEW FUNCTION BELOW:
// Registration handler
const handleRegister = async (e) => {
  e.preventDefault();
  setRegisterError('');
  setRegisterSuccess(false);
  
  // Validation
  if (registerForm.password !== registerForm.confirmPassword) {
    setRegisterError('Passwords do not match');
    return;
  }
  
  if (registerForm.password.length < 6) {
    setRegisterError('Password must be at least 6 characters long');
    return;
  }
  
  try {
    // Check if email already exists
    const { data: existingTeacher, error: checkError } = await supabase
      .from('teachers')
      .select('email')
      .eq('email', registerForm.email)
      .single();
    
    if (existingTeacher) {
      setRegisterError('Email already registered. Please login instead.');
      return;
    }
    
   // Insert new teacher
const { data, error } = await supabase
  .from('teachers')
  .insert({
    name: registerForm.name,
    email: registerForm.email,
    password: registerForm.password,
    department: registerForm.department
  })
      .select()
      .single();
    
    if (error) {
      console.error('Registration error:', error);
      setRegisterError('Failed to register. Please try again.');
      return;
    }
    
    // Registration successful
    setRegisterSuccess(true);
    setRegisterForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: ''
      
    });
    
    // Auto-switch to login after 2 seconds
    setTimeout(() => {
      setShowRegister(false);
      setRegisterSuccess(false);
    }, 2000);
    
  } catch (error) {
    console.error('Registration error:', error);
    setRegisterError('An error occurred. Please try again.');
  }
};

const generateQRCode = async (sessionId) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const expiresAt = new Date(timestamp + refreshInterval * 1000).toISOString();
  
  try {
    // Insert QR into database
    const { error: qrInsertError } = await supabase
      .from('qr_codes')
      .insert({
        qr_id: randomId,
        session_id: sessionId || currentSessionId,
        generated_at: new Date(timestamp).toISOString(),
        expires_at: expiresAt
      });
    
    if (qrInsertError) {
      console.error('Failed to insert QR into database:', qrInsertError);
      alert('Failed to generate QR code. Please try again.');
      return;
    }
    
    console.log('✅ QR code registered in database:', randomId);
    
    // Generate the visual QR code
    const payload = {
      qrId: randomId,
      sessionId: sessionId || currentSessionId
    };
    
    const payloadString = JSON.stringify(payload);
    setQrPayload(payloadString);
    
    const qrDataUrl = await QRCode.toDataURL(payloadString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    setQrDataURL(qrDataUrl);
    
    // Store locally for history display
    const historyEntry = {
      id: randomId,
      content: payloadString,
      timestamp: timestamp,
      dateTime: new Date(timestamp).toLocaleString(),
      second: Math.floor(timestamp / 1000),
      expiresAt: expiresAt
    };
    
    setHistory(prev => [historyEntry, ...prev]);
    setCountdown(refreshInterval);
    
  } catch (err) {
    console.error('Error generating QR code:', err);
    alert('Error generating QR code');
  }
};

const startGenerator = (sessionId) => {
  setIsRunning(true);
  generateQRCode(sessionId);
  
  intervalRef.current = setInterval(() => {
    generateQRCode(sessionId);
  }, refreshInterval * 1000);
  
  countdownRef.current = setInterval(() => {
    setCountdown(prev => {
      if (prev <= 1) return refreshInterval;
      return prev - 1;
    });
  }, 1000);
};

  const stopGenerator = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(refreshInterval);
  };

const startSession = async () => {
  if (!classData.subject || !classData.section) {
    alert('Please enter subject and section first!');
    return;
  }
  
  setLocationLoading(true);
  
  const handleSessionStart = async (location = null) => {
    const sessionId = `${classData.subject}-${classData.section}-${classData.date}-${Date.now()}`;
    const startTime = new Date();
    
    try {
      // ✅ STEP 1: Insert session into database FIRST
      const sessionData = {
        session_id: sessionId,
        teacher_email: currentTeacher.email,
        teacher_name: currentTeacher.name,
        subject: classData.subject,
        section: classData.section,
        date: classData.date,
        start_time: startTime.toISOString(),
        end_time: null // Will be updated when session ends
      };
      
      // Add location data only if available
      if (location) {
        sessionData.teacher_latitude = location.latitude.toString();
        sessionData.teacher_longitude = location.longitude.toString();
        
      }
      
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert(sessionData);
      
      if (sessionError) {
        console.error('Error creating session:', sessionError);
        alert(`Failed to start session: ${sessionError.message}`);
        setLocationLoading(false);
        return;
      }
      
      console.log('✅ Session created in database:', sessionId);
      
      // ✅ STEP 2: NOW set local state and start QR generation
      setCurrentSessionId(sessionId);
      setSessionStartTime(startTime);
      setTeacherLocation(location);
      setClassData({...classData, startTime: startTime.toLocaleTimeString()});
      setSessionActive(true);
      setActiveTab('qr');
      startGenerator(sessionId);
      
    } catch (err) {
      console.error('Error starting session:', err);
      alert('Failed to start session');
      setLocationLoading(false);
    }
  };
  
  if (navigator.geolocation) {
    const timeoutId = setTimeout(() => {
      setLocationLoading(false);
      const proceed = window.confirm(
        'Location request timed out. Proximity verification will be disabled.\n\nDo you want to continue anyway?'
      );
      
      if (proceed) {
        handleSessionStart(null);
      }
    }, 20000);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        console.log('Location captured:', location);
        setLocationLoading(false);
        handleSessionStart(location);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('Location error:', error);
        setLocationLoading(false);
        
        let errorMsg = 'Unable to get location.\n\n';
        if (error.code === 1) {
          errorMsg += 'Location permission denied. Please allow location access in browser settings.';
        } else if (error.code === 2) {
          errorMsg += 'Location unavailable. Please check your device settings.';
        } else if (error.code === 3) {
          errorMsg += 'Location request timed out.';
        }
        errorMsg += '\n\nProximity verification will be disabled. Continue anyway?';
        
        const proceed = window.confirm(errorMsg);
        
        if (proceed) {
          handleSessionStart(null);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  } else {
    setLocationLoading(false);
    alert('Geolocation is not supported by your browser');
  }
};

const endSession = async () => {
  const endTime = new Date();
  
  try {
    // Update session end_time in database
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ end_time: endTime.toISOString() })
      .eq('session_id', currentSessionId);
    
    if (updateError) {
      console.error('Error updating session:', updateError);
      alert('Failed to save session to database');
      return;
    }
    
    // Reload sessions from database
    await loadPastSessions();
    
    console.log('Session ended successfully');
    
  } catch (err) {
    console.error('Error ending session:', err);
    alert('Failed to save session data');
    return;
  }
  
  // Clear all local data
  setSessionActive(false);
  stopGenerator();
  setHistory([]);
  setQrDataURL('');
  setQrPayload('');
  setStudents([]);
  setFailedStudents([]);
  setTeacherLocation(null);
  setCurrentSessionId(null);
  setSessionStartTime(null);
  setActiveTab('setup');
};

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

 useEffect(() => {
  if (isRunning && currentSessionId) {
    stopGenerator();
    startGenerator(currentSessionId);
  }
}, [refreshInterval]);


// Load attendance records for a session
const loadSessionAttendance = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_id', sessionId)
      .order('marked_at', { ascending: true });
    
    if (error) {
      console.error('Error loading attendance:', error);
      return [];
    }
    
    return data.map(record => ({
      name: record.student_name,
      email: record.student_email,
      timestamp: new Date(record.marked_at).toLocaleString(),
      distance: record.distance_from_teacher ? Math.round(record.distance_from_teacher) : 'N/A',
      location: {
        latitude: parseFloat(record.student_latitude),
        longitude: parseFloat(record.student_longitude)
      },
      verified: record.is_verified,
      notes: record.verification_notes
    }));
  } catch (err) {
    console.error('Error loading session attendance:', err);
    return [];
  }
};



// Load past sessions from database
const loadPastSessions = async () => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('teacher_email', currentTeacher.email)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading sessions:', error);
      return;
    }
    
    // Get QR counts and attendance for each session
    const formattedSessions = await Promise.all(data.map(async (session) => {
      // Count QR codes for this session
      const { count } = await supabase
        .from('qr_codes')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.session_id);
      
      // Load attendance records
      const students = await loadSessionAttendance(session.session_id);
      
      // Load failed attempts
      const failedAttempts = await loadFailedAttendance(session.session_id);
      
      return {
        subject: session.subject,
        section: session.section,
        date: session.date,
        teacherName: session.teacher_name,
        startTime: new Date(session.start_time).toLocaleTimeString(),
        endTime: session.end_time ? new Date(session.end_time).toLocaleTimeString() : 'In Progress',
        sessionId: session.session_id,
        teacherLocation: session.teacher_latitude ? {
          latitude: parseFloat(session.teacher_latitude),
          longitude: parseFloat(session.teacher_longitude),
          accuracy: 0
        } : null,
        qrCount: count || 0,
        students: students,
        failedStudents: failedAttempts
      };
    }));
    
    setSessions(formattedSessions);
  } catch (err) {
    console.error('Error loading past sessions:', err);
  }
};

// Load sessions when teacher logs in
useEffect(() => {
  if (isAuthenticated && currentTeacher) {
    loadPastSessions();
  }
}, [isAuthenticated, currentTeacher]);


// Load attendance in real-time for active session
const loadActiveSessionAttendance = async () => {
  if (!currentSessionId) return;
  
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_id', currentSessionId)
      .order('marked_at', { ascending: false });
    
    if (error) {
      console.error('Error loading attendance:', error);
      return;
    }
    
    const formattedStudents = data.map(record => ({
      name: record.student_name,
      email: record.student_email,
      timestamp: new Date(record.marked_at).toLocaleString(),
      distance: record.distance_from_teacher ? Math.round(record.distance_from_teacher) : 'N/A',
      location: {
        latitude: parseFloat(record.student_latitude),
        longitude: parseFloat(record.student_longitude)
      },
      verified: record.is_verified,
      notes: record.verification_notes
    }));
    
    setStudents(formattedStudents);
  } catch (err) {
    console.error('Error loading active attendance:', err);
  }
};

// Load failed attempts in real-time for active session
const loadActiveFailedAttempts = async () => {
  if (!currentSessionId) return;
  
  try {
    const { data, error } = await supabase
      .from('attendance_failed')
      .select('*')
      .eq('session_id', currentSessionId)
      .order('attempted_at', { ascending: false });
    
    if (error) {
      console.error('Error loading failed attempts:', error);
      return;
    }
    
    const formattedFailed = data.map(record => ({
      name: record.student_name,
      email: record.student_email,
      timestamp: new Date(record.attempted_at).toLocaleString(),
      reason: record.failure_reason
    }));
    
    setFailedStudents(formattedFailed);
  } catch (err) {
    console.error('Error loading active failed attempts:', err);
  }
};

// Load failed attendance attempts for a session
const loadFailedAttendance = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('attendance_failed')
      .select('*')
      .eq('session_id', sessionId)
      .order('attempted_at', { ascending: false });
    
    if (error) {
      console.error('Error loading failed attendance:', error);
      return [];
    }
    
    return data.map(record => ({
      name: record.student_name,
      email: record.student_email,
      timestamp: new Date(record.attempted_at).toLocaleString(),
      reason: record.failure_reason
    }));
  } catch (err) {
    console.error('Error loading failed attendance:', err);
    return [];
  }
};

const exportToExcel = (session) => {
  // Get unique students (remove duplicates by email)
  const uniqueStudents = {};
  
  session.students?.forEach(student => {
    if (!uniqueStudents[student.email]) {
      uniqueStudents[student.email] = {
        Name: student.name,
        Email: student.email,
        Status: 'Present',
        'Marked At': student.timestamp,
        'Distance (m)': student.distance
      };
    }
  });
  
  // Convert to array
  const attendanceData = Object.values(uniqueStudents);
  
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(attendanceData);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
  
  // Generate filename
  const filename = `Attendance_${session.subject}_${session.section}_${session.date}.xlsx`;
  
  // Download
  XLSX.writeFile(wb, filename);
};


// Poll for new attendance records during active session
useEffect(() => {
  let pollInterval;
  
  if (sessionActive && currentSessionId) {
    loadActiveSessionAttendance();
    loadActiveFailedAttempts();
    
    pollInterval = setInterval(() => {
      loadActiveSessionAttendance();
      loadActiveFailedAttempts();
    }, 5000);
  }
  
  return () => {
    if (pollInterval) clearInterval(pollInterval);
  };
}, [sessionActive, currentSessionId]);


 // Login Screen
if (!isAuthenticated) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <Lock size={48} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center">Teacher Portal</h1>
          <p className="text-center text-indigo-100 mt-2">Anti-Proxy Attendance System</p>
        </div>
        
        <div className="p-8">
          {!showRegister ? (
            // Login Form
            <>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline mr-2" size={16} />
                    Email
                  </label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="inline mr-2" size={16} />
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={locationLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {locationLoading ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Log In'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm mb-3">Don't have an account?</p>
                <button
                  onClick={() => {
                    setShowRegister(true);
                    setLoginError('');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center justify-center gap-2 mx-auto"
                >
                  <User size={16} />
                  Register as Teacher
                </button>
              </div>
            </>
          ) : (
            // Registration Form
            <>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline mr-2" size={16} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={registerForm.department}
                    onChange={(e) => setRegisterForm({...registerForm, department: e.target.value})}
                    placeholder="e.g., Computer Science"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

               

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="inline mr-2" size={16} />
                    Password
                  </label>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    placeholder="Create a password (min 6 characters)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                {registerError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {registerError}
                  </div>
                )}

                {registerSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    Registration successful! Redirecting to login...
                  </div>
                )}

                <button
                  type="submit"
                  disabled={registerSuccess}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Register
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm mb-3">Already have an account?</p>
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setRegisterError('');
                    setRegisterSuccess(false);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

  // Main Application (after login)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Anti-Proxy Attendance System</h1>
            <p className="text-gray-600 mt-1">Dynamic QR-based attendance tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome,</p>
              <p className="font-semibold text-gray-800">{currentTeacher.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition font-medium"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-2 bg-white rounded-lg p-2 shadow">
          <button
            onClick={() => setActiveTab('setup')}
            disabled={sessionActive}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'setup' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            } ${sessionActive ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <BookOpen size={20} />
            Class Setup
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            disabled={!sessionActive}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'qr' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            } ${!sessionActive ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={20} />
            QR Generator
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'sessions' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Database size={20} />
           Past Sessions
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading Modal */}
        {locationLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
              <div className="mb-4">
                <RefreshCw size={48} className="animate-spin mx-auto text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Fetching Your Location</h3>
              <p className="text-gray-600">Please wait while we get your GPS coordinates...</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <MapPin size={16} />
                <span>This may take a few seconds</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Setup Tab */}
        {activeTab === 'setup' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Setup Attendance Session</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BookOpen className="inline mr-2" size={16} />
                  Subject
                </label>
                <input
                  type="text"
                  value={classData.subject}
                  onChange={(e) => setClassData({...classData, subject: e.target.value})}
                  placeholder="e.g., Mathematics, Physics"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline mr-2" size={16} />
                  Section
                </label>
                <input
                  type="text"
                  value={classData.section}
                  onChange={(e) => setClassData({...classData, section: e.target.value})}
                  placeholder="e.g., A, B, CSE-1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline mr-2" size={16} />
                  Date
                </label>
                <input
                  type="date"
                  value={classData.date}
                  onChange={(e) => setClassData({...classData, date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline mr-2" size={16} />
                  QR Refresh Interval: {refreshInterval} seconds
                </label>
                <input
                  type="range"
                  min="5"
                  max="10"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-8 bg-indigo-50 rounded-lg p-6">
              <h3 className="font-semibold text-indigo-900 mb-3">Session Summary:</h3>
              <div className="space-y-2 text-indigo-800">
                <p><strong>Teacher:</strong> {currentTeacher.name}</p>
                <p><strong>Subject:</strong> {classData.subject || 'Not entered'}</p>
                <p><strong>Section:</strong> {classData.section || 'Not entered'}</p>
                <p><strong>Date:</strong> {classData.date}</p>
                <p><strong>QR Updates:</strong> Every {refreshInterval} seconds</p>
              </div>
            </div>

            <button
              onClick={startSession}
              disabled={!classData.subject || !classData.section || locationLoading}
              className="w-full mt-6 bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {locationLoading ? (
                <>
                  <RefreshCw size={24} className="animate-spin" />
                  Fetching Location...
                </>
              ) : (
                <>
                  <Play size={24} />
                  Start Attendance Session
                </>
              )}
            </button>
          </div>
        )}

        {/* QR Generator Tab */}
        {activeTab === 'qr' && sessionActive && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">Current QR Code</h2>
                  <p className="text-sm text-gray-600">{classData.subject} - {classData.section}</p>
                </div>
                {isRunning && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Clock size={20} />
                    <span className="font-mono text-lg">{countdown}s</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                {qrDataURL ? (
                  <>
                    <img src={qrDataURL} alt="Attendance QR Code" className="w-72 h-72 border-4 border-gray-300 rounded-lg" />
                    <div className="bg-blue-50 p-4 rounded-lg w-full">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Instructions for Students:</p>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Open your attendance app</li>
                        <li>Scan this QR code</li>
                        <li>Allow location access</li>
                        <li>Enter your name to mark attendance</li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <div className="w-72 h-72 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">No QR code yet</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => generateQRCode(currentSessionId)}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  Generate Now
                </button>
                
                <button
                  onClick={endSession}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <Square size={20} />
                  End Session
                </button>
              </div>
              
              {teacherLocation && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-blue-600" />
                  <span className="text-blue-800">
                    Location: {teacherLocation.latitude.toFixed(6)}, {teacherLocation.longitude.toFixed(6)}
                  </span>
                </div>
              )}
              
              {!teacherLocation && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-yellow-600" />
                  <span className="text-yellow-800">
                    Location not available (Proximity check disabled)
                  </span>
                </div>
              )}

              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-green-600" />
                    <span className="font-semibold text-green-900">Students Present</span>
                  </div>
                  <span className="text-2xl font-bold text-green-900">{students.length}</span>
                </div>
                {students.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                    {students.slice(0, 5).map((student, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                        <span className="text-gray-700">{student.name}</span>
                        <span className="text-green-600 font-medium">{student.distance}m</span>
                      </div>
                    ))}
                    {students.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{students.length - 5} more students
                      </p>
                    )}
                  </div>
                )}
              </div>

              {failedStudents.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle size={20} className="text-red-600" />
                      <span className="font-semibold text-red-900">Failed Attempts</span>
                    </div>
                    <span className="text-2xl font-bold text-red-900">{failedStudents.length}</span>
                  </div>
                  <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                    {failedStudents.slice(0, 3).map((student, idx) => (
                      <div key={idx} className="text-sm bg-white p-2 rounded border border-red-200">
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle size={14} className="text-red-600" />
                          <span className="text-gray-700 font-medium">{student.name}</span>
                        </div>
                        <p className="text-xs text-red-600 pl-5">{student.reason}</p>
                      </div>
                    ))}
                    {failedStudents.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{failedStudents.length - 3} more failed attempts
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between mb-4 hover:text-blue-600 transition"
              >
                <div className="flex items-center gap-2">
                  <Database size={24} className="text-gray-700" />
                  <h2 className="text-xl font-semibold text-gray-700">Generation History ({history.length})</h2>
                </div>
                {showHistory ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
              
              {showHistory && (
                <div className="space-y-2 overflow-y-auto max-h-96">
                  {history.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No history yet</p>
                  ) : (
                    history.map((entry) => (
                      <div
                        key={entry.timestamp}
                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-xs text-blue-600">#{entry.id}</span>
                          <span className="text-xs text-gray-500">{entry.dateTime}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Second: {entry.second}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {showHistory && history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="w-full mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                >
                  Clear History
                </button>
              )}
            </div>
          </div>
        )}

        {/* Past Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            {!selectedSession ? (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Past Attendance Sessions</h2>
                
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Database size={64} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-400 text-lg">No past sessions yet</p>
                    <p className="text-gray-400 text-sm mt-2">Complete a session to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session, index) => (
                      <div 
                        key={index} 
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition cursor-pointer hover:border-indigo-300"
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">{session.subject}</h3>
                            <p className="text-gray-600">Section {session.section}</p>
                            <p className="text-sm text-gray-500">By {session.teacherName}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                              {session.qrCount} QR Codes
                            </span>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              {session.students?.length || 0} Students
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Date</p>
                            <p className="font-medium">{session.date}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Start Time</p>
                            <p className="font-medium">{session.startTime}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">End Time</p>
                            <p className="font-medium">{session.endTime}</p>
                          </div>
                        </div>
                        
                        {session.teacherLocation && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={14} />
                            <span>Location recorded</span>
                          </div>
                        )}
                        
                        <p className="text-sm text-indigo-600 mt-3 font-medium">Click to view details →</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 font-medium"
                >
                  <ArrowLeft size={20} />
                  Back to Sessions
                </button>
                
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedSession.subject}</h2>
                  <p className="text-gray-600">Section {selectedSession.section} • {selectedSession.date}</p>
                  <p className="text-sm text-gray-500">Teacher: {selectedSession.teacherName}</p>
                  <div className="mt-2 bg-gray-100 rounded p-2">
                    <p className="text-xs text-gray-600">Session ID:</p>
                    <p className="text-sm font-mono text-gray-800">{selectedSession.sessionId}</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
  <div className="bg-indigo-50 rounded-lg p-4">
    <p className="text-sm text-indigo-600 mb-1">Total Students</p>
    <p className="text-3xl font-bold text-indigo-900">{selectedSession.students?.length || 0}</p>
  </div>
  <div className="bg-blue-50 rounded-lg p-4">
    <p className="text-sm text-blue-600 mb-1">QR Codes Generated</p>
    <p className="text-3xl font-bold text-blue-900">{selectedSession.qrCount}</p>
  </div>
  <div className="bg-green-50 rounded-lg p-4">
    <p className="text-sm text-green-600 mb-1">Duration</p>
    <p className="text-xl font-bold text-green-900">{selectedSession.startTime} - {selectedSession.endTime}</p>
  </div>
</div>

<button
  onClick={() => exportToExcel(selectedSession)}
  disabled={!selectedSession.students || selectedSession.students.length === 0}
  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
>
  <Database size={20} />
  Export Attendance to Excel
</button>
                
                {selectedSession.teacherLocation && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={20} className="text-gray-700" />
                      <h3 className="font-semibold text-gray-800">Class Location</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Latitude: {selectedSession.teacherLocation.latitude.toFixed(6)}, 
                      Longitude: {selectedSession.teacherLocation.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Accuracy: ±{selectedSession.teacherLocation.accuracy?.toFixed(0)}m
                    </p>
                  </div>
                )}
                
                <div className="border-t pt-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Students Present</h3>
                  
                  {!selectedSession.students || selectedSession.students.length === 0 ? (
                    <div className="text-center py-8">
                      <Users size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-400">No students marked attendance</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedSession.students.map((student, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="text-green-600" size={24} />
                              <div>
                                <p className="font-semibold text-gray-800">{student.name}</p>
                                <p className="text-sm text-gray-500">{student.timestamp}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700">{student.distance}m away</p>
                              <p className="text-xs text-gray-500">from teacher</p>
                            </div>
                          </div>
                          {student.location && (
                            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                              <MapPin size={12} />
                              <span>
                                {student.location.latitude.toFixed(6)}, {student.location.longitude.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <XCircle className="text-red-600" size={24} />
                    Failed Attendance Attempts ({selectedSession.failedStudents?.length || 0})
                  </h3>
                  
                  {!selectedSession.failedStudents || selectedSession.failedStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle size={48} className="mx-auto text-green-300 mb-3" />
                      <p className="text-gray-400">No failed attempts - All students verified successfully!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedSession.failedStudents.map((student, idx) => (
                        <div key={idx} className="border border-red-200 bg-red-50 rounded-lg p-4 hover:bg-red-100 transition">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <XCircle className="text-red-600" size={24} />
                              <div>
                                <p className="font-semibold text-gray-800">{student.name}</p>
                                <p className="text-sm text-gray-600">{student.email}</p>
                                <p className="text-xs text-gray-500">{student.timestamp}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 p-2 bg-white rounded border border-red-200">
                            <p className="text-sm font-semibold text-red-700">Reason for Rejection:</p>
                            <p className="text-sm text-gray-700 mt-1">{student.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      {activeTab === 'dashboard' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              Analytics Dashboard
            </h2>
            <p className="text-gray-500 mb-6">
              Attendance insights for {currentTeacher?.name}
            </p>
            <TableauDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceSystem;