import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './JointAngles.css'

function JointAngles({ data, realTimeData }) {
  const displayData = realTimeData || data

  // Handle no data case
  if (!displayData) {
    return (
      <div className="joint-angles">
        <div className="section-header">
          <h2>Joint Angle Analysis</h2>
          <p className="section-description">
            Real-time monitoring of joint angles to detect asymmetries in running form
          </p>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No data available. Start a live session to see joint angle metrics.</p>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const chartData = displayData.timeSeriesData?.map((point, index) => ({
    time: `${Math.floor(index / 60)}:${String(index % 60).padStart(2, '0')}`,
    frontKnee: point.frontKnee?.angle,
    backKnee: point.backKnee?.angle,
    elbowLeft: point.elbow?.left,
    elbowRight: point.elbow?.right,
    backToHead: point.backToHead?.angle,
  })) || []

  const currentAngles = displayData.jointAngles || displayData

  // Check if we have the required angle data
  if (!currentAngles.frontKnee?.angle && !currentAngles.backKnee?.angle && !currentAngles.elbow?.left) {
    return (
      <div className="joint-angles">
        <div className="section-header">
          <h2>Joint Angle Analysis</h2>
          <p className="section-description">
            Real-time monitoring of joint angles to detect asymmetries in running form
          </p>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No joint angle data available. Start a live session to see metrics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="joint-angles">
      <div className="section-header">
        <h2>Joint Angle Analysis</h2>
        <p className="section-description">
          Real-time monitoring of joint angles to detect asymmetries in running form
        </p>
      </div>

      <div className="joint-cards">
        <div className="joint-card">
          <h3>Front Knee</h3>
          <div className="angle-comparison">
            <div className="angle-display">
              <div className="angle-label">Angle</div>
              <div className="angle-value">
                {currentAngles.frontKnee?.angle !== undefined 
                  ? `${currentAngles.frontKnee.angle.toFixed(1)}°` 
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="joint-card">
          <h3>Back Knee</h3>
          <div className="angle-comparison">
            <div className="angle-display">
              <div className="angle-label">Angle</div>
              <div className="angle-value">
                {currentAngles.backKnee?.angle !== undefined 
                  ? `${currentAngles.backKnee.angle.toFixed(1)}°` 
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="joint-card">
          <h3>Elbow Angles</h3>
          <div className="angle-comparison">
            <div className="angle-display">
              <div className="angle-label">Left</div>
              <div className="angle-value">
                {currentAngles.elbow?.left !== undefined 
                  ? `${currentAngles.elbow.left.toFixed(1)}°` 
                  : 'N/A'}
              </div>
            </div>
            <div className="angle-separator">vs</div>
            <div className="angle-display">
              <div className="angle-label">Right</div>
              <div className="angle-value">
                {currentAngles.elbow?.right !== undefined 
                  ? `${currentAngles.elbow.right.toFixed(1)}°` 
                  : 'N/A'}
              </div>
            </div>
          </div>
          {currentAngles.elbow?.symmetry !== undefined && (
            <div className="symmetry-indicator">
              <span>Symmetry: {currentAngles.elbow.symmetry}%</span>
              <div className="symmetry-bar">
                <div 
                  className={`symmetry-fill ${currentAngles.elbow.symmetry >= 90 ? 'excellent' : currentAngles.elbow.symmetry >= 75 ? 'good' : 'needs-improvement'}`}
                  style={{ '--symmetry-width': `${currentAngles.elbow.symmetry}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="joint-card">
          <h3>Back to Head</h3>
          <div className="angle-comparison">
            <div className="angle-display">
              <div className="angle-label">Tilt</div>
              <div className="angle-value">
                {currentAngles.backToHead?.angle !== undefined 
                  ? `${currentAngles.backToHead.angle.toFixed(1)}°` 
                  : 'N/A'}
              </div>
            </div>
            <div className="angle-display">
              <div className="angle-label">Spine Curvature</div>
              <div className="angle-value">
                {currentAngles.backToHead?.spineCurvature !== undefined 
                  ? `${currentAngles.backToHead.spineCurvature.toFixed(1)}°` 
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h3>Joint Angle Over Time</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="time" 
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#64748b"
                label={{ value: 'Angle (degrees)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="frontKnee" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Front Knee"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="backKnee" 
                stroke="#60a5fa" 
                strokeWidth={2}
                name="Back Knee"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="elbowLeft" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Elbow Left"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="elbowRight" 
                stroke="#34d399" 
                strokeWidth={2}
                name="Elbow Right"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="backToHead" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Back to Head"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default JointAngles

