# SymStride - Running Form Symmetry Analysis

M202A Project Repo for Group: Yibo, Michael, Ido

## Overview

SymStride is a real-time running form symmetry analysis system that helps runners identify and correct asymmetries in their running form to prevent injuries. This web application displays results from our machine learning model that analyzes joint angles and running form metrics.

## Features

- **Dashboard**: Overview of key running form metrics and symmetry scores
- **Joint Angles**: Real-time visualization of knee, hip, and ankle angles
- **Form Analysis**: Detailed analysis of running form with back position, knee angles, and arm position
- **Real-time Feedback**: Live monitoring and actionable feedback during runs

**Note**: The `AsymmetryMetrics` component exists in the codebase but is currently not being used or displayed in the dashboard.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Building for Production (Untested)

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.jsx    # Main dashboard view
│   │   ├── Dashboard.css    # Dashboard styles
│   │   ├── JointAngles.jsx  # Joint angle visualizations
│   │   ├── JointAngles.css  # Joint angles styles
│   │   ├── FormAnalysis.jsx # Form analysis component
│   │   ├── FormAnalysis.css # Form analysis styles
│   │   ├── RealTimeFeedback.jsx  # Real-time feedback panel
│   │   ├── RealTimeFeedback.css  # Real-time feedback styles
│   │   ├── AsymmetryMetrics.jsx  # Asymmetry analysis (currently not used)
│   │   └── AsymmetryMetrics.css  # Asymmetry metrics styles
│   ├── utils/
│   │   ├── mockData.js      # Mock data generator for ML model results
│   │   └── feedbackConfig.js # Feedback configuration and logic
│   ├── App.jsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles
├── package.json
└── vite.config.js
```

## Integrating with ML Model

The application currently uses mock data from `src/utils/mockData.js`. To integrate with your actual ML model:

1. Replace the mock data functions with API calls to your ML model endpoint
2. Update the data structure in `src/utils/mockData.js` to match your model's output format
3. The expected data structure includes:
   - `overallSymmetry`: Overall symmetry percentage (0-100)
   - `asymmetryScore`: Asymmetry score (lower is better)
   - `jointAngles`: Object with knee, hip, and ankle angles (left, right, symmetry)
   - `strideSymmetry`: Stride length symmetry percentage
   - `timeSeriesData`: Array of time-series data points
   - `recommendations`: Array of improvement recommendations
   - `insights`: Array of insights with type, title, and description

## Technologies Used

- React 18
- Vite
- Recharts (for data visualization)
- CSS3 (for styling)

## License

This project is part of M202A coursework.
