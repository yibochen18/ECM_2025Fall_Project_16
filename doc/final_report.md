# SymStride – Full 3D Running Kinematics Analysis

**M202A Project by Yibo, Michael, and Ido**

---

## Abstract

SymStride enables full 3D running kinematics analysis using only low-cost IMUs, avoiding the controlled environments, privacy concerns, and high costs of camera-based and optical motion-capture systems. IMUs placed on key body segments feed into fine-tuned ML models inspired by DIP and MobilePoser to reconstruct full 3D pose, from which joint angles such as hip, knee, ankle, and elbow are computed through relative rotations. Performance is evaluated by comparing these IMU-derived metrics against vision-based outputs from tools like Ochy, with success defined by matching angle patterns and maintaining small numerical differences. The system already replicates the full IMU-to-mesh pipeline using real data, with ongoing work focused on running-specific fine-tuning and jitter reduction.

---

## 1. Introduction

### 1.1 Motivation

The SymStride project aims to overcome the limitations of current running analysis methods, which rely heavily on cameras, controlled lighting, and invasive setups. Video-based tools like Ochy and smartphone CV apps suffer from issues such as angle sensitivity, occlusion, and privacy concerns, while high-accuracy optical motion capture remains prohibitively expensive and confined to indoor labs. SymStride addresses these constraints by using low-cost, portable IMUs paired with machine learning models to provide accurate, camera-free motion tracking. This IMU-only workflow enables coach-level running analysis for both novice and experienced runners without requiring any changes to their normal routine.

### 1.2 State of the Art & Limitations

Existing approaches to human pose reconstruction and running analysis fall into two categories—commercial methods and foundational research—each with clear limitations that SymStride seeks to address. 

**Commercial Systems:**
- **Optical motion capture** offers high accuracy but is prohibitively expensive and restricted to controlled lab environments
- **Smartphone apps and tools like Ochy** rely on video-based computer vision that is sensitive to lighting, camera angle, and occlusion, and also raise privacy concerns and require deliberate setup

**Foundational Research:**
Models such as DIP, MobilePoser, and IMUPoser, as well as datasets like AMASS and body models like SMPL, demonstrate that IMU-driven full-body pose estimation is feasible but still requires fine-tuning to handle real-world running scenarios.

Collectively, these methods show promise but fall short of providing accessible, low-cost, camera-free, and routine-friendly running analysis—gaps that SymStride's IMU-only workflow is designed to fill.

### 1.3 Novelty

SymStride's core novelty is its **fully IMU-only workflow**, which eliminates the cameras, lighting dependencies, privacy concerns, and controlled lab environments required by smartphone vision apps and optical motion-capture systems. Instead of relying on specialized hardware, SymStride uses the IMUs already embedded in commercial consumer devices—phones, watches, and AirPods—and feeds their signals into fine-tuned models such as DIP and MobilePoser to reconstruct full 3D human pose. 

From these reconstructions, SymStride extracts key kinematic metrics like hip, knee, ankle, and elbow angles, enabling coach-level running analysis without any video capture or marker-based setups. This makes high-quality running-form analysis accessible in everyday settings using devices people already own.

### 1.4 Challenges

SymStride faces several challenges in converting sparse IMU data from consumer devices into accurate 3D running kinematics:

**Accuracy and Consistency:** The models must produce joint angles comparable to vision-based systems while handling variability across different runners and movements. Running introduces significant noise and jitter, so the models require fine-tuning to generate smooth, kinematically plausible motion, particularly during fast, cyclical actions.

**Validation and Ground Truth:** Even though the goal is a fully IMU-only workflow, the system must be rigorously compared against synchronized video-based data, such as from Ochy, to confirm reliability.

**Hardware Integration and Metric Refinement:** SymStride must standardize data from multiple devices—iPhones, Apple Watches, and AirPods—while refining calculations for advanced kinematic metrics, including symmetry, heel-kick angle, and running-form subtleties.

Overall, the project is like reconstructing a full 3D landscape from scattered, noisy compass and accelerometer readings: portable and private, but requiring sophisticated algorithms to produce precise and reliable insights.

