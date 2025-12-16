"""
View Your MobilePoser Results
==============================
Simple script to visualize your recorded data results.
"""

import torch
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from mobileposer.viewers import SMPLViewer
from mobileposer.articulate.math import axis_angle_to_rotation_matrix


def view_results(results_file='sensor_data_12d_mobileposer_results.pt'):
    """View the pose estimation results."""
    print("Loading results from:", results_file)
    
    # Load results
    results = torch.load(results_file)
    
    # Handle different file formats
    if 'poses' in results:
        poses = results['poses']
        translations = results['translations']
        num_frames = results['num_frames']
    elif 'pose' in results:
        poses = results['pose']
        translations = results['tran']
        num_frames = len(poses)
    else:
        raise ValueError(f"Unknown file format. Keys: {list(results.keys())}")
    
    print(f"Loaded {num_frames} frames")
    
    # Convert poses from axis-angle to rotation matrices if needed
    if poses.shape[-1] == 72:
        print("Converting poses from axis-angle to rotation matrices...")
        poses = axis_angle_to_rotation_matrix(poses.view(-1, 24, 3)).view(-1, 24, 3, 3)
    
    print("\nControls:")
    print("  Space: Play/Pause")
    print("  Left/Right arrows: Step frame")
    print("  Q: Quit")
    print("\nLaunching viewer...")
    
    # Create viewer and visualize (use predictions as both pred and GT since we have no GT)
    viewer = SMPLViewer()
    viewer.view(poses, translations, poses, translations, with_tran=True)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--results', type=str, 
                        default='sensor_data_12d_mobileposer_results.pt',
                        help='Path to results file')
    args = parser.parse_args()
    
    view_results(args.results)
