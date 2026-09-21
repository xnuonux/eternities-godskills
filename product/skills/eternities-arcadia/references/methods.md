# Arcadia method cards

## immersive-comfort-and-spatial-interaction

Start from target hardware, input devices, player posture, session length, age or access needs, and the intended spatial action. Map reach, target acquisition, locomotion, turning, acceleration, camera behavior, object scale, readability, interaction distance, and interruption rules. For each action, provide a comfortable default, an alternative control, and a clear recovery when the player loses orientation.

Write a comfort and accessibility matrix before playtesting: motion intensity, field of view or camera movement, snap or smooth turning, teleport or seated option, dominant-hand and reach variation, text and contrast, audio and non-audio cues, pause and recenter behavior. Test the matrix with representative scenarios and record observed discomfort, confusion, missed affordances, task completion, and the condition that would reject the design. Machine checks can verify state and input contracts; only human play evidence supports comfort or fun conclusions.

## realtime-3d-performance-and-spatial-systems

Freeze the scene, hardware tier, resolution, frame target, memory ceiling, visibility assumptions, determinism requirement, and correctness fixtures. Choose a bounded system: spatial partition, visibility and level-of-detail policy, fixed-step simulation, streaming, or interaction query. Define ownership and ordering before optimizing.

Measure a repeatable baseline with frame-time distribution, memory, draw or object counts, loading behavior, and relevant correctness outputs. Change one lever, rerun the same fixture, and compare both performance and behavior. Test near/far visibility, high object counts, camera extremes, missing assets, device degradation, and repeated runs. Keep a lower-cost fallback and record whether evidence is local profiling, a fixture, or a real representative device. An improved frame sample does not prove all scenes meet budget.
