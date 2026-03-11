import { useState } from "react";

export default function Dashboard() {
  const [subject, setSubject] = useState("");
  const [section, setSection] = useState("");
  const [date, setDate] = useState("");

  const [sessionId, setSessionId] = useState<string | null>(null);

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject || !section || !date) {
      alert("Please fill all fields");
      return;
    }

    const id = generateSessionId();
    setSessionId(id);

    console.log("Session Created:", {
      subject,
      section,
      date,
      sessionId: id,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white shadow rounded p-6">
        <h1 className="text-2xl font-bold mb-6">
          Start Attendance Session
        </h1>

        <form onSubmit={handleCreateSession}>
          <input
            type="text"
            placeholder="Subject"
            className="w-full p-2 mb-4 border rounded"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <input
            type="text"
            placeholder="Section"
            className="w-full p-2 mb-4 border rounded"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          />

          <input
            type="date"
            className="w-full p-2 mb-4 border rounded"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Create Session
          </button>
        </form>

        {sessionId && (
          <div className="mt-6 p-4 border rounded bg-gray-50">
            <h2 className="font-semibold mb-2">
              Session Started
            </h2>

            <p>Subject: {subject}</p>
            <p>Section: {section}</p>
            <p>Date: {date}</p>

            <p className="font-bold mt-2">
              Session ID: {sessionId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}