# Import Harmonic Scene — one action, everything built.
# © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
# Proprietary and confidential — see NOTICE at the repository root.
#
# Reads a v2 scene package exported by the web app and builds the whole cinematic:
# cameras, the Hawaiʻi anchor, the lens progression, camera cuts, the timeline,
# and the identity's harmonic palette. Nothing is assembled by hand.
#
#     import_harmonic_scene(r"C:/path/to/harmonic_scene.json")
#
# The package is the single source of truth: every frequency, colour and
# coordinate was computed by src/lib/harmonics.ts. THIS SCRIPT COMPUTES NOTHING
# ITSELF — it only places what the package already decided, so Unreal and the
# browser cannot drift apart.
#
# There is no login, no API token, and no network call. If a version of this
# script asks you to paste a "studio token", it is not this script.

import unreal
import json


def _bind_section(section, start, end):
    """Bound a section to an explicit frame range across UE 5.x variants."""
    try:
        section.set_start_frame_bounded(True)
        section.set_start_frame(start)
        section.set_end_frame_bounded(True)
        section.set_end_frame(end)
    except Exception:
        section.set_range(start, end)


def _spawn_camera(sequence, cam):
    """Spawn one CineCameraActor, bind it, and key its transform for the shot."""
    location = unreal.Vector(cam['location_cm']['x'], cam['location_cm']['y'], cam['location_cm']['z'])
    rotation = unreal.Rotator(cam['rotation']['roll'], cam['rotation']['pitch'], cam['rotation']['yaw'])

    actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actor = actor_subsystem.spawn_actor_from_class(unreal.CineCameraActor, location, rotation)
    actor.set_actor_label(cam['name'])

    binding = sequence.add_possessable(actor)
    return actor, binding


def import_harmonic_scene(json_file_path, package_path="/Game/Cinematics"):
    with open(json_file_path, 'r', encoding='utf-8') as handle:
        data = json.load(handle)

    version = str(data.get('version', ''))
    if not version.startswith('2.'):
        unreal.log_error(
            "This importer expects a v2 scene package; got '{}'. Re-export from the app.".format(version or 'none'))
        return None

    identity = data['identity']
    anchor = data['anchor']
    scene = data['scene']
    fps = int(scene['fps'])
    total_frames = int(scene['total_frames'])

    unreal.log("Harmonic scene for {} — anchored on {} ({}, {}), {} as origin.".format(
        identity['user_id'], anchor.get('name'), anchor.get('lat'), anchor.get('lon'),
        anchor.get('coordinate_system')))

    # 1. The sequence itself
    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    sequence_name = "Seq_Harmonic_{}".format(identity['user_id'])
    sequence = asset_tools.create_asset(
        asset_name=sequence_name,
        package_path=package_path,
        asset_class=unreal.LevelSequence,
        factory=unreal.LevelSequenceFactoryNew(),
    )
    if not sequence:
        unreal.log_error("Could not create {}/{}".format(package_path, sequence_name))
        return None
    sequence.set_display_rate(unreal.FrameRate(fps, 1))
    sequence.set_playback_start(0)
    sequence.set_playback_end(total_frames)

    # 2. Cameras, one per stage, placed from the package
    bindings = {}
    for cam in scene['cameras']:
        try:
            actor, binding = _spawn_camera(sequence, cam)
            bindings[cam['name']] = binding

            track = binding.add_track(unreal.MovieScene3DTransformTrack)
            section = track.add_section()
            _bind_section(section, 0, total_frames)
            channels = section.get_channels()
            values = [
                cam['location_cm']['x'], cam['location_cm']['y'], cam['location_cm']['z'],
                cam['rotation']['roll'], cam['rotation']['pitch'], cam['rotation']['yaw'],
            ]
            for index, value in enumerate(values):
                channels[index].add_key(unreal.FrameNumber(0), float(value))
        except Exception as exc:
            unreal.log_warning("Camera {} skipped ({}).".format(cam['name'], exc))

    # 3. Lens progression — the optical half of the zoom
    lens_keys = scene.get('lens', {}).get('keys', [])
    for cut in scene['camera_cuts']:
        binding = bindings.get(cut['camera'])
        if not binding:
            continue
        # Every camera holds the focal length its stage calls for.
        stage = next((k for k in lens_keys if k['frame'] == cut['frame']), None)
        if not stage:
            continue
        try:
            actor = binding.get_object_template() if hasattr(binding, 'get_object_template') else None
            component = None
            for candidate in unreal.EditorLevelLibrary.get_all_level_actors():
                if candidate.get_actor_label() == cut['camera']:
                    component = candidate.get_cine_camera_component()
                    break
            if component is None and actor is not None:
                component = actor.get_cine_camera_component()
            if component is None:
                raise RuntimeError('camera component not found')

            comp_binding = sequence.add_possessable(component)
            comp_binding.set_parent(binding, sequence)
            focal_track = comp_binding.add_track(unreal.MovieSceneFloatPropertyTrack)
            focal_track.set_property_name_and_path("CurrentFocalLength", "CurrentFocalLength")
            focal_section = focal_track.add_section()
            _bind_section(focal_section, 0, total_frames)
            focal_section.get_channels()[0].add_key(
                unreal.FrameNumber(0), float(stage['focal_mm']))
        except Exception as exc:
            unreal.log_warning("Lens for {} skipped ({}).".format(cut['camera'], exc))

    # 4. Camera cuts — declarative, straight from the package
    try:
        cut_track = sequence.add_track(unreal.MovieSceneCameraCutTrack)
        cuts = list(scene['camera_cuts'])
        for index, cut in enumerate(cuts):
            binding = bindings.get(cut['camera'])
            if not binding:
                continue
            start = int(cut['frame'])
            end = int(cuts[index + 1]['frame']) if index + 1 < len(cuts) else total_frames
            section = cut_track.add_section()
            _bind_section(section, start, end)
            section.set_camera_binding_id(
                unreal.MovieSceneSequenceExtensions.make_binding_id(sequence, binding))
        unreal.log("Camera cuts: " + " -> ".join(c['camera'] for c in cuts))
    except Exception as exc:
        unreal.log_warning("Camera cut track skipped ({}). Choose cameras manually in Sequencer.".format(exc))

    # 5. The identity's palette, logged so it can be wired to materials
    palette = data.get('harmonic_nodes', [])
    unreal.log("Signature {} = {}".format(
        identity.get('signature'),
        " ".join("{}({})".format(n['letter'], n['color']['hex']) for n in palette)))

    unreal.EditorAssetLibrary.save_loaded_asset(sequence)

    # 6. Open it, so the artist lands in the finished cinematic
    try:
        unreal.LevelSequenceEditorBlueprintLibrary.open_level_sequence(sequence)
    except Exception:
        pass

    unreal.log("Built {}/{} — {} frames at {}fps.".format(package_path, sequence_name, total_frames, fps))
    return sequence


# Point this at the file the app gave you, then run.
# import_harmonic_scene(r"C:/Path/To/Your/harmonic_scene.json")