### 1.5 Required Skills & Resources

**Skills:**
- **Sensor Integration:** Proficiency in collecting and processing IMU sensor data
- **HTTPS Protocols:** Understanding of how to stream data live from the iPhone to a laptop
- **Machine Learning Integration:** Understanding of how to adapt prior machine learning models to our use case and run inference on custom data
- **Web Dev:** Experience in designing and building the front and backend to a web app to display the results of our model in a clean and professional way
- **Signal Processing/Data Analysis:** Understand data alignment and interpolation, processing the data appropriately to generate the insights we are interested in

**Hardware Resources:**
- iPhone, Apple Watch, AirPods: A full Apple ecosystem and leveraging SensorLogger to transmit the data available across all devices

### 1.6 Success Metrics

The success of the SymStride project is measured by its ability to derive running kinematic metrics and higher-level insights comparable to those produced by established vision-based systems, such as Ochy, using only Inertial Measurement Units (IMUs).

**Evaluation Goal and Approach:**
Since Ochy is proprietary, intermediate results such as human poses cannot be accessed or directly compared against; evaluation is therefore limited to comparing SymStride's final outputs and derived insights. Identical motion sequences are processed through the SymStride pipeline, and the resulting metrics are directly compared to Ochy's outputs.

**Key Accuracy and Consistency Metrics:**
1. **Mean Absolute Error (MAE):** Quantifies differences between SymStride-derived metrics and Ochy outputs
2. **Standard Deviation of Error:** Measures the consistency of SymStride estimates across repeated movements
3. **Statistical Significance:** Assesses whether deviations from Ochy outputs are statistically meaningful

**Performance and Output Parity Metrics:**
SymStride's performance is further evaluated by comparing derived outputs to high-level insights from Ochy, including heel kick and symmetry, as well as running form characteristics such as knee and elbow flexion, gaze, and foot landing patterns.

**Success Criteria:**
SymStride is considered successful when its outputs and insights closely match Ochy, demonstrating the feasibility of an IMU-only approach for coach-level running analysis.

---

## 2. Related Work

The SymStride project builds upon both existing commercial running analysis methods and foundational research in IMU-based human pose reconstruction.

### 2.1 Commercially Available Approaches

Current commercial solutions illustrate the limitations that SymStride seeks to address:

1. **Optical Motion Capture:** Provides highly accurate measurements but is prohibitively expensive and requires controlled indoor laboratory environments
2. **Smartphone Applications (e.g., Ochy):** Estimate 2D or pseudo-3D poses from video using computer vision. Their accuracy is constrained by camera angle, lighting, occlusion, and the need for separate device setup. Additionally, video-based analysis raises privacy concerns

### 2.2 Foundational Research

SymStride leverages and fine-tunes pre-existing machine learning models and datasets to enable IMU-only pose reconstruction:

1. **Deep Inertial Poser (DIP):** Uses sparse IMUs (six sensors) for real-time 3D pose reconstruction. SymStride incorporates DIP as a pre-trained model for pose extraction
2. **MobilePoser:** Enhances pose estimation via kinematic predictions, supporting real-time full-body pose reconstruction and 3D human translation from IMUs on mobile devices
3. **IMUPoser:** Focuses on full-body pose estimation using IMUs in consumer devices such as phones, watches, and headphones
4. **AMASS (Archive of Motion Capture as Surface Shapes):** A comprehensive motion capture dataset used for model training and evaluation
5. **SMPL (Skinned Multi-Person Linear Model):** Provides the human body mesh representation derived from the AMASS dataset

The SymStride technical approach integrates these models and datasets within a Python backend for inferencing, establishing a foundation for a fully IMU-based running analysis workflow.

---

## 3. Technical Approach

### 3.1 System Architecture

SymStride implements a modular pipeline architecture consisting of three primary stages: data acquisition, pose estimation, and symmetry analysis. The data acquisition layer captures synchronized IMU streams from heterogeneous Apple devices (iPhone, Apple Watch, AirPods) via the SensorLogger iOS application, recording 6-DOF motion data (3-axis acceleration and quaternion orientation) at native sampling rates. 

