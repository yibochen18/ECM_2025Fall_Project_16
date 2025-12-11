/**
 * Feedback configuration based on average joint angles
 * The system will evaluate each metric and display the appropriate feedback.
 */

export const feedbackConfig = {
  // Front Knee Angle feedback
  frontKnee: {
    // Thresholds are in degrees
    excellent: { min: 135, max: 170, message: "Excellent front knee angle! You're maintaining optimal form for shock absorption." },
    needsImprovement: { min: 126, max: 135, message: "Could be improved. Low running efficiency, aim for over 135 degrees." },
    bad: { min: 0, max: 126, message: "Excessive flexion. Low running efficiency and increased risk of injury. Aim for over 135 degrees." },
    tooMuchFlexion: { min: 171, max: 200, message: "Too much flexion (knee too straight). Excessive extension reduces shock absorption and increases injury risk. Aim for 135-170 degrees." },
  },

  // Back Knee Angle feedback
  backKnee: {
    excellent: { min: 100, max: 116, message: "Ideal back knee angle! This indicates excellent leg recovery." },
    needsImprovement: { min: 117, max: 125, message: "Could be improved. Back knee is too open. Aim for under 116 degrees." },
    bad: { min: 125, max: 200, message: "Not enough flexion. Needs more energy to maintain speed, movement amplitude is restricted." },
    tooMuchFlexion: { min: 0, max: 99, message: "Too much flexion (knee too bent). Excessive bending reduces leg recovery efficiency. Aim for 100-116 degrees." },
  },

  // Elbow Angle feedback (left and right)
  elbow: {
    excellent: { min: 76, max: 86, message: "Excellent elbow angles! Your arm swing is optimal." },
    needsImprovement: { min: 87, max: 200, message: "Needs improvement. Not enough flexion, loss of efficiency. Avoid pushing backward." },
    bad: { min: 0, max: 76, message: "Too much flexion. Loss of efficiency, increased risk of injury." },

    // Asymmetry feedback
    asymmetry: {
      excellent: { max: 5, message: "Excellent arm symmetry! Both arms are working in perfect balance." },
      good: { max: 10, message: "Good arm symmetry. Minor differences are normal." },
      needsImprovement: { max: 20, message: "Your arms show some asymmetry. Focus on balanced arm swing." },
      bad: { max: 200, message: "Significant arm asymmetry detected. Work on synchronizing your arm movements." }
    }
  },

  // Back to Head Angle feedback
  backToHead: {
    excellent: { min: -15, max: 5, message: "Perfect posture! Your back-to-head alignment is ideal. Keep your gaze looking forward." },
    good: { min: -18, max: -15, message: "Good posture. You're maintaining a relatively straight gaze." },
    tooForward: { min: 6, max: 200, message:  "You're gazing at the sky, lower gaze to improve posture. Poor running posture."},
    tooBackward: { min: -200, max: -18, message: "Your gaze is too focused on the ground, lift gaze to improve posture. Risk of slouched posture."}
  },

  // Knee Symmetry feedback
  kneeSymmetry: {
    excellent: { min: 90, max: 100, message: "Excellent knee symmetry! Both legs are working equally." },
    good: { min: 75, max: 90, message: "Good knee symmetry. Minor differences are normal." },
    needsImprovement: { min: 51, max: 75, message: "Your knee angles show asymmetry. Focus on balanced leg movement." },
    bad: { min: 0, max: 50, message: "Significant knee asymmetry detected. Consider working on leg strength balance." }
  },

  // Lean Position feedback (spine curvature)
  lean: {
    excellent: { min: 6, max: 12, message: "Excellent lean position! Your posture is optimal for running efficiency." },
    good: { min: 13, max: 16, message: "Good lean position. You're maintaining proper forward posture." },
    needsImprovement: { min: 3, max: 5, message: "Lean position could be improved. Aim for a more forward lean between 6-12 degrees." },
    bad: { min: -100, max: 2, message: "Insufficient lean. Increase forward lean to improve running efficiency and reduce injury risk." }
  }
}

/**
 * Get feedback for a specific metric based on its value
 * @param {string} metricType - Type of metric (e.g., 'frontKnee', 'backKnee', 'elbow')
 * @param {number} value - The average value to evaluate
 * @param {object} config - Optional custom config (defaults to feedbackConfig)
 * @returns {object} Feedback object with type and message
 */
