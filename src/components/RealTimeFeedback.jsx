import React, { useEffect, useRef } from 'react'
import './RealTimeFeedback.css'
import { getFeedbackForMetric, getAsymmetryFeedback } from '../utils/feedbackConfig'

function RealTimeFeedback({ data, realTimeData, isActive, sessionAverages }) {
  const feedbackRef = useRef(null)

  useEffect(() => {
    if (feedbackRef.current && isActive) {
      feedbackRef.current.scrollTop = feedbackRef.current.scrollHeight
    }
  }, [realTimeData, isActive])

  const currentData = realTimeData || data
  
  // Use session averages if available, otherwise use current data
  const displayData = sessionAverages || currentData
  const isShowingAverages = !!sessionAverages
  
  // Handle case where there's no data at all
  const hasData = displayData && (displayData.jointAngles || displayData.frontKnee || displayData.knee)

  const getFeedbackType = (symmetry) => {
    if (symmetry >= 90) return { type: 'success', icon: '✓', message: 'Excellent symmetry!' }
    if (symmetry >= 75) return { type: 'warning', icon: '⚠', message: 'Good, but can improve' }
    return { type: 'error', icon: '✗', message: 'Needs attention' }
  }
  
  // Generate feedback based on session averages
  const getSessionBasedFeedback = () => {
    if (!sessionAverages || !sessionAverages.jointAngles) {
      return []
    }
    
    const feedback = []
    const ja = sessionAverages.jointAngles
    
    // Front Knee feedback
    if (ja.frontKnee && ja.frontKnee.angle !== undefined) {
      const frontKneeFeedback = getFeedbackForMetric('frontKnee', ja.frontKnee.angle)
      feedback.push({
        metric: 'Front Knee',
        value: `${ja.frontKnee.angle.toFixed(1)}°`,
        range: `${ja.frontKnee.min.toFixed(1)}° - ${ja.frontKnee.max.toFixed(1)}°`,
        ...frontKneeFeedback
      })
    }
    
    // Back Knee feedback
    if (ja.backKnee && ja.backKnee.angle !== undefined) {
      const backKneeFeedback = getFeedbackForMetric('backKnee', ja.backKnee.angle)
      feedback.push({
        metric: 'Back Knee',
        value: `${ja.backKnee.angle.toFixed(1)}°`,
        range: `${ja.backKnee.min.toFixed(1)}° - ${ja.backKnee.max.toFixed(1)}°`,
        ...backKneeFeedback
      })
    }
    
    // Elbow feedback
    if (ja.elbow) {
      const avgElbow = (ja.elbow.left + ja.elbow.right) / 2
      const elbowFeedback = getFeedbackForMetric('elbow', avgElbow)
      const elbowSymmetryFeedback = getAsymmetryFeedback('elbow', Math.abs(ja.elbow.left - ja.elbow.right))
      feedback.push({
        metric: 'Elbow Angles',
        value: `L: ${ja.elbow.left.toFixed(1)}°, R: ${ja.elbow.right.toFixed(1)}°`,
        symmetry: `${ja.elbow.symmetry.toFixed(1)}%`,
        ...elbowFeedback,
        symmetryFeedback: elbowSymmetryFeedback
      })
    }
    
    // Back to Head feedback
    if (ja.backToHead && ja.backToHead.angle !== undefined) {
      const backToHeadFeedback = getFeedbackForMetric('backToHead', ja.backToHead.angle)
      feedback.push({
        metric: 'Posture (Back to Head)',
        value: `${ja.backToHead.angle.toFixed(1)}°`,
        ...backToHeadFeedback
      })
    }
    
    // Knee Symmetry feedback
    if (ja.knee && ja.knee.symmetry !== undefined) {
      const kneeSymmetryFeedback = getAsymmetryFeedback('kneeSymmetry', ja.knee.symmetry)
      feedback.push({
        metric: 'Knee Symmetry',
        value: `${ja.knee.symmetry.toFixed(1)}%`,
        ...kneeSymmetryFeedback
      })
    }
    
    return feedback
  }
  
  const sessionFeedback = getSessionBasedFeedback()

  const getJointFeedback = () => {
    if (!currentData || !currentData.jointAngles) {
      return []
    }
    
    const joints = [
      { name: 'Knee', symmetry: currentData.jointAngles.knee?.symmetry || 0 },
      { name: 'Elbow', symmetry: currentData.jointAngles.elbow?.symmetry || 0 }
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
    if (!currentData || !currentData.jointAngles) {
      return []
    }
    
    const feedback = []
    const jointAngles = currentData.jointAngles
    
    if (jointAngles.knee?.symmetry !== undefined && jointAngles.knee.symmetry < 75) {
      const diff = (jointAngles.knee.left !== undefined && jointAngles.knee.right !== undefined)
        ? Math.abs(jointAngles.knee.left - jointAngles.knee.right)
        : 0
      if (jointAngles.knee.left !== undefined && jointAngles.knee.right !== undefined) {
        if (jointAngles.knee.left > jointAngles.knee.right) {
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
    }

    if (jointAngles.elbow?.symmetry !== undefined && jointAngles.elbow.symmetry < 75) {
      const diff = (jointAngles.elbow.left !== undefined && jointAngles.elbow.right !== undefined)
        ? Math.abs(jointAngles.elbow.left - jointAngles.elbow.right)
        : 0
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

      {isShowingAverages && (
        <div className="session-averages-banner" style={{
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #2196f3'
        }}>
          <strong>📊 Session Summary</strong>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>
            Displaying feedback based on average angles from your completed session
            {sessionAverages.totalFrames && ` (${sessionAverages.totalFrames} frames)`}
            {sessionAverages.sessionEndTime && (
              <span style={{ marginLeft: '10px', opacity: 0.7 }}>
                • Ended: {new Date(sessionAverages.sessionEndTime).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
      )}

      {!isActive && !isShowingAverages && (
        <div className="offline-notice">
          <p>Enable real-time monitoring to receive live feedback during your run.</p>
        </div>
      )}

      {hasData ? (
        <div className="feedback-grid">
          <div className="current-metrics">
            <h3>Current Metrics</h3>
            <div className="metric-display">
              <div className="metric-item">
                <span className="metric-name">Overall Symmetry</span>
                <span className={`metric-value ${currentData?.overallSymmetry !== undefined ? getFeedbackType(currentData.overallSymmetry).type : 'info'}`}>
                  {currentData?.overallSymmetry !== undefined ? `${currentData.overallSymmetry}%` : 'N/A'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Asymmetry Score</span>
                <span className={`metric-value ${currentData?.asymmetryScore !== undefined 
                  ? (currentData.asymmetryScore < 2 ? 'success' : currentData.asymmetryScore < 5 ? 'warning' : 'error')
                  : 'info'}`}>
                  {currentData?.asymmetryScore !== undefined ? `${currentData.asymmetryScore.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="joint-status">
            <h3>Joint Status</h3>
            {jointFeedback.length > 0 ? (
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
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>No joint data available</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No data available. Start a live session to see feedback.</p>
        </div>
      )}

      {/* Session-based feedback (when averages are available) */}
      {isShowingAverages && sessionFeedback.length > 0 && (
        <div className="session-feedback">
          <h3>Session Analysis & Feedback</h3>
          <div className="feedback-list" ref={feedbackRef}>
            {sessionFeedback.map((item, index) => (
              <div key={index} className={`feedback-item session-feedback-item ${item.type}`}>
                <div className="feedback-header">
                  <div className="feedback-metric-name">
                    <strong>{item.metric}</strong>
                    {item.value && <span className="feedback-value"> ({item.value})</span>}
                    {item.range && <span className="feedback-range"> Range: {item.range}</span>}
                    {item.symmetry && <span className="feedback-symmetry"> Symmetry: {item.symmetry}</span>}
                  </div>
                  <div className={`feedback-type-badge ${item.type}`}>
                    {item.type === 'success' ? '✓' : item.type === 'warning' ? '⚠' : item.type === 'error' ? '✗' : 'ℹ'}
                  </div>
                </div>
                <div className="feedback-message">{item.message}</div>
                {item.symmetryFeedback && (
                  <div className="feedback-symmetry-message" style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '0.9em', opacity: 0.9 }}>
                    {item.symmetryFeedback.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time actionable feedback (when live) */}
      {!isShowingAverages && actionableFeedback.length > 0 && (
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

