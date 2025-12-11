import React from 'react'
import './Dashboard.css'
import { getFeedbackForMetric, getAsymmetryFeedback } from '../utils/feedbackConfig'

/**
 * Dashboard Component
 * 
 * Data Sources (in priority order):
 * 1. sessionAverages - Session averages from backend (when session ends)
 * 2. realTimeData - Real-time data from backend (same structure as JointAngles receives)
 * 
 * Backend Data Structure (from http://localhost:4000/joint-angles):
 * {
 *   frontKnee: { angle, ... },
 *   backKnee: { angle, ... },
 *   backToHead: { angle, spineCurvature },
 *   elbow: { left, right, symmetry },
 *   knee: { left, right, symmetry }
 * }
 * 
 * MISSING from backend (will show as 'N/A'):
 * - runDuration: Actual duration of the run (e.g., "25:30")
 * All other metrics are calculated from the joint angles data above.
 */
function Dashboard({ data, realTimeData, sessionAverages }) {
  // Priority: sessionAverages > realTimeData
  // Use session averages if available, otherwise use real-time backend data
  let displayData
  
  if (sessionAverages) {
    displayData = convertSessionAveragesToDashboardFormat(sessionAverages)
  } else if (realTimeData) {
    // Convert real-time backend data to dashboard format
    displayData = convertRealTimeDataToDashboardFormat(realTimeData)
  } else {
    // No data available - show message
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Run Analysis Overview</h2>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No data available. Start a live session to see metrics.</p>
        </div>
      </div>
    )
  }
  
  const overallSymmetry = displayData.overallSymmetry
  const asymmetryScore = displayData.asymmetryScore
  const runDuration = displayData.runDuration || 'N/A'
  
  // Helper function to convert real-time backend data to dashboard format
  function convertRealTimeDataToDashboardFormat(rtData) {
    // Backend sends: { frontKnee, backKnee, backToHead, elbow, knee }
    // Same structure as what JointAngles receives
    const jointAngles = rtData.jointAngles || {
      frontKnee: rtData.frontKnee,
      backKnee: rtData.backKnee,
      backToHead: rtData.backToHead,
      elbow: rtData.elbow,
      knee: rtData.knee
    }
    
    // Calculate overall symmetry as average of knee and elbow symmetry
    const overallSymmetry = jointAngles.knee?.symmetry && jointAngles.elbow?.symmetry
      ? (jointAngles.knee.symmetry + jointAngles.elbow.symmetry) / 2
      : 0
    
    // Calculate asymmetry score (difference between left and right)
    const kneeDiff = jointAngles.knee?.left && jointAngles.knee?.right
      ? Math.abs(jointAngles.knee.left - jointAngles.knee.right)
      : 0
    const elbowDiff = jointAngles.elbow?.left && jointAngles.elbow?.right
      ? Math.abs(jointAngles.elbow.left - jointAngles.elbow.right)
      : 0
    const asymmetryScore = (kneeDiff + elbowDiff) / 2
    
    // Convert to formAnalysis format
    const frontKneeAngle = jointAngles.frontKnee?.angle || 0
    const backKneeAngle = jointAngles.backKnee?.angle || 0
    const kneeSymmetry = jointAngles.knee?.symmetry || 0
    
    const formAnalysis = {
      backPosition: {
        forwardLean: Math.abs(jointAngles.backToHead?.angle || 0),
        symmetry: 90, // Default, not available from backend
        status: 'N/A' // Status determined by feedbackConfig in render
      },
      kneeAnglesAtLanding: {
        frontKnee: {
          left: frontKneeAngle,
          right: frontKneeAngle, // Using same value, backend doesn't provide left/right for front/back
          symmetry: kneeSymmetry
        },
        backKnee: {
          left: backKneeAngle,
          right: backKneeAngle, // Using same value, backend doesn't provide left/right for front/back
          symmetry: kneeSymmetry
        }
      },
      armsPosition: {
        leftAngle: jointAngles.elbow?.left || 0,
        rightAngle: jointAngles.elbow?.right || 0,
        symmetry: jointAngles.elbow?.symmetry || 0,
        swingSymmetry: jointAngles.elbow?.symmetry || 0 // Using elbow symmetry as proxy
      }
    }
    
    return {
      overallSymmetry: Math.round(overallSymmetry),
      asymmetryScore: asymmetryScore,
      runDuration: 'N/A', // MISSING: Not provided by backend
      jointAngles: jointAngles,
      formAnalysis: formAnalysis,
      recommendations: generateRecommendations(jointAngles, overallSymmetry, asymmetryScore)
    }
  }
  
  // Helper function to convert session averages to dashboard format
  function convertSessionAveragesToDashboardFormat(avgData) {
    const jointAngles = avgData.jointAngles
    
    // Calculate overall symmetry as average of knee and elbow symmetry
    const overallSymmetry = (jointAngles.knee.symmetry + jointAngles.elbow.symmetry) / 2
    
    // Calculate asymmetry score (difference between left and right)
    const kneeDiff = Math.abs(jointAngles.knee.left - jointAngles.knee.right)
    const elbowDiff = Math.abs(jointAngles.elbow.left - jointAngles.elbow.right)
    const asymmetryScore = (kneeDiff + elbowDiff) / 2
    
    // Estimate duration from totalFrames (assuming ~30fps)
    const estimatedDuration = avgData.totalFrames ? `${Math.floor(avgData.totalFrames / 30 / 60)}:${String(Math.floor((avgData.totalFrames / 30) % 60)).padStart(2, '0')}` : 'N/A'
    
    // Convert to formAnalysis format
    const frontKneeAvg = jointAngles.frontKnee.angle
    const backKneeAvg = jointAngles.backKnee.angle
    const kneeSymmetry = jointAngles.knee.symmetry || 95
    
    const formAnalysis = {
      backPosition: {
        forwardLean: Math.abs(jointAngles.backToHead.angle),
        symmetry: 90,
        status: 'N/A' // Status determined by feedbackConfig in render
      },
      kneeAnglesAtLanding: {
        frontKnee: {
          left: frontKneeAvg,
          right: frontKneeAvg,
          symmetry: kneeSymmetry
        },
        backKnee: {
          left: backKneeAvg,
          right: backKneeAvg,
          symmetry: kneeSymmetry
        }
      },
      armsPosition: {
        leftAngle: jointAngles.elbow.left,
        rightAngle: jointAngles.elbow.right,
        symmetry: jointAngles.elbow.symmetry,
        swingSymmetry: jointAngles.elbow.symmetry
      }
    }
    
    return {
      overallSymmetry: Math.round(overallSymmetry),
      asymmetryScore: asymmetryScore,
      runDuration: estimatedDuration,
      jointAngles: jointAngles,
      formAnalysis: formAnalysis,
      recommendations: generateRecommendations(jointAngles, overallSymmetry, asymmetryScore)
    }
  }
  
  // Generate recommendations based on session data
  function generateRecommendations(jointAngles, overallSymmetry, asymmetryScore) {
    const recommendations = []
    
    if (overallSymmetry < 75) {
      recommendations.push('Focus on improving overall symmetry between left and right sides')
    }
    
    if (jointAngles.knee.symmetry < 75) {
      recommendations.push('Work on balancing knee angles between both legs')
    }
    
    if (jointAngles.elbow.symmetry < 75) {
      recommendations.push('Maintain balanced arm swing for better symmetry')
    }
    
    if (Math.abs(jointAngles.backToHead.angle) > 10) {
      recommendations.push('Keep your head aligned with your back for better posture')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Great job maintaining good form! Keep up the excellent work.')
    }
    
    return recommendations
  }

  // Get status class from feedbackConfig thresholds
  // Map feedbackConfig threshold names to CSS classes
  // CSS supports: excellent (green), good (yellow), fair (orange), needs-improvement (red)
  const getStatusClass = (threshold) => {
    if (!threshold) return 'needs-improvement'
    if (threshold === 'excellent') return 'excellent'
    if (threshold === 'good') return 'good'
    if (threshold === 'needsImprovement') return 'needs-improvement'
    if (threshold === 'bad') return 'needs-improvement' // Bad is red
    if (threshold === 'tooForward') return 'needs-improvement' // Too forward is red
    if (threshold === 'tooBackward') return 'needs-improvement' // Too backward is red
    return 'needs-improvement'
  }

  const getStatusLabel = (threshold) => {
    if (!threshold) return 'Needs Improvement'
    if (threshold === 'excellent') return 'Excellent'
    if (threshold === 'good') return 'Good'
    if (threshold === 'needsImprovement') return 'Needs Improvement'
    if (threshold === 'bad') return 'Bad' // Bad has its own label
    if (threshold === 'tooForward') return 'Too Forward' // Too Forward has its own label
    if (threshold === 'tooBackward') return 'Too Backward' // Too Backward has its own label
    return 'Needs Improvement'
  }

  // Legacy function for symmetry scores (uses feedbackConfig kneeSymmetry thresholds)
  const getSymmetryClass = (score) => {
    const feedback = getAsymmetryFeedback('kneeSymmetry', score)
    return getStatusClass(feedback.threshold || feedback.type)
  }

  const getSymmetryLabel = (score) => {
    const feedback = getAsymmetryFeedback('kneeSymmetry', score)
    return getStatusLabel(feedback.threshold || feedback.type)
  }

  // Get status for angle-based metrics using feedbackConfig
  const getAngleStatus = (metricType, angle) => {
    const feedback = getFeedbackForMetric(metricType, angle)
    return {
      class: getStatusClass(feedback.threshold || feedback.type),
      label: getStatusLabel(feedback.threshold || feedback.type)
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Run Analysis Overview</h2>
        <div className="run-info">
          <span>Duration: {runDuration}</span>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-header">
            <h3>Overall Symmetry</h3>
            <span className={`metric-label ${getSymmetryClass(overallSymmetry)}`}>
              {getSymmetryLabel(overallSymmetry)}
            </span>
          </div>
          <div className={`metric-value ${getSymmetryClass(overallSymmetry)}`}>
            {overallSymmetry}%
          </div>
          <div className="metric-progress">
            <div 
              className={`metric-progress-bar ${getSymmetryClass(overallSymmetry)}`}
              style={{ '--progress-width': `${overallSymmetry}%` }}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Asymmetry Score</h3>
          </div>
          <div className={`metric-value ${getSymmetryClass(100 - asymmetryScore)}`}>
            {asymmetryScore.toFixed(1)}%
          </div>
          <p className="metric-description">
            Lower is better. Measures overall form deviation.
          </p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Knee Angle Symmetry</h3>
          </div>
          <div className={`metric-value ${getSymmetryClass(displayData.jointAngles.knee.symmetry)}`}>
            {displayData.jointAngles.knee.symmetry}%
          </div>
          <p className="metric-description">
            Left: {displayData.jointAngles.knee.left.toFixed(1)}° | Right: {displayData.jointAngles.knee.right.toFixed(1)}°
          </p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Elbow Angle Symmetry</h3>
          </div>
          <div className={`metric-value ${getSymmetryClass(displayData.jointAngles.elbow.symmetry)}`}>
            {displayData.jointAngles.elbow.symmetry}%
          </div>
          <p className="metric-description">
            Left: {displayData.jointAngles.elbow.left.toFixed(1)}° | Right: {displayData.jointAngles.elbow.right.toFixed(1)}°
          </p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Back to Head Tilt</h3>
            <span className={`metric-label ${getAngleStatus('backToHead', displayData.jointAngles.backToHead.angle).class}`}>
              {getAngleStatus('backToHead', displayData.jointAngles.backToHead.angle).label}
            </span>
          </div>
          <div className={`metric-value ${getAngleStatus('backToHead', displayData.jointAngles.backToHead.angle).class}`}>
            {displayData.jointAngles.backToHead.angle.toFixed(1)}°
          </div>
          <p className="metric-description">
            Spine curvature: {displayData.jointAngles.backToHead.spineCurvature.toFixed(1)}°
          </p>
        </div>

        {displayData.formAnalysis && (
          <>
            <div className="metric-card">
              <div className="metric-header">
                <h3>Back Position</h3>
                <span className={`metric-label ${getAngleStatus('backToHead', displayData.jointAngles.backToHead.angle).class}`}>
                  {getAngleStatus('backToHead', displayData.jointAngles.backToHead.angle).label}
                </span>
              </div>
              <div className={`metric-value ${getAngleStatus('backToHead', displayData.jointAngles.backToHead.angle).class}`}>
                {displayData.formAnalysis.backPosition.forwardLean.toFixed(1)}°
              </div>
              <p className="metric-description">
                Forward lean: {displayData.formAnalysis.backPosition.forwardLean.toFixed(1)}°
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>Front Knee</h3>
                <span className={`metric-label ${getAngleStatus('frontKnee', displayData.jointAngles.frontKnee.angle).class}`}>
                  {getAngleStatus('frontKnee', displayData.jointAngles.frontKnee.angle).label}
                </span>
              </div>
              <div className={`metric-value ${getAngleStatus('frontKnee', displayData.jointAngles.frontKnee.angle).class}`}>
                {displayData.jointAngles.frontKnee.angle.toFixed(1)}°
              </div>
              <p className="metric-description">
                Symmetry: {displayData.formAnalysis.kneeAnglesAtLanding.frontKnee.symmetry}% | Range: {displayData.jointAngles.frontKnee.min?.toFixed(1) || 'N/A'}° - {displayData.jointAngles.frontKnee.max?.toFixed(1) || 'N/A'}°
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>Back Knee</h3>
                <span className={`metric-label ${getAngleStatus('backKnee', displayData.jointAngles.backKnee.angle).class}`}>
                  {getAngleStatus('backKnee', displayData.jointAngles.backKnee.angle).label}
                </span>
              </div>
              <div className={`metric-value ${getAngleStatus('backKnee', displayData.jointAngles.backKnee.angle).class}`}>
                {displayData.jointAngles.backKnee.angle.toFixed(1)}°
              </div>
              <p className="metric-description">
                Symmetry: {displayData.formAnalysis.kneeAnglesAtLanding.backKnee.symmetry}% | Range: {displayData.jointAngles.backKnee.min?.toFixed(1) || 'N/A'}° - {displayData.jointAngles.backKnee.max?.toFixed(1) || 'N/A'}°
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>Arms Position</h3>
                <span className={`metric-label ${getSymmetryClass(displayData.formAnalysis.armsPosition.symmetry)}`}>
                  {getSymmetryLabel(displayData.formAnalysis.armsPosition.symmetry)}
                </span>
              </div>
              <div className={`metric-value ${getSymmetryClass(displayData.formAnalysis.armsPosition.symmetry)}`}>
                {displayData.formAnalysis.armsPosition.symmetry}%
              </div>
              <p className="metric-description">
                Left: {displayData.jointAngles.elbow.left.toFixed(1)}° | Right: {displayData.jointAngles.elbow.right.toFixed(1)}° | Swing: {displayData.formAnalysis.armsPosition.swingSymmetry}%
              </p>
            </div>
          </>
        )}
      </div>

      <div className="recommendations-section">
        <h3>Recommendations</h3>
        <div className="recommendations-list">
          {displayData.recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <span className="recommendation-icon">💡</span>
              <p>{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

