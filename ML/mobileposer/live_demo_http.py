"""
HTTP phone IMU live demo for MobilePoser.

Close structural match to live_demo_orig.py, but:
- Uses PhoneIMUSet (HTTP) instead of UDP IMUSet.
- Uses PyGame PoseVisualizer instead of Unity/Socket.
"""

import os
import time
import threading
import json
from argparse import ArgumentParser
from datetime import datetime

import numpy as np
import torch
from flask import Flask, request, jsonify
from pygame.time import Clock
from threading import Lock

from articulate.math import *
from mobileposer.config import *
from mobileposer.models import *
from mobileposer.utils.model_utils import *
from mobileposer.extract_joint_angles import extract_poses_from_pose_tran, calculate_averages_from_live_data, reset_live_session_data, calculate_symmetry

import requests



# Configurations
USE_PHONE_AS_WATCH = False
global GLOBAL_COUNT
# GLOBAL_COUNT = 0

class PhoneIMUSet:
    """HTTP-based IMU receiver.

    Exposes the same interface as IMUSet in live_demo_orig.py:
    - start_reading / stop_reading
    - get_current_buffer
    - get_mean_measurement_of_n_second

    Each HTTP POST to /data should contain a JSON body with a "payload" list
    including entries named "orientation" (quaternion) and "accelerometer".
    The single phone IMU is tiled to 5 IMU slots to match the original demo.
    """

    def __init__(self, imu_host: str = "0.0.0.0", imu_port: int = 8000, buffer_len: int = 26):
        self.imu_host = imu_host
        self.imu_port = imu_port
        self.clock = Clock()

        self._buffer_len = buffer_len
        self._quat_buffer = []  # list of [5,4]
        self._acc_buffer = []   # list of [5,3]
        self._is_reading = False
        self._read_thread = None
        self._lock = Lock()

        self._app = Flask(__name__)
        self._setup_routes()

    def _setup_routes(self):
        @self._app.route("/data", methods=["POST"])
        def receive_data():
            try:
                data = request.get_json()
                
                # print("Received data:", data)

                quat = None
                acc = None
                quat_wrist = None
                acc_wrist = None
            

                if data and "payload" in data and len(data["payload"]) > 0:
                    # count = len(data["payload"])
                    # print(f"=============== Global Count: {GLOBAL_COUNT} ===================")
                    
                    # Search from newest to oldest
                    for item in reversed(data["payload"]):
                        name = item.get("name")
                        values = item.get("values", {})

                        if name == "orientation" and quat is None:
                            # Expect phone to send quaternion as qx,qy,qz,qw
                            # quaternion_to_rotation_matrix expects w,x,y,z
                            qw = values.get("qw")
                            qx = values.get("qx")
                            qy = values.get("qy")
                            qz = values.get("qz")
                            if None not in (qw, qx, qy, qz):
                                quat = np.array([qw, qx, qy, qz], dtype=np.float32)

                        elif name == "accelerometer" and acc is None:
                            ax = values.get("x")
                            ay = values.get("y")
                            az = values.get("z")
                            if None not in (ax, ay, az):
                                acc = np.array([ax, ay, az], dtype=np.float32)
                          
                        # elif name == "wrist motion" and acc_wrist is None and quat_wrist is None:
                        #     # Handle write motion data if needed
                        #     print("Received wrist motion data:", values)

                        if quat is not None and acc is not None:
                            break
                        
                        
                        # GLOBAL_COUNT += 1


                if quat is not None and acc is not None:
                    # Match original IMUSet format: [5,4] quats, [5,3] accs.
                    # Simple version: tile the single phone IMU to all 5 slots.
                    # quat_full = np.tile((quat), (5, 1))               # [5,4]
                    # acc_full = np.tile(acc, (5, 1)) * -9.8          # [5,3]
                    # Match original IMUSet format: [5,4] quats, [5,3] accs.
                    quat_full = np.zeros((5, 4), dtype=np.float32)
                    acc_full  = np.zeros((5, 3), dtype=np.float32)

                    # Set all IMUs to identity rotation (w=1,x=y=z=0)
                    quat_full[:, 0] = 1.0  # w component

                    # Put real phone data in the rp slot (index 3)
                    rp_index = 0
                    quat_full[rp_index, :] = quat.astype(np.float32)
                    acc_full[rp_index, :]  = (acc * -9.8).astype(np.float32)

                    with self._lock:
                        tranc = int(len(self._quat_buffer) == self._buffer_len)
                        self._quat_buffer = self._quat_buffer[tranc:] + [quat_full]
                        self._acc_buffer = self._acc_buffer[tranc:] + [acc_full]
                        self.clock.tick()

                return {"status": "ok"}, 200
            except Exception as e:
                print(f"Error processing data: {e}")
                return {"status": "error", "message": str(e)}, 400

    def _run_server(self):
        self._app.run(host=self.imu_host, port=self.imu_port, debug=False, threaded=True)

    def start_reading(self):
        if self._read_thread is None:
            self._is_reading = True
            self._read_thread = threading.Thread(target=self._run_server)
            self._read_thread.setDaemon(True)
            with self._lock:
                self._quat_buffer = []
                self._acc_buffer = []
            self._read_thread.start()
            print(f"HTTP server started on http://{self.imu_host}:{self.imu_port}/data")
        else:
            print("Failed to start reading thread: reading is already started.")

    def stop_reading(self):
        if self._read_thread is not None:
            self._is_reading = False
            # Flask dev server will exit with main process; nothing graceful here
            self._read_thread = None

    def get_current_buffer(self):
        with self._lock:
            q = torch.from_numpy(np.array(self._quat_buffer)).float()
            a = torch.from_numpy(np.array(self._acc_buffer)).float()
        return q, a

    def get_mean_measurement_of_n_second(self, num_seconds: int = 3, buffer_len: int = 120):
        save_buffer_len = self._buffer_len
        self._buffer_len = buffer_len
        with self._lock:
            self._quat_buffer = []
            self._acc_buffer = []
        if self._read_thread is None:
            self.start_reading()
        time.sleep(num_seconds)
        q, a = self.get_current_buffer()
        self._buffer_len = save_buffer_len
        return q.mean(dim=0), a.mean(dim=0)


