# Powers of Ten — Unreal LevelSequence generator
# © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
# Proprietary and confidential — see NOTICE at the repository root.
#
# Reads a `user_spectrum.json` exported from the app's Kula Mele signature page
# (the "Download my spectrum" button on /signature) and builds a Cine Camera
# LevelSequence that zooms planet -> atmosphere -> the individual's unique ground
# point. Run inside the Unreal Editor's Python console.
#
# Expected JSON shape (see docs/KULA_MELE_COLOR_MAP.md and the app's
# buildSpectrum()):
#   user_id: str                      # asset-safe; sequence is named Seq_Zoom_<user_id>
#   sequence_settings: { duration_seconds: float, fps: int }
#   coordinates:
#     macro_space:     { x, y, z, pitch, yaw }   # planet view (shared)
#     meso_atmosphere: { x, y, z, pitch, yaw }   # atmospheric entry
#     micro_ground:    { x, y, z, pitch, yaw }   # the person's unique point
# (Extra keys such as signature_word / spectrum are ignored by this importer.)

import unreal
import json

# 1. Load the JSON Data
json_file_path = "C:/Path/To/Your/user_spectrum.json"  # Update to your local path

with open(json_file_path, 'r') as f:
    data = json.load(f)

# Extract coordinates and timing
macro = data['coordinates']['macro_space']
meso = data['coordinates']['meso_atmosphere']
micro = data['coordinates']['micro_ground']
duration = data['sequence_settings']['duration_seconds']
fps = data['sequence_settings']['fps']
total_frames = int(duration * fps)

# 2. Create Level Sequence Asset
asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
package_path = "/Game/Cinematics"
sequence_name = f"Seq_Zoom_{data['user_id']}"

level_sequence = asset_tools.create_asset(
    asset_name=sequence_name,
    package_path=package_path,
    asset_class=unreal.LevelSequence,
    factory=unreal.LevelSequenceFactoryNew()
)

# Set display rate
level_sequence.set_display_rate(unreal.FrameRate(fps, 1))

# 3. Add Cine Camera to Sequence
ls_system = unreal.get_editor_subsystem(unreal.LevelSequenceEditorSubsystem)
cine_cam = ls_system.create_camera(spawnable=True)
cam_binding = level_sequence.add_spawnable_from_instance(cine_cam)

# Add Transform Track
transform_track = cam_binding.add_track(unreal.MovieScene3DTransformTrack)
transform_section = transform_track.add_section()
transform_section.set_range(0, total_frames)

# Helper function to add keyframe
def add_transform_key(frame, pos, rot):
    frame_time = unreal.FrameNumber(frame)
    # Location
    transform_section.get_channels()[0].add_key(frame_time, pos.x)
    transform_section.get_channels()[1].add_key(frame_time, pos.y)
    transform_section.get_channels()[2].add_key(frame_time, pos.z)
    # Rotation
    transform_section.get_channels()[3].add_key(frame_time, rot.roll)
    transform_section.get_channels()[4].add_key(frame_time, rot.pitch)
    transform_section.get_channels()[5].add_key(frame_time, rot.yaw)

# 4. Keyframe the Camera Zoom Sequence
# Frame 0: Global Macro View (Planet Space)
add_transform_key(
    0,
    unreal.Vector(macro['x'], macro['y'], macro['z']),
    unreal.Rotator(0, macro['pitch'], macro['yaw'])
)

# Mid-Frame: Atmospheric Entry
mid_frame = int(total_frames * 0.5)
add_transform_key(
    mid_frame,
    unreal.Vector(meso['x'], meso['y'], meso['z']),
    unreal.Rotator(0, meso['pitch'], meso['yaw'])
)

# Final Frame: Ground Focus (Individual's Unique Spectrum Location)
add_transform_key(
    total_frames,
    unreal.Vector(micro['x'], micro['y'], micro['z']),
    unreal.Rotator(0, micro['pitch'], micro['yaw'])
)

# Save Asset
unreal.EditorAssetLibrary.save_loaded_asset(level_sequence)
print(f"Successfully generated zoom sequence for {data['user_id']} at {package_path}/{sequence_name}")
