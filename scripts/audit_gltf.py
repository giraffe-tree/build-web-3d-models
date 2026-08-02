#!/usr/bin/env python3
"""Audit glTF 2.0 JSON or GLB assets with deterministic Web delivery budgets."""

from __future__ import annotations

import argparse
import json
import struct
import sys
import tempfile
from pathlib import Path
from typing import Any


JSON_CHUNK = 0x4E4F534A
TRIANGLES = 4
TRIANGLE_STRIP = 5
TRIANGLE_FAN = 6


class AuditError(RuntimeError):
    pass


def load_document(path: Path) -> dict[str, Any]:
    if path.suffix.lower() == ".gltf":
        return json.loads(path.read_text(encoding="utf-8"))
    if path.suffix.lower() != ".glb":
        raise AuditError("expected a .gltf or .glb file")

    raw = path.read_bytes()
    if len(raw) < 20:
        raise AuditError("GLB is too short")
    magic, version, declared_length = struct.unpack_from("<III", raw, 0)
    if magic != 0x46546C67:
        raise AuditError("invalid GLB magic")
    if version != 2:
        raise AuditError(f"unsupported GLB version {version}; expected 2")
    if declared_length != len(raw):
        raise AuditError(
            f"GLB declared length {declared_length} differs from file size {len(raw)}"
        )

    offset = 12
    while offset + 8 <= len(raw):
        chunk_length, chunk_type = struct.unpack_from("<II", raw, offset)
        offset += 8
        end = offset + chunk_length
        if end > len(raw):
            raise AuditError("GLB chunk exceeds file length")
        if chunk_type == JSON_CHUNK:
            payload = raw[offset:end].rstrip(b" \t\r\n\0")
            return json.loads(payload.decode("utf-8"))
        offset = end
    raise AuditError("GLB contains no JSON chunk")


def accessor_count(document: dict[str, Any], index: Any) -> int:
    accessors = document.get("accessors", [])
    if not isinstance(index, int) or index < 0 or index >= len(accessors):
        return 0
    count = accessors[index].get("count", 0)
    return count if isinstance(count, int) and count >= 0 else 0


def primitive_triangles(mode: int, element_count: int) -> int:
    if mode == TRIANGLES:
        return element_count // 3
    if mode in (TRIANGLE_STRIP, TRIANGLE_FAN):
        return max(0, element_count - 2)
    return 0


def summarize(document: dict[str, Any], file_size: int) -> dict[str, Any]:
    warnings: list[str] = []
    asset = document.get("asset", {})
    if str(asset.get("version", "")) != "2.0":
        warnings.append("asset.version is not glTF 2.0")

    accessors = document.get("accessors", [])
    materials = document.get("materials", [])
    meshes = document.get("meshes", [])
    mesh_stats: list[dict[str, int]] = []
    unique_vertices = 0
    unique_triangles = 0
    unique_primitives = 0

    for mesh_index, mesh in enumerate(meshes):
        mesh_vertices = 0
        mesh_triangles = 0
        primitives = mesh.get("primitives", [])
        for primitive_index, primitive in enumerate(primitives):
            unique_primitives += 1
            attributes = primitive.get("attributes", {})
            position_index = attributes.get("POSITION")
            vertex_count = accessor_count(document, position_index)
            mesh_vertices += vertex_count
            if vertex_count == 0:
                warnings.append(
                    f"mesh {mesh_index} primitive {primitive_index} has no valid POSITION accessor"
                )
            elif isinstance(position_index, int) and position_index < len(accessors):
                position = accessors[position_index]
                if "min" not in position or "max" not in position:
                    warnings.append(
                        f"mesh {mesh_index} primitive {primitive_index} POSITION has no min/max bounds"
                    )

            indexed = "indices" in primitive
            element_count = (
                accessor_count(document, primitive.get("indices"))
                if indexed
                else vertex_count
            )
            mode = primitive.get("mode", TRIANGLES)
            if not isinstance(mode, int):
                mode = TRIANGLES
            mesh_triangles += primitive_triangles(mode, element_count)
            if mode in (TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN) and not indexed:
                warnings.append(
                    f"mesh {mesh_index} primitive {primitive_index} is non-indexed"
                )

            material_index = primitive.get("material")
            if isinstance(material_index, int) and 0 <= material_index < len(materials):
                material = materials[material_index]
                if material.get("alphaMode") == "BLEND":
                    warnings.append(
                        f"mesh {mesh_index} primitive {primitive_index} uses alpha BLEND"
                    )

        mesh_stats.append(
            {
                "vertices": mesh_vertices,
                "triangles": mesh_triangles,
                "primitives": len(primitives),
            }
        )
        unique_vertices += mesh_vertices
        unique_triangles += mesh_triangles

    nodes = document.get("nodes", [])
    scenes = document.get("scenes", [])
    active_nodes: set[int] = set()

    def visit_node(index: Any) -> None:
        if not isinstance(index, int) or index < 0 or index >= len(nodes) or index in active_nodes:
            return
        active_nodes.add(index)
        for child in nodes[index].get("children", []):
            visit_node(child)

    if scenes:
        scene_index = document.get("scene", 0)
        if not isinstance(scene_index, int) or scene_index < 0 or scene_index >= len(scenes):
            warnings.append("default scene index is invalid; auditing scene 0")
            scene_index = 0
        for root in scenes[scene_index].get("nodes", []):
            visit_node(root)
    else:
        active_nodes.update(range(len(nodes)))
        if nodes:
            warnings.append("asset has nodes but no scene; auditing all nodes")

    mesh_instances = [0 for _ in meshes]
    for node_index in active_nodes:
        node = nodes[node_index]
        mesh_index = node.get("mesh")
        if isinstance(mesh_index, int) and 0 <= mesh_index < len(mesh_instances):
            mesh_instances[mesh_index] += 1

    scene_vertices = 0
    scene_triangles = 0
    scene_draws = 0
    for index, stats in enumerate(mesh_stats):
        instances = mesh_instances[index]
        scene_vertices += stats["vertices"] * instances
        scene_triangles += stats["triangles"] * instances
        scene_draws += stats["primitives"] * instances

    return {
        "file_bytes": file_size,
        "meshes": len(meshes),
        "mesh_instances": sum(mesh_instances),
        "primitives": unique_primitives,
        "unique_vertices": unique_vertices,
        "unique_triangles": unique_triangles,
        "scene_vertices": scene_vertices,
        "scene_triangles": scene_triangles,
        "estimated_draw_calls": scene_draws,
        "materials": len(materials),
        "textures": len(document.get("textures", [])),
        "images": len(document.get("images", [])),
        "animations": len(document.get("animations", [])),
        "skins": len(document.get("skins", [])),
        "extensions_used": document.get("extensionsUsed", []),
        "extensions_required": document.get("extensionsRequired", []),
        "warnings": warnings,
    }


