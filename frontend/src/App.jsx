import React, { useState } from 'react';
import './App.css';
import CandidateView from './components/Candidate';
import ReportView from './components/ReportView';

function App() {

  const [reportId, setReportId] = useState(null);

  return (
    <div className="App">
      <header className="App-header">
        {reportId ? (
          <ReportView reportId={reportId} setReportId={setReportId} />
        ) : (
          <CandidateView setReportId={setReportId} />
        )}
      </header>
    </div>
  );
}

export default App;