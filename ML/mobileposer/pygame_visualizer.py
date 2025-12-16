"""
Simple PyGame visualizer for SMPL poses
Drop-in replacement for Unity visualization
"""

import pygame
import torch
import numpy as np
import pickle
from pathlib import Path


class PoseVisualizer:
    """Simple PyGame visualizer for SMPL skeleton"""
    
    def __init__(self, width=800, height=600, render_mesh=True):
        """Initialize PyGame window"""
        pygame.init()
        self.screen = pygame.display.set_mode((width, height))
        pygame.display.set_caption('MobilePoser - Pose Visualization')
        self.font = pygame.font.Font(None, 24)
        self.width = width
        self.height = height
        self.fps_clock = pygame.time.Clock()
        self.render_mesh = render_mesh
        
        # SMPL skeleton structure (parent indices)
        self.parents = [-1, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 12, 13, 14, 16, 17, 18, 19, 20, 21]
        
        # Approximate bone lengths (meters)
        self.bone_lengths = [
            0.0, 0.1, 0.1, 0.15, 0.45, 0.45, 0.15, 0.45, 0.45, 0.15, 0.1, 0.1, 0.15, 0.1, 0.1, 0.2,
            0.15, 0.15, 0.3, 0.3, 0.25, 0.25, 0.1, 0.1
        ]
        
        # Joint names for coloring
        self.joint_names = [
            'Pelvis', 'L_Hip', 'R_Hip', 'Spine1', 'L_Knee', 'R_Knee', 'Spine2', 'L_Ankle', 'R_Ankle',
            'Spine3', 'L_Foot', 'R_Foot', 'Neck', 'L_Collar', 'R_Collar', 'Head',
            'L_Shoulder', 'R_Shoulder', 'L_Elbow', 'R_Elbow', 'L_Wrist', 'R_Wrist', 'L_Hand', 'R_Hand'
        ]
        
        # Load SMPL model if mesh rendering is enabled
        self.smpl_faces = None
        if render_mesh:
            try:
                smpl_path = Path(__file__).parent / "smpl" / "basicmodel_m.pkl"
                with open(smpl_path, 'rb') as f:
                    smpl_data = pickle.load(f, encoding='latin1')
                    self.smpl_faces = smpl_data['f']  # Face indices
                    print(f"Loaded SMPL mesh with {len(self.smpl_faces)} faces")
            except Exception as e:
                print(f"Could not load SMPL model: {e}. Falling back to skeleton rendering.")
                self.render_mesh = False
    
    def axis_angle_to_rotation_matrix(self, axis_angle):
        """Convert axis-angle to rotation matrix using Rodrigues formula"""
        angle = torch.norm(axis_angle)
        if angle < 1e-8:
            return torch.eye(3)
        
        axis = axis_angle / angle
        K = torch.tensor([
            [0, -axis[2], axis[1]],
            [axis[2], 0, -axis[0]],
            [-axis[1], axis[0], 0]
        ])
        R = torch.eye(3) + torch.sin(angle) * K + (1 - torch.cos(angle)) * (K @ K)
        return R
    
    def compute_joint_positions(self, pose, tran):
        """
        Compute 3D joint positions from pose parameters using forward kinematics
        
        Args:
            pose: [72] axis-angle representation (24 joints * 3)
            tran: [3] global translation
        
        Returns:
            joint_positions: [24, 3] 3D positions
        """
        pose_aa = pose.view(24, 3)
        joint_positions = torch.zeros(24, 3)
        joint_rotations = []
        
        # Forward kinematics
        for i in range(24):
            R = self.axis_angle_to_rotation_matrix(pose_aa[i])
            joint_rotations.append(R)
            
            if self.parents[i] == -1:
                # Root joint
                joint_positions[i] = tran
            else:
                # Child joint
                parent_idx = self.parents[i]
                offset = torch.tensor([0.0, self.bone_lengths[i], 0.0])
                rotated_offset = joint_rotations[parent_idx] @ offset
                joint_positions[i] = joint_positions[parent_idx] + rotated_offset
        
        return joint_positions
    
    def project_to_2d(self, pos_3d):
        """Simple orthographic projection"""
        scale = 200  # pixels per meter
        x = int(self.width // 2 + pos_3d[0].item() * scale)
        y = int(self.height - 150 - pos_3d[1].item() * scale)  # Flip Y
        return (x, y)
    
    def draw_pose(self, pose, tran):
        """
        Draw pose on screen
        
        Args:
            pose: [72] axis-angle or torch.Tensor
            tran: [3] translation or torch.Tensor
        """
        # Convert to tensors if needed
        if not isinstance(pose, torch.Tensor):
            pose = torch.tensor(pose).float()
        if not isinstance(tran, torch.Tensor):
            tran = torch.tensor(tran).float()
        
        # Compute joint positions
        joint_positions = self.compute_joint_positions(pose, tran)
        
        # Clear screen
        self.screen.fill((25, 25, 35))
        
        # Draw bones
        for i in range(24):
            if self.parents[i] != -1:
                p1 = self.project_to_2d(joint_positions[self.parents[i]])
                p2 = self.project_to_2d(joint_positions[i])
                
                # Color code: blue for left, red for right, white for center
                if 'L_' in self.joint_names[i]:
                    color = (100, 150, 255)
                elif 'R_' in self.joint_names[i]:
                    color = (255, 100, 100)
                else:
                    color = (200, 200, 200)
                
                pygame.draw.line(self.screen, color, p1, p2, 3)
        
        # Draw joints
        for i in range(24):
            pos = self.project_to_2d(joint_positions[i])
            
            if i == 0:  # Pelvis
                color = (255, 255, 0)
                radius = 8
            elif i == 15:  # Head
                color = (255, 200, 100)
                radius = 10
            else:
                color = (150, 255, 150)
                radius = 5
            
            pygame.draw.circle(self.screen, color, pos, radius)
            pygame.draw.circle(self.screen, (255, 255, 255), pos, radius, 1)
        
        # Display info
        fps_text = self.font.render(f'FPS: {self.fps_clock.get_fps():.1f}', True, (0, 255, 0))
        self.screen.blit(fps_text, (10, 10))
        
        tran_text = self.font.render(f'Pos: ({tran[0]:.2f}, {tran[1]:.2f}, {tran[2]:.2f})', True, (200, 200, 200))
        self.screen.blit(tran_text, (10, 35))
        
        info_text = self.font.render('Press Q to quit', True, (150, 150, 150))
        self.screen.blit(info_text, (10, self.height - 30))
        
        pygame.display.flip()
        self.fps_clock.tick(60)
    
    def handle_events(self):
        """
        Handle pygame events
        
        Returns:
            False if user wants to quit, True otherwise
        """
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q:
                    return False
        return True
    
    def close(self):
        """Clean up"""
        pygame.quit()


# Example usage:
"""
# In your main code, replace Unity visualization with:

if args.vis:
    visualizer = PoseVisualizer()

# In your main loop, replace Unity send with:
if args.vis:
    if not visualizer.handle_events():
        running = False
    visualizer.draw_pose(pose, tran)

# At the end:
if args.vis:
    visualizer.close()
"""
