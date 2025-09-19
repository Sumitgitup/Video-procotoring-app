

import React, { useState, useEffect } from 'react';

// A simple component to display a loading spinner or message
const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
    <p>Loading Report...</p>
  </div>
);

const ReportView = ({ reportId, setReportId }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [integrityScore, setIntegrityScore] = useState(100);

  useEffect(() => {
    if (!reportId) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:4000/api/report/${reportId}`);
        if (!response.ok) {
          throw new Error('Report not found or server error.');
        }
        const data = await response.json();
        setReport(data);
        calculateScore(data.events);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  // Function to calculate the integrity score based on logged events
  const calculateScore = (events) => {
    let deductions = 0;
    const deductionPoints = {
      'Multiple faces detected': 15,
      'User absent for > 10 seconds': 10,
      'User looking away for > 5 seconds': 5,
      'Cell phone detected': 20,
      'Book detected': 15,
    };

    events.forEach(event => {
      if (deductionPoints[event.event]) {
        deductions += deductionPoints[event.event];
      }
    });

    setIntegrityScore(Math.max(0, 100 - deductions)); // Score cannot be less than 0
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!report) return <p>No report data available.</p>;

  return (
    <div style={{ fontFamily: 'sans-serif', width: '800px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <button onClick={() => setReportId(null)} style={{ marginBottom: '20px' }}>
        &larr; Back to Interview
      </button>
      <h1 style={{ textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Proctoring Report</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div><strong>Candidate:</strong> {report.candidateName}</div>
        <div><strong>Interview Duration:</strong> {report.interviewDuration} seconds</div>
      </div>

      <div style={{ textAlign: 'center', margin: '30px 0', padding: '20px', background: '#f2f2f2', borderRadius: '8px' }}>
        <h2>Final Integrity Score</h2>
        <h1 style={{ fontSize: '4em', margin: 0, color: integrityScore > 70 ? 'green' : (integrityScore > 40 ? 'orange' : 'red') }}>
          {integrityScore}
        </h1>
      </div>

      <h3>Suspicious Events Log</h3>
      {report.events.length === 0 ? (
        <p>No suspicious events were flagged during the interview.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f2f2f2' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Timestamp</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Event Description</th>
            </tr>
          </thead>
          <tbody>
            {report.events.map((event, index) => (
              <tr key={index}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{event.timestamp}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{event.event}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReportView;
