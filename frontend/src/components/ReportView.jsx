import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// A styled loading spinner component
const LoadingSpinner = () => (
  <div style={styles.loadingContainer}>
    <style>{`
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `}</style>
    <div style={styles.spinner}></div>
    <p>Loading Report...</p>
  </div>
);

// Helper function to get an icon for each event type
const getIconForEvent = (eventText) => {
  if (eventText.includes('Multiple faces')) return '👨‍👩‍👧';
  if (eventText.includes('User absent')) return '👤❓';
  if (eventText.includes('looking away')) return '👀';
  if (eventText.includes('Cell phone')) return '📱';
  if (eventText.includes('Book')) return '📚';
  return '⚠️';
};


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
        setError(null);
        // Corrected port to 4000 to match the backend server
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

  const calculateScore = (events = []) => {
    let deductions = 0;
    const deductionPoints = {
      'Multiple faces detected': 15,
      'User absent for > 10 seconds': 10,
      'User looking away for > 5 seconds': 5,
      'Cell phone detected': 20,
      'Book detected': 15,
    };

    events.forEach(eventLog => {
      if (deductionPoints[eventLog.event]) {
        deductions += deductionPoints[eventLog.event];
      }
    });
    setIntegrityScore(Math.max(0, 100 - deductions));
  };

  const generatePdf = () => {
    if (!report) return;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('Proctoring Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Candidate: ${report.candidateName}`, 14, 40);
    doc.text(`Interview Duration: ${report.interviewDuration} seconds`, 14, 48);
    doc.text(`Report Generated: ${new Date(report.createdAt).toLocaleString()}`, 14, 56);
    
    doc.setFontSize(16);
    doc.text('Final Integrity Score:', 105, 75, { align: 'center' });
    doc.setFontSize(40);
    const scoreColor = integrityScore > 70 ? '#28a745' : integrityScore > 40 ? '#fd7e14' : '#dc3545';
    doc.setTextColor(scoreColor.substring(1)); // setTextColor requires hex without '#'
    doc.text(String(integrityScore), 105, 95, { align: 'center' });
    doc.setTextColor('#000000');

    if (report.events.length > 0) {
      doc.autoTable({
        startY: 110,
        head: [['Timestamp', 'Event Description']],
        body: report.events.map(event => [event.timestamp, event.event]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });
    } else {
      doc.setFontSize(12);
      doc.text('No suspicious events were flagged during the interview.', 14, 110);
    }

    doc.save(`proctoring-report-${report.candidateName.replace(/\s/g, '_')}-${reportId}.pdf`);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={styles.container}><p style={styles.errorMessage}>Error: {error}</p></div>;
  if (!report) return <div style={styles.container}><p>No report data available.</p></div>;

  const scoreColor = integrityScore > 70 ? '#28a745' : (integrityScore > 40 ? '#fd7e14' : '#dc3545');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📋 Proctoring Report</h1>
        <div style={styles.buttonGroup}>
           <button onClick={() => setReportId(null)} style={{...styles.button, ...styles.backButton}}>
            &larr; New Interview
          </button>
          <button onClick={generatePdf} style={{...styles.button, ...styles.downloadButton}}>
            📄 Download PDF
          </button>
        </div>
      </div>
      
      <div style={styles.grid}>
        <div style={styles.gridItem}>👤 <strong>Candidate:</strong> {report.candidateName}</div>
        <div style={styles.gridItem}>⏱️ <strong>Duration:</strong> {report.interviewDuration} seconds</div>
        <div style={styles.gridItem}>📅 <strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString()}</div>
      </div>

      <div style={styles.scoreCard}>
        <h2 style={styles.scoreTitle}>Final Integrity Score</h2>
        <div style={{...styles.score, color: scoreColor }}>
          {integrityScore}
        </div>
      </div>

      <div style={styles.eventsSection}>
        <h3>Suspicious Events Log</h3>
        {report.events.length === 0 ? (
          <p style={styles.noEventsText}>✅ No suspicious events were flagged.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{...styles.th, width: '200px'}}>Timestamp</th>
                <th style={styles.th}>Event Description</th>
              </tr>
            </thead>
            <tbody>
              {report.events.map((event, index) => (
                <tr key={index} style={styles.tr}>
                  <td style={styles.td}>{event.timestamp}</td>
                  <td style={{...styles.td, display: 'flex', alignItems: 'center'}}>
                    <span style={{fontSize: '1.2em', marginRight: '12px'}}>{getIconForEvent(event.event)}</span>
                    {event.event}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Centralized styles object for better readability and management
const styles = {
  container: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', width: '800px', margin: 'auto', padding: '32px', border: '1px solid #e0e0e0', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '24px' },
  title: { margin: 0, color: '#2a3f5f', fontSize: '24px' },
  buttonGroup: { display: 'flex', gap: '12px' },
  button: { padding: '10px 18px', fontSize: '14px', cursor: 'pointer', borderRadius: '8px', border: 'none', fontWeight: '600', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' },
  backButton: { backgroundColor: '#f0f0f0', color: '#333' },
  downloadButton: { backgroundColor: '#007bff', color: 'white' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #eee' },
  gridItem: { fontSize: '14px', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' },
  scoreCard: { textAlign: 'center', margin: '32px 0', padding: '32px', background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', borderRadius: '12px' },
  scoreTitle: { margin: '0 0 16px 0', color: '#495057', fontWeight: '500' },
  score: { fontSize: '4.5em', fontWeight: 'bold', margin: 0, lineHeight: 1 },
  eventsSection: { marginTop: '32px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', borderBottom: '2px solid #ddd', textAlign: 'left', backgroundColor: '#f2f2f2', fontWeight: '600', color: '#333' },
  tr: { '&:nth-child(even)': { backgroundColor: '#f9f9f9' } },
  td: { padding: '12px 16px', borderBottom: '1px solid #eee', color: '#555' },
  noEventsText: { color: '#888', textAlign: 'center', padding: '30px', backgroundColor: '#f9fafb', borderRadius: '8px' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', color: '#555' },
  spinner: { border: '4px solid #f3f3f3', borderTop: '4px solid #007bff', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '16px' },
  errorMessage: { color: '#dc3545', textAlign: 'center', fontSize: '18px', padding: '20px' },
};

export default ReportView;

