import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import JointAngles from './components/JointAngles'
import AsymmetryMetrics from './components/AsymmetryMetrics'
import RealTimeFeedback from './components/RealTimeFeedback'
import FormAnalysis from './components/FormAnalysis'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [runData, setRunData] = useState(null)
  const [realTimeData, setRealTimeData] = useState(null)
  const [isRealTime, setIsRealTime] = useState(false)
  const [realTimeSeries, setRealTimeSeries] = useState([])
  const [sessionAverages, setSessionAverages] = useState(null)

  // runData is kept for backward compatibility but will be null initially

  useEffect(() => {
    if (!isRealTime) {
      return
    }

    let isCancelled = false

    const poll = async () => {
      try {
        const response = await fetch('http://localhost:4000/joint-angles')
        if (!response.ok) {
          console.error('HTTP error fetching joint angles', response.status)
          return
        }

        const message = await response.json()

        if (isCancelled) return

        // Expect backend message to match live joint-angle sample shape
        // { frontKnee, backKnee, backToHead, elbow, knee }
        // Check if backend includes session averages in the response
        if (message.sessionAverages || message.averages) {
          setSessionAverages(message.sessionAverages || message.averages)
        }
        
        // Extract just the real-time data (without averages)
        const {
          sessionAverages: _sessionAverages,
          averages: _averages,
          ...realtimeOnly
        } = message;
        setRealTimeData(realtimeOnly)

        // Accumulate real-time frames into an array where each point
        // has the same shape as the incoming message. JointAngles
        // will compute the time axis from the index.
        setRealTimeSeries((prev) => {
          const next = [
            ...prev,
            message,
          ]
          // Keep a rolling window of the most recent 300 points
          return next.slice(-300)
        })
      } catch (error) {
        console.error('Failed to fetch joint angle message', error)
      }
    }

    const intervalId = setInterval(poll, 200)

    // Kick off immediately instead of waiting for first interval
    poll()

    return () => {
      isCancelled = true
      clearInterval(intervalId)
    }
  }, [isRealTime])

  useEffect(() => {
    if (!isRealTime) {
      // Reset real-time state when switching back to offline mode
      setRealTimeData(null)
      setRealTimeSeries([])
      // Note: sessionAverages should be included in joint-angles response from backend
      // If not available, components will display appropriate empty states
    } else {
      // When starting a new session, clear previous session averages
      setSessionAverages(null)
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
          {/*
          <button
            className={`nav-btn ${currentView === 'asymmetry' ? 'active' : ''}`}
            onClick={() => handleViewChange('asymmetry')}
          >
            Asymmetry Metrics
          </button>
          */}
          <button
            className={`nav-btn ${currentView === 'form' ? 'active' : ''}`}
            onClick={() => handleViewChange('form')}
          >
            Form Analysis
          </button>
          <button
            className={`nav-btn ${currentView === 'realtime' ? 'active' : ''}`}
            onClick={() => handleViewChange('realtime')}
          >
            Feedback
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
        {currentView === 'dashboard' && (
          <Dashboard 
            data={runData} 
            realTimeData={realTimeData}
            sessionAverages={sessionAverages}
          />
        )}
        {currentView === 'joints' && (
          <JointAngles 
            data={runData} 
            realTimeData={
              realTimeData
                ? { ...realTimeData, timeSeriesData: realTimeSeries }
                : null
            } 
          />
        )}
        {/* {currentView === 'asymmetry' && (
          <AsymmetryMetrics data={runData} realTimeData={realTimeData} />
        )} */}
        {currentView === 'realtime' && (
          <RealTimeFeedback 
            data={runData} 
            realTimeData={realTimeData}
            sessionAverages={sessionAverages}
            isActive={isRealTime}
          />
        )}
        {currentView === 'form' && (
          <FormAnalysis 
            data={runData} 
            realTimeData={realTimeData}
            sessionAverages={sessionAverages}
          />
        )}
      </main>
    </div>
  )
}

export default App