def budget_failures(summary: dict[str, Any], args: argparse.Namespace) -> list[str]:
    checks = [
        ("scene_vertices", args.max_vertices, "scene vertices"),
        ("scene_triangles", args.max_triangles, "scene triangles"),
        ("estimated_draw_calls", args.max_draw_calls, "estimated draw calls"),
        ("textures", args.max_textures, "textures"),
    ]
    failures: list[str] = []
    for key, limit, label in checks:
        if limit is not None and summary[key] > limit:
            failures.append(f"{label} {summary[key]:,} exceeds budget {limit:,}")
    return failures


def run_self_test() -> None:
    document = {
        "asset": {"version": "2.0"},
        "accessors": [
            {
                "componentType": 5126,
                "count": 3,
                "type": "VEC3",
                "min": [0, 0, 0],
                "max": [1, 1, 0],
            },
            {"componentType": 5123, "count": 3, "type": "SCALAR"},
        ],
        "meshes": [
            {
                "primitives": [
                    {"attributes": {"POSITION": 0}, "indices": 1, "mode": TRIANGLES}
                ]
            }
        ],
        "nodes": [{"mesh": 0}, {"mesh": 0}],
        "scenes": [{"nodes": [0, 1]}],
        "scene": 0,
    }
    result = summarize(document, 256)
    assert result["unique_vertices"] == 3
    assert result["unique_triangles"] == 1
    assert result["scene_vertices"] == 6
    assert result["scene_triangles"] == 2
    assert result["estimated_draw_calls"] == 2
    assert result["warnings"] == []
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        gltf_path = tmp_path / "triangle.gltf"
        gltf_path.write_text(json.dumps(document), encoding="utf-8")
        assert load_document(gltf_path)["asset"]["version"] == "2.0"

        json_chunk = json.dumps(document, separators=(",", ":")).encode("utf-8")
        json_chunk += b" " * ((4 - len(json_chunk) % 4) % 4)
        total_length = 12 + 8 + len(json_chunk)
        glb = (
            struct.pack("<III", 0x46546C67, 2, total_length)
            + struct.pack("<II", len(json_chunk), JSON_CHUNK)
            + json_chunk
        )
        glb_path = tmp_path / "triangle.glb"
        glb_path.write_bytes(glb)
        assert load_document(glb_path)["meshes"][0]["primitives"][0]["indices"] == 1
    print("audit_gltf self-test OK")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Audit glTF/GLB topology, runtime instances, features, and Web budgets."
    )
    parser.add_argument("asset", nargs="?", type=Path, help="path to .gltf or .glb")
    parser.add_argument("--max-vertices", type=int)
    parser.add_argument("--max-triangles", type=int)
    parser.add_argument("--max-draw-calls", type=int)
    parser.add_argument("--max-textures", type=int)
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    parser.add_argument("--self-test", action="store_true", help="run built-in unit test")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.self_test:
        run_self_test()
        return 0
    if args.asset is None:
        parser.error("asset is required unless --self-test is used")

    try:
        document = load_document(args.asset)
        result = summarize(document, args.asset.stat().st_size)
    except (OSError, ValueError, json.JSONDecodeError, AuditError) as exc:
        print(f"audit_gltf: {exc}", file=sys.stderr)
        return 2

    failures = budget_failures(result, args)
    result["budget_failures"] = failures
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"Asset: {args.asset}")
        for key in (
            "file_bytes",
            "meshes",
            "mesh_instances",
            "primitives",
            "unique_vertices",
            "unique_triangles",
            "scene_vertices",
            "scene_triangles",
            "estimated_draw_calls",
            "materials",
            "textures",
            "images",
            "animations",
            "skins",
        ):
            value = result[key]
            print(f"{key:>22}: {value:,}" if isinstance(value, int) else f"{key:>22}: {value}")
        if result["extensions_used"]:
            print(f"{'extensions_used':>22}: {', '.join(result['extensions_used'])}")
        for warning in result["warnings"]:
            print(f"WARNING: {warning}")
        for failure in failures:
            print(f"BUDGET: {failure}")
    return 3 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
