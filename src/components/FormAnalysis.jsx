import React from 'react'
import './FormAnalysis.css'

function FormAnalysis({ data, realTimeData, sessionAverages }) {
  // Use session averages if available, otherwise use regular data
  const displayData = sessionAverages ? {
    jointAngles: sessionAverages.jointAngles,
    formAnalysis: convertSessionAveragesToFormAnalysis(sessionAverages)
  } : (realTimeData || data)
  
  // Handle no data case
  if (!displayData) {
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
  
  const formAnalysis = displayData.formAnalysis

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

