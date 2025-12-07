import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './JointAngles.css'

function JointAngles({ data, realTimeData }) {
  const displayData = realTimeData || data

  // Prepare chart data
  const chartData = displayData.timeSeriesData?.map((point, index) => ({
    time: `${Math.floor(index / 60)}:${String(index % 60).padStart(2, '0')}`,
    kneeLeft: point.jointAngles.knee.left,
    kneeRight: point.jointAngles.knee.right,
    hipLeft: point.jointAngles.hip.left,
    hipRight: point.jointAngles.hip.right,
    ankleLeft: point.jointAngles.ankle.left,
    ankleRight: point.jointAngles.ankle.right,
  })) || []

  const currentAngles = displayData.jointAngles

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
          <h3>Knee Angles</h3>
          <div className="angle-comparison">
            <div className="angle-display">
              <div className="angle-label">Left</div>
              <div className="angle-value">{currentAngles.knee.left.toFixed(1)}°</div>
            </div>
            <div className="angle-separator">vs</div>
            <div className="angle-display">
              <div className="angle-label">Right</div>
              <div className="angle-value">{currentAngles.knee.right.toFixed(1)}°</div>
            </div>
          </div>
          <div className="symmetry-indicator">
            <span>Symmetry: {currentAngles.knee.symmetry}%</span>
            <div className="symmetry-bar">
              <div 
                className={`symmetry-fill ${currentAngles.knee.symmetry >= 90 ? 'excellent' : currentAngles.knee.symmetry >= 75 ? 'good' : 'needs-improvement'}`}
                style={{ '--symmetry-width': `${currentAngles.knee.symmetry}%` }}
              />
            </div>
          </div>
        </div>

        <div className="joint-card">
          <h3>Hip Angles</h3>
          <div className="angle-comparison">
            <div className="angle-display">
              <div className="angle-label">Left</div>
              <div className="angle-value">{currentAngles.hip.left.toFixed(1)}°</div>
            </div>
            <div className="angle-separator">vs</div>
            <div className="angle-display">
              <div className="angle-label">Right</div>
              <div className="angle-value">{currentAngles.hip.right.toFixed(1)}°</div>
            </div>
          </div>
          <div className="symmetry-indicator">
            <span>Symmetry: {currentAngles.hip.symmetry}%</span>
            <div className="symmetry-bar">
              <div 
                className={`symmetry-fill ${currentAngles.hip.symmetry >= 90 ? 'excellent' : currentAngles.hip.symmetry >= 75 ? 'good' : 'needs-improvement'}`}
                style={{ '--symmetry-width': `${currentAngles.hip.symmetry}%` }}
              />
            </div>
          </div>
        </div>

        <div className="joint-card">
          <h3>Ankle Angles</h3>
          <div className="angle-comparison">
            <div className="angle-display">
              <div className="angle-label">Left</div>
              <div className="angle-value">{currentAngles.ankle.left.toFixed(1)}°</div>
            </div>
            <div className="angle-separator">vs</div>
            <div className="angle-display">
              <div className="angle-label">Right</div>
              <div className="angle-value">{currentAngles.ankle.right.toFixed(1)}°</div>
            </div>
          </div>
          <div className="symmetry-indicator">
            <span>Symmetry: {currentAngles.ankle.symmetry}%</span>
            <div className="symmetry-bar">
              <div 
                className={`symmetry-fill ${currentAngles.ankle.symmetry >= 90 ? 'excellent' : currentAngles.ankle.symmetry >= 75 ? 'good' : 'needs-improvement'}`}
                style={{ '--symmetry-width': `${currentAngles.ankle.symmetry}%` }}
              />
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
                dataKey="kneeLeft" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Knee Left"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="kneeRight" 
                stroke="#60a5fa" 
                strokeWidth={2}
                name="Knee Right"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="hipLeft" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Hip Left"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="hipRight" 
                stroke="#34d399" 
                strokeWidth={2}
                name="Hip Right"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="ankleLeft" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Ankle Left"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="ankleRight" 
                stroke="#fbbf24" 
                strokeWidth={2}
                name="Ankle Right"
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

