import React from 'react'
import './FormAnalysis.css'
import { getFeedbackForMetric } from '../utils/feedbackConfig'

// Convert session-level averages into the formAnalysis structure
// expected by the UI below. This keeps the component logic simple
// and makes it easy to adjust mappings later.
function convertSessionAveragesToFormAnalysis(sessionAverages) {
  if (!sessionAverages) {
    return null
  }

  const ja = sessionAverages.jointAngles || sessionAverages

  // Safely read helper to avoid lots of repeated optional chaining.
  const safeNumber = (value, fallback = 0) => (
    typeof value === 'number' ? value : fallback
  )

  const backToHead = ja.backToHead || {}
  const frontKnee = ja.frontKnee || {}
  const backKnee = ja.backKnee || {}
  const elbow = ja.elbow || {}
  const knee = ja.knee || {}

  // Back Position uses spine curvature (angle between spine segments)
  const spineCurvature = safeNumber(backToHead.spineCurvature, 0)
  // Note: spine curvature doesn't have feedbackConfig thresholds yet
  // For now, use a simple threshold: < 180° = curved, closer to 180° = straighter
  const backPositionStatus = spineCurvature > 170 ? 'Good' : 'Warning'

  const backPosition = {
    forwardLean: spineCurvature, // Actually spine curvature angle
    status: backPositionStatus,
  }

  // Front/back knee angles are averages from the session
  const kneeAnglesAtLanding = {
    frontKnee: {
      angle: safeNumber(frontKnee.angle), // Average front knee angle
      symmetry: safeNumber(knee.symmetry, 0), // Left/right knee symmetry
    },
    backKnee: {
      angle: safeNumber(backKnee.angle), // Average back knee angle
      symmetry: safeNumber(knee.symmetry, 0), // Left/right knee symmetry
    },
  }

  const armsPosition = {
    leftAngle: safeNumber(elbow.left ?? elbow.angle),
    rightAngle: safeNumber(elbow.right ?? elbow.angle),
    symmetry: safeNumber(elbow.symmetry, 0),
  }

  const headPosition = {
    tilt: safeNumber(backToHead.tilt ?? backToHead.angle, 0),
  }

  return {
    backPosition,
    kneeAnglesAtLanding,
    armsPosition,
    headPosition,
  }
}

