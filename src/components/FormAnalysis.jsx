import React from 'react'
import './FormAnalysis.css'

function FormAnalysis({ data, realTimeData }) {
  const displayData = realTimeData || data
  const formAnalysis = displayData.formAnalysis

  if (!formAnalysis) {
    return <div className="form-analysis">No form analysis data available</div>
  }

  const getSymmetryClass = (score) => {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    return 'needs-improvement'
  }

  const getFootLandingClass = (type) => {
    if (type === 'midfoot' || type === 'forefoot') return 'optimal'
    return 'suboptimal'
  }

  return (
    <div className="form-analysis">
      <div className="section-header">
        <h2>Form Analysis</h2>
        <p className="section-description">
          Detailed analysis of running form including foot landing, posture, and body positioning
        </p>
      </div>

      <div className="form-metrics-grid">
        {/* Foot Landing */}
        <div className="form-metric-card">
          <h3>Foot Landing</h3>
          <div className="metric-content">
            <div className="landing-comparison">
              <div className="landing-item">
                <div className="landing-label">Left</div>
                <div className={`landing-type ${getFootLandingClass(formAnalysis.footLanding.left)}`}>
                  {formAnalysis.footLanding.left.charAt(0).toUpperCase() + formAnalysis.footLanding.left.slice(1)}
                </div>
              </div>
              <div className="landing-separator">vs</div>
              <div className="landing-item">
                <div className="landing-label">Right</div>
                <div className={`landing-type ${getFootLandingClass(formAnalysis.footLanding.right)}`}>
                  {formAnalysis.footLanding.right.charAt(0).toUpperCase() + formAnalysis.footLanding.right.slice(1)}
                </div>
              </div>
            </div>
            <div className="symmetry-indicator">
              <span>Symmetry: {formAnalysis.footLanding.symmetry}%</span>
              <div className="symmetry-bar">
                <div 
                  className={`symmetry-fill ${getSymmetryClass(formAnalysis.footLanding.symmetry)}`}
                  style={{ '--symmetry-width': `${formAnalysis.footLanding.symmetry}%` }}
                />
              </div>
            </div>
            {formAnalysis.footLanding.recommendation && (
              <p className="metric-tip">{formAnalysis.footLanding.recommendation}</p>
            )}
          </div>
        </div>

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

