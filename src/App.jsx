import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import JointAngles from './components/JointAngles'
import AsymmetryMetrics from './components/AsymmetryMetrics'
import RealTimeFeedback from './components/RealTimeFeedback'
import FormAnalysis from './components/FormAnalysis'
import { getMockData, simulateRealTimeData } from './utils/mockData'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [runData, setRunData] = useState(null)
  const [realTimeData, setRealTimeData] = useState(null)
  const [isRealTime, setIsRealTime] = useState(false)

  useEffect(() => {
    // Load initial run data
    const data = getMockData()
    setRunData(data)
  }, [])

  useEffect(() => {
    if (isRealTime) {
      const interval = setInterval(() => {
        const newData = simulateRealTimeData()
        setRealTimeData(newData)
      }, 1000) // Update every second

      return () => clearInterval(interval)
    }
  }, [isRealTime])

  const handleViewChange = (view) => {
    setCurrentView(view)
  }

  const toggleRealTime = () => {
    setIsRealTime(!isRealTime)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="logo">SymStride</h1>
          <p className="tagline">Running Form Symmetry Analysis</p>
        </div>
        <nav className="nav-menu">
          <button
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleViewChange('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-btn ${currentView === 'joints' ? 'active' : ''}`}
            onClick={() => handleViewChange('joints')}
          >
            Joint Angles
          </button>
          <button
            className={`nav-btn ${currentView === 'asymmetry' ? 'active' : ''}`}
            onClick={() => handleViewChange('asymmetry')}
          >
            Asymmetry Metrics
          </button>
          <button
            className={`nav-btn ${currentView === 'realtime' ? 'active' : ''}`}
            onClick={() => handleViewChange('realtime')}
          >
            Feedback
          </button>
          <button
            className={`nav-btn ${currentView === 'form' ? 'active' : ''}`}
            onClick={() => handleViewChange('form')}
          >
            Form Analysis
          </button>
        </nav>
        <div className="header-actions">
          <button
            className={`realtime-toggle ${isRealTime ? 'active' : ''}`}
            onClick={toggleRealTime}
          >
            {isRealTime ? '● Live' : '○ Offline'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'dashboard' && runData && (
          <Dashboard data={runData} />
        )}
        {currentView === 'joints' && runData && (
          <JointAngles data={runData} realTimeData={realTimeData} />
        )}
        {currentView === 'asymmetry' && runData && (
          <AsymmetryMetrics data={runData} realTimeData={realTimeData} />
        )}
        {currentView === 'realtime' && (
          <RealTimeFeedback 
            data={runData} 
            realTimeData={realTimeData}
            isActive={isRealTime}
          />
        )}
        {currentView === 'form' && runData && (
          <FormAnalysis 
            data={runData} 
            realTimeData={realTimeData}
          />
        )}
      </main>
    </div>
  )
}

export default App

