import asyncio
import json
import random
from datetime import datetime
from aiohttp import web


def calculate_symmetry(left: float, right: float) -> int:
    diff = abs(left - right)
    avg = (left + right) / 2 if (left + right) != 0 else 1.0
    symmetry = max(0.0, 100.0 - (diff / avg) * 100.0)
    return int(round(symmetry))


def calculate_asymmetry_score(joint_angles: dict) -> float:
    knee_diff = abs(joint_angles["knee"]["left"] - joint_angles["knee"]["right"])
    hip_diff = abs(joint_angles["hip"]["left"] - joint_angles["hip"]["right"])
    ankle_diff = abs(joint_angles["ankle"]["left"] - joint_angles["ankle"]["right"])
    return (knee_diff + hip_diff + ankle_diff) / 3.0


def compute_joint_metrics_once() -> dict:
    # Base angles similar to mockData.simulateRealTimeData
    base_knee_left = 165
    base_knee_right = 165
    base_hip_left = 170
    base_hip_right = 170
    base_ankle_left = 110
    base_ankle_right = 110

    # Random variation
    variation = (random.random() - 0.5) * 4.0

    knee_left = base_knee_left + variation
    knee_right = base_knee_right - variation * 0.9
    hip_left = base_hip_left + variation * 0.7
    hip_right = base_hip_right - variation * 0.7
    ankle_left = base_ankle_left + variation * 0.5
    ankle_right = base_ankle_right - variation * 0.5

    joint_angles = {
        "knee": {
            "left": knee_left,
            "right": knee_right,
            "symmetry": calculate_symmetry(knee_left, knee_right),
        },
        "hip": {
            "left": hip_left,
            "right": hip_right,
            "symmetry": calculate_symmetry(hip_left, hip_right),
        },
        "ankle": {
            "left": ankle_left,
            "right": ankle_right,
            "symmetry": calculate_symmetry(ankle_left, ankle_right),
        },
    }

    asymmetry_score = calculate_asymmetry_score(
        {
            "knee": {"left": knee_left, "right": knee_right},
            "hip": {"left": hip_left, "right": hip_right},
            "ankle": {"left": ankle_left, "right": ankle_right},
        }
    )

    overall_symmetry = int(
        round(
            (
                joint_angles["knee"]["symmetry"]
                + joint_angles["hip"]["symmetry"]
                + joint_angles["ankle"]["symmetry"]
            )
            / 3.0
        )
    )

    # Form analysis (random but reasonable ranges)
    foot_landing = {
        "left": random.choice(["heel", "midfoot", "forefoot"]),
        "right": random.choice(["heel", "midfoot", "forefoot"]),
        "symmetry": random.randint(70, 95),
    }

    back_position = {
        "forwardLean": 5 + random.random() * 3,  # 5–8 degrees
        "symmetry": random.randint(80, 95),
        "status": "Good",
    }

    front_knee_left = 160 + (random.random() - 0.5) * 10
    front_knee_right = 160 + (random.random() - 0.5) * 10
    back_knee_left = 30 + (random.random() - 0.5) * 10
    back_knee_right = 30 + (random.random() - 0.5) * 10

    knee_angles_at_landing = {
        "frontKnee": {
            "left": front_knee_left,
            "right": front_knee_right,
            "symmetry": calculate_symmetry(front_knee_left, front_knee_right),
        },
        "backKnee": {
            "left": back_knee_left,
            "right": back_knee_right,
            "symmetry": calculate_symmetry(back_knee_left, back_knee_right),
        },
    }

    arms_left_angle = 85 + (random.random() - 0.5) * 10
    arms_right_angle = 85 + (random.random() - 0.5) * 10
    arms_position = {
        "leftAngle": arms_left_angle,
        "rightAngle": arms_right_angle,
        "symmetry": calculate_symmetry(arms_left_angle, arms_right_angle),
        "swingSymmetry": random.randint(80, 95),
    }

    head_position = {
        "tilt": (random.random() - 0.5) * 3,  # -1.5 to 1.5 degrees
        "forwardPosition": 2 + random.random() * 2,  # 2–4 cm
        "symmetry": random.randint(85, 95),
    }

    metrics = {
        "overallSymmetry": overall_symmetry,
        "asymmetryScore": asymmetry_score,
        "jointAngles": joint_angles,
        "strideSymmetry": 85 + random.random() * 10,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "formAnalysis": {
            "footLanding": foot_landing,
            "backPosition": back_position,
            "kneeAnglesAtLanding": knee_angles_at_landing,
            "armsPosition": arms_position,
            "headPosition": head_position,
        },
    }

    return metrics

async def joint_angles_handler(request):
    data = await request.json()
    print("Received message:", data)

    # Echo back the data
    return web.json_response(data)

async def main():
    app = web.Application()
    app.router.add_post('/joint-angles', joint_angles_handler)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 4000)
    await site.start()

    print("HTTP server listening on http://localhost:4000/joint-angles")
    await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())