function FormAnalysis({ data, realTimeData, sessionAverages }) {
  // FormAnalysis only displays session averages, not live data
  // This ensures consistent analysis based on the full session
  let formAnalysis = null

  if (sessionAverages) {
    formAnalysis = convertSessionAveragesToFormAnalysis(sessionAverages)
  } else if (data && data.formAnalysis) {
    // Fallback for legacy data format
    formAnalysis = data.formAnalysis
  }

  const displayData = sessionAverages ? { jointAngles: sessionAverages.jointAngles } : null
  
  // Handle no data case
  if (!formAnalysis) {
    return (
      <div className="form-analysis">
        <div className="section-header">
          <h2>Form Analysis</h2>
          <p className="section-description">
            Detailed analysis of running form including posture and body positioning
          </p>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>Form analysis will be available after your session ends.</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9em', opacity: 0.8 }}>
            Complete a running session to see detailed form metrics and averages.
          </p>
        </div>
      </div>
    )
  }

  const getSymmetryClass = (score) => {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    return 'needs-improvement'
  }

  // Get status for angle-based metrics using feedbackConfig (similar to Dashboard)
  const getAngleStatus = (metricType, angle) => {
    const feedback = getFeedbackForMetric(metricType, angle)
    return {
      class: feedback.threshold === 'excellent' ? 'excellent' : 
             feedback.threshold === 'good' ? 'good' : 
             feedback.threshold === 'needsImprovement' ? 'needs-improvement' : 'needs-improvement',
      label: feedback.threshold === 'excellent' ? 'Excellent' :
             feedback.threshold === 'good' ? 'Good' :
             feedback.threshold === 'needsImprovement' ? 'Needs Improvement' :
             feedback.threshold === 'bad' ? 'Bad' :
             feedback.threshold === 'tooForward' ? 'Too Forward' :
             feedback.threshold === 'tooBackward' ? 'Too Backward' : 'Needs Improvement'
    }
  }

  return (
    <div className="form-analysis">
      <div className="section-header">
        <h2>Form Analysis</h2>
        <p className="section-description">
          Detailed analysis of running form including posture and body positioning
        </p>
        {sessionAverages && (
          <div className="session-info" style={{ 
            marginTop: '10px', 
            padding: '8px 12px', 
            backgroundColor: '#e8f5e9', 
            borderRadius: '4px',
            fontSize: '0.9em',
            color: '#2e7d32'
          }}>
            ✓ Displaying session averages from {sessionAverages.totalFrames || 'N/A'} frames
            {sessionAverages.sessionEndTime && (
              <span style={{ marginLeft: '10px', opacity: 0.8 }}>
                (Session ended: {new Date(sessionAverages.sessionEndTime).toLocaleTimeString()})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="form-metrics-grid">
        {/* Back Position */}
        <div className="form-metric-card">
          <h3>Back Position</h3>
          <div className="metric-content">
            <div className="position-display">
              <div className="position-value">
                {formAnalysis.backPosition.forwardLean.toFixed(1)}°
              </div>
              <div className="position-label">Spine Curvature</div>
            </div>
            <div className="position-status">
              <span className={`status-badge ${formAnalysis.backPosition.status === 'Good' ? 'good' : 'warning'}`}>
                {formAnalysis.backPosition.status}
              </span>
            </div>
          </div>
        </div>

        {/* Front Knee Angle at Landing */}
        <div className="form-metric-card">
          <h3>Front Knee Angle at Landing</h3>
          <div className="metric-content">
            <div className="position-display">
              <div className="position-value">
                {formAnalysis.kneeAnglesAtLanding.frontKnee.angle.toFixed(1)}°
              </div>
              <div className="position-label">Average Front Knee Angle</div>
            </div>
            <div className="position-status">
              <span className={`status-badge ${getAngleStatus('frontKnee', formAnalysis.kneeAnglesAtLanding.frontKnee.angle).class}`}>
                {getAngleStatus('frontKnee', formAnalysis.kneeAnglesAtLanding.frontKnee.angle).label}
              </span>
            </div>
            <div className="symmetry-indicator">
              <span>Knee Symmetry: {formAnalysis.kneeAnglesAtLanding.frontKnee.symmetry}%</span>
              <div className="symmetry-bar">
                <div 
                  className={`symmetry-fill ${getSymmetryClass(formAnalysis.kneeAnglesAtLanding.frontKnee.symmetry)}`}
                  style={{ '--symmetry-width': `${formAnalysis.kneeAnglesAtLanding.frontKnee.symmetry}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Back Knee Angle at Landing */}
        <div className="form-metric-card">
          <h3>Back Knee Angle at Landing</h3>
          <div className="metric-content">
            <div className="position-display">
              <div className="position-value">
                {formAnalysis.kneeAnglesAtLanding.backKnee.angle.toFixed(1)}°
              </div>
              <div className="position-label">Average Back Knee Angle</div>
            </div>
            <div className="position-status">
              <span className={`status-badge ${getAngleStatus('backKnee', formAnalysis.kneeAnglesAtLanding.backKnee.angle).class}`}>
                {getAngleStatus('backKnee', formAnalysis.kneeAnglesAtLanding.backKnee.angle).label}
              </span>
            </div>
            <div className="symmetry-indicator">
              <span>Knee Symmetry: {formAnalysis.kneeAnglesAtLanding.backKnee.symmetry}%</span>
              <div className="symmetry-bar">
                <div 
                  className={`symmetry-fill ${getSymmetryClass(formAnalysis.kneeAnglesAtLanding.backKnee.symmetry)}`}
                  style={{ '--symmetry-width': `${formAnalysis.kneeAnglesAtLanding.backKnee.symmetry}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Arms Position */}
        <div className="form-metric-card">
          <h3>Arms Position</h3>
          <div className="metric-content">
            <div className="angle-comparison">
              <div className="angle-display">
                <div className="angle-label">Left</div>
                <div className="angle-value">
                  {formAnalysis.armsPosition.leftAngle.toFixed(1)}°
                </div>
              </div>
              <div className="angle-separator">vs</div>
              <div className="angle-display">
                <div className="angle-label">Right</div>
                <div className="angle-value">
                  {formAnalysis.armsPosition.rightAngle.toFixed(1)}°
                </div>
              </div>
            </div>
            <div className="position-status">
              <span className={`status-badge ${getAngleStatus('elbow', (formAnalysis.armsPosition.leftAngle + formAnalysis.armsPosition.rightAngle) / 2).class}`}>
                {getAngleStatus('elbow', (formAnalysis.armsPosition.leftAngle + formAnalysis.armsPosition.rightAngle) / 2).label}
              </span>
            </div>
            <div className="symmetry-indicator">
              <span>Angle Symmetry: {formAnalysis.armsPosition.symmetry}%</span>
              <div className="symmetry-bar">
                <div 
                  className={`symmetry-fill ${getSymmetryClass(formAnalysis.armsPosition.symmetry)}`}
                  style={{ '--symmetry-width': `${formAnalysis.armsPosition.symmetry}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Head Position */}
        <div className="form-metric-card">
          <h3>Head Position</h3>
          <div className="metric-content">
            <div className="head-metrics">
              <div className="head-metric-item">
                <div className="head-metric-label">Tilt</div>
                <div className="head-metric-value">
                  {formAnalysis.headPosition.tilt > 0 ? '+' : ''}{formAnalysis.headPosition.tilt.toFixed(1)}°
                </div>
              </div>
            </div>
            <div className="position-status">
              <span className={`status-badge ${getAngleStatus('backToHead', formAnalysis.headPosition.tilt).class}`}>
                {getAngleStatus('backToHead', formAnalysis.headPosition.tilt).label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FormAnalysis

