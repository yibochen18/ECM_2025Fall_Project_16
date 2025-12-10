// Mock data generator for ML model results
// This simulates the output from your machine learning model

function generateTimeSeriesData(duration = 300) {
  const data = []
  const baseAngles = {
    frontKnee: 160,
    backKnee: 145,
    elbow: { left: 90, right: 90 },
    backToHead: 0
  }

  for (let i = 0; i < duration; i++) {
    const variation = Math.sin(i / 20) * 3 + (Math.random() - 0.5) * 2
    const elbowVar = (Math.random() - 0.5) * 4
    const headVar = (Math.random() - 0.5) * 2

    data.push({
      timestamp: i,
      jointAngles: {
        frontKnee: {
          angle: baseAngles.frontKnee + variation,
          side: variation > 0 ? 'left' : 'right'
        },
        backKnee: {
          angle: baseAngles.backKnee - variation * 0.5,
          side: variation > 0 ? 'right' : 'left'
        },
        elbow: {
          left: baseAngles.elbow.left + elbowVar,
          right: baseAngles.elbow.right - elbowVar,
          symmetry: calculateSymmetry(
            baseAngles.elbow.left + elbowVar,
            baseAngles.elbow.right - elbowVar
          )
        },
        backToHead: {
          angle: baseAngles.backToHead + headVar,
          spineCurvature: 10 + (Math.random() - 0.5) * 2
        },
        knee: {
          left: baseAngles.frontKnee + variation,
          right: baseAngles.backKnee - variation * 0.5,
          symmetry: calculateSymmetry(
            baseAngles.frontKnee + variation,
            baseAngles.backKnee - variation * 0.5
          )
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
  const elbowDiff = Math.abs(jointAngles.elbow.left - jointAngles.elbow.right)
  return (kneeDiff + elbowDiff) / 2
}

export function getMockData() {
  const timeSeriesData = generateTimeSeriesData(300)
  
  // Calculate average angles from time series
  const avgFrontKnee = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.frontKnee.angle, 0) / timeSeriesData.length
  const avgBackKnee = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.backKnee.angle, 0) / timeSeriesData.length
  const avgKneeLeft = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.knee.left, 0) / timeSeriesData.length
  const avgKneeRight = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.knee.right, 0) / timeSeriesData.length
  const avgElbowLeft = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.elbow.left, 0) / timeSeriesData.length
  const avgElbowRight = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.elbow.right, 0) / timeSeriesData.length
  const avgBackToHead = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.backToHead.angle, 0) / timeSeriesData.length
  const avgSpineCurvature = timeSeriesData.reduce((sum, d) => sum + d.jointAngles.backToHead.spineCurvature, 0) / timeSeriesData.length

  const jointAngles = {
    frontKnee: {
      angle: avgFrontKnee,
      min: avgFrontKnee - 5,
      max: avgFrontKnee + 5,
      side: 'left'
    },
    backKnee: {
      angle: avgBackKnee,
      min: avgBackKnee - 5,
      max: avgBackKnee + 5,
      side: 'right'
    },
    backToHead: {
      angle: avgBackToHead,
      spineCurvature: avgSpineCurvature
    },
    elbow: {
      left: avgElbowLeft,
      right: avgElbowRight,
      symmetry: calculateSymmetry(avgElbowLeft, avgElbowRight)
    },
    knee: {
      left: avgKneeLeft,
      right: avgKneeRight,
      symmetry: calculateSymmetry(avgKneeLeft, avgKneeRight)
    }
  }

  const asymmetryScore = calculateAsymmetryScore({
    knee: { left: avgKneeLeft, right: avgKneeRight },
    elbow: { left: avgElbowLeft, right: avgElbowRight }
  })

  const overallSymmetry = Math.round(
    (jointAngles.knee.symmetry + jointAngles.elbow.symmetry) / 2
  )

  const strideSymmetry = 85 + Math.random() * 10 // Simulated stride symmetry

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
    ]
  }
}

export function simulateRealTimeData() {
  const baseAngles = {
    frontKnee: 160,
    backKnee: 145,
    elbow: { left: 90, right: 90 },
    backToHead: 0
  }

  const variation = (Math.random() - 0.5) * 4
  const elbowVar = (Math.random() - 0.5) * 4
  const headVar = (Math.random() - 0.5) * 2

  const frontKnee = baseAngles.frontKnee + variation
  const backKnee = baseAngles.backKnee - variation * 0.5

  const jointAngles = {
    frontKnee: {
      angle: frontKnee,
      side: variation > 0 ? 'left' : 'right'
    },
    backKnee: {
      angle: backKnee,
      side: variation > 0 ? 'right' : 'left'
    },
    backToHead: {
      angle: baseAngles.backToHead + headVar,
      spineCurvature: 10 + (Math.random() - 0.5) * 2
    },
    elbow: {
      left: baseAngles.elbow.left + elbowVar,
      right: baseAngles.elbow.right - elbowVar,
      symmetry: calculateSymmetry(
        baseAngles.elbow.left + elbowVar,
        baseAngles.elbow.right - elbowVar
      )
    },
    knee: {
      left: frontKnee,
      right: backKnee,
      symmetry: calculateSymmetry(frontKnee, backKnee)
    }
  }

  const asymmetryScore = calculateAsymmetryScore({
    knee: { left: jointAngles.knee.left, right: jointAngles.knee.right },
    elbow: { left: jointAngles.elbow.left, right: jointAngles.elbow.right }
  })

  const overallSymmetry = Math.round(
    (jointAngles.knee.symmetry + jointAngles.elbow.symmetry) / 2
  )

  // Form analysis metrics for real-time
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
      backPosition,
      kneeAnglesAtLanding,
      armsPosition,
      headPosition
    }
  }
}

