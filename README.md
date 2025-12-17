# SymStride: An AI running coach that lives in your pocket.
**Yibo Chen**, **Ido Dukler**, **Michael Zhou**

### SymStride aids runners to better their running techinque through real-time, professional based feedback using only the sensors from the devices you already own. This work builds upon [MobilePoser](https://github.com/SPICExLAB/MobilePoser?tab=readme-ov-file), an on-body pose estimation system.

Moreover, we provide a framework for running the MobilePoser in real time using free apps for sending your phone's data to your computer.


[![Video Title](demo.png)](https://youtu.be/ps6nEUCEM1I)
<br>


## Installation 
We recommend configuring the project inside an Anaconda environment. We have tested everything using [Anaconda](https://docs.anaconda.com/anaconda/install/) version 23.9.0 and Python 3.9. The first step is to create a virtual environment, as shown below (named `mobileposer`).
```
conda create -n symstride python=3.9
```
You should then activate the environment as shown below. All following operations must be completed within the virtual environment.
```
conda activate symstride
```
Then, install the required packages.
```
pip install -r requirements.txt
```
You will then need to install the local mobileposer package for development via the command below. You must run this from the root directory (e.g., where setup.py is).
```
pip install -e .
```

## Running **SymStride Backend**

SymStride is made up of two main components:

- data being sent from your phone and watch to your computer
- SymStride metrics being computed
- Symstrude metrics being visualized

We found the following pipeline to be the most effective for running MobilePoser in real time:

1) Download the [SensorLogger](https://apps.apple.com/us/app/sensor-logger/id1531582925) app from the App Store on your phone.
2) Go to Settings > Data Streaming > Enter your computer's IP address into HTTP Push's "Push URL" field. You can find your IP address by typing `ifconfig` in the terminal and searching for the line that starts with "inet" and ends with "en0".
3) Then go to the MobilePoser directory and run the live_demo_http.py script.
```
cd ML

python -m mobileposer.live_demo_http.py
```

with options to save using the ```--save``` flag to save your run as a ```.pt``` file.

### After running live_demo_http.py, you will be prompted to do the following calibration steps in the terminal:

1) First, see that you are receiving data packets from your phone to your computer. Once you are receiving data packets, you can proceed to the next step.
2) Calibrate your phones reference frame by facing your phone with your camera pointing up and your screen facing away from your body. Click return in the terminal to **calibrate for 3 seconds**.
3) Afterwards, place your phone in your pocket with the screen facing outward, your app running, and with the camera facing up. Click return in the terminal.
4) Stand up straight (or in a T-pose if you are using more devices) and click return. **Stand straight for 3 seconds.**
5) Wait for calibration to finish. 

*Optional*: To visualize your run, use the ```view_my_results.py``` script.
```
python -m mobileposer.view_my_results.py --results YOUR_RESULTS_FROM_--save.pt
```

4) Again, ensure you see data packets being received in the terminal. If you do not, try check the ip address you entered in SensorLogger and make sure it matches your computer's IP address. 

5) If your computer needs to go around a network which restricts sending data peer to peer, you can use a tool like [Tailscale](https://tailscale.com/) to create a mesh network for free.






## Running **SymStride Visualization**


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

Note: *Run the following from the root directory of this project.*


1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

4. Open another terminal window and run the server that listens to the ML backend:

```
python web-backend/server.py   
```

### Finally
Open up your localhost:3000 in your browser and visualize your results!
## Contact
For questions, please contact idukler@g.ucla.edu, ziyangzhou8@g.ucla.edu, or yibochen@g.ucla.edu.


## License

We are adopting MobilePoser's license. Extending our work to our coursework as part of UCLA Fall 2025, ECE M202A advised by Professor Mani Srivastava.