// Mock data generator for ML model results
// This simulates the output from your machine learning model

function generateTimeSeriesData(duration = 300) {
  const data = []
  const baseAngles = {
    knee: { left: 165, right: 165 },
    hip: { left: 170, right: 170 },
    ankle: { left: 110, right: 110 }
  }

  for (let i = 0; i < duration; i++) {
    // Simulate natural variation in running form
    const variation = Math.sin(i / 20) * 5 + (Math.random() - 0.5) * 3
    
    data.push({
      timestamp: i,
      jointAngles: {
        knee: {
          left: baseAngles.knee.left + variation + (Math.random() - 0.5) * 2,
          right: baseAngles.knee.right - variation * 0.8 + (Math.random() - 0.5) * 2
        },
        hip: {
          left: baseAngles.hip.left + variation * 0.7 + (Math.random() - 0.5) * 2,
          right: baseAngles.hip.right - variation * 0.7 + (Math.random() - 0.5) * 2
        },
        ankle: {
          left: baseAngles.ankle.left + variation * 0.5 + (Math.random() - 0.5) * 2,
          right: baseAngles.ankle.right - variation * 0.5 + (Math.random() - 0.5) * 2
        }
      }
    })
  }

  return data
}

function calculateSymmetry(left, right) {
  const diff = Math.abs(left - right)
  const avg = (left + right) / 2
  const symmetry = Math.max(0, 100 - (diff / avg) * 100)
  return Math.round(symmetry)
}

function calculateAsymmetryScore(jointAngles) {
  const kneeDiff = Math.abs(jointAngles.knee.left - jointAngles.knee.right)
  const hipDiff = Math.abs(jointAngles.hip.left - jointAngles.hip.right)
  const ankleDiff = Math.abs(jointAngles.ankle.left - jointAngles.ankle.right)
  
  const avgDiff = (kneeDiff + hipDiff + ankleDiff) / 3
  return avgDiff
}

export function getMockData() {
  const timeSeriesData = generateTimeSeriesData(300)
  
  // Calculate average angles from time series
  const avgKneeLeft = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.knee.left, 0) / timeSeriesData.length
  const avgKneeRight = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.knee.right, 0) / timeSeriesData.length
  const avgHipLeft = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.hip.left, 0) / timeSeriesData.length
  const avgHipRight = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.hip.right, 0) / timeSeriesData.length
  const avgAnkleLeft = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.ankle.left, 0) / timeSeriesData.length
  const avgAnkleRight = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.ankle.right, 0) / timeSeriesData.length

  const jointAngles = {
    knee: {
      left: avgKneeLeft,
      right: avgKneeRight,
      symmetry: calculateSymmetry(avgKneeLeft, avgKneeRight)
    },
    hip: {
      left: avgHipLeft,
      right: avgHipRight,
      symmetry: calculateSymmetry(avgHipLeft, avgHipRight)
    },
    ankle: {
      left: avgAnkleLeft,
      right: avgAnkleRight,
      symmetry: calculateSymmetry(avgAnkleLeft, avgAnkleRight)
    }
  }

  const asymmetryScore = calculateAsymmetryScore({
    knee: { left: avgKneeLeft, right: avgKneeRight },
    hip: { left: avgHipLeft, right: avgHipRight },
    ankle: { left: avgAnkleLeft, right: avgAnkleRight }
  })

  const overallSymmetry = Math.round(
    (jointAngles.knee.symmetry + jointAngles.hip.symmetry + jointAngles.ankle.symmetry) / 3
  )

  const strideSymmetry = 85 + Math.random() * 10 // Simulated stride symmetry

  // Form analysis metrics
  const footLanding = {
    left: ['heel', 'midfoot', 'forefoot'][Math.floor(Math.random() * 3)],
    right: ['heel', 'midfoot', 'forefoot'][Math.floor(Math.random() * 3)],
    symmetry: Math.floor(70 + Math.random() * 25), // 70-95%
    recommendation: 'Aim for midfoot or forefoot landing for better shock absorption'
  }

  const backPosition = {
    forwardLean: 5 + Math.random() * 3, // 5-8 degrees
    symmetry: Math.floor(80 + Math.random() * 15), // 80-95%
    status: 'Good', // Good, Too Upright, Too Forward
    recommendation: 'Maintain slight forward lean (5-8°) for optimal running efficiency'
  }

  const frontKneeLeft = 160 + (Math.random() - 0.5) * 10
  const frontKneeRight = 160 + (Math.random() - 0.5) * 10
  const backKneeLeft = 30 + (Math.random() - 0.5) * 10
  const backKneeRight = 30 + (Math.random() - 0.5) * 10

  const kneeAnglesAtLanding = {
    frontKnee: {
      left: frontKneeLeft,
      right: frontKneeRight,
      symmetry: calculateSymmetry(frontKneeLeft, frontKneeRight)
    },
    backKnee: {
      left: backKneeLeft,
      right: backKneeRight,
      symmetry: calculateSymmetry(backKneeLeft, backKneeRight)
    }
  }

  const armsLeftAngle = 85 + (Math.random() - 0.5) * 10
  const armsRightAngle = 85 + (Math.random() - 0.5) * 10
  const armsPosition = {
    leftAngle: armsLeftAngle,
    rightAngle: armsRightAngle,
    symmetry: calculateSymmetry(armsLeftAngle, armsRightAngle),
    swingSymmetry: Math.floor(80 + Math.random() * 15), // 80-95%
    recommendation: 'Keep arms at 85-90° angle, avoid crossing midline'
  }

  const headPosition = {
    tilt: (Math.random() - 0.5) * 3, // -1.5 to 1.5 degrees
    forwardPosition: 2 + Math.random() * 2, // 2-4 cm forward
    symmetry: Math.floor(85 + Math.random() * 10), // 85-95%
    recommendation: 'Keep head neutral, eyes looking 10-20m ahead'
  }

  return {
    overallSymmetry,
    asymmetryScore,
    jointAngles,
    strideSymmetry,
    runDuration: '25:30',
    totalSteps: 3420,
    timeSeriesData,
    formAnalysis: {
      footLanding,
      backPosition,
      kneeAnglesAtLanding,
      armsPosition,
      headPosition
    },
    recommendations: [
      'Focus on maintaining equal knee flexion between both legs during the stance phase',
      'Work on hip alignment - ensure both hips remain level throughout the running cycle',
      'Practice single-leg balance exercises to improve muscle symmetry',
      'Consider incorporating strength training for your weaker side'
    ],
    insights: [
      {
        type: 'warning',
        title: 'Knee Angle Asymmetry Detected',
        description: 'Your left knee shows 3.2° more flexion than your right knee. This may lead to overuse injuries on the left side.'
      },
      {
        type: 'success',
        title: 'Hip Alignment is Good',
        description: 'Your hip angles are well-balanced, indicating good core stability during your run.'
      },
      {
        type: 'info',
        title: 'Ankle Symmetry Improving',
        description: 'Ankle angles are showing good symmetry. Continue focusing on consistent foot strike patterns.'
      }
    ]
  }
}