The preprocessing module (`process_own.py`) performs temporal alignment using UNIX epoch timestamps, applies spherical linear interpolation (SLERP) for orientation data, and executes T-pose calibration to compute sensor-to-body frame transformations. The pose estimation engine leverages the MobilePoser neural network, a transformer-based model trained on the AMASS dataset, which ingests the calibrated 6-sensor IMU configuration to predict full-body SMPL pose parameters (72-dimensional pose vector plus 3D root translation). 

Finally, the web-based dashboard (built with React and Vite) consumes the pose predictions to compute biomechanical metrics including joint angles, stride symmetry scores, and gait asymmetries, presenting real-time visualizations and actionable feedback through an interactive multi-view interface with Recharts-powered analytics.

### 3.2 Data Preprocessing

#### Data Alignment and Interpolation

To synchronize IMU data from heterogeneous sensors (iPhone, Apple Watch, AirPods), we implemented a temporal alignment pipeline that accounts for the asynchronous nature of the hardware. Each sensor records data at variable rates with UNIX epoch nanosecond timestamps provided by SensorLogger. The `align_all_sensors_to_common_timebase()` function first converts all timestamps to absolute seconds, then identifies the overlapping time window across all active sensors. 

A uniform timeline is generated at 100 Hz within this overlap region. Linear interpolation is applied to the 3-axis acceleration data, while spherical linear interpolation (SLERP) is used for the orientation quaternions to preserve rotational continuity and avoid gimbal lock artifacts. This produces synchronized sensor streams of equal length, which are subsequently downsampled to the target 30 Hz frame rate required by the MobilePoser model. This two-stage approach (alignment at 100 Hz, then downsampling) ensures smooth interpolation while maintaining temporal coherence across all input modalities.

#### Calibration
*[TO BE ADDED - IDO]*

### 3.3 SMPL Output Analysis
*[TO BE ADDED - YIBO]*

---

## 4. Evaluation & Results

### 4.1 Model Performance
*[TO BE ADDED]*

### 4.2 System Performance
*[TO BE ADDED]*

---

## 5. Discussion & Conclusions

### Discussion

#### Finetuning

Major fine tuning of the model is needed for a more consistent and accurate output for our system. If we were given more time, we would finetune the model on a substantial set of data we collect ourselves to specialize for running purposes. It would be of interest to train the model to observe more specific artifacts, such as high or low heel drive, directly as an output as opposed to generating an intermediary layer to perform further data analysis on.

#### Model Critiques

The MobilePoser model, and all parent models (IMUPoser, DIP, TransPose) in fact, are trained and evaluated on extremely limited data. There are a lot of overly-optimistic conclusions drawn that are heavily biased towards the training data used. The models are only good for localized, steady movements that are performed while mostly standing upright. For example, motions are sorted into categories like walking in a circle or waving hands. 

If the motions are substantially jerkier, quicker, or erratic, the model performs really poorly and generates a lot of artifacts. In addition, many conclusions drawn from recent papers are largely skewed, such as AirPods do not contribute meaningfully to the accuracy of the model. Since almost all of the training data has the user's head stacked over the hip joint all of the time, the model learned to generalize that the head is stacked above the hips usually. It is very reasonable to assume that if the user were to bend over to pick something up, headphones will contribute much more meaningfully in detecting the human pose as described in the paper. 

Furthermore, by abstracting away the opposite matching sensors on the wrists and legs by having one phone and one watch, the best we can do is train the model to mirror the motion onto the non-sensing side. For symmetrical movements, like running or walking, this is a sufficient assumption. However, for more complex tasks, these models would fail drastically.

### Conclusion
*[TO BE ADDED]*

---

## Demo

*[Add demo video or link here]*

---

## Team

- **Yibo** - [Role/Contributions]
- **Michael** - [Role/Contributions]  
- **Ido** - [Role/Contributions]

---

## References

*[Add references here]*
