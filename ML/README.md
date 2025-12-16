# SymStride: An AI running coach that lives in your pocket.
**Yibo Chen**, **Ido Dukler**, **Michael Zhou**

### SymStride aids runners to better their running techinque through real-time, professional based feedback using only the sensors from the devices you already own. This work builds upon [MobilePoser](https://github.com/SPICExLAB/MobilePoser?tab=readme-ov-file), an on-body pose estimation system.

Moreover, we provide a framework for running the MobilePoser in real time using free apps for sending your phone's data to your computer.


[![Video Title](placeholder.png)](https://youtu.be/MWTbItMX2pw)
<br>


## Installation 
We recommend configuring the project inside an Anaconda environment. We have tested everything using [Anaconda](https://docs.anaconda.com/anaconda/install/) version 23.9.0 and Python 3.9. The first step is to create a virtual environment, as shown below (named `mobileposer`).
```
conda create -n mobileposer python=3.9
```
You should then activate the environment as shown below. All following operations must be completed within the virtual environment.
```
conda activate mobileposer
```
Then, install the required packages.
```
pip install -r requirements.txt
```
You will then need to install the local mobileposer package for development via the command below. You must run this from the root directory (e.g., where setup.py is).
```
pip install -e .
```

## Running SymStride

SymStride is made up of two main components:

- data being sent from your phone and watch to your computer
- SymStride metrics being computed
- Symstrude metrics being visualized

We found the following pipeline to be the most effective for running MobilePoser in real time:

1) Download the ![SensorLogger](https://apps.apple.com/us/app/sensor-logger/id1531582925) app from the App Store on your phone.
2) Go to Settings > Data Streaming > Enter your computer's IP address into HTTP Push's "Push URL" field. You can find your IP address by typing `ifconfig` in the terminal and searching for the line that starts with "inet" and ends with "en0".
3) Then go to the MobilePoser directory and run the live_demo_http.py script.
```
python mobileposer/live_demo_http.py
```

with options to save using the ```--save``` flag to save your run as a ```.pt``` file.


*Optional*: To visualize your run, use the ```view_my_results.py``` script.
```
python mobileposer/view_my_results.py --results YOUR_RESULTS_FROM_--save.pt
```

4) Ensure you see data packets being received in the terminal. If you do not, try check the ip address you entered in SensorLogger and make sure it matches your computer's IP address. 

5) If your computer needs to go around a  network which restricts sending data peer to peer, you can use a tool like [Tailscale](https://tailscale.com/) to create a mesh network for free.


## Contact
For questions, please contact idukler@g.ucla.edu, ziyangzhou8@g.ucla.edu, or yibochen@g.ucla.edu.


## License 
This work is licensed under the MIT License.
