import asyncio
import json
import random
from datetime import datetime
from aiohttp import web


# Cache for the most recently received live frame from the external backend.
_latest_live_frame = None


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
    """Handle POST /joint-angles by echoing and caching the received JSON body.

    The external backend sends frames shaped like:

        {
            "frontKnee": {"angle": ..., "side": "right"},
            "backKnee": {"angle": ..., "side": "left"},
            "backToHead": {"angle": ..., "spineCurvature": ...},
            "elbow": {"left": ..., "right": ..., "symmetry": ...},
            "knee": {"left": ..., "right": ..., "symmetry": ...},
        }

    We cache this so GET /joint-angles can serve the most recent live frame
    to the frontend's HTTP polling.
    """
    global _latest_live_frame

    data = await request.json()
    print("Received message:", data)

    # Cache the most recent frame
    _latest_live_frame = data

    # Echo back the data
    return web.json_response(data, headers={"Access-Control-Allow-Origin": "*"})


async def joint_angles_get_handler(request):
    """Handle GET /joint-angles by returning the most recent live frame.

    If an external backend has POSTed a frame to /joint-angles, we return
    that exact JSON so the frontend sees the real incoming data. If no live
    frame has been received yet, we fall back to synthesizing a frame from
    compute_joint_metrics_once(), converted into the same shape.
    """
    global _latest_live_frame

    if _latest_live_frame is not None:
        return web.json_response(_latest_live_frame, headers={"Access-Control-Allow-Origin": "*"})

    # Fallback: generate a synthetic frame in the same shape
    metrics = compute_joint_metrics_once()

    knee_metrics = metrics["jointAngles"]["knee"]
    knee_left = knee_metrics["left"]
    knee_right = knee_metrics["right"]
    knee_symmetry = knee_metrics["symmetry"]

    arms = metrics["formAnalysis"]["armsPosition"]
    head = metrics["formAnalysis"]["headPosition"]
    back = metrics["formAnalysis"]["backPosition"]

    elbow_left = arms["leftAngle"]
    elbow_right = arms["rightAngle"]
    elbow_symmetry = calculate_symmetry(elbow_left, elbow_right)

    back_to_head_angle = head["tilt"]
    spine_curvature = back["forwardLean"]

    frame = {
        "frontKnee": {"angle": float(knee_right), "side": "right"},
        "backKnee": {"angle": float(knee_left), "side": "left"},
        "backToHead": {
            "angle": float(back_to_head_angle),
            "spineCurvature": float(spine_curvature),
        },
        "elbow": {
            "left": float(elbow_left),
            "right": float(elbow_right),
            "symmetry": float(elbow_symmetry),
        },
        "knee": {
            "left": float(knee_left),
            "right": float(knee_right),
            "symmetry": float(knee_symmetry),
        },
    }

    return web.json_response(frame, headers={"Access-Control-Allow-Origin": "*"})

async def main():
    app = web.Application()
    app.router.add_post('/joint-angles', joint_angles_handler)
    app.router.add_get('/joint-angles', joint_angles_get_handler)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 4000)
    await site.start()

    print("HTTP server listening on http://localhost:4000/joint-angles")
    await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())