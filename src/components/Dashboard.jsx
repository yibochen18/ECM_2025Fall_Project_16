import React from 'react'
import './Dashboard.css'

function Dashboard({ data }) {
  const overallSymmetry = data.overallSymmetry
  const asymmetryScore = data.asymmetryScore
  const runDuration = data.runDuration
  const totalSteps = data.totalSteps

  const getSymmetryClass = (score) => {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'fair'
    return 'needs-improvement'
  }

  const getSymmetryLabel = (score) => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs Improvement'
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Run Analysis Overview</h2>
        <div className="run-info">
          <span>Duration: {runDuration}</span>
          <span>Steps: {totalSteps}</span>
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
          <div className={`metric-value ${getSymmetryClass(data.jointAngles.knee.symmetry)}`}>
            {data.jointAngles.knee.symmetry}%
          </div>
          <p className="metric-description">
            Left: {data.jointAngles.knee.left.toFixed(1)}° | Right: {data.jointAngles.knee.right.toFixed(1)}°
          </p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Hip Angle Symmetry</h3>
          </div>
          <div className={`metric-value ${getSymmetryClass(data.jointAngles.hip.symmetry)}`}>
            {data.jointAngles.hip.symmetry}%
          </div>
          <p className="metric-description">
            Left: {data.jointAngles.hip.left.toFixed(1)}° | Right: {data.jointAngles.hip.right.toFixed(1)}°
          </p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Ankle Angle Symmetry</h3>
          </div>
          <div className={`metric-value ${getSymmetryClass(data.jointAngles.ankle.symmetry)}`}>
            {data.jointAngles.ankle.symmetry}%
          </div>
          <p className="metric-description">
            Left: {data.jointAngles.ankle.left.toFixed(1)}° | Right: {data.jointAngles.ankle.right.toFixed(1)}°
          </p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Stride Length Symmetry</h3>
          </div>
          <div className={`metric-value ${getSymmetryClass(data.strideSymmetry)}`}>
            {data.strideSymmetry}%
          </div>
          <p className="metric-description">
            Consistency in step length between legs.
          </p>
        </div>

        {data.formAnalysis && (
          <>
            <div className="metric-card">
              <div className="metric-header">
                <h3>Foot Landing</h3>
              </div>
              <div className={`metric-value ${getSymmetryClass(data.formAnalysis.footLanding.symmetry)}`}>
                {data.formAnalysis.footLanding.symmetry}%
              </div>
              <p className="metric-description">
                Left: {data.formAnalysis.footLanding.left} | Right: {data.formAnalysis.footLanding.right}
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>Back Position</h3>
              </div>
              <div className={`metric-value ${getSymmetryClass(data.formAnalysis.backPosition.symmetry)}`}>
                {data.formAnalysis.backPosition.forwardLean.toFixed(1)}°
              </div>
              <p className="metric-description">
                Forward lean: {data.formAnalysis.backPosition.forwardLean.toFixed(1)}° ({data.formAnalysis.backPosition.status})
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>Front Knee at Landing</h3>
              </div>
              <div className={`metric-value ${getSymmetryClass(data.formAnalysis.kneeAnglesAtLanding.frontKnee.symmetry)}`}>
                {data.formAnalysis.kneeAnglesAtLanding.frontKnee.symmetry}%
              </div>
              <p className="metric-description">
                Left: {data.formAnalysis.kneeAnglesAtLanding.frontKnee.left.toFixed(1)}° | Right: {data.formAnalysis.kneeAnglesAtLanding.frontKnee.right.toFixed(1)}°
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>Arms Position</h3>
              </div>
              <div className={`metric-value ${getSymmetryClass(data.formAnalysis.armsPosition.symmetry)}`}>
                {data.formAnalysis.armsPosition.symmetry}%
              </div>
              <p className="metric-description">
                Angle symmetry: {data.formAnalysis.armsPosition.symmetry}% | Swing: {data.formAnalysis.armsPosition.swingSymmetry}%
              </p>
            </div>
          </>
        )}
      </div>

      <div className="recommendations-section">
        <h3>Recommendations</h3>
        <div className="recommendations-list">
          {data.recommendations.map((rec, index) => (
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

