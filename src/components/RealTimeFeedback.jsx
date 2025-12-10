import React, { useEffect, useRef } from 'react'
import './RealTimeFeedback.css'

function RealTimeFeedback({ data, realTimeData, isActive }) {
  const feedbackRef = useRef(null)

  useEffect(() => {
    if (feedbackRef.current && isActive) {
      feedbackRef.current.scrollTop = feedbackRef.current.scrollHeight
    }
  }, [realTimeData, isActive])

  const currentData = realTimeData || data

  const getFeedbackType = (symmetry) => {
    if (symmetry >= 90) return { type: 'success', icon: '✓', message: 'Excellent symmetry!' }
    if (symmetry >= 75) return { type: 'warning', icon: '⚠', message: 'Good, but can improve' }
    return { type: 'error', icon: '✗', message: 'Needs attention' }
  }

  const getJointFeedback = () => {
    const joints = [
      { name: 'Knee', symmetry: currentData.jointAngles.knee.symmetry },
      { name: 'Elbow', symmetry: currentData.jointAngles.elbow.symmetry }
    ]

    return joints.map(joint => {
      const feedback = getFeedbackType(joint.symmetry)
      return {
        ...joint,
        ...feedback
      }
    })
  }

  const jointFeedback = getJointFeedback()

  const getActionableFeedback = () => {
    const feedback = []
    
    if (currentData.jointAngles.knee.symmetry < 75) {
      const diff = Math.abs(currentData.jointAngles.knee.left - currentData.jointAngles.knee.right)
      if (currentData.jointAngles.knee.left > currentData.jointAngles.knee.right) {
        feedback.push({
          type: 'action',
          message: `Reduce left knee angle by ${diff.toFixed(1)}° - focus on right leg form`,
          priority: 'high'
        })
      } else {
        feedback.push({
          type: 'action',
          message: `Reduce right knee angle by ${diff.toFixed(1)}° - focus on left leg form`,
          priority: 'high'
        })
      }
    }

    if (currentData.jointAngles.elbow.symmetry < 75) {
      const diff = Math.abs(currentData.jointAngles.elbow.left - currentData.jointAngles.elbow.right)
      feedback.push({
        type: 'action',
        message: `Balance arm swing - reduce elbow angle difference by ${diff.toFixed(1)}°`,
        priority: 'medium'
      })
    }

    return feedback
  }

  const actionableFeedback = getActionableFeedback()

  return (
    <div className="realtime-feedback">
      <div className="section-header">
        <h2>Feedback</h2>
        <div className="status-indicator">
          <span className={`status-dot ${isActive ? 'active' : ''}`} />
          <span>{isActive ? 'Live Monitoring' : 'Offline Mode'}</span>
        </div>
      </div>

      {!isActive && (
        <div className="offline-notice">
          <p>Enable real-time monitoring to receive live feedback during your run.</p>
        </div>
      )}

      <div className="feedback-grid">
        <div className="current-metrics">
          <h3>Current Metrics</h3>
          <div className="metric-display">
            <div className="metric-item">
              <span className="metric-name">Overall Symmetry</span>
              <span className={`metric-value ${getFeedbackType(currentData.overallSymmetry).type}`}>
                {currentData.overallSymmetry}%
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Asymmetry Score</span>
              <span className={`metric-value ${currentData.asymmetryScore < 2 ? 'success' : currentData.asymmetryScore < 5 ? 'warning' : 'error'}`}>
                {currentData.asymmetryScore.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="joint-status">
          <h3>Joint Status</h3>
          <div className="joint-list">
            {jointFeedback.map((joint, index) => (
              <div key={index} className={`joint-item ${joint.type}`}>
                <div className="joint-header">
                  <span className="joint-icon">{joint.icon}</span>
                  <span className="joint-name">{joint.name}</span>
                  <span className="joint-symmetry">{joint.symmetry}%</span>
                </div>
                <div className="joint-message">{joint.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {actionableFeedback.length > 0 && (
        <div className="actionable-feedback">
          <h3>Actionable Feedback</h3>
          <div className="feedback-list" ref={feedbackRef}>
            {actionableFeedback.map((item, index) => (
              <div key={index} className={`feedback-item ${item.priority}`}>
                <div className="feedback-priority">
                  {item.priority === 'high' ? '🔴' : '🟡'}
                </div>
                <div className="feedback-message">{item.message}</div>
                <div className="feedback-time">
                  {isActive ? new Date().toLocaleTimeString() : 'Sample'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="feedback-tips">
        <h3>Tips for Better Symmetry</h3>
        <ul>
          <li>Focus on maintaining equal weight distribution between both legs</li>
          <li>Keep your core engaged to stabilize your hips</li>
          <li>Practice running drills to improve muscle balance</li>
          <li>Keep arms balanced to improve overall symmetry</li>
          <li>Maintain a consistent cadence (steps per minute)</li>
        </ul>
      </div>
    </div>
  )
}

export default RealTimeFeedback