export function simulateRealTimeData() {
  const baseAngles = {
    knee: { left: 165, right: 165 },
    hip: { left: 170, right: 170 },
    ankle: { left: 110, right: 110 }
  }

  // Add some variation to simulate real-time changes
  const variation = (Math.random() - 0.5) * 4
  const kneeLeft = baseAngles.knee.left + variation
  const kneeRight = baseAngles.knee.right - variation * 0.9
  const hipLeft = baseAngles.hip.left + variation * 0.7
  const hipRight = baseAngles.hip.right - variation * 0.7
  const ankleLeft = baseAngles.ankle.left + variation * 0.5
  const ankleRight = baseAngles.ankle.right - variation * 0.5

  const jointAngles = {
    knee: {
      left: kneeLeft,
      right: kneeRight,
      symmetry: calculateSymmetry(kneeLeft, kneeRight)
    },
    hip: {
      left: hipLeft,
      right: hipRight,
      symmetry: calculateSymmetry(hipLeft, hipRight)
    },
    ankle: {
      left: ankleLeft,
      right: ankleRight,
      symmetry: calculateSymmetry(ankleLeft, ankleRight)
    }
  }

  const asymmetryScore = calculateAsymmetryScore({
    knee: { left: kneeLeft, right: kneeRight },
    hip: { left: hipLeft, right: hipRight },
    ankle: { left: ankleLeft, right: ankleRight }
  })

  const overallSymmetry = Math.round(
    (jointAngles.knee.symmetry + jointAngles.hip.symmetry + jointAngles.ankle.symmetry) / 3
  )

  // Form analysis metrics for real-time
  const footLanding = {
    left: ['heel', 'midfoot', 'forefoot'][Math.floor(Math.random() * 3)],
    right: ['heel', 'midfoot', 'forefoot'][Math.floor(Math.random() * 3)],
    symmetry: Math.floor(70 + Math.random() * 25)
  }

  const backPosition = {
    forwardLean: 5 + Math.random() * 3,
    symmetry: Math.floor(80 + Math.random() * 15),
    status: 'Good'
  }

  const frontKneeLeft = 160 + (Math.random() - 0.5) * 10
  const frontKneeRight = 160 + (Math.random() - 0.5) * 10
  const backKneeLeft = 30 + (Math.random() - 0.5) * 10
  const backKneeRight = 30 + (Math.random() - 0.5) * 10

  const kneeAnglesAtLanding = {
    frontKnee: {
      left: frontKneeLeft,
      right: frontKneeRight,
      symmetry: calculateSymmetry(frontKneeLeft, frontKneeRight)
    },
    backKnee: {
      left: backKneeLeft,
      right: backKneeRight,
      symmetry: calculateSymmetry(backKneeLeft, backKneeRight)
    }
  }

  const armsLeftAngle = 85 + (Math.random() - 0.5) * 10
  const armsRightAngle = 85 + (Math.random() - 0.5) * 10
  const armsPosition = {
    leftAngle: armsLeftAngle,
    rightAngle: armsRightAngle,
    symmetry: calculateSymmetry(armsLeftAngle, armsRightAngle),
    swingSymmetry: Math.floor(80 + Math.random() * 15)
  }

  const headPosition = {
    tilt: (Math.random() - 0.5) * 3,
    forwardPosition: 2 + Math.random() * 2,
    symmetry: Math.floor(85 + Math.random() * 10)
  }

  return {
    overallSymmetry,
    asymmetryScore,
    jointAngles,
    strideSymmetry: 85 + Math.random() * 10,
    timestamp: new Date().toISOString(),
    formAnalysis: {
      footLanding,
      backPosition,
      kneeAnglesAtLanding,
      armsPosition,
      headPosition
    }
  }
}