def get_input():
    global running, start_recording
    while running:
        c = input()
        if c == "q":
            running = False
        elif c == "r":
            start_recording = True
        elif c == "s":
            start_recording = False


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("--vis", action="store_true")
    parser.add_argument("--save", action="store_true")
    args = parser.parse_args()

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

    # IMU collection (HTTP)
    imu_set = PhoneIMUSet(buffer_len=1)
    imu_set.start_reading()
    print("Waiting for phone to send data...")
    while len(imu_set._quat_buffer) == 0:
        time.sleep(0.1)
    print("Receiving data from phone!")

    # Calibration 1: align IMU to SMPL body frame
    input("Put phone aligned with your body reference frame (x = Left, y = Up, z = Forward) and then press any key.")
    print("Capturing data for 3 seconds...")
    time.sleep(2)
    if len(imu_set._quat_buffer) == 0:
        print("ERROR: No data received. Check phone connection.")
        exit(1)
    oris = imu_set.get_mean_measurement_of_n_second(num_seconds=3, buffer_len=40)[0][0]
    smpl2imu = quaternion_to_rotation_matrix(oris).view(3, 3).t()
    input("Data collected! Press any key to continue to T-pose calibration.")

    # Calibration 2: bone and acceleration offsets
    input("\tFinish.\nKeep phone in right pocket and press any key.")
    for i in range(3, 0, -1):
        print("\rStand straight in T-pose and be ready. The calibration will begin after %d seconds." % i, end="")
        time.sleep(1)
    print("\nStand straight in T-pose. Keep the pose for 3 seconds ...", end="")

    oris, accs = imu_set.get_mean_measurement_of_n_second(num_seconds=3, buffer_len=40)
    oris = quaternion_to_rotation_matrix(oris)
    device2bone = smpl2imu.matmul(oris).transpose(1, 2).matmul(torch.eye(3))
    acc_offsets = smpl2imu.matmul(accs.unsqueeze(-1))  # [num_imus, 3, 1]

    print("\tFinished Calibrating.\nEstimating poses. Press q to quit")

    # Model
    model = load_model(paths.weights_file)
    model.eval()

    # Visualization
    if args.vis:
        visualizer = PoseVisualizer()

    global running, start_recording
    running = True
    start_recording = False
    clock = Clock()
    is_recording = False
    record_buffer = None

    get_input_thread = threading.Thread(target=get_input)
    get_input_thread.setDaemon(True)
    get_input_thread.start()

    n_imus = 5
    accs_list, oris_list = [], []
    raw_accs, raw_oris = [], []
    poses, trans = [], []
    
    actual_poses = []
    
    # Track previous pelvis position for velocity-based front/back detection
    prev_pelvis_pos = None
    # Reset live session data at start
    reset_live_session_data()

    while running:
        clock.tick(datasets.fps)
        ori_raw, acc_raw = imu_set.get_current_buffer()  # [buffer_len, 5, 4]

        if ori_raw.shape[0] == 0:
            time.sleep(0.01)
            continue

        # Use only last frame
        ori_raw = ori_raw[-1:]
        acc_raw = acc_raw[-1:]

        ori_raw = quaternion_to_rotation_matrix(ori_raw).view(-1, n_imus, 3, 3)
        glb_acc = (smpl2imu.matmul(acc_raw.view(-1, n_imus, 3, 1)) - acc_offsets).view(-1, n_imus, 3)
        glb_ori = smpl2imu.matmul(ori_raw).matmul(device2bone)

        # Optional flip (copied from your addition; disable if not needed)
        # flip = torch.diag(torch.tensor([1.0, -1.0, 1.0], device=glb_ori.device))
        # glb_ori = glb_ori.matmul(flip)

        # Normalization (same as live_demo_orig.py)
        _acc = glb_acc.view(-1, 5, 3)[:, [1, 4, 3, 0, 2]] / amass.acc_scale
        _ori = glb_ori.view(-1, 5, 3, 3)[:, [1, 4, 3, 0, 2]]
        acc = torch.zeros_like(_acc)
        ori = torch.zeros_like(_ori)

        combo = "rp"  # only right pocket; change to e.g. 'lw_rp' if you add watch later
        c = amass.combos[combo]

        if USE_PHONE_AS_WATCH:
            acc[:, [0]] = _acc[:, [3]]
            ori[:, [0]] = _ori[:, [3]]
        else:
            acc[:, c] = _acc[:, c]
            ori[:, c] = _ori[:, c]

        imu_input = torch.cat([acc.flatten(1), ori.flatten(1)], dim=1)

        with torch.no_grad():
            output = model.forward_online(imu_input.squeeze(0), [imu_input.shape[0]])
            pred_pose = output[0]
            # print("pred_pose shape:", pred_pose.shape)
            # pred_joints = output[1]
            pred_tran = output[2]

        pose = rotation_matrix_to_axis_angle(pred_pose.view(1, 216)).view(72)
        tran = pred_tran

        # Compute joint angle metrics from current pose/translation
        try:
            # Convert prev_pelvis_pos to tensor if it's a list/numpy array
            if prev_pelvis_pos is not None and not isinstance(prev_pelvis_pos, torch.Tensor):
                prev_pelvis_pos = torch.tensor(prev_pelvis_pos, dtype=torch.float32)
            
            # Extract joint metrics with velocity-based detection and data accumulation
            joint_metrics = extract_poses_from_pose_tran(pose, tran, prev_pelvis_pos=prev_pelvis_pos, accumulate_data=True)
            
            # Update previous pelvis position for next frame (remove _pelvis_pos from metrics before sending)
            if "_pelvis_pos" in joint_metrics:
                prev_pelvis_pos = torch.tensor(joint_metrics["_pelvis_pos"], dtype=torch.float32)
                # Create a copy without the internal tracking field for sending to frontend
                metrics_to_send = {k: v for k, v in joint_metrics.items() if k != "_pelvis_pos"}
            else:
                metrics_to_send = joint_metrics
            
            print("Joint metrics:", metrics_to_send)
            
            try:
                response = requests.post(
                    "http://localhost:4000/joint-angles",
                    json=metrics_to_send,
                    timeout=1.0,  # optional
                    proxies={"http": None, "https": None}, 
                )
            except Exception as e:
                print("Error sending joint metrics:", e)

        except Exception as e:
            print("Error computing joint metrics:", e)

        if args.save:
            actual_poses.append(pose.cpu())
            accs_list.append(glb_acc)
            oris_list.append(glb_ori)
            raw_accs.append(acc_raw)
            raw_oris.append(ori_raw)
            poses.append(pred_pose)
            trans.append(pred_tran)

        if args.vis:
            if not visualizer.handle_events():
                running = False
            visualizer.draw_pose(pose, tran)

            if os.getenv("DEBUG") is not None:
                print("\r", "(recording)" if is_recording else "", "Sensor FPS:", imu_set.clock.get_fps(),
                      "\tOutput FPS:", clock.get_fps(), end="")

    if args.save:
        data = {
            "raw_acc": torch.cat(raw_accs, dim=0) if len(raw_accs) > 0 else torch.empty(0, dtype=torch.float32),
            "raw_ori": torch.cat(raw_oris, dim=0) if len(raw_oris) > 0 else torch.empty(0, dtype=torch.float32),
            "acc": torch.cat(accs_list, dim=0) if len(accs_list) > 0 else torch.empty(0, dtype=torch.float32),
            "ori": torch.cat(oris_list, dim=0) if len(oris_list) > 0 else torch.empty(0, dtype=torch.float32),
            "pose": torch.cat(poses, dim=0) if len(poses) > 0 else torch.empty(0, dtype=torch.float32),
            "tran": torch.cat(trans, dim=0) if len(trans) > 0 else torch.empty(0, dtype=torch.float32),
            "calibration": {
                "smpl2imu": smpl2imu,
                "device2bone": device2bone,
            },
            "actual_poses": torch.stack(actual_poses, dim=0)
        }
        torch.save(data, f"data/runs/phone_dev_{int(time.time())}.pt")

    # Calculate average joint angles when session ends
    average_data = calculate_averages_from_live_data()
    if average_data is not None:
        print(f"\nCalculating average joint angles from {average_data['totalFrames']} frames...")
        
        # Add session end time
        from datetime import datetime
        average_data['sessionEndTime'] = datetime.now().isoformat()
        
        # Save to JSON file
        output_file = f"data/avgs/live_session_averages_{int(time.time())}.json"
        with open(output_file, 'w') as f:
            json.dump(average_data, f, indent=2)
        print(f"✓ Average joint angles saved to {output_file}")
        
        # Also save to a fixed filename for easy frontend access
        fixed_output_file = "data/avgs/latest_session_averages.json"
        with open(fixed_output_file, 'w') as f:
            json.dump(average_data, f, indent=2)
        print(f"✓ Also saved to {fixed_output_file} for frontend access")
    
        
        # Send to the frontend
        try:
            response = requests.post(
                "http://localhost:4000/joint-angles",
                json=average_data,
                timeout=1.0,  # optional
                proxies={"http": None, "https": None}, 
            )
        except Exception as e:
            print("Error sending joint metrics:", e)
        
        # Print summary
    #     print(f"\nSession Summary:")
    #     print(f"  - Total frames: {average_data['totalFrames']}")
    #     print(f"  - Front knee angle: {average_data['jointAngles']['frontKnee']['angle']:.1f}°")
    #     print(f"    → Range: {average_data['jointAngles']['frontKnee']['min']:.1f}° - {average_data['jointAngles']['frontKnee']['max']:.1f}°")
    #     print(f"  - Back knee angle: {average_data['jointAngles']['backKnee']['angle']:.1f}°")
    #     print(f"    → Range: {average_data['jointAngles']['backKnee']['min']:.1f}° - {average_data['jointAngles']['backKnee']['max']:.1f}°")
    #     print(f"  - Back to head angle: {average_data['jointAngles']['backToHead']['angle']:.1f}°")
    #     print(f"  - Elbow angles: L={average_data['jointAngles']['elbow']['left']:.1f}°, R={average_data['jointAngles']['elbow']['right']:.1f}°")
    #     print(f"  - Elbow symmetry: {average_data['jointAngles']['elbow']['symmetry']:.1f}%")
    # else:
    #     print("\nNo joint angle data accumulated during this session.")

    if args.vis:
        visualizer.close()
    get_input_thread.join()
    imu_set.stop_reading()
    print("Finish.")
