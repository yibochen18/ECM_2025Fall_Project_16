import React from 'react'
import './FormAnalysis.css'

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

  const backPosition = {
    forwardLean: safeNumber(backToHead.angle),
    status: 'Good',
    symmetry: safeNumber(knee.symmetry, 0),
    recommendation: 'Maintain slight forward lean (6-8°) for optimal running efficiency.',
  }

  const kneeAnglesAtLanding = {
    frontKnee: {
      left: safeNumber(frontKnee.left ?? frontKnee.angle),
      right: safeNumber(frontKnee.right ?? frontKnee.angle),
      symmetry: safeNumber(frontKnee.symmetry ?? knee.symmetry, 0),
    },
    backKnee: {
      left: safeNumber(backKnee.left ?? backKnee.angle),
      right: safeNumber(backKnee.right ?? backKnee.angle),
      symmetry: safeNumber(backKnee.symmetry ?? knee.symmetry, 0),
    },
  }

  const armsPosition = {
    leftAngle: safeNumber(elbow.left ?? elbow.angle),
    rightAngle: safeNumber(elbow.right ?? elbow.angle),
    symmetry: safeNumber(elbow.symmetry, 0),
    swingSymmetry: safeNumber(elbow.symmetry, 0),
    recommendation: 'Keep arms at 85–90° angle, avoiding cross-body swing.',
  }

  const headPosition = {
    tilt: safeNumber(backToHead.tilt ?? backToHead.angle, 0),
    forwardPosition: safeNumber(backToHead.forwardPosition, 0),
    symmetry: safeNumber(backToHead.symmetry ?? knee.symmetry, 0),
    recommendation: 'Keep head neutral, eyes looking 10–20m ahead.',
  }

  return {
    backPosition,
    kneeAnglesAtLanding,
    armsPosition,
    headPosition,
  }
}

