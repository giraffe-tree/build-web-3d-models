#!/usr/bin/env python3
"""Fetch or register real-scan PBR texture sets and write a provenance lineage JSON.

Generic counterpart of demos/web-3d-collection/scripts/fetch_japanese_house_pbr.py:
instead of a hardcoded Poly Haven asset list, the materials come from a spec
JSON file. Each material records provenance (source, license, physical scale,
per-channel semantics, SHA-256) so the output can back a material contract's
lineage without re-deriving where a texture came from.

No credentials are required or supported; fetch only from sources that allow
anonymous download. Network failures abort with a clear error.

Spec format (paths resolve against the spec file's directory):
  {
    "outputDir": "public/textures/pbr",
    "lineagePath": "assets/pbr-lineage.json",
    "license": "CC0",
    "licenseUrl": "https://polyhaven.com/license",
    "materials": [
      {
        "materialId": "fine_grained_wood",
        "binding": ["MAT_TABLETOP"],
        "role": "fine timber response proxy",
        "physicalScale": "2k tile covers roughly 1.0 m of sawn boards",
        "sourceUrl": "https://polyhaven.com/a/fine_grained_wood",
        "license": "CC0",                     // optional per-material override
        "channels": {
          "diff":  {"semantic": "baseColor", "colorSpace": "sRGB",
                    "url": "https://example.org/wood_diff_1k.jpg"},
          "nor_gl": {"semantic": "normal-gl", "colorSpace": "linear",
                    "path": "./local/wood_nor_gl_1k.jpg"}
        }
      }
    ]
  }

Each channel needs exactly one source: "url" (downloaded) or "path" (a local
file registered in place, i.e. copied into outputDir). "semantic" and
"colorSpace" are recorded verbatim so downstream material contracts can check
channel conventions (normal-gl vs normal-dx, sRGB vs linear).

Usage:
  python3 scripts/fetch_pbr.py --spec pbr-spec.json
  python3 scripts/fetch_pbr.py --print-example-spec
  python3 scripts/fetch_pbr.py --self-test
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import struct
import sys
import tempfile
import zlib
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

USER_AGENT = "build-web-3d-models-fetch-pbr/1.0"
CHANNEL_SEMANTICS = {
    "baseColor", "normal-gl", "normal-dx", "roughness", "metalness",
    "ao", "height", "displacement", "opacity", "emissive", "hdri",
}
COLOR_SPACES = {"sRGB", "linear", "linear-HDR"}


class SpecError(RuntimeError):
    pass


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def png_dimensions(path: Path) -> tuple[int, int] | None:
    data = path.read_bytes()[:24]
    if len(data) == 24 and data.startswith(b"\x89PNG\r\n\x1a\n"):
        return struct.unpack(">II", data[16:24])
    return None


def download(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(request, timeout=90) as response:
            destination.write_bytes(response.read())
    except HTTPError as exc:
        raise SpecError(f"download failed for {url}: HTTP {exc.code} {exc.reason}") from exc
    except URLError as exc:
        raise SpecError(f"download failed for {url}: {exc.reason}") from exc
    except TimeoutError as exc:
        raise SpecError(f"download timed out for {url}") from exc


def _require(mapping: dict, field: str, context: str) -> object:
    value = mapping.get(field)
    if not isinstance(value, str) or not value.strip():
        raise SpecError(f"{context}.{field} is required")
    return value


def process_material(material: dict, spec_dir: Path, root: Path, output_dir: Path) -> dict:
    material_id = _require(material, "materialId", "materials[]")
    record = {
        "materialId": material_id,
        "binding": material.get("binding", []),
        "role": material.get("role", ""),
        "physicalScale": material.get("physicalScale", ""),
        "sourceUrl": material.get("sourceUrl", ""),
        "files": [],
    }
    for field in ("binding",):
        if not isinstance(record[field], list):
            raise SpecError(f"materials[{material_id}].{field} must be a list")
    channels = material.get("channels")
    if not isinstance(channels, dict) or not channels:
        raise SpecError(f"materials[{material_id}].channels must be a non-empty object")
    for channel_name, channel in channels.items():
        context = f"materials[{material_id}].channels.{channel_name}"
        if not isinstance(channel, dict):
            raise SpecError(f"{context} must be an object")
        semantic = _require(channel, "semantic", context)
        color_space = _require(channel, "colorSpace", context)
        if semantic not in CHANNEL_SEMANTICS:
            raise SpecError(f"{context}.semantic must be one of {sorted(CHANNEL_SEMANTICS)}")
        if color_space not in COLOR_SPACES:
            raise SpecError(f"{context}.colorSpace must be one of {sorted(COLOR_SPACES)}")
        url, local_path = channel.get("url"), channel.get("path")
        if bool(url) == bool(local_path):
            raise SpecError(f"{context} needs exactly one of url or path")
        suffix = Path(str(url or local_path)).suffix.lower() or ".bin"
        destination = output_dir / str(material_id) / f"{material_id}_{channel_name}{suffix}"
        if url:
            print(f"FETCH {material_id}:{channel_name} -> {destination.relative_to(root)}")
            download(str(url), destination)
            source = {"sourceUrl": str(url)}
        else:
            origin = (spec_dir / str(local_path)).resolve()
            if not origin.is_file():
                raise SpecError(f"{context}.path does not exist: {origin}")
            destination.parent.mkdir(parents=True, exist_ok=True)
            print(f"REGISTER {material_id}:{channel_name} -> {destination.relative_to(root)}")
            shutil.copyfile(origin, destination)
            source = {"sourcePath": str(local_path)}
        dimensions = png_dimensions(destination)
        record["files"].append({
            "channel": channel_name,
            "semantic": semantic,
            "colorSpace": color_space,
            "path": str(destination.relative_to(root)),
            "bytes": destination.stat().st_size,
            "sha256": sha256(destination),
            "width": dimensions[0] if dimensions else None,
            "height": dimensions[1] if dimensions else None,
            **source,
        })
    return record


def run_spec(spec_path: Path) -> dict:
    spec_path = spec_path.resolve()
    try:
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SpecError(f"cannot read spec: {exc}") from exc
    if not isinstance(spec, dict):
        raise SpecError("spec root must be a JSON object")
    root = spec_path.parent
    output_dir = (root / str(_require(spec, "outputDir", "spec"))).resolve()
    lineage_path = (root / str(_require(spec, "lineagePath", "spec"))).resolve()
    materials = spec.get("materials")
    if not isinstance(materials, list) or not materials:
        raise SpecError("spec.materials must be a non-empty list")

    lineage = {
        "pbrLineageVersion": 1,
        "generatedBy": "fetch_pbr.py",
        "license": spec.get("license", ""),
        "licenseUrl": spec.get("licenseUrl", ""),
        "retrievalUserAgent": USER_AGENT,
        "materials": [],
    }
    for index, material in enumerate(materials):
        if not isinstance(material, dict):
            raise SpecError(f"spec.materials[{index}] must be an object")
        record = process_material(material, spec_path.parent, root, output_dir)
        if material.get("license"):
            record["license"] = material["license"]
        if material.get("licenseUrl"):
            record["licenseUrl"] = material["licenseUrl"]
        lineage["materials"].append(record)
    lineage_path.parent.mkdir(parents=True, exist_ok=True)
    lineage_path.write_text(json.dumps(lineage, indent=2) + "\n", encoding="utf-8")
    print(f"WROTE {lineage_path.relative_to(root)}")
    return lineage


def _pattern_png(width: int, height: int, seed: int) -> bytes:
    """Minimal non-semantic PNG for the self-test's local registration path."""

    def chunk(chunk_type: bytes, payload: bytes) -> bytes:
        crc = zlib.crc32(chunk_type)
        crc = zlib.crc32(payload, crc) & 0xFFFFFFFF
        return struct.pack(">I", len(payload)) + chunk_type + payload + struct.pack(">I", crc)

    rows = bytearray()
    for y in range(height):
        rows.append(0)
        for x in range(width):
            rows.extend(((x + seed * 17) % 256, (y + seed * 29) % 256, ((x + y) + seed * 43) % 256))
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(rows), level=9))
        + chunk(b"IEND", b"")
    )


