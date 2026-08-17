/*
 * Scene package — everything Unreal needs, built by the browser.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 */
// The user never sees this. They sign in and their space appears; this is the
// creator-side artefact that lets the same identity be rebuilt as a cinematic.
//
// Every number here comes from `harmonics.ts`. Nothing is recomputed, so the
// browser and the Unreal importer cannot disagree about a colour or a frequency.
//
// The documents below are emitted as named sections of ONE file rather than six
// loose ones: it needs no archive library, it cannot arrive half-copied, and the
// importer has a single thing to open. Each section is still addressable by name.

import {
  ANCHOR, LATTICE, alphabetNodes, spectrumFor, placementFor, identityId,
  type HarmonicNode, type Placement,
} from './harmonics';

export const PACKAGE_VERSION = '2.0';

/** The cinematic language, declared once and applied to every identity. */
export const STAGES = [
  { frame: 0,   camera: 'CAM_Environment', focal_mm: 24, focus: 'anchor',   label: 'Wide environmental lens' },
  { frame: 120, camera: 'CAM_Anchor',      focal_mm: 35, focus: 'anchor',   label: 'Atmospheric approach' },
  { frame: 240, camera: 'CAM_Lattice',     focal_mm: 50, focus: 'lattice',  label: 'Harmonic lattice' },
  { frame: 360, camera: 'CAM_User',        focal_mm: 85, focus: 'identity', label: 'Identity close-up' },
] as const;

export const FPS = 30;
export const TOTAL_FRAMES = STAGES[STAGES.length - 1].frame;

export interface ScenePackage {
  version: string;
  generated_at: string;
  generator: string;
  anchor: typeof ANCHOR & { lattice: typeof LATTICE };
  identity: { signature: string; canonical: string; user_id: string; display_name?: string };
  harmonic_nodes: HarmonicNode[];
  harmonic_palette: { letter: string; hex: string; oklch: [number, number, number]; frequency_hz: number }[];
  placement: Placement;
  scene: {
    fps: number;
    total_frames: number;
    duration_seconds: number;
    lens: { keys: { frame: number; focal_mm: number; focus: string }[] };
    camera_cuts: { frame: number; camera: string }[];
    cameras: { name: string; location_cm: { x: number; y: number; z: number }; rotation: { pitch: number; yaw: number; roll: number } }[];
    animation: { stages: { frame: number; label: string }[] };
    atmosphere: { start_altitude_cm: number; end_altitude_cm: number };
  };
}

/**
 * Build the full package for one identity. Deterministic: the same signature
 * always yields the same document, apart from `generated_at`.
 */
export function buildScenePackage(signature: string, displayName?: string): ScenePackage {
  const nodes = spectrumFor(signature);
  const place = placementFor(signature);
  const macroZ = 200_000_000;   // ~2000 km up — the planet framing
  const mesoZ = 1_200_000;      // ~12 km, atmospheric approach
  const { east, north, up } = place.local_enu_cm;

  // Cameras are derived from the placement, so the flight always ends on the
  // person's own node rather than a generic point.
  const cameras: ScenePackage['scene']['cameras'] = [
    { name: 'CAM_Environment', location_cm: { x: 0, y: 0, z: macroZ }, rotation: { pitch: -90, yaw: place.heading_deg, roll: 0 } },
    { name: 'CAM_Anchor', location_cm: { x: 0, y: 0, z: mesoZ }, rotation: { pitch: -75, yaw: place.heading_deg, roll: 0 } },
    { name: 'CAM_Lattice', location_cm: { x: Math.round(east * 0.4), y: Math.round(north * 0.4), z: Math.round(mesoZ * 0.15) }, rotation: { pitch: -55, yaw: place.heading_deg, roll: 0 } },
    { name: 'CAM_User', location_cm: { x: east, y: north, z: up }, rotation: { pitch: -8, yaw: place.heading_deg, roll: 0 } },
  ];

  return {
    version: PACKAGE_VERSION,
    generated_at: new Date().toISOString(),
    generator: 'Kula Mele harmonic engine (src/lib/harmonics.ts)',
    anchor: { ...ANCHOR, lattice: LATTICE },
    identity: {
      signature,
      canonical: nodes.map(n => n.letter).join(''),
      user_id: identityId(signature),
      ...(displayName ? { display_name: displayName } : {}),
    },
    harmonic_nodes: nodes,
    harmonic_palette: alphabetNodes().map(n => ({
      letter: n.letter, hex: n.color.hex,
      oklch: [n.color.l, n.color.c, n.color.h],
      frequency_hz: n.frequency_hz,
    })),
    placement: place,
    scene: {
      fps: FPS,
      total_frames: TOTAL_FRAMES,
      duration_seconds: TOTAL_FRAMES / FPS,
      lens: { keys: STAGES.map(s => ({ frame: s.frame, focal_mm: s.focal_mm, focus: s.focus })) },
      camera_cuts: STAGES.map(s => ({ frame: s.frame, camera: s.camera })),
      cameras,
      animation: { stages: STAGES.map(s => ({ frame: s.frame, label: s.label })) },
      atmosphere: { start_altitude_cm: macroZ, end_altitude_cm: up },
    },
  };
}

/** The user-facing view: what their spectrum is, with no operator detail. */
export interface SpectrumCard {
  signature: string;
  canonical: string;
  notes: { letter: string; hex: string; hz: string }[];
  place: { ring: number; lat: number; lon: number; alt_m: number };
}
export function buildSpectrumCard(signature: string): SpectrumCard {
  const nodes = spectrumFor(signature);
  const p = placementFor(signature);
  return {
    signature,
    canonical: nodes.map(n => n.letter).join(''),
    // Rounded HERE, at the edge, for display only — the stored value stays exact.
    notes: nodes.map(n => ({ letter: n.letter, hex: n.color.hex, hz: n.frequency_hz.toFixed(2) })),
    place: { ring: p.lattice.ring, lat: p.geodetic.lat, lon: p.geodetic.lon, alt_m: p.geodetic.alt_m },
  };
}
