---
title: "SymStride"
description: "Project for UCLA ECEM202A (Fall 2025)"
---

# Home

## Abstract
SymStride enables full 3D running kinematics analysis using only low-cost IMUs, avoiding the controlled environments, privacy concerns, and high costs of camera-based and optical motion-capture systems. IMUs placed on key body segments feed into fine-tuned ML models inspired by DIP and MobilePoser to reconstruct full 3D pose, from which joint angles such as hip, knee, ankle, and elbow are computed through relative rotations. Performance is evaluated by comparing these IMU-derived metrics against vision-based outputs from tools like Ochy, with success defined by matching angle patterns and maintaining small numerical differences. The system already replicates the full IMU-to-mesh pipeline using real data, with ongoing work focused on running-specific fine-tuning and jitter reduction.

## Team
- Michael Zhou
- Yibo Chen
- Ido Dukler

## Required Submissions
- [Midterm Checkpoint Presentation Slides](midterm_presentation.pdf)
- [Final Presentation Slides](final_presentation.pdf)
- [Final Report](final_report.md)