def self_test() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        local_texture = root / "local" / "synthetic_diff_1k.png"
        local_texture.parent.mkdir(parents=True)
        local_texture.write_bytes(_pattern_png(64, 64, 3))
        spec = {
            "outputDir": "public/textures/pbr",
            "lineagePath": "assets/pbr-lineage.json",
            "license": "CC0",
            "licenseUrl": "https://example.org/license",
            "materials": [{
                "materialId": "synthetic_wood",
                "binding": ["MAT_TEST"],
                "role": "self-test registration only",
                "physicalScale": "64 px tile, no real scale",
                "channels": {
                    "diff": {"semantic": "baseColor", "colorSpace": "sRGB", "path": "local/synthetic_diff_1k.png"},
                    "nor_gl": {"semantic": "normal-gl", "colorSpace": "linear", "path": "local/synthetic_diff_1k.png"},
                },
            }],
        }
        spec_path = root / "pbr-spec.json"
        spec_path.write_text(json.dumps(spec), encoding="utf-8")
        lineage = run_spec(spec_path)

        material = lineage["materials"][0]
        destination = root / "public/textures/pbr/synthetic_wood/synthetic_wood_diff.png"
        checks = [
            ("lineage JSON written", (root / "assets/pbr-lineage.json").is_file()),
            ("local texture registered", destination.is_file()),
            ("sha256 matches registered bytes", material["files"][0]["sha256"] == sha256(destination)),
            ("png dimensions recorded", material["files"][0]["width"] == 64),
            ("channel semantics recorded", material["files"][1]["semantic"] == "normal-gl"),
        ]
        for name, ok in checks:
            print(f"{'PASS' if ok else 'FAIL'} {name}")
        failed = [name for name, ok in checks if not ok]
        print("SELF-TEST PASS" if not failed else "SELF-TEST FAIL")
        return 0 if not failed else 1


