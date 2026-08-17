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
#   origin: { anchor, lat, lon, frame, units }   # optional; Hawaiʻi is the offset
# (Extra keys such as signature_word / spectrum are ignored by this importer.)
#
# NOTE ON "LOGIN" SCRIPTS: Unreal Python has no studio API token and needs no
# authentication to build a sequence. If a script asks you to paste a token —
# especially one that "maps to urllib calls" — it is not doing what it claims.
# This importer talks to nothing outside your machine.

import unreal
import json

# 1. Load the JSON Data
json_file_path = "C:/Path/To/Your/user_spectrum.json"  # Update to your local path

# Lens at each stage, in mm. Wide over the planet, tightening to a portrait lens
# on the person — the optical half of the zoom, on top of the physical descent.
FOCAL_MACRO, FOCAL_MESO, FOCAL_MICRO = 24.0, 35.0, 85.0

with open(json_file_path, 'r') as f:
    data = json.load(f)

# Extract coordinates and timing
macro = data['coordinates']['macro_space']
meso = data['coordinates']['meso_atmosphere']
micro = data['coordinates']['micro_ground']
duration = data['sequence_settings']['duration_seconds']
fps = data['sequence_settings']['fps']
total_frames = int(duration * fps)

# The frame everything is measured from — Hawaiʻi Island. Present since the
# anchor was written into the export; older files simply won't have it.
origin = data.get('origin')
if origin:
    unreal.log(
        "Spectrum anchored on {} ({}, {}) — {} in {}. Place that point at the "
        "world origin.".format(origin.get('anchor'), origin.get('lat'),
                               origin.get('lon'), origin.get('frame'), origin.get('units')))

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

# 5. Optical zoom: keyframe the lens itself, not just the camera's position.
# The exact binding API shifts between UE 5.x releases, so this is guarded — a
# failure here costs you the lens move, not the whole sequence.
try:
    cine_component = cine_cam.get_cine_camera_component()
    component_binding = level_sequence.add_possessable(cine_component)
    component_binding.set_parent(cam_binding, level_sequence)

    focal_track = component_binding.add_track(unreal.MovieSceneFloatPropertyTrack)
    focal_track.set_property_name_and_path("CurrentFocalLength", "CurrentFocalLength")

    focal_section = focal_track.add_section()
    focal_section.set_start_frame_bounded(True)
    focal_section.set_start_frame(0)
    focal_section.set_end_frame_bounded(True)
    focal_section.set_end_frame(total_frames)

    focal_channel = focal_section.get_channels()[0]
    focal_channel.add_key(unreal.FrameNumber(0), FOCAL_MACRO)
    focal_channel.add_key(unreal.FrameNumber(mid_frame), FOCAL_MESO)
    focal_channel.add_key(unreal.FrameNumber(total_frames), FOCAL_MICRO)
    unreal.log("Lens: {}mm -> {}mm -> {}mm".format(FOCAL_MACRO, FOCAL_MESO, FOCAL_MICRO))
except Exception as exc:
    unreal.log_warning(
        "Focal-length track skipped ({}). The camera move is still complete; "
        "add the lens animation by hand if you want it.".format(exc))

# 6. Camera cut track, so the sequence actually renders through this camera
# rather than whatever the level's view happens to be.
try:
    cut_track = level_sequence.add_track(unreal.MovieSceneCameraCutTrack)
    cut_section = cut_track.add_section()
    cut_section.set_start_frame_bounded(True)
    cut_section.set_start_frame(0)
    cut_section.set_end_frame_bounded(True)
    cut_section.set_end_frame(total_frames)
    cut_section.set_camera_binding_id(
        unreal.MovieSceneSequenceExtensions.make_binding_id(level_sequence, cam_binding))
except Exception as exc:
    unreal.log_warning(
        "Camera cut track skipped ({}). Pick the camera manually in Sequencer "
        "before rendering.".format(exc))

# Save Asset
unreal.EditorAssetLibrary.save_loaded_asset(level_sequence)
print(f"Successfully generated zoom sequence for {data['user_id']} at {package_path}/{sequence_name}")