function FormAnalysis({ data, realTimeData, sessionAverages }) {
  const baseData = realTimeData || data || null

  let formAnalysis = null

  if (sessionAverages) {
    formAnalysis = convertSessionAveragesToFormAnalysis(sessionAverages)
  } else if (baseData && baseData.formAnalysis) {
    formAnalysis = baseData.formAnalysis
  } else if (baseData && baseData.jointAngles) {
    // Shape like { jointAngles: { ... } }
    formAnalysis = convertSessionAveragesToFormAnalysis({ jointAngles: baseData.jointAngles })
  } else if (baseData && (baseData.frontKnee || baseData.backKnee || baseData.elbow || baseData.backToHead || baseData.knee)) {
    // Live frame shape from backend: { frontKnee, backKnee, backToHead, elbow, knee }
    formAnalysis = convertSessionAveragesToFormAnalysis(baseData)
  }

  const displayData = baseData || (sessionAverages ? { jointAngles: sessionAverages.jointAngles } : null)
  
  // Handle no data case
  if (!displayData && !formAnalysis) {
    return (
      <div className="form-analysis">
        <div className="section-header">
          <h2>Form Analysis</h2>
          <p className="section-description">
            Detailed analysis of running form including posture and body positioning
          </p>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No data available. Start a live session to see form analysis.</p>
        </div>
      </div>
    )
  }
  
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
          <p>No form analysis data available. Start a live session to see metrics.</p>
        </div>
      </div>
    )
  }

  const getSymmetryClass = (score) => {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    return 'needs-improvement'
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
              <div className="position-label">Forward Lean</div>
            </div>
            <div className="position-status">
              <span className={`status-badge ${formAnalysis.backPosition.status === 'Good' ? 'good' : 'warning'}`}>
                {formAnalysis.backPosition.status}
              </span>
            </div>
            <div className="symmetry-indicator">
              <span>Symmetry: {formAnalysis.backPosition.symmetry}%</span>
              <div className="symmetry-bar">
                <div 
                  className={`symmetry-fill ${getSymmetryClass(formAnalysis.backPosition.symmetry)}`}
                  style={{ '--symmetry-width': `${formAnalysis.backPosition.symmetry}%` }}
                />
              </div>
            </div>
            {formAnalysis.backPosition.recommendation && (
              <p className="metric-tip">{formAnalysis.backPosition.recommendation}</p>
            )}
          </div>
        </div>

        {/* Front Knee Angle at Landing */}
        <div className="form-metric-card">
          <h3>Front Knee Angle at Landing</h3>
          <div className="metric-content">
            <div className="angle-comparison">
              <div className="angle-display">
                <div className="angle-label">Left</div>
                <div className="angle-value">
                  {formAnalysis.kneeAnglesAtLanding.frontKnee.left.toFixed(1)}°
                </div>
              </div>
              <div className="angle-separator">vs</div>
              <div className="angle-display">
                <div className="angle-label">Right</div>
                <div className="angle-value">
                  {formAnalysis.kneeAnglesAtLanding.frontKnee.right.toFixed(1)}°
                </div>
              </div>
            </div>
            <div className="symmetry-indicator">
              <span>Symmetry: {formAnalysis.kneeAnglesAtLanding.frontKnee.symmetry}%</span>
              <div className="symmetry-bar">
                <div 
                  className={`symmetry-fill ${getSymmetryClass(formAnalysis.kneeAnglesAtLanding.frontKnee.symmetry)}`}
                  style={{ '--symmetry-width': `${formAnalysis.kneeAnglesAtLanding.frontKnee.symmetry}%` }}
                />
              </div>
            </div>
            <p className="metric-tip">Optimal: 160-165° for efficient shock absorption</p>
          </div>
        </div>

        {/* Back Knee Angle at Landing */}
        <div className="form-metric-card">
          <h3>Back Knee Angle at Landing</h3>
          <div className="metric-content">
            <div className="angle-comparison">
              <div className="angle-display">
                <div className="angle-label">Left</div>
                <div className="angle-value">
                  {formAnalysis.kneeAnglesAtLanding.backKnee.left.toFixed(1)}°
                </div>
              </div>
              <div className="angle-separator">vs</div>
              <div className="angle-display">
                <div className="angle-label">Right</div>
                <div className="angle-value">
                  {formAnalysis.kneeAnglesAtLanding.backKnee.right.toFixed(1)}°
                </div>
              </div>
            </div>
            <div className="symmetry-indicator">
              <span>Symmetry: {formAnalysis.kneeAnglesAtLanding.backKnee.symmetry}%</span>
              <div className="symmetry-bar">
                <div 
                  className={`symmetry-fill ${getSymmetryClass(formAnalysis.kneeAnglesAtLanding.backKnee.symmetry)}`}
                  style={{ '--symmetry-width': `${formAnalysis.kneeAnglesAtLanding.backKnee.symmetry}%` }}
                />
              </div>
            </div>
            <p className="metric-tip">Optimal: 25-35° for proper leg recovery</p>
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
            <div className="symmetry-indicator">
              <span>Angle Symmetry: {formAnalysis.armsPosition.symmetry}%</span>
              <div className="symmetry-bar">
                <div 
                  className={`symmetry-fill ${getSymmetryClass(formAnalysis.armsPosition.symmetry)}`}
                  style={{ '--symmetry-width': `${formAnalysis.armsPosition.symmetry}%` }}
                />
              </div>
            </div>
            <div className="symmetry-indicator symmetry-indicator-spaced">
              <span>Swing Symmetry: {formAnalysis.armsPosition.swingSymmetry}%</span>
              <div className="symmetry-bar">
                <div 
                  className={`symmetry-fill ${getSymmetryClass(formAnalysis.armsPosition.swingSymmetry)}`}
                  style={{ '--symmetry-width': `${formAnalysis.armsPosition.swingSymmetry}%` }}
                />
              </div>
            </div>
            {formAnalysis.armsPosition.recommendation && (
              <p className="metric-tip">{formAnalysis.armsPosition.recommendation}</p>
            )}
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
              <div className="head-metric-item">
                <div className="head-metric-label">Forward Position</div>
                <div className="head-metric-value">
                  {formAnalysis.headPosition.forwardPosition.toFixed(1)} cm
                </div>
              </div>
            </div>
            <div className="symmetry-indicator">
              <span>Symmetry: {formAnalysis.headPosition.symmetry}%</span>
              <div className="symmetry-bar">
                <div 
                  className={`symmetry-fill ${getSymmetryClass(formAnalysis.headPosition.symmetry)}`}
                  style={{ '--symmetry-width': `${formAnalysis.headPosition.symmetry}%` }}
                />
              </div>
            </div>
            {formAnalysis.headPosition.recommendation && (
              <p className="metric-tip">{formAnalysis.headPosition.recommendation}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FormAnalysis