EXAMPLE_SPEC = {
    "outputDir": "public/textures/pbr",
    "lineagePath": "assets/pbr-lineage.json",
    "license": "CC0",
    "licenseUrl": "https://polyhaven.com/license",
    "materials": [{
        "materialId": "fine_grained_wood",
        "binding": ["MAT_TABLETOP"],
        "role": "fine timber response proxy",
        "physicalScale": "1k tile; measure real coverage against a known dimension before use",
        "sourceUrl": "https://polyhaven.com/a/fine_grained_wood",
        "channels": {
            "diff": {"semantic": "baseColor", "colorSpace": "sRGB", "url": "https://example.org/fine_grained_wood_diff_1k.jpg"},
            "nor_gl": {"semantic": "normal-gl", "colorSpace": "linear", "url": "https://example.org/fine_grained_wood_nor_gl_1k.jpg"},
            "rough": {"semantic": "roughness", "colorSpace": "linear", "url": "https://example.org/fine_grained_wood_rough_1k.jpg"},
        },
    }],
}


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--spec", type=Path, help="PBR spec JSON (see module docstring)")
    parser.add_argument("--print-example-spec", action="store_true", help="print a starter spec JSON")
    parser.add_argument("--self-test", action="store_true", help="register a synthetic local texture and exit")
    args = parser.parse_args()

    if args.self_test:
        return self_test()
    if args.print_example_spec:
        print(json.dumps(EXAMPLE_SPEC, indent=2))
        return 0
    if not args.spec:
        parser.error("--spec is required (or run --self-test / --print-example-spec)")
    try:
        run_spec(args.spec)
    except SpecError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