export function getFeedbackForMetric(metricType, value, config = feedbackConfig) {
  const metricConfig = config[metricType]
  if (!metricConfig) {
    return { type: 'info', message: `No feedback available for ${metricType}` }
  }

  // Check thresholds in order of priority (best to worst)
  // Check if value falls within each range
  const checkRange = (threshold) => {
    if (!metricConfig[threshold] || metricConfig[threshold].min === undefined || metricConfig[threshold].max === undefined) {
      return false
    }
    return value >= metricConfig[threshold].min && value <= metricConfig[threshold].max
  }

  // Priority order: excellent > good > needsImprovement > bad > tooForward/tooBackward
  // Return the threshold name directly (matches feedbackConfig keys)
  if (checkRange('excellent')) {
    return {
      type: 'excellent',
      threshold: 'excellent',
      message: metricConfig.excellent.message,
      value: value
    }
  }

  if (checkRange('good')) {
    return {
      type: 'good',
      threshold: 'good',
      message: metricConfig.good.message,
      value: value
    }
  }

  if (checkRange('needsImprovement')) {
    return {
      type: 'needsImprovement',
      threshold: 'needsImprovement',
      message: metricConfig.needsImprovement.message,
      value: value
    }
  }

  if (checkRange('bad')) {
    return {
      type: 'bad',
      threshold: 'bad',
      message: metricConfig.bad.message,
      value: value
    }
  }

  // Special cases for backToHead
  if (checkRange('tooForward')) {
    return {
      type: 'bad',
      threshold: 'tooForward',
      message: metricConfig.tooForward.message,
      value: value
    }
  }

  if (checkRange('tooBackward')) {
    return {
      type: 'bad',
      threshold: 'tooBackward',
      message: metricConfig.tooBackward.message,
      value: value
    }
  }

  // Special cases for out-of-range values
  // Front knee: > 170 is bad (too much flexion - knee too straight)
  if (metricType === 'frontKnee' && value > 170) {
    return {
      type: 'bad',
      threshold: 'tooMuchFlexion',
      message: metricConfig.tooMuchFlexion?.message || metricConfig.bad.message,
      value: value
    }
  }

  // Back knee: < 100 is bad (too much flexion - knee too bent)
  if (metricType === 'backKnee' && value < 100) {
    return {
      type: 'bad',
      threshold: 'tooMuchFlexion',
      message: metricConfig.tooMuchFlexion?.message || metricConfig.bad.message,
      value: value
    }
  }

  // Lean: > 16 is bad
  if (metricType === 'lean' && value > 16) {
    return {
      type: 'bad',
      threshold: 'bad',
      message: metricConfig.bad.message,
      value: value
    }
  }

  return { type: 'needsImprovement', threshold: 'needsImprovement', message: 'No specific feedback available', value: value }
}

/**
 * Get feedback for asymmetry metrics
 * @param {string} metricType - Type of metric (e.g., 'elbow', 'kneeSymmetry')
 * @param {number} value - The symmetry percentage or difference value
 * @param {object} config - Optional custom config
 * @returns {object} Feedback object
 */
export function getAsymmetryFeedback(metricType, value, config = feedbackConfig) {
  const asymmetryConfig = config[metricType]?.asymmetry || config[metricType]
  if (!asymmetryConfig) {
    return { type: 'info', message: `No asymmetry feedback for ${metricType}` }
  }

  // For symmetry percentages (higher is better)
  if (metricType === 'kneeSymmetry') {
    if (value >= 90) return { type: 'excellent', threshold: 'excellent', message: asymmetryConfig.excellent.message, value }
    if (value >= 75) return { type: 'good', threshold: 'good', message: asymmetryConfig.good.message, value }
    if (value >= 50) return { type: 'needsImprovement', threshold: 'needsImprovement', message: asymmetryConfig.needsImprovement.message, value }
    return { type: 'bad', threshold: 'bad', message: asymmetryConfig.bad.message, value }
  }

  // For difference values (lower is better)
  const diffConfig = asymmetryConfig
  if (value <= diffConfig.excellent.max) return { type: 'excellent', threshold: 'excellent', message: diffConfig.excellent.message, value }
  if (value <= diffConfig.good.max) return { type: 'good', threshold: 'good', message: diffConfig.good.message, value }
  if (value <= diffConfig.needsImprovement.max) return { type: 'needsImprovement', threshold: 'needsImprovement', message: diffConfig.needsImprovement.message, value }
  return { type: 'bad', threshold: 'bad', message: diffConfig.bad.message, value }
}

