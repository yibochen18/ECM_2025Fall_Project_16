import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import './AsymmetryMetrics.css'

function AsymmetryMetrics({ data, realTimeData }) {
  const displayData = realTimeData || data

  // Prepare bar chart data
  const asymmetryData = [
    {
      joint: 'Knee',
      asymmetry: Math.abs(displayData.jointAngles.knee.left - displayData.jointAngles.knee.right),
      symmetry: displayData.jointAngles.knee.symmetry
    },
    {
      joint: 'Hip',
      asymmetry: Math.abs(displayData.jointAngles.hip.left - displayData.jointAngles.hip.right),
      symmetry: displayData.jointAngles.hip.symmetry
    },
    {
      joint: 'Ankle',
      asymmetry: Math.abs(displayData.jointAngles.ankle.left - displayData.jointAngles.ankle.right),
      symmetry: displayData.jointAngles.ankle.symmetry
    }
  ]

  // Prepare radar chart data
  const radarData = [
    {
      metric: 'Knee',
      symmetry: displayData.jointAngles.knee.symmetry
    },
    {
      metric: 'Hip',
      symmetry: displayData.jointAngles.hip.symmetry
    },
    {
      metric: 'Ankle',
      symmetry: displayData.jointAngles.ankle.symmetry
    },
    {
      metric: 'Stride',
      symmetry: displayData.strideSymmetry
    },
    {
      metric: 'Overall',
      symmetry: displayData.overallSymmetry
    }
  ]

  const getAsymmetryLevel = (asymmetry) => {
    if (asymmetry < 2) return { level: 'Low', class: 'low' }
    if (asymmetry < 5) return { level: 'Moderate', class: 'moderate' }
    return { level: 'High', class: 'high' }
  }

  return (
    <div className="asymmetry-metrics">
      <div className="section-header">
        <h2>Asymmetry Analysis</h2>
        <p className="section-description">
          Detailed breakdown of form asymmetries to identify areas for improvement
        </p>
      </div>

      <div className="asymmetry-overview">
        <div className="overview-card">
          <h3>Overall Asymmetry Score</h3>
          <div className="score-display">
            <div className={`score-value ${getAsymmetryLevel(displayData.asymmetryScore).class}`}>
              {displayData.asymmetryScore.toFixed(1)}%
            </div>
            <div className={`score-label ${getAsymmetryLevel(displayData.asymmetryScore).class}`}>
              {getAsymmetryLevel(displayData.asymmetryScore).level} Asymmetry
            </div>
          </div>
          <p className="score-description">
            Lower scores indicate better symmetry. Aim for &lt; 2% asymmetry.
          </p>
        </div>

        <div className="overview-card">
          <h3>Symmetry Breakdown</h3>
          <div className="breakdown-list">
            {asymmetryData.map((item, index) => {
              const level = getAsymmetryLevel(item.asymmetry)
              return (
                <div key={index} className="breakdown-item">
                  <div className="breakdown-header">
                    <span className="breakdown-joint">{item.joint}</span>
                    <span className={`breakdown-level ${level.class}`}>
                      {level.level}
                    </span>
                  </div>
                  <div className="breakdown-details">
                    <span>Asymmetry: {item.asymmetry.toFixed(1)}°</span>
                    <span>Symmetry: {item.symmetry}%</span>
                  </div>
                  <div className="breakdown-bar">
                    <div 
                      className={`breakdown-fill ${level.class}`}
                      style={{ '--breakdown-width': `${item.symmetry}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Angle Asymmetry by Joint</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={asymmetryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="joint" stroke="#64748b" />
                <YAxis 
                  stroke="#64748b"
                  label={{ value: 'Angle Difference (°)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend />
                <Bar dataKey="asymmetry" fill="#ef4444" name="Asymmetry (degrees)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Symmetry Radar Chart</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                />
                <Radar 
                  name="Symmetry" 
                  dataKey="symmetry" 
                  stroke="#2563eb" 
                  fill="#2563eb" 
                  fillOpacity={0.6}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          {displayData.insights?.map((insight, index) => (
            <div key={index} className="insight-card">
              <div className="insight-icon">
                {insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : 'ℹ️'}
              </div>
              <div className="insight-content">
                <h4>{insight.title}</h4>
                <p>{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AsymmetryMetrics

