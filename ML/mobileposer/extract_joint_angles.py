"""
Extract SMPL pose data from .pt file and calculate joint angles.

This script:
1. Loads the saved .pt file from live_demo_phone_http.py
2. Extracts pose data (axis-angle format)
3. Computes joint positions using forward kinematics
4. Calculates joint angles (knee, hip, ankle) from joint positions
5. Exports data in JSON format for React app consumption
"""

import os
import sys
import json
import torch
import numpy as np
from pathlib import Path

# Add parent directory to path to import mobileposer modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from mobileposer.config import paths
import mobileposer.articulate as art


_SINGLE_FRAME_BODYMODEL = None
_SINGLE_FRAME_DEVICE = torch.device("cpu")

# Global array to accumulate joint angle data during live session
_LIVE_SESSION_DATA = []


# SMPL joint indices (from pygame_visualizer.py)
JOINT_NAMES = [
    'Pelvis', 'L_Hip', 'R_Hip', 'Spine1', 'L_Knee', 'R_Knee', 'Spine2', 
    'L_Ankle', 'R_Ankle', 'Spine3', 'L_Foot', 'R_Foot', 'Neck', 
    'L_Collar', 'R_Collar', 'Head', 'L_Shoulder', 'R_Shoulder', 
    'L_Elbow', 'R_Elbow', 'L_Wrist', 'R_Wrist', 'L_Hand', 'R_Hand'
]

# Joint indices for angle calculations
PELVIS = 0
L_HIP = 1
R_HIP = 2
SPINE1 = 3
L_KNEE = 4
R_KNEE = 5
SPINE2 = 6
L_ANKLE = 7
R_ANKLE = 8
SPINE3 = 9
L_FOOT = 10
R_FOOT = 11
NECK = 12
HEAD = 15
L_SHOULDER = 16
R_SHOULDER = 17
L_ELBOW = 18
R_ELBOW = 19
L_WRIST = 20
R_WRIST = 21


def calculate_angle_between_vectors(v1, v2):
    """
    Calculate the angle (in degrees) between two 3D vectors.
    
    Args:
        v1: [3] vector
        v2: [3] vector
    
    Returns:
        angle in degrees
    """
    # Normalize vectors
    v1_norm = v1 / (torch.norm(v1) + 1e-8)
    v2_norm = v2 / (torch.norm(v2) + 1e-8)
    
    # Calculate dot product and clamp to [-1, 1] for numerical stability
    dot_product = torch.clamp(torch.dot(v1_norm, v2_norm), -1.0, 1.0)
    
    # Calculate angle in radians, then convert to degrees
    angle_rad = torch.acos(dot_product)
    angle_deg = torch.rad2deg(angle_rad)
    
    return angle_deg.item()


def detect_foot_landing(joint_positions_history, foot_joint_idx, ankle_joint_idx, 
                        other_ankle_idx=None, min_frames_between=18, fps=30):
    """
    Foot landing detection based on biomechanical principles:
    
    Foot landing (foot strike) occurs when:
    1. Foot/ankle reaches minimum height (local minimum)
    2. Vertical velocity crosses zero (from descending to ascending/stopped)
    3. Foot is near ground level
    
    This method uses a simplified approach focusing on the most reliable indicators:
    - Velocity zero-crossing (strongest signal)
    - Local minimum in height
    - Ground proximity
    
    Args:
        joint_positions_history: List of [24, 3] joint positions for all frames
        foot_joint_idx: Index of foot joint (L_FOOT=10 or R_FOOT=11)
        ankle_joint_idx: Index of ankle joint (L_ANKLE=7 or R_ANKLE=8)
        other_ankle_idx: Index of other ankle (for comparison, optional)
        min_frames_between: Minimum frames between landing events (default: 12, ~0.4s at 30fps)
        fps: Frames per second (default: 30)
    
    Returns:
        List of frame indices where foot landing occurred
    """
    if len(joint_positions_history) < 5:
        return []
    
    # Extract heights for landing detection
    ankle_heights = [joints[ankle_joint_idx][1].item() for joints in joint_positions_history]
    foot_heights = [joints[foot_joint_idx][1].item() for joints in joint_positions_history]
    
    if len(ankle_heights) == 0 or len(foot_heights) == 0:
        return []
    
    # Find landing events using simplified biomechanical approach
    landing_frames = []
    last_landing_frame = -min_frames_between - 1
    
    # Estimate ground level from foot heights (more accurate than ankle)
    sorted_foot_heights = sorted(foot_heights)
    ground_level_idx = max(1, int(len(sorted_foot_heights) * 3 / 100))  # 3rd percentile
    estimated_ground_foot = sorted_foot_heights[ground_level_idx]
    
    # Calculate foot velocities (more sensitive to landing than ankle)
    foot_velocities = []
    for i in range(len(foot_heights)):
        if i == 0:
            vel = foot_heights[1] - foot_heights[0] if len(foot_heights) > 1 else 0
        elif i == len(foot_heights) - 1:
            vel = foot_heights[i] - foot_heights[i-1]
        else:
            vel = (foot_heights[i+1] - foot_heights[i-1]) / 2.0
        foot_velocities.append(vel)
    
    for i in range(2, len(foot_heights) - 2):
        # PRECONDITION 1: Require that foot was descending with significant velocity before this frame
        # Look back 5-10 frames to ensure there was real descent
        lookback_start = max(0, i - 10)
        recent_velocities = foot_velocities[lookback_start:i]
        
        # Require at least 2 frames with significant downward velocity (> 1mm/frame)
        significant_descent_frames = sum(1 for v in recent_velocities if v < -0.001)
        if significant_descent_frames < 2:
            continue  # Not enough descent, skip
        
        # PRECONDITION 2: Check that foot was higher in recent past (at least 3cm higher)
        recent_heights = foot_heights[lookback_start:i]
        if len(recent_heights) > 0:
            max_recent_height = max(recent_heights)
            height_drop = max_recent_height - foot_heights[i]
            if height_drop < 0.03:  # Less than 3cm drop
                continue  # Not enough height change
        
        # PRIMARY CRITERION: Velocity zero-crossing with minimum descent magnitude
        # Require that velocity was significantly negative before crossing
        was_descending = foot_velocities[i-1] < -0.003  # Was moving down at least 3mm/frame
        is_stopped_or_ascending = foot_velocities[i] >= -0.002  # Now stopped or moving up
        velocity_zero_crossing = was_descending and is_stopped_or_ascending
        
        if not velocity_zero_crossing:
            continue
        
        # SECONDARY CRITERIA (need at least 3 out of 4):
        # 1. Local minimum in foot height (foot at lowest point)
        is_local_min_foot = (foot_heights[i] < foot_heights[i-1] and 
                            foot_heights[i] < foot_heights[i+1])
        
        # 2. Foot is near ground (within reasonable distance of estimated ground)
        height_above_ground = foot_heights[i] - estimated_ground_foot
        is_near_ground = height_above_ground < 0.08  # Within 8cm of ground (stricter)
        
        # 3. Low velocity magnitude at landing (foot has stopped descending)
        is_low_velocity = abs(foot_velocities[i]) < 0.008  # Less than 0.8cm/frame (stricter)
        
        # 4. If other ankle provided, check relative position (landing foot should be lower)
        other_foot_lower = True
        if other_ankle_idx is not None and i < len(joint_positions_history):
            other_ankle_height = joint_positions_history[i][other_ankle_idx][1].item()
            # Allow small tolerance (2cm) for when both feet are on ground
            if ankle_heights[i] > other_ankle_height + 0.02:
                other_foot_lower = False
        
        # Require velocity zero-crossing (primary) AND at least 3 of the 4 secondary criteria
        secondary_score = sum([is_local_min_foot, is_near_ground, is_low_velocity, other_foot_lower])
        
        # Need at least 3 secondary criteria (stricter than before)
        if secondary_score >= 3 and (i - last_landing_frame) >= min_frames_between:
            landing_frames.append(i)
            last_landing_frame = i
    
    return landing_frames


def determine_front_back_leg_from_velocity(joint_positions, prev_pelvis_pos=None):
    """
    Determine front/back leg using direction of travel (pelvis velocity).
    Projects foot positions onto the direction of travel vector.
    
    Args:
        joint_positions: [24, 3] tensor of joint positions
        prev_pelvis_pos: Previous frame's pelvis position [3] (optional)
    
    Returns:
        tuple: (front_side, back_side) where both are 'left' or 'right', or None if can't determine
    """
    if prev_pelvis_pos is None:
        return None
    
    # Calculate direction of travel (pelvis velocity)
    pelvis_pos = joint_positions[PELVIS]
    travel_direction = pelvis_pos - prev_pelvis_pos
    
    # Normalize travel direction
    travel_magnitude = torch.norm(travel_direction)
    if travel_magnitude < 1e-6:  # Too small, can't determine direction
        return None
    
    travel_direction_normalized = travel_direction / travel_magnitude
    
    # Project foot positions onto travel direction
    l_foot_rel = joint_positions[L_FOOT] - pelvis_pos
    r_foot_rel = joint_positions[R_FOOT] - pelvis_pos
    
    # Dot product gives projection along travel direction
    l_foot_projection = torch.dot(l_foot_rel, travel_direction_normalized).item()
    r_foot_projection = torch.dot(r_foot_rel, travel_direction_normalized).item()
    
    # Foot with larger projection in travel direction is front
    if l_foot_projection > r_foot_projection:
        return 'left', 'right'
    else:
        return 'right', 'left'


def calculate_joint_angles(joint_positions, prev_pelvis_pos=None):
    """
    Calculate joint angles from joint positions.
    
    Args:
        joint_positions: [24, 3] tensor of joint positions
        prev_pelvis_pos: Previous frame's pelvis position [3] (optional, for velocity-based front/back)
    
    Returns:
        dict with front knee, back knee, back-to-head angle, and elbow angles
    """
    # Convert to numpy if needed
    if isinstance(joint_positions, torch.Tensor):
        joint_positions = joint_positions.cpu()
    
    # Calculate knee angles for both legs
    # Knee angle is the interior angle at the knee joint (hip->knee->ankle)
    # We need vectors pointing FROM the knee joint TO the adjacent joints
    # Then measure the angle between them to get the interior joint angle
    l_knee_to_hip = joint_positions[L_HIP] - joint_positions[L_KNEE]  # Vector from knee to hip
    l_knee_to_ankle = joint_positions[L_ANKLE] - joint_positions[L_KNEE]  # Vector from knee to ankle
    l_knee_angle = calculate_angle_between_vectors(l_knee_to_hip, l_knee_to_ankle)
    
    # Right knee angle
    r_knee_to_hip = joint_positions[R_HIP] - joint_positions[R_KNEE]  # Vector from knee to hip
    r_knee_to_ankle = joint_positions[R_ANKLE] - joint_positions[R_KNEE]  # Vector from knee to ankle
    r_knee_angle = calculate_angle_between_vectors(r_knee_to_hip, r_knee_to_ankle)
    
    # Determine which leg is front/back using two methods (in order of reliability):
    # 1. Velocity-based (if available): Project feet onto direction of travel
    # 2. Knee extension angles: More extended = front leg
    
    front_side, back_side = None, None
    
    # Method 1: Try velocity-based detection (most accurate for direction of travel)
    if prev_pelvis_pos is not None:
        result = determine_front_back_leg_from_velocity(joint_positions, prev_pelvis_pos)
        if result is not None:
            front_side, back_side = result
    
    # Method 2: Use knee extension angles (biomechanically accurate)
    if front_side is None:
        angle_diff = abs(l_knee_angle - r_knee_angle)
        if angle_diff > 5:  # Significant difference (>5°)
            if l_knee_angle > r_knee_angle:
                front_side, back_side = 'left', 'right'
            else:
                front_side, back_side = 'right', 'left'
        else:
            # If angles are too similar, use whichever is slightly more extended
            # This should rarely happen, but provides a deterministic result
            if l_knee_angle >= r_knee_angle:
                front_side, back_side = 'left', 'right'
            else:
                front_side, back_side = 'right', 'left'
    
    # Get front and back knee angles
    if front_side == 'left':
        front_knee_angle = l_knee_angle
        back_knee_angle = r_knee_angle
    else:
        front_knee_angle = r_knee_angle
        back_knee_angle = l_knee_angle
    
    # Back to head angle: gaze direction (head tilt relative to horizontal)
    # Positive = looking up, Negative = looking down
    # Calculate using pelvis-to-head vector projected onto YZ plane (sagittal plane)
    pelvis_to_head = joint_positions[HEAD] - joint_positions[PELVIS]
    
    # Project onto YZ plane (vertical plane) to get head direction in sagittal plane
    # Y = vertical (up/down), Z = forward/backward in SMPL coordinate system
    head_y = pelvis_to_head[1].item()  # Vertical component
    head_z = pelvis_to_head[2].item()  # Forward component
    
    # Calculate the angle of the head direction vector from vertical
    # When head is directly above pelvis (mostly vertical): angle from vertical ≈ 0°, gaze is horizontal (0°)
    # When head tilts forward: angle from vertical > 0°, gaze is looking DOWN (negative)
    # When head tilts backward: angle from vertical < 0°, gaze is looking UP (positive)
    if abs(head_z) < 1e-6 and abs(head_y) < 1e-6:
        # Degenerate case: head and pelvis are at same position
        back_to_head_angle = 0.0
    else:
        # Calculate angle from vertical using atan2
        # atan2(Z, Y) gives angle from Y-axis (vertical)
        # When Y > 0 (head above pelvis) and Z > 0 (forward): angle_from_vertical is positive (head tilts forward)
        # When Y > 0 (head above pelvis) and Z < 0 (backward): angle_from_vertical is negative (head tilts backward)
        angle_from_vertical_rad = torch.atan2(torch.tensor(head_z), torch.tensor(head_y))
        angle_from_vertical_deg = torch.rad2deg(angle_from_vertical_rad).item()
        
        # Convert angle from vertical to gaze angle (deviation from horizontal)
        # Final result: looking DOWN = negative angle, looking UP = positive angle
        # When angle_from_vertical = 0° (head directly above): gaze = 0° (horizontal)
        # When angle_from_vertical = +30° (head tilts forward): gaze = -30° (looking DOWN, negative)
        # When angle_from_vertical = -30° (head tilts backward): gaze = +30° (looking UP, positive)
        # Flip the sign: forward tilt → looking down (negative), backward tilt → looking up (positive)
        back_to_head_angle = -angle_from_vertical_deg
        
        # Clamp to reasonable range [-90°, 90°] for head tilt
        if back_to_head_angle > 90:
            back_to_head_angle = 90
        elif back_to_head_angle < -90:
            back_to_head_angle = -90
    
    # Alternative: angle between spine segments (pelvis->spine3 and spine3->head)
    # This gives the spine curvature angle
    pelvis_to_spine3 = joint_positions[SPINE3] - joint_positions[PELVIS]
    spine3_to_head = joint_positions[HEAD] - joint_positions[SPINE3]
    spine_curvature_angle = calculate_angle_between_vectors(pelvis_to_spine3, spine3_to_head)
    
    # Left elbow angle: interior angle at elbow joint
    # Vectors pointing FROM elbow TO adjacent joints
    l_elbow_to_shoulder = joint_positions[L_SHOULDER] - joint_positions[L_ELBOW]
    l_elbow_to_wrist = joint_positions[L_WRIST] - joint_positions[L_ELBOW]
    l_elbow_angle = calculate_angle_between_vectors(l_elbow_to_shoulder, l_elbow_to_wrist)
    
    # Right elbow angle
    r_elbow_to_shoulder = joint_positions[R_SHOULDER] - joint_positions[R_ELBOW]
    r_elbow_to_wrist = joint_positions[R_WRIST] - joint_positions[R_ELBOW]
    r_elbow_angle = calculate_angle_between_vectors(r_elbow_to_shoulder, r_elbow_to_wrist)
    
    return {
        'frontKnee': {
            'angle': float(front_knee_angle),
            'side': front_side
        },
        'backKnee': {
            'angle': float(back_knee_angle),
            'side': back_side
        },
        'backToHead': {
            'angle': float(back_to_head_angle),
            'spineCurvature': float(spine_curvature_angle)
        },
        'elbow': {
            'left': float(l_elbow_angle),
            'right': float(r_elbow_angle)
        },
        # Also keep individual knee angles for reference
        'knee': {
            'left': float(l_knee_angle),
            'right': float(r_knee_angle)
        }
    }


def calculate_symmetry(left, right):
    """Calculate symmetry percentage between left and right angles."""
    if left == 0 and right == 0:
        return 100.0
    avg = (left + right) / 2
    # Handle edge case where avg is zero (e.g., left=5, right=-5)
    # If avg == 0, then left + right == 0, so right == -left
    # If left == right and avg == 0, then left == 0 (already handled above)
    # So if avg == 0, left != right, meaning values sum to zero but differ
    if abs(avg) < 1e-10:  # Use small epsilon to handle floating point precision
        # Values sum to zero but are different, return 0% symmetry
        return 0.0
    diff = abs(left - right)
    symmetry = max(0.0, 100.0 - (diff / avg) * 100.0)
    return round(symmetry, 1)


def calculate_averages_from_live_data():
    """Calculate average joint angles from accumulated live session data.
    
    Returns:
        dict with average joint angles in the same format as extract_poses_from_pt_file,
        or None if no data has been accumulated.
    """
    global _LIVE_SESSION_DATA
    
    if len(_LIVE_SESSION_DATA) == 0:
        return None
    
    # Calculate averages
    avg_front_knee = np.mean([m['frontKnee']['angle'] for m in _LIVE_SESSION_DATA])
    avg_back_knee = np.mean([m['backKnee']['angle'] for m in _LIVE_SESSION_DATA])
    avg_back_to_head = np.mean([m['backToHead']['angle'] for m in _LIVE_SESSION_DATA])
    avg_spine_curvature = np.mean([m['backToHead']['spineCurvature'] for m in _LIVE_SESSION_DATA])
    avg_elbow_left = np.mean([m['elbow']['left'] for m in _LIVE_SESSION_DATA])
    avg_elbow_right = np.mean([m['elbow']['right'] for m in _LIVE_SESSION_DATA])
    avg_knee_left = np.mean([m['knee']['left'] for m in _LIVE_SESSION_DATA])
    avg_knee_right = np.mean([m['knee']['right'] for m in _LIVE_SESSION_DATA])
    
    # Calculate min/max for front and back knee
    front_knee_angles = [m['frontKnee']['angle'] for m in _LIVE_SESSION_DATA]
    back_knee_angles = [m['backKnee']['angle'] for m in _LIVE_SESSION_DATA]
    min_front_knee = np.min(front_knee_angles)
    max_front_knee = np.max(front_knee_angles)
    min_back_knee = np.min(back_knee_angles)
    max_back_knee = np.max(back_knee_angles)
    
    # Determine most common front/back side
    front_sides = [m['frontKnee']['side'] for m in _LIVE_SESSION_DATA]
    most_common_front = max(set(front_sides), key=front_sides.count)
    back_sides = [m['backKnee']['side'] for m in _LIVE_SESSION_DATA]
    most_common_back = max(set(back_sides), key=back_sides.count)
    
    # Create average data structure matching the format expected by frontend
    average_data = {
        'jointAngles': {
            'frontKnee': {
                'angle': float(avg_front_knee),
                'min': float(min_front_knee),
                'max': float(max_front_knee),
                'side': most_common_front
            },
            'backKnee': {
                'angle': float(avg_back_knee),
                'min': float(min_back_knee),
                'max': float(max_back_knee),
                'side': most_common_back
            },
            'backToHead': {
                'angle': float(avg_back_to_head),
                'spineCurvature': float(avg_spine_curvature)
            },
            'elbow': {
                'left': float(avg_elbow_left),
                'right': float(avg_elbow_right),
                'symmetry': calculate_symmetry(avg_elbow_left, avg_elbow_right)
            },
            'knee': {
                'left': float(avg_knee_left),
                'right': float(avg_knee_right),
                'symmetry': calculate_symmetry(avg_knee_left, avg_knee_right)
            }
        },
        'totalFrames': len(_LIVE_SESSION_DATA)
    }
    
    return average_data


def reset_live_session_data():
    """Reset the accumulated live session data."""
    global _LIVE_SESSION_DATA
    _LIVE_SESSION_DATA = []

def extract_poses_from_pose_tran(pose, tran, prev_pelvis_pos=None, accumulate_data=True):
    """Compute joint angle metrics from a single SMPL pose and translation.

    Args:
        pose: [72] axis-angle tensor or array
        tran: [3] or [1, 3] translation tensor or array
        prev_pelvis_pos: Previous frame's pelvis position [3] (optional, for velocity-based front/back detection)
        accumulate_data: If True, accumulate this frame's data to global _LIVE_SESSION_DATA array

    Returns:
        dict with the same joint angle structure as produced per frame in
        extract_poses_from_pt_file (including symmetry fields).
    """
    global _SINGLE_FRAME_BODYMODEL, _LIVE_SESSION_DATA

    if _SINGLE_FRAME_BODYMODEL is None:
        smpl_file = paths.smpl_file
        if not os.path.exists(smpl_file):
            smpl_file = Path(__file__).parent / "smpl" / "basicmodel_m.pkl"
        _SINGLE_FRAME_BODYMODEL = art.model.ParametricModel(str(smpl_file), device=_SINGLE_FRAME_DEVICE)

    if not isinstance(pose, torch.Tensor):
        pose = torch.tensor(pose, dtype=torch.float32)
    pose = pose.to(_SINGLE_FRAME_DEVICE).float().view(24, 3)

    pose_rot = art.math.axis_angle_to_rotation_matrix(pose)
    pose_rot_batch = pose_rot.unsqueeze(0).contiguous()

    if isinstance(tran, torch.Tensor):
        tran = tran.to(_SINGLE_FRAME_DEVICE).float()
    else:
        tran = torch.tensor(tran, dtype=torch.float32, device=_SINGLE_FRAME_DEVICE)

    if tran.dim() == 1:
        tran_batch = tran.view(1, 3)
    else:
        tran_batch = tran

    _, joint_positions = _SINGLE_FRAME_BODYMODEL.forward_kinematics(pose_rot_batch, shape=None, tran=tran_batch)
    joint_positions = joint_positions[0]
    
    # Get current pelvis position for next frame's velocity-based detection
    current_pelvis_pos = joint_positions[PELVIS]

    # Calculate joint angles with previous pelvis position for velocity-based detection
    joint_angles = calculate_joint_angles(joint_positions, prev_pelvis_pos=prev_pelvis_pos)
    joint_angles["elbow"]["symmetry"] = calculate_symmetry(joint_angles["elbow"]["left"], joint_angles["elbow"]["right"])
    joint_angles["knee"]["symmetry"] = calculate_symmetry(joint_angles["knee"]["left"], joint_angles["knee"]["right"])

    # Accumulate data if requested (store clean copy without tracking fields)
    if accumulate_data:
        _LIVE_SESSION_DATA.append(joint_angles.copy())
    
    # Add current pelvis position to return value for tracking (but don't accumulate it)
    joint_angles["_pelvis_pos"] = current_pelvis_pos.cpu().numpy().tolist() if isinstance(current_pelvis_pos, torch.Tensor) else current_pelvis_pos

    return joint_angles


def extract_poses_from_pt_file(pt_file_path):
    """
    Extract pose data from .pt file and calculate joint angles.
    
    Args:
        pt_file_path: Path to the .pt file
    
    Returns:
        dict with time series data and joint angles
    """
    print(f"Loading data from {pt_file_path}...")
    
    # Load the .pt file
    data = torch.load(pt_file_path, map_location='cpu')
    
    # Check what keys are available
    print(f"Available keys in .pt file: {list(data.keys())}")
    
    # Extract pose data - it should be in 'actual_poses' key based on live_demo_phone_http.py
    if 'actual_poses' in data:
        poses = data['actual_poses']  # [num_frames, 72]
        trans = data.get('tran', None)
        
        # Debug translation data
        if trans is not None:
            print(f"  Found 'tran' key with shape: {trans.shape}, dtype: {trans.dtype}")
        else:
            print(f"  No 'tran' key found, will use zero translations")
        
        if trans is not None:
            # Handle different translation formats
            if len(trans.shape) == 0:
                # Scalar (shouldn't happen, but handle it)
                print(f"  Warning: Translation is scalar, using zeros")
                trans = torch.zeros(len(poses), 3)
            elif len(trans.shape) == 1:
                if trans.shape[0] == 3:
                    # Single translation vector [3], repeat for all frames
                    trans = trans.unsqueeze(0).repeat(len(poses), 1)
                elif trans.shape[0] == len(poses) * 3:
                    # Flattened format [num_frames * 3], reshape
                    trans = trans.view(len(poses), 3)
                else:
                    print(f"  Warning: Translation has unexpected 1D shape {trans.shape}, using zeros")
                    trans = torch.zeros(len(poses), 3)
            elif len(trans.shape) == 2:
                if trans.shape[1] == 3:
                    # [num_frames, 3] or [some_frames, 3]
                    if trans.shape[0] >= len(poses):
                        trans = trans[:len(poses)]  # Take first len(poses) frames
                    elif trans.shape[0] == 1:
                        # Single frame, repeat
                        trans = trans.repeat(len(poses), 1)
                    else:
                        print(f"  Warning: Translation shape {trans.shape} doesn't match {len(poses)} frames, using zeros")
                        trans = torch.zeros(len(poses), 3)
                else:
                    print(f"  Warning: Translation has unexpected 2D shape {trans.shape}, using zeros")
                    trans = torch.zeros(len(poses), 3)
            else:
                print(f"  Warning: Translation has unexpected shape {trans.shape}, using zeros")
                trans = torch.zeros(len(poses), 3)
        else:
            # Default translation (zero)
            trans = torch.zeros(len(poses), 3)
    elif 'pose' in data:
        poses = data['pose']  # Might be rotation matrices
        if poses.shape[-1] == 216:  # 24 joints * 9 (rotation matrix flattened)
            # Convert rotation matrices to axis-angle
            poses = poses.view(-1, 24, 3, 3)
            poses = art.math.rotation_matrix_to_axis_angle(poses).view(-1, 72)
        trans = data.get('tran', torch.zeros(len(poses), 3))
    else:
        raise ValueError(f"Could not find 'actual_poses' or 'pose' in .pt file. Available keys: {list(data.keys())}")
    
    # Validate that we have at least one frame
    if len(poses) == 0:
        raise ValueError(
            "The .pt file contains zero frames of pose data. "
            "Cannot extract joint angles from an empty dataset."
        )
    
    print(f"Found {len(poses)} frames of pose data")
    
    # Initialize SMPL model for forward kinematics
    smpl_file = paths.smpl_file
    if not os.path.exists(smpl_file):
        # Try relative path
        smpl_file = Path(__file__).parent / "smpl" / "basicmodel_m.pkl"
        if not os.path.exists(smpl_file):
            raise FileNotFoundError(f"SMPL model file not found at {paths.smpl_file} or {smpl_file}")
    
    print(f"Loading SMPL model from {smpl_file}...")
    device = torch.device('cpu')
    bodymodel = art.model.ParametricModel(str(smpl_file), device=device)
    
    # Process each frame
    time_series_data = []
    all_joint_angles = []
    all_joint_positions = []  # Store joint positions for landing detection
    
    print("Processing frames...")
    print(f"  Pose shape: {poses.shape}")
    print(f"  Translation shape: {trans.shape}")
    
    # Validate translation shape
    if len(trans.shape) == 0 or (len(trans.shape) == 1 and trans.shape[0] == 0):
        print("  Warning: Translation tensor is empty, using zero translations")
        trans = torch.zeros(len(poses), 3)
    elif len(trans.shape) == 1 and trans.shape[0] != 3:
        print(f"  Warning: Translation has unexpected shape {trans.shape}, reshaping...")
        if trans.shape[0] == len(poses) * 3:
            # Flattened format, reshape
            trans = trans.view(len(poses), 3)
        else:
            print(f"  Using zero translations as fallback")
            trans = torch.zeros(len(poses), 3)
    
    for i, pose in enumerate(poses):
        if i % 10 == 0:
            print(f"  Processing frame {i}/{len(poses)}")
        
        # Get translation for this frame
        if len(trans.shape) > 1:
            tran = trans[i]  # Should be [3]
        else:
            tran = trans[0] if len(trans) > 0 and trans.shape[0] >= 3 else torch.zeros(3)
        
        # Ensure translation is [3]
        if len(tran.shape) == 0 or tran.shape[0] != 3:
            print(f"  Warning: Invalid translation shape {tran.shape} for frame {i}, using zeros")
            tran = torch.zeros(3)
        
        # Ensure pose is the right shape [72]
        if pose.shape[0] != 72:
            print(f"  Warning: Unexpected pose shape {pose.shape} for frame {i}, expected [72]")
            continue
        
        # Convert axis-angle to rotation matrix for forward kinematics
        # Pose is [72] = [24, 3] axis-angle
        # Ensure pose is on CPU and float32
        pose = pose.cpu().float() if isinstance(pose, torch.Tensor) else torch.tensor(pose, dtype=torch.float32)
        pose_aa = pose.view(24, 3)
        
        # Convert to rotation matrices: [24, 3, 3]
        pose_rot = art.math.axis_angle_to_rotation_matrix(pose_aa)
        
        # Check for invalid values
        if torch.isnan(pose_rot).any() or torch.isinf(pose_rot).any():
            print(f"  Warning: Invalid values (NaN/Inf) in pose rotation matrices for frame {i}, skipping...")
            continue
        
        # Add batch dimension: [1, 24, 3, 3] (the format forward_kinematics expects)
        # Ensure tensor is contiguous for proper reshaping
        pose_rot_batch = pose_rot.unsqueeze(0).contiguous()
        
        # Ensure translation is correct shape: [1, 3] and on CPU
        if isinstance(tran, torch.Tensor):
            tran = tran.cpu().float()
            if len(tran.shape) == 1:
                tran_batch = tran.unsqueeze(0)  # [1, 3]
            else:
                tran_batch = tran
        else:
            tran_batch = torch.tensor(tran, dtype=torch.float32).unsqueeze(0) if len(tran) == 3 else torch.zeros(1, 3, dtype=torch.float32)
        
        # Forward kinematics to get joint positions
        # Expects [batch, 24, 3, 3] format
        try:
            pose_global, joint_positions = bodymodel.forward_kinematics(pose_rot_batch, shape=None, tran=tran_batch)
            
            # Debug first frame
            if i == 0:
                print(f"    Debug frame 0:")
                print(f"      pose_rot_batch shape: {pose_rot_batch.shape}")
                print(f"      tran_batch shape: {tran_batch.shape}")
                print(f"      joint_positions shape: {joint_positions.shape if joint_positions is not None else None}")
                if joint_positions is not None and joint_positions.shape[0] > 0:
                    print(f"      joint_positions[0] sample (first 3 joints): {joint_positions[0, :3]}")
                else:
                    print(f"      WARNING: joint_positions is empty or None!")
                    print(f"      pose_rot_batch min/max: {pose_rot_batch.min().item():.4f}/{pose_rot_batch.max().item():.4f}")
                    print(f"      pose_rot_batch contains NaN: {torch.isnan(pose_rot_batch).any().item()}")
                    print(f"      pose_rot_batch contains Inf: {torch.isinf(pose_rot_batch).any().item()}")
            
            # Check if joint_positions is valid
            if joint_positions is None:
                print(f"  Warning: None joint positions for frame {i}, skipping...")
                continue
            
            if joint_positions.shape[0] == 0:
                print(f"  Warning: Empty joint positions (shape {joint_positions.shape}) for frame {i}, skipping...")
                continue
            
            joint_positions = joint_positions[0]  # Get first (and only) frame: [24, 3]
            
            # Verify joint positions shape
            if joint_positions.shape[0] != 24:
                print(f"  Warning: Unexpected joint positions shape {joint_positions.shape} for frame {i}, expected [24, 3], skipping...")
                continue
            
            # Get previous pelvis position for velocity-based front/back detection
            prev_pelvis_pos = None
            if i > 0 and len(all_joint_positions) > 0:
                prev_pelvis_pos = all_joint_positions[-1][PELVIS]
            
            # Store joint positions for landing detection
            all_joint_positions.append(joint_positions.clone())
                
        except Exception as e:
            print(f"  Error processing frame {i}: {e}")
            print(f"    pose_rot_batch shape: {pose_rot_batch.shape}")
            print(f"    tran_batch shape: {tran_batch.shape}")
            if i == 0:  # Only print full traceback for first error
                import traceback
                traceback.print_exc()
            continue
        
        # Calculate joint angles (pass previous pelvis position for velocity-based front/back)
        joint_angles = calculate_joint_angles(joint_positions, prev_pelvis_pos)
        
        # Calculate symmetry for elbows
        joint_angles['elbow']['symmetry'] = calculate_symmetry(
            joint_angles['elbow']['left'],
            joint_angles['elbow']['right']
        )
        
        # Calculate symmetry for knees (left vs right, not front vs back)
        joint_angles['knee']['symmetry'] = calculate_symmetry(
            joint_angles['knee']['left'],
            joint_angles['knee']['right']
        )
        
        time_series_data.append({
            'timestamp': i,
            'jointAngles': joint_angles
        })
        
        all_joint_angles.append(joint_angles)
    
    # Check if we have any valid frames
    if len(all_joint_angles) == 0:
        raise ValueError(
            "No valid frames were processed! All frames returned empty joint positions. "
            "This might indicate an issue with the pose data format or the SMPL model."
        )
    
    print(f"\n  Successfully processed {len(all_joint_angles)}/{len(poses)} frames")
    
    # Detect foot landing events using robust multi-signal detection
    print("  Detecting foot landing events (using ankle position, velocity, and ground proximity)...")
    # Pass both ankle indices so we can compare and avoid simultaneous false detections
    left_foot_landings = detect_foot_landing(all_joint_positions, L_FOOT, L_ANKLE, R_ANKLE)
    right_foot_landings = detect_foot_landing(all_joint_positions, R_FOOT, R_ANKLE, L_ANKLE)
    
    print(f"    Found {len(left_foot_landings)} left foot landings at frames: {left_foot_landings}")
    print(f"    Found {len(right_foot_landings)} right foot landings at frames: {right_foot_landings}")
    
    # Debug: Show landing pattern
    if len(left_foot_landings) > 0 or len(right_foot_landings) > 0:
        all_landings = sorted(set(left_foot_landings + right_foot_landings))
        print(f"    Total unique landing events: {len(all_landings)}")
        if len(all_landings) > 1:
            intervals = [all_landings[i+1] - all_landings[i] for i in range(len(all_landings)-1)]
            avg_interval = np.mean(intervals)
            print(f"    Average interval between landings: {avg_interval:.1f} frames ({avg_interval/30:.2f}s at 30fps)")
    
    # Calculate knee angles at foot landing
    front_knee_at_landing = []
    back_knee_at_landing = []
    
    # For each landing event, determine if it's front or back leg and get knee angle
    for landing_frame in left_foot_landings:
        if landing_frame < len(all_joint_angles):
            joint_angles = all_joint_angles[landing_frame]
            # Determine if left leg is front or back at this moment
            if joint_angles['frontKnee']['side'] == 'left':
                front_knee_at_landing.append(joint_angles['frontKnee']['angle'])
            else:
                back_knee_at_landing.append(joint_angles['backKnee']['angle'])
    
    for landing_frame in right_foot_landings:
        if landing_frame < len(all_joint_angles):
            joint_angles = all_joint_angles[landing_frame]
            # Determine if right leg is front or back at this moment
            if joint_angles['frontKnee']['side'] == 'right':
                front_knee_at_landing.append(joint_angles['frontKnee']['angle'])
            else:
                back_knee_at_landing.append(joint_angles['backKnee']['angle'])
    
    # Calculate average knee angles at landing
    avg_front_knee_at_landing = np.mean(front_knee_at_landing) if len(front_knee_at_landing) > 0 else None
    avg_back_knee_at_landing = np.mean(back_knee_at_landing) if len(back_knee_at_landing) > 0 else None
    
    if avg_front_knee_at_landing is not None:
        print(f"    Average front knee angle at landing: {avg_front_knee_at_landing:.1f}° ({len(front_knee_at_landing)} events)")
    if avg_back_knee_at_landing is not None:
        print(f"    Average back knee angle at landing: {avg_back_knee_at_landing:.1f}° ({len(back_knee_at_landing)} events)")
    
    # Calculate average angles (overall)
    front_knee_angles = [a['frontKnee']['angle'] for a in all_joint_angles]
    back_knee_angles = [a['backKnee']['angle'] for a in all_joint_angles]
    
    avg_front_knee = np.mean(front_knee_angles)
    avg_back_knee = np.mean(back_knee_angles)
    min_front_knee = np.min(front_knee_angles)
    max_front_knee = np.max(front_knee_angles)
    min_back_knee = np.min(back_knee_angles)
    max_back_knee = np.max(back_knee_angles)
    
    avg_back_to_head = np.mean([a['backToHead']['angle'] for a in all_joint_angles])
    avg_spine_curvature = np.mean([a['backToHead']['spineCurvature'] for a in all_joint_angles])
    avg_elbow_left = np.mean([a['elbow']['left'] for a in all_joint_angles])
    avg_elbow_right = np.mean([a['elbow']['right'] for a in all_joint_angles])
    avg_knee_left = np.mean([a['knee']['left'] for a in all_joint_angles])
    avg_knee_right = np.mean([a['knee']['right'] for a in all_joint_angles])
    
    # Determine most common front/back side
    front_sides = [a['frontKnee']['side'] for a in all_joint_angles]
    back_sides = [a['backKnee']['side'] for a in all_joint_angles]
    
    # Validate that we have sides to process (should be caught by check above, but double-check)
    if len(front_sides) == 0 or len(back_sides) == 0:
        raise ValueError(
            f"Cannot determine front/back sides: front_sides has {len(front_sides)} items, "
            f"back_sides has {len(back_sides)} items. This should not happen if all_joint_angles "
            f"is non-empty (has {len(all_joint_angles)} items)."
        )
    
    # Debug: Show distribution of front/back sides
    left_front_count = front_sides.count('left')
    right_front_count = front_sides.count('right')
    left_back_count = back_sides.count('left')
    right_back_count = back_sides.count('right')
    
    print(f"  Front/back leg distribution:")
    print(f"    Left leg as front: {left_front_count}/{len(front_sides)} frames ({100*left_front_count/len(front_sides):.1f}%)")
    print(f"    Right leg as front: {right_front_count}/{len(front_sides)} frames ({100*right_front_count/len(front_sides):.1f}%)")
    
    most_common_front = max(set(front_sides), key=front_sides.count)
    most_common_back = max(set(back_sides), key=back_sides.count)
    
    result = {
        'timeSeriesData': time_series_data,
        'jointAngles': {
            'frontKnee': {
                'angle': float(avg_front_knee),
                'min': float(min_front_knee),
                'max': float(max_front_knee),
                'side': most_common_front,
                'angleAtLanding': float(avg_front_knee_at_landing) if avg_front_knee_at_landing is not None else None,
                'landingEvents': len(front_knee_at_landing)
            },
            'backKnee': {
                'angle': float(avg_back_knee),
                'min': float(min_back_knee),
                'max': float(max_back_knee),
                'side': most_common_back,
                'angleAtLanding': float(avg_back_knee_at_landing) if avg_back_knee_at_landing is not None else None,
                'landingEvents': len(back_knee_at_landing)
            },
            'backToHead': {
                'angle': float(avg_back_to_head),
                'spineCurvature': float(avg_spine_curvature)
            },
            'elbow': {
                'left': float(avg_elbow_left),
                'right': float(avg_elbow_right),
                'symmetry': calculate_symmetry(avg_elbow_left, avg_elbow_right)
            },
            # Keep knee angles for backward compatibility
            'knee': {
                'left': float(avg_knee_left),
                'right': float(avg_knee_right),
                'symmetry': calculate_symmetry(avg_knee_left, avg_knee_right)
            }
        }
    }
    
    return result


def main():
    """Main function to extract and export joint angles."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Extract joint angles from .pt file')
    parser.add_argument('--input', '-i', type=str, 
                       default='phone_dev_1765133853.pt',
                       help='Path to input .pt file')
    parser.add_argument('--output', '-o', type=str,
                       default='joint_angles.json',
                       help='Path to output JSON file')
    parser.add_argument('--output-dir', type=str,
                       default=None,
                       help='Directory to save output (default: same as input file)')
    
    args = parser.parse_args()
    
    # Resolve input path
    input_path = Path(args.input)
    if not input_path.is_absolute():
        # Try relative to script directory first
        script_dir = Path(__file__).parent
        input_path = script_dir / input_path
        if not input_path.exists():
            # Try current working directory
            input_path = Path(args.input)
    
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Determine output path
    if args.output_dir:
        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / args.output
    else:
        output_path = input_path.parent / args.output
    
    # Extract joint angles
    result = extract_poses_from_pt_file(str(input_path))
    
    # Save to JSON
    print(f"\nSaving results to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"\n✓ Successfully extracted joint angles!")
    print(f"  - Total frames: {len(result['timeSeriesData'])}")
    print(f"  - Front knee angle: {result['jointAngles']['frontKnee']['angle']:.1f}°")
    print(f"    → Range: {result['jointAngles']['frontKnee']['min']:.1f}° - {result['jointAngles']['frontKnee']['max']:.1f}°")
    if result['jointAngles']['frontKnee']['angleAtLanding'] is not None:
        print(f"    → At foot landing: {result['jointAngles']['frontKnee']['angleAtLanding']:.1f}° ({result['jointAngles']['frontKnee']['landingEvents']} events)")
    print(f"  - Back knee angle: {result['jointAngles']['backKnee']['angle']:.1f}°")
    print(f"    → Range: {result['jointAngles']['backKnee']['min']:.1f}° - {result['jointAngles']['backKnee']['max']:.1f}°")
    if result['jointAngles']['backKnee']['angleAtLanding'] is not None:
        print(f"    → At foot landing: {result['jointAngles']['backKnee']['angleAtLanding']:.1f}° ({result['jointAngles']['backKnee']['landingEvents']} events)")
    print(f"  - Back to head angle: {result['jointAngles']['backToHead']['angle']:.1f}°")
    print(f"  - Spine curvature: {result['jointAngles']['backToHead']['spineCurvature']:.1f}°")
    print(f"  - Elbow angles: L={result['jointAngles']['elbow']['left']:.1f}°, R={result['jointAngles']['elbow']['right']:.1f}°")
    print(f"  - Elbow symmetry: {result['jointAngles']['elbow']['symmetry']:.1f}%")
    print(f"  - Output saved to: {output_path}")


if __name__ == '__main__':
    main()

