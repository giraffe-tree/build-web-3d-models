#!/usr/bin/env python3
"""Validate the integrity and completeness of a Web 3D visual-evidence manifest."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import tempfile
from typing import Any
import zlib


RUBRIC_MAXIMUMS = {
    "silhouetteProportion": 25,
    "constructionAttachment": 20,
    "materialLightResponse": 20,
    "surfaceDetailVariation": 15,
    "motionInteraction": 10,
    "webPresentation": 10,
}
POLISHED_CANONICAL_VIEWS = {"hero", "orbitA", "orbitB", "neutralMaterial", "subjectProof"}
ARCHITECTURE_REQUIRED_VIEWS = {"roofEaveClose", "openingJunctionClose", "baseGroundContact"}
ARCHITECTURE_REQUIRED_GROUPS = {
    "massing-scale",
    "roof-system",
    "envelope-openings",
    "edges-connections",
    "material-response",
    "base-ground-contact",
}
ENVIRONMENT_REQUIRED_GROUPS = {
    "environment-scale",
    "material-response",
    "base-ground-contact",
}
POLISHED_POLICY = {
    "polished-stylized": {
        "total": 75,
        "floors": {
            "silhouetteProportion": 17,
            "constructionAttachment": 13,
            "materialLightResponse": 13,
            "surfaceDetailVariation": 9,
            "webPresentation": 7,
        },
    },
    "reference-faithful": {
        "total": 80,
        "floors": {
            "silhouetteProportion": 19,
            "constructionAttachment": 14,
            "materialLightResponse": 15,
            "surfaceDetailVariation": 10,
            "webPresentation": 7,
        },
    },
    "photoreal-hero": {
        "total": 85,
        "floors": {
            "silhouetteProportion": 21,
            "constructionAttachment": 16,
            "materialLightResponse": 17,
            "surfaceDetailVariation": 12,
            "webPresentation": 8,
        },
    },
}
FIDELITY_LANES = {"blockout", "polished-stylized", "reference-faithful", "photoreal-hero"}
STATUSES = {"complete", "partial", "blockout", "failed-validation"}
POLISHED_LANES = {"polished-stylized", "reference-faithful", "photoreal-hero"}
STATUS_RANK = {"failed-validation": 0, "blockout": 1, "partial": 2, "complete": 3}
SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")
PIPELINE_ROUTES = {"procedural", "blender", "hybrid"}
EVIDENCE_STATUSES = {"verified", "partial", "omitted"}
FINISH_STATUSES = {"passed", "partial", "failed", "not-applicable"}
RUNTIME_ARTIFACT_EXTENSIONS = {
    "model": {".glb", ".gltf"},
    "runtime-bundle": {".html", ".js", ".mjs", ".wasm"},
    "texture-package": {".ktx2", ".basis", ".zip"},
    "diagnostics": {".json", ".txt", ".md"},
}
MAX_IMAGE_PIXELS = 64_000_000
MAX_IMAGE_RAW_BYTES = 256 * 1024 * 1024


def _jpeg_dimensions(data: bytes) -> tuple[int, int] | None:
    if not data.startswith(b"\xff\xd8") or not data.endswith(b"\xff\xd9"):
        return None
    offset = 2
    sof_markers = {
        0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
        0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF,
    }
    dimensions: tuple[int, int] | None = None
    while offset + 4 <= len(data):
        if data[offset] != 0xFF:
            offset += 1
            continue
        while offset < len(data) and data[offset] == 0xFF:
            offset += 1
        if offset >= len(data):
            return None
        marker = data[offset]
        offset += 1
        if marker == 0xD8:
            continue
        if marker == 0xD9:
            return None
        if offset + 2 > len(data):
            return None
        segment_length = struct.unpack(">H", data[offset:offset + 2])[0]
        if segment_length < 2 or offset + segment_length > len(data):
            return None
        if marker in sof_markers and segment_length >= 7:
            height, width = struct.unpack(">HH", data[offset + 3:offset + 7])
            if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
                return None
            dimensions = (width, height)
        if marker == 0xDA:
            scan_start = offset + segment_length
            if dimensions is None or len(data) - 2 - scan_start < 2:
                return None
            return dimensions
        offset += segment_length
    return None


def _png_dimensions(data: bytes) -> tuple[int, int] | None:
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        return None
    offset = 8
    dimensions: tuple[int, int] | None = None
    png_format: tuple[int, int, int] | None = None
    idat_payloads: list[bytes] = []
    saw_plte = False
    saw_iend = False
    chunk_index = 0
    while offset + 12 <= len(data):
        length = struct.unpack(">I", data[offset:offset + 4])[0]
        chunk_type = data[offset + 4:offset + 8]
        chunk_start = offset + 8
        chunk_end = chunk_start + length
        crc_end = chunk_end + 4
        if crc_end > len(data):
            return None
        expected_crc = struct.unpack(">I", data[chunk_end:crc_end])[0]
        actual_crc = zlib.crc32(chunk_type)
        actual_crc = zlib.crc32(data[chunk_start:chunk_end], actual_crc) & 0xFFFFFFFF
        if actual_crc != expected_crc:
            return None
        if chunk_index == 0 and chunk_type != b"IHDR":
            return None
        if chunk_type == b"IHDR":
            if dimensions is not None or length != 13:
                return None
            width, height, bit_depth, color_type, compression, filter_method, interlace = struct.unpack(
                ">IIBBBBB", data[chunk_start:chunk_end]
            )
            if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
                return None
            allowed_depths = {
                0: {1, 2, 4, 8, 16},
                2: {8, 16},
                3: {1, 2, 4, 8},
                4: {8, 16},
                6: {8, 16},
            }
            if (
                color_type not in allowed_depths
                or bit_depth not in allowed_depths[color_type]
                or compression != 0
                or filter_method != 0
                or interlace not in {0, 1}
            ):
                return None
            dimensions = (width, height)
            png_format = (bit_depth, color_type, interlace)
        elif chunk_type == b"PLTE":
            saw_plte = True
        elif chunk_type == b"IDAT":
            if dimensions is None:
                return None
            idat_payloads.append(data[chunk_start:chunk_end])
        elif chunk_type == b"IEND":
            if length != 0:
                return None
            saw_iend = True
            offset = crc_end
            break
        offset = crc_end
        chunk_index += 1
    if not dimensions or not png_format or not idat_payloads or not saw_iend or offset != len(data):
        return None
    bit_depth, color_type, interlace = png_format
    if color_type == 3 and not saw_plte:
        return None
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[color_type]
    width, height = dimensions

    def row_payload_bytes(row_width: int) -> int:
        return (row_width * channels * bit_depth + 7) // 8

    row_groups: list[tuple[int, int]] = []
    if interlace == 0:
        row_groups = [(height, row_payload_bytes(width))]
    else:
        adam7 = (
            (0, 0, 8, 8),
            (4, 0, 8, 8),
            (0, 4, 4, 8),
            (2, 0, 4, 4),
            (0, 2, 2, 4),
            (1, 0, 2, 2),
            (0, 1, 1, 2),
        )
        for start_x, start_y, step_x, step_y in adam7:
            if width <= start_x or height <= start_y:
                continue
            pass_width = (width - start_x + step_x - 1) // step_x
            pass_height = (height - start_y + step_y - 1) // step_y
            row_groups.append((pass_height, row_payload_bytes(pass_width)))
    expected_raw_bytes = sum(row_count * (row_length + 1) for row_count, row_length in row_groups)
    if expected_raw_bytes <= 0 or expected_raw_bytes > MAX_IMAGE_RAW_BYTES:
        return None
    try:
        decompressor = zlib.decompressobj()
        raw = decompressor.decompress(b"".join(idat_payloads), expected_raw_bytes + 1)
        if len(raw) > expected_raw_bytes or decompressor.unconsumed_tail:
            return None
        raw += decompressor.flush()
    except zlib.error:
        return None
    if (
        not decompressor.eof
        or decompressor.unused_data
        or decompressor.unconsumed_tail
        or len(raw) != expected_raw_bytes
    ):
        return None
    raw_offset = 0
    for row_count, row_length in row_groups:
        for _ in range(row_count):
            if raw[raw_offset] > 4:
                return None
            raw_offset += row_length + 1
    return dimensions


def image_info(path: Path) -> tuple[str, int, int]:
    data = path.read_bytes()
    png_size = _png_dimensions(data)
    if png_size:
        return "png", png_size[0], png_size[1]
    jpeg_size = _jpeg_dimensions(data)
    if jpeg_size:
        return "jpeg", jpeg_size[0], jpeg_size[1]
    raise ValueError("unsupported or invalid image; expected PNG or JPEG")


def _nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _is_enum(value: Any, allowed: Any) -> bool:
    return isinstance(value, str) and value in allowed


def _finite_vector(value: Any) -> bool:
    return (
        isinstance(value, list)
        and len(value) == 3
        and all(
            isinstance(item, (int, float))
            and not isinstance(item, bool)
            and math.isfinite(item)
            for item in value
        )
    )


def _normalized_dot(left: list[float], right: list[float]) -> float:
    left_length = sum(value * value for value in left) ** 0.5
    right_length = sum(value * value for value in right) ** 0.5
    if left_length == 0 or right_length == 0:
        return 1.0
    return sum(a * b for a, b in zip(left, right)) / (left_length * right_length)


def _rubric_total(rubric: Any, prefix: str, errors: list[str]) -> int:
    if not isinstance(rubric, dict):
        errors.append(f"{prefix} must be an object")
        rubric = {}
    total = 0
    for field, maximum in RUBRIC_MAXIMUMS.items():
        score = rubric.get(field)
        if not isinstance(score, int) or isinstance(score, bool) or not 0 <= score <= maximum:
            errors.append(f"{prefix}.{field} must be an integer from 0 to {maximum}")
            continue
        total += score
    return total


def _validate_category_floors(
    rubric: Any,
    prefix: str,
    lane: Any,
    errors: list[str],
) -> None:
    if not isinstance(rubric, dict) or not _is_enum(lane, POLISHED_POLICY):
        return
    for field, minimum in POLISHED_POLICY[lane]["floors"].items():
        score = rubric.get(field)
        if isinstance(score, int) and not isinstance(score, bool) and score < minimum:
            errors.append(f"{prefix}.{field} {score} is below the {lane} floor {minimum}")


def _validate_bound_hashes(
    value: Any,
    prefix: str,
    required_views: list[str],
    actual_hashes: dict[str, str],
    errors: list[str],
) -> None:
    if not isinstance(value, dict):
        errors.append(f"{prefix} must be an object")
        return
    for view_name in required_views:
        digest = value.get(view_name)
        if not isinstance(digest, str) or not SHA256_PATTERN.fullmatch(digest):
            errors.append(f"{prefix}.{view_name} must be a lowercase SHA-256 digest")
        elif actual_hashes.get(view_name) != digest:
            errors.append(f"{prefix}.{view_name} does not match the current view bytes")


def _validate_file_binding(
    value: Any,
    prefix: str,
    manifest_path: Path,
    errors: list[str],
    *,
    require_image: bool = False,
    minimum_width: int = 1,
    minimum_height: int = 1,
    minimum_bytes: int = 1,
) -> tuple[Path | None, str | None]:
    if not isinstance(value, dict):
        errors.append(f"{prefix} must be an object")
        return None, None
    path_value = value.get("path")
    if not _nonempty_string(path_value):
        errors.append(f"{prefix}.path is required")
        return None, None
    path = Path(path_value)
    if not path.is_absolute():
        path = manifest_path.parent / path
    path = path.resolve()
    if not path.is_file():
        errors.append(f"{prefix}.path does not exist: {path}")
        return None, None
    if path.stat().st_size < minimum_bytes:
        errors.append(f"{prefix}.path is smaller than {minimum_bytes} bytes")
    if require_image:
        try:
            _, width, height = image_info(path)
        except ValueError as exc:
            errors.append(f"{prefix}.path: {exc}")
            return path, None
        if width < minimum_width:
            errors.append(f"{prefix}.path width {width} is below {minimum_width}")
        if height < minimum_height:
            errors.append(f"{prefix}.path height {height} is below {minimum_height}")
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    declared_digest = value.get("sha256")
    if not isinstance(declared_digest, str) or not SHA256_PATTERN.fullmatch(declared_digest):
        errors.append(f"{prefix}.sha256 must be a lowercase SHA-256 digest")
    elif declared_digest != digest:
        errors.append(f"{prefix}.sha256 does not match the current file bytes")
    return path, digest


def _validate_runtime_artifact_content(
    path: Path,
    kind: str,
    prefix: str,
    errors: list[str],
) -> None:
    data = path.read_bytes()
    suffix = path.suffix.lower()
    if kind == "runtime-bundle":
        if suffix == ".wasm":
            if not data.startswith(b"\x00asm"):
                errors.append(f"{prefix}.path is not a valid WebAssembly binary header")
            return
        try:
            text_content = data.decode("utf-8")
        except UnicodeDecodeError:
            errors.append(f"{prefix}.path must be UTF-8 text for {suffix}")
            return
        stripped = text_content.strip()
        if len(stripped) < 16:
            errors.append(f"{prefix}.path has no substantive runtime content")
            return
        if suffix == ".html":
            if "<" not in stripped or ">" not in stripped:
                errors.append(f"{prefix}.path does not contain HTML markup")
        elif not any(token in stripped for token in ("export", "import", "function", "=>", "=")):
            errors.append(f"{prefix}.path does not contain recognizable JavaScript structure")
    elif kind == "model":
        if suffix == ".glb":
            if not data.startswith(b"glTF"):
                errors.append(f"{prefix}.path is not a GLB binary")
        elif suffix == ".gltf":
            try:
                gltf = json.loads(data.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                errors.append(f"{prefix}.path is not valid glTF JSON")
                return
            if not isinstance(gltf, dict) or not isinstance(gltf.get("asset"), dict):
                errors.append(f"{prefix}.path is missing the glTF asset object")


def _png_chunk(chunk_type: bytes, payload: bytes) -> bytes:
    crc = zlib.crc32(chunk_type)
    crc = zlib.crc32(payload, crc) & 0xFFFFFFFF
    return struct.pack(">I", len(payload)) + chunk_type + payload + struct.pack(">I", crc)


def _pattern_png(width: int, height: int, seed: int) -> bytes:
    """Create non-semantic patterned bytes for schema-integrity self-tests only."""
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    rows = []
    for y in range(height):
        row = bytearray(b"\x00")
        for x in range(width):
            row.extend(
                (
                    (x // 8 + seed * 17) % 256,
                    (y // 8 + seed * 29) % 256,
                    ((x + y) // 16 + seed * 43) % 256,
                )
            )
        rows.append(bytes(row))
    return (
        b"\x89PNG\r\n\x1a\n"
        + _png_chunk(b"IHDR", ihdr)
        + _png_chunk(b"IDAT", zlib.compress(b"".join(rows), level=9))
        + _png_chunk(b"IEND", b"")
    )


def validate_manifest(manifest_path: Path) -> tuple[list[str], list[str], dict[str, Any]]:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"cannot read manifest: {exc}"], warnings, {}
    if not isinstance(manifest, dict):
        return ["manifest root must be a JSON object"], warnings, {}

    schema_version = manifest.get("schemaVersion")
    if not isinstance(schema_version, int) or isinstance(schema_version, bool) or schema_version not in (1, 2, 3):
        errors.append("schemaVersion must be 1, 2, or 3")
    if not _nonempty_string(manifest.get("assetId")):
        errors.append("assetId is required")

    lane = manifest.get("fidelityLane")
    if not _is_enum(lane, FIDELITY_LANES):
        errors.append(f"fidelityLane must be one of {sorted(FIDELITY_LANES)}")
    status = manifest.get("status")
    if not _is_enum(status, STATUSES):
        errors.append(f"status must be one of {sorted(STATUSES)}")
    aaa_target = manifest.get("aaaTarget")
    if schema_version == 3 and not isinstance(aaa_target, bool):
        errors.append("aaaTarget must be an explicit boolean for schema v3")
        aaa_target = False
    elif schema_version != 3 and not isinstance(aaa_target, bool):
        aaa_target = False

    request_path = None
    request_actual_hash = None
    if schema_version == 3:
        request_path, request_actual_hash = _validate_file_binding(
            manifest.get("requestEvidence"),
            "requestEvidence",
            manifest_path,
            errors,
        )
        if request_path is not None and request_path.suffix.lower() not in {".txt", ".md", ".json"}:
            errors.append("requestEvidence.path must be a .txt, .md, or .json file")

    acceptance = manifest.get("acceptance")
    if not isinstance(acceptance, dict):
        errors.append("acceptance must be an object")
        acceptance = {}
    required_views = acceptance.get("requiredViews", [])
    if not isinstance(required_views, list) or not all(_nonempty_string(item) for item in required_views):
        errors.append("acceptance.requiredViews must be a list of names")
        required_views = []
    minimum_width = acceptance.get("minimumWidth", 1)
    minimum_height = acceptance.get("minimumHeight", 1)
    minimum_rounds = acceptance.get("minimumReviewRounds", 0)
    score_minimum = acceptance.get("visualScoreMinimum", 0)
    critic_required = acceptance.get("independentCriticRequired", False)
    for label, value in (
        ("minimumWidth", minimum_width),
        ("minimumHeight", minimum_height),
        ("minimumReviewRounds", minimum_rounds),
        ("visualScoreMinimum", score_minimum),
    ):
        if not isinstance(value, int) or value < 0:
            errors.append(f"acceptance.{label} must be a non-negative integer")
    if schema_version in (2, 3) and not isinstance(critic_required, bool):
        errors.append("acceptance.independentCriticRequired must be a boolean")
        critic_required = False
    if schema_version == 1 and _is_enum(lane, POLISHED_LANES):
        warnings.append("schema v1 does not bind final reviews or critics to exact evidence bytes")

    asset_profile = manifest.get("assetProfile")
    if schema_version == 3 and not _is_enum(
        asset_profile, {"general", "architecture-exterior", "environment"}
    ):
        errors.append(
            "assetProfile must be general, architecture-exterior, or environment for schema v3"
        )
    site_environment = manifest.get("siteEnvironment")
    regional_style = manifest.get("regionalStyle")
    if schema_version == 3:
        if not isinstance(site_environment, bool):
            errors.append("siteEnvironment must be a boolean for schema v3")
            site_environment = False
        if not isinstance(regional_style, bool):
            errors.append("regionalStyle must be a boolean for schema v3")
            regional_style = False
        if asset_profile == "general" and (site_environment or regional_style):
            errors.append(
                "siteEnvironment or regionalStyle requires assetProfile architecture-exterior or environment"
            )

    if status == "complete" and _is_enum(lane, POLISHED_LANES):
        if schema_version != 3:
            errors.append("new polished complete claims require schemaVersion 3")
        policy = POLISHED_POLICY[lane]
        missing_canonical = sorted(POLISHED_CANONICAL_VIEWS.difference(required_views))
        if missing_canonical:
            errors.append(f"polished complete is missing canonical views: {missing_canonical}")
        if not isinstance(minimum_width, int) or minimum_width < 1280:
            errors.append("polished complete requires minimumWidth of at least 1280")
        if not isinstance(minimum_height, int) or minimum_height < 720:
            errors.append("polished complete requires minimumHeight of at least 720")
        if not isinstance(minimum_rounds, int) or minimum_rounds < 2:
            errors.append("polished complete requires at least 2 review rounds")
        if not isinstance(score_minimum, int) or score_minimum < policy["total"]:
            errors.append(
                f"{lane} complete requires visualScoreMinimum of at least {policy['total']}"
            )
        if critic_required is not True:
            errors.append("polished complete requires an independent critic")
        if asset_profile == "architecture-exterior":
            architecture_views = set(ARCHITECTURE_REQUIRED_VIEWS)
            if site_environment:
                architecture_views.add("landscapeNear")
            missing_architecture = sorted(architecture_views.difference(required_views))
            if missing_architecture:
                errors.append(
                    f"architecture complete is missing required views: {missing_architecture}"
                )
        if asset_profile == "environment" and site_environment and "landscapeNear" not in required_views:
            errors.append("site environment complete requires the landscapeNear view")

    identity_features = manifest.get("identityFeatures")
    if not isinstance(identity_features, list):
        errors.append("identityFeatures must be a list")
        identity_features = []
    if _is_enum(lane, POLISHED_LANES) and len(identity_features) < 5:
        errors.append("polished lanes require at least 5 identityFeatures")
    critical_feature_count = 0
    identity_feature_names: set[str] = set()
    for index, feature in enumerate(identity_features):
        prefix = f"identityFeatures[{index}]"
        if not isinstance(feature, dict):
            errors.append(f"{prefix} must be an object")
            continue
        for field in ("name", "representation", "evidenceView", "status"):
            if not _nonempty_string(feature.get(field)):
                errors.append(f"{prefix}.{field} is required")
        feature_name = feature.get("name")
        if _nonempty_string(feature_name):
            normalized_name = feature_name.strip().casefold()
            if normalized_name in identity_feature_names:
                errors.append(f"{prefix}.name duplicates another identity feature")
            identity_feature_names.add(normalized_name)
        if feature.get("evidenceView") not in required_views:
            errors.append(f"{prefix}.evidenceView must name a required view")
        if not _is_enum(feature.get("status"), {"verified", "partial", "omitted"}):
            errors.append(f"{prefix}.status must be verified, partial, or omitted")
        if schema_version == 3:
            if not isinstance(feature.get("critical"), bool):
                errors.append(f"{prefix}.critical must be a boolean for schema v3")
            if feature.get("critical") is True:
                critical_feature_count += 1
        if status == "complete" and feature.get("critical") is True and feature.get("status") != "verified":
            errors.append(f"{prefix} is critical but not verified for complete status")
    if schema_version == 3 and status == "complete" and _is_enum(lane, POLISHED_LANES):
        if critical_feature_count < 5:
            errors.append("polished complete requires at least 5 critical identityFeatures")

    if schema_version == 3:
        pipeline = manifest.get("pipelineDecision")
        if not isinstance(pipeline, dict):
            errors.append("pipelineDecision must be an object for schema v3")
            pipeline = {}
        route = pipeline.get("route")
        if not _is_enum(route, PIPELINE_ROUTES):
            errors.append(f"pipelineDecision.route must be one of {sorted(PIPELINE_ROUTES)}")
        if not _nonempty_string(pipeline.get("rationale")):
            errors.append("pipelineDecision.rationale is required")
        closest_view = pipeline.get("closestViewMeters")
        if (
            not isinstance(closest_view, (int, float))
            or isinstance(closest_view, bool)
            or not math.isfinite(closest_view)
            or closest_view <= 0
        ):
            errors.append("pipelineDecision.closestViewMeters must be a positive finite number")
        quality_risks = pipeline.get("qualityRisks")
        if not isinstance(quality_risks, list) or len(quality_risks) < 2:
            errors.append("pipelineDecision.qualityRisks must contain at least 2 risks")
            quality_risks = []
        for index, risk in enumerate(quality_risks):
            prefix = f"pipelineDecision.qualityRisks[{index}]"
            if not isinstance(risk, dict):
                errors.append(f"{prefix} must be an object")
                continue
            for field in ("name", "mitigation", "proofView"):
                if not _nonempty_string(risk.get(field)):
                    errors.append(f"{prefix}.{field} is required")
            if risk.get("proofView") not in required_views:
                errors.append(f"{prefix}.proofView must name a required view")
        finish_spike = pipeline.get("finishSpike")
        if not isinstance(finish_spike, dict):
            errors.append("pipelineDecision.finishSpike must be an object")
            finish_spike = {}
        spike_required = finish_spike.get("required")
        spike_status = finish_spike.get("status")
        if not isinstance(spike_required, bool):
            errors.append("pipelineDecision.finishSpike.required must be a boolean")
        if not _is_enum(spike_status, {"passed", "failed", "not-required"}):
            errors.append("pipelineDecision.finishSpike.status must be passed, failed, or not-required")
        if not _nonempty_string(finish_spike.get("decision")):
            errors.append("pipelineDecision.finishSpike.decision is required")
        spike_views = finish_spike.get("evidenceViews")
        if not isinstance(spike_views, list) or not all(_nonempty_string(item) for item in spike_views):
            errors.append("pipelineDecision.finishSpike.evidenceViews must be a list of view names")
            spike_views = []
        for view_name in spike_views:
            if view_name not in required_views:
                errors.append(
                    f"pipelineDecision.finishSpike.evidenceViews contains unknown view {view_name}"
                )
        if route == "procedural" and _is_enum(lane, POLISHED_LANES) and spike_required is not True:
            errors.append("procedural polished work requires a finish spike")
        if status == "complete" and spike_required is True:
            if spike_status != "passed" or not spike_views:
                errors.append("complete status requires a passed finish spike with evidence views")
        if spike_required is False and spike_status != "not-required":
            errors.append("a non-required finish spike must use status not-required")

        spike_review = finish_spike.get("independentReview")
        spike_review_status = None
        if spike_review is not None:
            if not isinstance(spike_review, dict):
                errors.append("pipelineDecision.finishSpike.independentReview must be an object")
                spike_review = {}
            spike_review_status = spike_review.get("status")
            if not _is_enum(spike_review_status, {"passed", "partial", "failed"}):
                errors.append(
                    "pipelineDecision.finishSpike.independentReview.status must be passed, partial, or failed"
                )
            if not _nonempty_string(spike_review.get("reviewerRunId")):
                errors.append(
                    "pipelineDecision.finishSpike.independentReview.reviewerRunId is required"
                )
            spike_report_path, _ = _validate_file_binding(
                spike_review.get("report"),
                "pipelineDecision.finishSpike.independentReview.report",
                manifest_path,
                errors,
                minimum_bytes=100,
            )
            if spike_report_path is not None and spike_report_path.suffix.lower() not in {
                ".md",
                ".txt",
                ".json",
            }:
                errors.append(
                    "pipelineDecision.finishSpike.independentReview.report.path must be a .md, .txt, or .json file"
                )

        aaa_architecture = (
            status == "complete"
            and asset_profile == "architecture-exterior"
            and (aaa_target is True or lane == "photoreal-hero")
        )
        if aaa_architecture:
            if spike_required is not True or spike_status != "passed":
                errors.append(
                    "3A/AAA or photoreal architecture complete requires a passed finish spike"
                )
            missing_spike_views = sorted(
                set(ARCHITECTURE_REQUIRED_VIEWS).difference(spike_views)
            )
            if missing_spike_views:
                errors.append(
                    "3A/AAA or photoreal architecture finish spike is missing evidence views: "
                    f"{missing_spike_views}"
                )
            if not isinstance(spike_review, dict) or spike_review_status != "passed":
                errors.append(
                    "3A/AAA or photoreal architecture complete requires a passed independent finish-spike review"
                )

        material_contracts = manifest.get("materialContracts")
        if not isinstance(material_contracts, list):
            errors.append("materialContracts must be a list for schema v3")
            material_contracts = []
        if _is_enum(lane, POLISHED_LANES) and not material_contracts:
            errors.append("polished schema-v3 evidence requires at least one material contract")
        critical_material_count = 0
        for index, contract in enumerate(material_contracts):
            prefix = f"materialContracts[{index}]"
            if not isinstance(contract, dict):
                errors.append(f"{prefix} must be an object")
                continue
            for field in (
                "materialId",
                "realMaterial",
                "layerStack",
                "realScale",
                "runtimeBinding",
            ):
                if not _nonempty_string(contract.get(field)):
                    errors.append(f"{prefix}.{field} is required")
            if not isinstance(contract.get("critical"), bool):
                errors.append(f"{prefix}.critical must be a boolean")
            elif contract.get("critical"):
                critical_material_count += 1
            if not _is_enum(contract.get("status"), EVIDENCE_STATUSES):
                errors.append(f"{prefix}.status must be verified, partial, or omitted")
            proof_views = contract.get("proofViews")
            if not isinstance(proof_views, list) or not proof_views:
                errors.append(f"{prefix}.proofViews must be a non-empty list")
                proof_views = []
            for view_name in proof_views:
                if view_name not in required_views:
                    errors.append(f"{prefix}.proofViews contains unknown view {view_name}")
            scale_bands = contract.get("scaleBands")
            if not isinstance(scale_bands, dict):
                errors.append(f"{prefix}.scaleBands must be an object")
                scale_bands = {}
            for band_name in ("macro", "meso", "micro"):
                band = scale_bands.get(band_name)
                if not isinstance(band, dict):
                    errors.append(f"{prefix}.scaleBands.{band_name} must be an object")
                    continue
                if not _nonempty_string(band.get("physicalScale")):
                    errors.append(f"{prefix}.scaleBands.{band_name}.physicalScale is required")
                if not _nonempty_string(band.get("representationOrOmission")):
                    errors.append(
                        f"{prefix}.scaleBands.{band_name}.representationOrOmission is required"
                    )
            if (
                status == "complete"
                and contract.get("critical") is True
                and contract.get("status") != "verified"
            ):
                errors.append(f"{prefix} is critical but not verified for complete status")
        if status == "complete" and _is_enum(lane, POLISHED_LANES) and critical_material_count < 1:
            errors.append("polished complete requires at least one critical material contract")

        lighting = manifest.get("lightingProfile")
        if not isinstance(lighting, dict):
            errors.append("lightingProfile must be an object for schema v3")
            lighting = {}
        for field in (
            "profileId",
            "rendererBuild",
            "colorManagement",
            "toneMappingExposure",
            "environment",
            "contactStrategy",
        ):
            if not _nonempty_string(lighting.get(field)):
                errors.append(f"lightingProfile.{field} is required")
        lighting_views = lighting.get("proofViews")
        if not isinstance(lighting_views, list) or not lighting_views:
            errors.append("lightingProfile.proofViews must be a non-empty list")
            lighting_views = []
        for view_name in lighting_views:
            if view_name not in required_views:
                errors.append(f"lightingProfile.proofViews contains unknown view {view_name}")

        finish_checks = manifest.get("finishChecks")
        if not isinstance(finish_checks, dict):
            errors.append("finishChecks must be an object for schema v3")
            finish_checks = {}
        for check_name in (
            "edgeTreatment",
            "constructionDepth",
            "materialSeparation",
            "surfaceVariation",
            "contactGrounding",
        ):
            check = finish_checks.get(check_name)
            prefix = f"finishChecks.{check_name}"
            if not isinstance(check, dict):
                errors.append(f"{prefix} must be an object")
                continue
            check_status = check.get("status")
            if not _is_enum(check_status, FINISH_STATUSES):
                errors.append(f"{prefix}.status must be one of {sorted(FINISH_STATUSES)}")
            proof_views = check.get("proofViews")
            if not isinstance(proof_views, list):
                errors.append(f"{prefix}.proofViews must be a list")
                proof_views = []
            for view_name in proof_views:
                if view_name not in required_views:
                    errors.append(f"{prefix}.proofViews contains unknown view {view_name}")
            if check_status == "not-applicable":
                if not _nonempty_string(check.get("reason")):
                    errors.append(f"{prefix}.reason is required when not-applicable")
            elif not proof_views:
                errors.append(f"{prefix}.proofViews must identify visible evidence")
            if status == "complete" and check_name != "contactGrounding" and check_status != "passed":
                errors.append(f"{prefix} must pass for complete status")
            if (
                status == "complete"
                and check_name == "contactGrounding"
                and not _is_enum(check_status, {"passed", "not-applicable"})
            ):
                errors.append(
                    f"{prefix} must pass or be explicitly not-applicable for complete status"
                )
            if (
                status == "complete"
                and _is_enum(asset_profile, {"architecture-exterior", "environment"})
                and check_name == "contactGrounding"
                and check_status != "passed"
            ):
                errors.append(
                    "architecture/environment complete requires a passed contactGrounding check"
                )

        runtime = manifest.get("runtimeEvidence")
        if not isinstance(runtime, dict):
            errors.append("runtimeEvidence must be an object for schema v3")
            runtime = {}
        if not _nonempty_string(runtime.get("buildId")):
            errors.append("runtimeEvidence.buildId is required")
        runtime_artifacts = runtime.get("artifacts")
        if not isinstance(runtime_artifacts, list) or not runtime_artifacts:
            errors.append("runtimeEvidence.artifacts must be a non-empty list")
            runtime_artifacts = []
        runtime_artifact_names: set[str] = set()
        runtime_artifact_kinds: dict[str, str] = {}
        primary_runtime_artifact_count = 0
        for index, artifact in enumerate(runtime_artifacts):
            prefix = f"runtimeEvidence.artifacts[{index}]"
            if not isinstance(artifact, dict):
                errors.append(f"{prefix} must be an object")
                continue
            artifact_name = artifact.get("name")
            if not _nonempty_string(artifact_name):
                errors.append(f"{prefix}.name is required")
            elif artifact_name in runtime_artifact_names:
                errors.append(f"{prefix}.name duplicates another runtime artifact")
            else:
                runtime_artifact_names.add(artifact_name)
            artifact_kind = artifact.get("kind")
            if not _is_enum(artifact_kind, RUNTIME_ARTIFACT_EXTENSIONS):
                errors.append(
                    f"{prefix}.kind must be one of {sorted(RUNTIME_ARTIFACT_EXTENSIONS)}"
                )
            elif artifact_kind in {"model", "runtime-bundle"}:
                primary_runtime_artifact_count += 1
            if _nonempty_string(artifact_name) and _is_enum(
                artifact_kind, RUNTIME_ARTIFACT_EXTENSIONS
            ):
                runtime_artifact_kinds[artifact_name] = artifact_kind
            artifact_path, artifact_digest = _validate_file_binding(
                artifact,
                prefix,
                manifest_path,
                errors,
                minimum_bytes=32,
            )
            if artifact_path is not None and _is_enum(artifact_kind, RUNTIME_ARTIFACT_EXTENSIONS):
                if artifact_path.suffix.lower() not in RUNTIME_ARTIFACT_EXTENSIONS[artifact_kind]:
                    errors.append(
                        f"{prefix}.path extension does not match artifact kind {artifact_kind}"
                    )
                else:
                    _validate_runtime_artifact_content(artifact_path, artifact_kind, prefix, errors)
            if artifact_path is not None and request_path is not None and artifact_path == request_path:
                errors.append(f"{prefix}.path cannot reuse requestEvidence.path")
            if (
                artifact_digest is not None
                and request_actual_hash is not None
                and artifact_digest == request_actual_hash
            ):
                errors.append(f"{prefix}.sha256 cannot reuse requestEvidence bytes")
        if status == "complete" and primary_runtime_artifact_count < 1:
            errors.append("complete status requires a model or runtime-bundle artifact")
        console_errors = runtime.get("consoleErrors")
        if not isinstance(console_errors, int) or isinstance(console_errors, bool) or console_errors < 0:
            errors.append("runtimeEvidence.consoleErrors must be a non-negative integer")
        elif status == "complete" and console_errors != 0:
            errors.append("complete status requires zero runtime console errors")
        if not isinstance(runtime.get("requiredPathPassed"), bool):
            errors.append("runtimeEvidence.requiredPathPassed must be a boolean")
        elif status == "complete" and runtime.get("requiredPathPassed") is not True:
            errors.append("complete status requires the visible runtime path to pass")

        if _is_enum(asset_profile, {"architecture-exterior", "environment"}):
            groups = manifest.get("mandatoryFeatureGroups")
            if not isinstance(groups, list):
                errors.append("mandatoryFeatureGroups must be a list for architecture/environment")
                groups = []
            resolved_groups: dict[str, dict[str, Any]] = {}
            for index, group in enumerate(groups):
                prefix = f"mandatoryFeatureGroups[{index}]"
                if not isinstance(group, dict):
                    errors.append(f"{prefix} must be an object")
                    continue
                name = group.get("name")
                if not _nonempty_string(name):
                    errors.append(f"{prefix}.name is required")
                    continue
                if name in resolved_groups:
                    errors.append(f"{prefix}.name duplicates {name}")
                resolved_groups[name] = group
                if not _is_enum(group.get("status"), EVIDENCE_STATUSES):
                    errors.append(f"{prefix}.status must be verified, partial, or omitted")
                if group.get("evidenceView") not in required_views:
                    errors.append(f"{prefix}.evidenceView must name a required view")
                if status == "complete" and group.get("status") != "verified":
                    errors.append(f"{prefix} must be verified for complete status")
            required_groups = (
                set(ARCHITECTURE_REQUIRED_GROUPS)
                if asset_profile == "architecture-exterior"
                else set(ENVIRONMENT_REQUIRED_GROUPS)
            )
            if site_environment:
                required_groups.add("site-vegetation")
            if regional_style:
                required_groups.add("regional-cues")
            missing_groups = sorted(required_groups.difference(resolved_groups))
            if missing_groups:
                errors.append(
                    f"architecture/environment is missing mandatory feature groups: {missing_groups}"
                )

        image_lineage = manifest.get("imageLineage", [])
        if not isinstance(image_lineage, list):
            errors.append("imageLineage must be a list when present")
            image_lineage = []
        for index, image_entry in enumerate(image_lineage):
            prefix = f"imageLineage[{index}]"
            if not isinstance(image_entry, dict):
                errors.append(f"{prefix} must be an object")
                continue
            if not _nonempty_string(image_entry.get("sourceId")):
                errors.append(f"{prefix}.sourceId is required")
            _, source_digest = _validate_file_binding(
                image_entry, prefix, manifest_path, errors, require_image=True
            )
            role = image_entry.get("role")
            if not _is_enum(
                role,
                {"generated-concept", "generated-texture-source", "decal-mask", "background-plate"},
            ):
                errors.append(f"{prefix}.role is invalid")
            image_status = image_entry.get("status")
            if not _is_enum(image_status, {"concept-only", "retained-runtime", "rejected", "removed"}):
                errors.append(f"{prefix}.status is invalid")
            binding_cues = image_entry.get("bindingCues", [])
            if not isinstance(binding_cues, list):
                errors.append(f"{prefix}.bindingCues must be a list")
                binding_cues = []
            for cue_index, cue in enumerate(binding_cues):
                cue_prefix = f"{prefix}.bindingCues[{cue_index}]"
                if not isinstance(cue, dict):
                    errors.append(f"{cue_prefix} must be an object")
                    continue
                for field in ("cueId", "target"):
                    if not _nonempty_string(cue.get(field)):
                        errors.append(f"{cue_prefix}.{field} is required")
                disposition = cue.get("disposition")
                if not _is_enum(disposition, {"binding", "inspirational", "rejected"}):
                    errors.append(f"{cue_prefix}.disposition is invalid")
                if disposition == "binding":
                    if cue.get("proofView") not in required_views:
                        errors.append(f"{cue_prefix}.proofView must name a required view")
                    if status == "complete" and cue.get("status") != "verified":
                        errors.append(f"{cue_prefix} binding cue must be verified for complete status")
            if image_status == "retained-runtime":
                if not _is_enum(role, {"generated-texture-source", "decal-mask", "background-plate"}):
                    errors.append(
                        f"{prefix}.role cannot be retained-runtime; generated concepts are concept-only"
                    )
                _, derivative_digest = _validate_file_binding(
                    image_entry.get("derivative"),
                    f"{prefix}.derivative",
                    manifest_path,
                    errors,
                    require_image=True,
                )
                if (
                    source_digest is not None
                    and derivative_digest is not None
                    and source_digest == derivative_digest
                ):
                    errors.append(f"{prefix}.derivative must differ from the generated source")
                operations = image_entry.get("operations")
                if (
                    not isinstance(operations, list)
                    or not operations
                    or not all(_nonempty_string(item) for item in operations)
                ):
                    errors.append(f"{prefix}.operations must be a non-empty list")
                elif all(item.strip().casefold() in {"none", "no-op", "noop"} for item in operations):
                    errors.append(f"{prefix}.operations must record real derivative processing")
                for field in (
                    "physicalCoverage",
                    "projection",
                    "channelSemantics",
                ):
                    if not _nonempty_string(image_entry.get(field)):
                        errors.append(f"{prefix}.{field} is required for retained-runtime")
                runtime_binding = image_entry.get("runtimeBinding")
                if not isinstance(runtime_binding, dict):
                    errors.append(f"{prefix}.runtimeBinding must be an object for retained-runtime")
                else:
                    artifact_name = runtime_binding.get("artifactName")
                    if not _nonempty_string(artifact_name) or artifact_name not in runtime_artifact_names:
                        errors.append(
                            f"{prefix}.runtimeBinding.artifactName must name a runtime artifact"
                        )
                    elif runtime_artifact_kinds.get(artifact_name) == "diagnostics":
                        errors.append(
                            f"{prefix}.runtimeBinding.artifactName cannot target diagnostics"
                        )
                    if not _nonempty_string(runtime_binding.get("target")):
                        errors.append(f"{prefix}.runtimeBinding.target is required")
            elif role == "generated-concept" and not _is_enum(
                image_status, {"concept-only", "rejected", "removed"}
            ):
                errors.append(f"{prefix}.generated-concept must be concept-only, rejected, or removed")

    views = manifest.get("views")
    if not isinstance(views, dict):
        errors.append("views must be an object")
        views = {}
    image_hashes: dict[str, str] = {}
    actual_view_hashes: dict[str, str] = {}
    resolved_views: dict[str, dict[str, Any]] = {}
    primary_directions: list[list[float]] = []
    for view_name in required_views:
        view = views.get(view_name)
        if not isinstance(view, dict) or not _nonempty_string(view.get("path")):
            errors.append(f"views.{view_name}.path is required")
            continue
        if schema_version in (2, 3):
            if not _nonempty_string(view.get("semanticState")):
                errors.append(f"views.{view_name}.semanticState is required for schema v2+")
            fixed_time = view.get("fixedTimeSeconds")
            if (
                not isinstance(fixed_time, (int, float))
                or isinstance(fixed_time, bool)
                or not math.isfinite(fixed_time)
            ):
                errors.append(f"views.{view_name}.fixedTimeSeconds must be finite for schema v2+")
            direction = view.get("cameraDirection")
            if not _finite_vector(direction):
                errors.append(f"views.{view_name}.cameraDirection must contain 3 finite numbers")
            elif view_name in {"hero", "orbitA", "orbitB"}:
                primary_directions.append(direction)
            ui_mode = view.get("uiMode")
            if not _is_enum(ui_mode, {"page", "review"}):
                errors.append(f"views.{view_name}.uiMode must be page or review")
            elif view_name != "hero" and ui_mode != "review":
                errors.append(f"views.{view_name}.uiMode must be review for asset evidence")
        image_path = Path(view["path"])
        if not image_path.is_absolute():
            image_path = manifest_path.parent / image_path
        image_path = image_path.resolve()
        if not image_path.is_file():
            errors.append(f"views.{view_name} image does not exist: {image_path}")
            continue
        try:
            image_format, width, height = image_info(image_path)
        except ValueError as exc:
            errors.append(f"views.{view_name}: {exc}")
            continue
        suffix = image_path.suffix.lower()
        expected_suffixes = {".png"} if image_format == "png" else {".jpg", ".jpeg"}
        if suffix not in expected_suffixes:
            errors.append(
                f"views.{view_name} extension {suffix or '<none>'} does not match {image_format} bytes"
            )
        if isinstance(minimum_width, int) and width < minimum_width:
            errors.append(f"views.{view_name} width {width} is below {minimum_width}")
        if isinstance(minimum_height, int) and height < minimum_height:
            errors.append(f"views.{view_name} height {height} is below {minimum_height}")
        digest = hashlib.sha256(image_path.read_bytes()).hexdigest()
        actual_view_hashes[view_name] = digest
        if schema_version in (2, 3):
            declared_digest = view.get("sha256")
            if not isinstance(declared_digest, str) or not SHA256_PATTERN.fullmatch(declared_digest):
                errors.append(f"views.{view_name}.sha256 must be a lowercase SHA-256 digest")
            elif declared_digest != digest:
                errors.append(f"views.{view_name}.sha256 does not match the current image bytes")
        if digest in image_hashes:
            errors.append(f"views.{view_name} duplicates pixels from views.{image_hashes[digest]}")
        else:
            image_hashes[digest] = view_name
        resolved_views[view_name] = {
            "path": str(image_path),
            "format": image_format,
            "width": width,
            "height": height,
            "sha256": digest,
        }

    if schema_version in (2, 3) and len(primary_directions) == 3:
        for left in range(len(primary_directions)):
            for right in range(left + 1, len(primary_directions)):
                if _normalized_dot(primary_directions[left], primary_directions[right]) > 0.94:
                    errors.append("hero, orbitA, and orbitB camera directions must be visibly distinct")

    review_rounds = manifest.get("reviewRounds")
    if not isinstance(review_rounds, list):
        errors.append("reviewRounds must be a list")
        review_rounds = []
    if status == "complete" and isinstance(minimum_rounds, int) and len(review_rounds) < minimum_rounds:
        errors.append(f"complete status requires at least {minimum_rounds} reviewRounds")
    previous_round_output: dict[str, str] | None = None
    for index, review in enumerate(review_rounds):
        prefix = f"reviewRounds[{index}]"
        if not isinstance(review, dict):
            errors.append(f"{prefix} must be an object")
            continue
        defects = review.get("largestDefects")
        if not isinstance(defects, list) or not defects or not all(_nonempty_string(item) for item in defects):
            errors.append(f"{prefix}.largestDefects must be a non-empty list")
        for field in ("change", "result"):
            if not _nonempty_string(review.get(field)):
                errors.append(f"{prefix}.{field} is required")
        if schema_version == 3:
            structured_defects = review.get("defects")
            if not isinstance(structured_defects, list) or not structured_defects:
                errors.append(f"{prefix}.defects must be a non-empty list for schema v3")
                structured_defects = []
            defect_views: dict[str, str] = {}
            for defect_index, defect in enumerate(structured_defects):
                defect_prefix = f"{prefix}.defects[{defect_index}]"
                if not isinstance(defect, dict):
                    errors.append(f"{defect_prefix} must be an object")
                    continue
                defect_id = defect.get("id")
                if not _nonempty_string(defect_id):
                    errors.append(f"{defect_prefix}.id is required")
                else:
                    defect_views[defect_id] = defect.get("view")
                if defect.get("view") not in required_views:
                    errors.append(f"{defect_prefix}.view must name a required view")
                if not _is_enum(defect.get("severity"), {"low", "medium", "high", "critical"}):
                    errors.append(f"{defect_prefix}.severity is invalid")
            selected_defect_id = review.get("selectedDefectId")
            if not _nonempty_string(selected_defect_id) or selected_defect_id not in defect_views:
                errors.append(f"{prefix}.selectedDefectId must name a structured defect")
            if not _is_enum(review.get("reviewerType"), {"builder", "independent"}):
                errors.append(f"{prefix}.reviewerType must be builder or independent")
            round_maps: dict[str, dict[str, str]] = {}
            for map_name in ("inputViews", "outputViews"):
                bindings = review.get(map_name)
                if not isinstance(bindings, dict) or not bindings:
                    errors.append(f"{prefix}.{map_name} must be a non-empty object")
                    bindings = {}
                digest_map: dict[str, str] = {}
                for view_name, binding in bindings.items():
                    if view_name not in required_views:
                        errors.append(f"{prefix}.{map_name} contains unknown view {view_name}")
                    _, digest = _validate_file_binding(
                        binding,
                        f"{prefix}.{map_name}.{view_name}",
                        manifest_path,
                        errors,
                        require_image=True,
                        minimum_width=minimum_width if isinstance(minimum_width, int) else 1,
                        minimum_height=minimum_height if isinstance(minimum_height, int) else 1,
                    )
                    if digest is not None:
                        digest_map[view_name] = digest
                round_maps[map_name] = digest_map
            selected_view = defect_views.get(selected_defect_id)
            if selected_view is not None:
                for map_name in ("inputViews", "outputViews"):
                    if selected_view not in round_maps[map_name]:
                        errors.append(
                            f"{prefix}.{map_name} must bind the selected defect view {selected_view}"
                        )
            if round_maps["inputViews"] == round_maps["outputViews"]:
                errors.append(f"{prefix} must record a changed output hash")
            if previous_round_output is not None and round_maps["inputViews"] != previous_round_output:
                errors.append(f"{prefix}.inputViews must match the previous round output")
            previous_round_output = round_maps["outputViews"]

    if schema_version == 3 and status == "complete" and review_rounds:
        if not previous_round_output:
            errors.append("the final review round must bind output view hashes")
        else:
            missing_final_round_views = sorted(set(required_views).difference(previous_round_output))
            if missing_final_round_views:
                errors.append(
                    f"the final review round is missing required views: {missing_final_round_views}"
                )
            for view_name in required_views:
                digest = previous_round_output.get(view_name)
                if actual_view_hashes.get(view_name) != digest:
                    errors.append(
                        f"the final review output for {view_name} does not match the current final view"
                    )

    if schema_version in (2, 3):
        final_review = manifest.get("finalReview")
        if not isinstance(final_review, dict):
            errors.append("finalReview must be an object for schema v2+")
        else:
            _validate_bound_hashes(
                final_review.get("reviewedViewHashes"),
                "finalReview.reviewedViewHashes",
                required_views,
                actual_view_hashes,
                errors,
            )

    total_score = _rubric_total(manifest.get("rubric"), "rubric", errors)
    if status == "complete" and isinstance(score_minimum, int) and total_score < score_minimum:
        errors.append(f"rubric total {total_score} is below declared minimum {score_minimum}")
    if schema_version == 3 and status == "complete" and _is_enum(lane, POLISHED_LANES):
        _validate_category_floors(manifest.get("rubric"), "rubric", lane, errors)

    critic_status = None
    critic_total = None
    critic = manifest.get("independentCritic")
    if schema_version in (2, 3) and (critic_required or critic is not None):
        if not isinstance(critic, dict):
            errors.append("independentCritic must be an object when required")
        else:
            critic_report_digest = None
            report_path_value = critic.get("reportPath")
            if not _nonempty_string(report_path_value):
                errors.append("independentCritic.reportPath is required")
            else:
                report_path = Path(report_path_value)
                if not report_path.is_absolute():
                    report_path = manifest_path.parent / report_path
                if not report_path.is_file() or report_path.stat().st_size < 100:
                    errors.append("independentCritic.reportPath must reference a non-empty critic report")
                else:
                    critic_report_digest = hashlib.sha256(report_path.read_bytes()).hexdigest()
            critic_status = critic.get("status")
            if not _is_enum(critic_status, STATUSES):
                errors.append(f"independentCritic.status must be one of {sorted(STATUSES)}")
            critic_total = _rubric_total(critic.get("rubric"), "independentCritic.rubric", errors)
            _validate_bound_hashes(
                critic.get("reviewedViewHashes"),
                "independentCritic.reviewedViewHashes",
                required_views,
                actual_view_hashes,
                errors,
            )
            if _is_enum(status, STATUS_RANK) and _is_enum(critic_status, STATUS_RANK):
                if STATUS_RANK[status] > STATUS_RANK[critic_status]:
                    errors.append(
                        f"manifest status {status} is more optimistic than critic status {critic_status}"
                    )
            if status == "complete" and isinstance(score_minimum, int) and critic_total < score_minimum:
                errors.append(
                    f"independent critic total {critic_total} is below declared minimum {score_minimum}"
                )
            if schema_version == 3:
                provenance = critic.get("provenance")
                if not isinstance(provenance, dict):
                    errors.append("independentCritic.provenance must be an object for schema v3")
                    provenance = {}
                for field in ("promptSpecVersion", "criticRunId", "model"):
                    if not _nonempty_string(provenance.get(field)):
                        errors.append(f"independentCritic.provenance.{field} is required")
                request_digest = provenance.get("requestSha256")
                if not isinstance(request_digest, str) or not SHA256_PATTERN.fullmatch(request_digest):
                    errors.append(
                        "independentCritic.provenance.requestSha256 must be a lowercase SHA-256 digest"
                    )
                elif request_actual_hash is not None and request_digest != request_actual_hash:
                    errors.append(
                        "independentCritic.provenance.requestSha256 does not match requestEvidence"
                    )
                report_digest = provenance.get("reportSha256")
                if not isinstance(report_digest, str) or not SHA256_PATTERN.fullmatch(report_digest):
                    errors.append(
                        "independentCritic.provenance.reportSha256 must be a lowercase SHA-256 digest"
                    )
                elif critic_report_digest is not None and report_digest != critic_report_digest:
                    errors.append(
                        "independentCritic.provenance.reportSha256 does not match the critic report"
                    )
                context_allowlist = provenance.get("contextAllowlist")
                required_context = {"original-request", "fidelity-lane", "final-views"}
                if (
                    not isinstance(context_allowlist, list)
                    or not all(_nonempty_string(item) for item in context_allowlist)
                    or set(context_allowlist) != required_context
                ):
                    errors.append(
                        "independentCritic.provenance.contextAllowlist must contain only original-request, fidelity-lane, and final-views"
                    )
                hard_gates = critic.get("hardGates")
                if not isinstance(hard_gates, dict):
                    errors.append("independentCritic.hardGates must be an object for schema v3")
                    hard_gates = {}
                for gate_name in (
                    "profileCorrect",
                    "identityReadable",
                    "notBlockout",
                    "constructionReadable",
                    "materialsReadable",
                    "edgeTreatmentReadable",
                    "noSevereArtifacts",
                ):
                    gate_value = hard_gates.get(gate_name)
                    if not isinstance(gate_value, bool):
                        errors.append(f"independentCritic.hardGates.{gate_name} must be a boolean")
                    elif status == "complete" and gate_value is not True:
                        errors.append(
                            f"independentCritic.hardGates.{gate_name} must pass for complete status"
                        )
                if status == "complete" and _is_enum(lane, POLISHED_LANES):
                    _validate_category_floors(
                        critic.get("rubric"), "independentCritic.rubric", lane, errors
                    )

    limitations = manifest.get("limitations")
    if not isinstance(limitations, list) or not all(_nonempty_string(item) for item in limitations):
        errors.append("limitations must be a list of strings")
    if status == "complete" and _is_enum(lane, POLISHED_LANES) and not limitations:
        warnings.append("complete polished asset declares no limitations")

    return errors, warnings, {
        "assetId": manifest.get("assetId"),
        "schemaVersion": schema_version,
        "fidelityLane": lane,
        "assetProfile": asset_profile,
        "aaaTarget": aaa_target,
        "status": status,
        "viewCount": len(resolved_views),
        "identityFeatureCount": len(identity_features),
        "reviewRoundCount": len(review_rounds),
        "rubricTotal": total_score,
        "criticStatus": critic_status,
        "criticRubricTotal": critic_total,
    }


def _self_test() -> None:
    with tempfile.TemporaryDirectory(prefix="visual-evidence-") as directory:
        root = Path(directory)
        view_names = ["hero", "orbitA", "orbitB", "neutralMaterial", "subjectProof"]
        directions = {
            "hero": [1.4, 0.8, 1.6],
            "orbitA": [-1.4, 0.7, 1.5],
            "orbitB": [1.2, 0.6, -1.6],
            "neutralMaterial": [0.0, 0.5, 1.8],
            "subjectProof": [0.7, 0.3, 1.1],
        }
        views: dict[str, dict[str, Any]] = {}
        view_hashes: dict[str, str] = {}
        for index, name in enumerate(view_names):
            path = root / f"{name}.png"
            path.write_bytes(_pattern_png(1280, 720, index + 1))
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            view_hashes[name] = digest
            views[name] = {
                "path": path.name,
                "semanticState": "rest",
                "fixedTimeSeconds": 0,
                "cameraDirection": directions[name],
                "uiMode": "page" if name == "hero" else "review",
                "sha256": digest,
            }
        critic_report = root / "independent-critic.md"
        critic_report.write_text(
            "# Independent critic\n\nThe exact final views pass the declared polished-stylized gate. "
            "Construction, materials, presentation, and evidence were reviewed independently.\n",
            encoding="utf-8",
        )
        request_file = root / "original-request.txt"
        request_file.write_text("Create a polished self-test asset.", encoding="utf-8")
        runtime_file = root / "runtime.js"
        runtime_file.write_text(
            "export const runtime = { loaded: true, version: 'self-test-v1' };\n",
            encoding="utf-8",
        )
        round_input_views: dict[str, dict[str, str]] = {}
        round_output_views: dict[str, dict[str, str]] = {}
        for index, name in enumerate(view_names):
            round_input_path = root / f"round-0-{name}.png"
            round_input_path.write_bytes(_pattern_png(1280, 720, 21 + index))
            round_output_path = root / f"round-1-{name}.png"
            round_output_path.write_bytes(_pattern_png(1280, 720, 31 + index))
            round_input_views[name] = {
                "path": round_input_path.name,
                "sha256": hashlib.sha256(round_input_path.read_bytes()).hexdigest(),
            }
            round_output_views[name] = {
                "path": round_output_path.name,
                "sha256": hashlib.sha256(round_output_path.read_bytes()).hexdigest(),
            }
        rubric = {
            "silhouetteProportion": 20,
            "constructionAttachment": 16,
            "materialLightResponse": 16,
            "surfaceDetailVariation": 12,
            "motionInteraction": 8,
            "webPresentation": 8,
        }
        manifest = {
            "schemaVersion": 3,
            "assetId": "self-test",
            "assetProfile": "general",
            "aaaTarget": False,
            "siteEnvironment": False,
            "regionalStyle": False,
            "fidelityLane": "polished-stylized",
            "status": "complete",
            "requestEvidence": {
                "path": request_file.name,
                "sha256": hashlib.sha256(request_file.read_bytes()).hexdigest(),
            },
            "acceptance": {
                "visualScoreMinimum": 75,
                "minimumWidth": 1280,
                "minimumHeight": 720,
                "minimumReviewRounds": 2,
                "independentCriticRequired": True,
                "requiredViews": view_names,
            },
            "identityFeatures": [
                {
                    "name": f"feature-{index}",
                    "critical": True,
                    "representation": "geometry",
                    "evidenceView": view_names[index],
                    "status": "verified",
                }
                for index in range(5)
            ],
            "pipelineDecision": {
                "route": "hybrid",
                "rationale": "Authored source plus runtime integration proves the target finish.",
                "closestViewMeters": 0.35,
                "qualityRisks": [
                    {
                        "name": "edge treatment",
                        "mitigation": "authored bevels",
                        "proofView": "subjectProof",
                    },
                    {
                        "name": "material response",
                        "mitigation": "reviewed PBR contract",
                        "proofView": "neutralMaterial",
                    },
                ],
                "finishSpike": {
                    "required": False,
                    "status": "not-required",
                    "decision": "The established authored route already has exact-runtime evidence.",
                    "evidenceViews": [],
                },
            },
            "materialContracts": [
                {
                    "materialId": "test-material",
                    "realMaterial": "painted wood",
                    "layerStack": "wood > primer > paint",
                    "realScale": "meters with millimeter coating cues",
                    "runtimeBinding": "test.glb::TestMaterial",
                    "critical": True,
                    "status": "verified",
                    "proofViews": ["neutralMaterial", "subjectProof"],
                    "scaleBands": {
                        "macro": {
                            "physicalScale": "0.1-1 m",
                            "representationOrOmission": "unique base-color variation",
                        },
                        "meso": {
                            "physicalScale": "1-100 mm",
                            "representationOrOmission": "normal and roughness",
                        },
                        "micro": {
                            "physicalScale": "0.05-1 mm",
                            "representationOrOmission": "detail normal",
                        },
                    },
                }
            ],
            "lightingProfile": {
                "profileId": "neutral-v1",
                "rendererBuild": "test-renderer-build",
                "colorManagement": "sRGB output",
                "toneMappingExposure": "ACES, exposure 1",
                "environment": "neutral studio environment hash fixture",
                "contactStrategy": "shadow and AO fixture",
                "proofViews": ["neutralMaterial", "subjectProof"],
            },
            "finishChecks": {
                name: {
                    "status": "passed",
                    "proofViews": ["subjectProof" if name != "materialSeparation" else "neutralMaterial"],
                }
                for name in (
                    "edgeTreatment",
                    "constructionDepth",
                    "materialSeparation",
                    "surfaceVariation",
                    "contactGrounding",
                )
            },
            "runtimeEvidence": {
                "buildId": "self-test-build",
                "artifacts": [
                    {
                        "name": "runtime",
                        "kind": "runtime-bundle",
                        "path": runtime_file.name,
                        "sha256": hashlib.sha256(runtime_file.read_bytes()).hexdigest(),
                    }
                ],
                "consoleErrors": 0,
                "requiredPathPassed": True,
            },
            "imageLineage": [],
            "views": views,
            "reviewRounds": [
                {
                    "largestDefects": ["defect"],
                    "defects": [{"id": "defect-1", "view": "hero", "severity": "high"}],
                    "selectedDefectId": "defect-1",
                    "reviewerType": "builder",
                    "inputViews": round_input_views,
                    "outputViews": round_output_views,
                    "change": "changed the asset",
                    "result": "visible improvement",
                },
                {
                    "largestDefects": ["remaining defect"],
                    "defects": [{"id": "defect-2", "view": "hero", "severity": "medium"}],
                    "selectedDefectId": "defect-2",
                    "reviewerType": "builder",
                    "inputViews": round_output_views,
                    "outputViews": {
                        name: {"path": views[name]["path"], "sha256": view_hashes[name]}
                        for name in view_names
                    },
                    "change": "changed the presentation",
                    "result": "visible improvement",
                },
            ],
            "rubric": rubric,
            "finalReview": {"reviewedViewHashes": view_hashes},
            "independentCritic": {
                "reportPath": critic_report.name,
                "status": "complete",
                "rubric": rubric,
                "reviewedViewHashes": view_hashes,
                "provenance": {
                    "requestSha256": hashlib.sha256(request_file.read_bytes()).hexdigest(),
                    "reportSha256": hashlib.sha256(critic_report.read_bytes()).hexdigest(),
                    "promptSpecVersion": "quality-critic-v1",
                    "criticRunId": "self-test-critic",
                    "model": "self-test-model",
                    "contextAllowlist": ["original-request", "fidelity-lane", "final-views"],
                },
                "hardGates": {
                    "profileCorrect": True,
                    "identityReadable": True,
                    "notBlockout": True,
                    "constructionReadable": True,
                    "materialsReadable": True,
                    "edgeTreatmentReadable": True,
                    "noSevereArtifacts": True,
                },
            },
            "limitations": ["self-test fixture"],
        }
        manifest_path = root / "quality-evidence.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if errors:
            raise AssertionError(f"valid fixture failed: {errors}")
        valid_manifest = json.loads(json.dumps(manifest))
        manifest["views"]["orbitB"]["path"] = manifest["views"]["orbitA"]["path"]
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("duplicates pixels" in error for error in errors):
            raise AssertionError("duplicate-image fixture did not fail")
        manifest["views"]["orbitB"]["path"] = "orbitB.png"
        manifest["independentCritic"]["status"] = "partial"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("more optimistic than critic status partial" in error for error in errors):
            raise AssertionError("critic-authority fixture did not fail")
        manifest["independentCritic"]["status"] = "complete"
        manifest["acceptance"]["visualScoreMinimum"] = 0
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("visualScoreMinimum of at least 75" in error for error in errors):
            raise AssertionError("lowered polished-policy fixture did not fail")
        manifest["acceptance"]["visualScoreMinimum"] = 75
        manifest["pipelineDecision"]["route"] = "procedural"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("procedural polished work requires a finish spike" in error for error in errors):
            raise AssertionError("procedural-without-spike fixture did not fail")
        manifest["pipelineDecision"]["route"] = "hybrid"
        manifest["assetProfile"] = "architecture-exterior"
        manifest["siteEnvironment"] = True
        manifest["regionalStyle"] = True
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("architecture complete is missing required views" in error for error in errors):
            raise AssertionError("architecture-view-policy fixture did not fail")
        if not any("architecture/environment is missing mandatory feature groups" in error for error in errors):
            raise AssertionError("architecture-group-policy fixture did not fail")

        aaa_architecture = json.loads(json.dumps(valid_manifest))
        aaa_architecture["assetProfile"] = "architecture-exterior"
        aaa_architecture["aaaTarget"] = True
        manifest_path.write_text(json.dumps(aaa_architecture), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any(
            "3A/AAA or photoreal architecture complete requires a passed finish spike" in error
            for error in errors
        ):
            raise AssertionError("AAA-architecture finish-spike bypass fixture did not fail")
        if not any(
            "requires a passed independent finish-spike review" in error for error in errors
        ):
            raise AssertionError("AAA-architecture independent-spike-review fixture did not fail")

        missing_aaa_target = json.loads(json.dumps(valid_manifest))
        missing_aaa_target.pop("aaaTarget")
        manifest_path.write_text(json.dumps(missing_aaa_target), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("aaaTarget must be an explicit boolean" in error for error in errors):
            raise AssertionError("missing-AAA-target fixture did not fail")

        finish_bypass = json.loads(json.dumps(valid_manifest))
        for check in finish_bypass["finishChecks"].values():
            check.clear()
            check.update({"status": "not-applicable", "proofViews": [], "reason": "claimed N/A"})
        manifest_path.write_text(json.dumps(finish_bypass), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("finishChecks.edgeTreatment must pass" in error for error in errors):
            raise AssertionError("finish-check N/A bypass fixture did not fail")

        duplicate_features = json.loads(json.dumps(valid_manifest))
        for feature in duplicate_features["identityFeatures"]:
            feature["name"] = "duplicate feature"
        manifest_path.write_text(json.dumps(duplicate_features), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("duplicates another identity feature" in error for error in errors):
            raise AssertionError("duplicate-identity-feature fixture did not fail")

        contradictory_profile = json.loads(json.dumps(valid_manifest))
        contradictory_profile["siteEnvironment"] = True
        manifest_path.write_text(json.dumps(contradictory_profile), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("siteEnvironment or regionalStyle requires" in error for error in errors):
            raise AssertionError("contradictory-profile fixture did not fail")

        missing_runtime = json.loads(json.dumps(valid_manifest))
        missing_runtime["runtimeEvidence"]["artifacts"][0]["path"] = "missing-runtime.js"
        manifest_path.write_text(json.dumps(missing_runtime), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("runtimeEvidence.artifacts[0].path does not exist" in error for error in errors):
            raise AssertionError("unbound-runtime fixture did not fail")

        empty_runtime_path = root / "empty.js"
        empty_runtime_path.write_bytes(b"")
        empty_runtime = json.loads(json.dumps(valid_manifest))
        empty_runtime["runtimeEvidence"]["artifacts"][0].update(
            {
                "path": empty_runtime_path.name,
                "sha256": hashlib.sha256(empty_runtime_path.read_bytes()).hexdigest(),
            }
        )
        manifest_path.write_text(json.dumps(empty_runtime), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("path is smaller than 32 bytes" in error for error in errors):
            raise AssertionError("empty-runtime fixture did not fail")

        whitespace_runtime_path = root / "whitespace.js"
        whitespace_runtime_path.write_bytes(b" " * 32)
        whitespace_runtime = json.loads(json.dumps(valid_manifest))
        whitespace_runtime["runtimeEvidence"]["artifacts"][0].update(
            {
                "path": whitespace_runtime_path.name,
                "sha256": hashlib.sha256(whitespace_runtime_path.read_bytes()).hexdigest(),
            }
        )
        manifest_path.write_text(json.dumps(whitespace_runtime), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("has no substantive runtime content" in error for error in errors):
            raise AssertionError("whitespace-runtime fixture did not fail")

        reused_request = json.loads(json.dumps(valid_manifest))
        reused_request["runtimeEvidence"]["artifacts"][0].update(
            {
                "path": request_file.name,
                "sha256": hashlib.sha256(request_file.read_bytes()).hexdigest(),
            }
        )
        manifest_path.write_text(json.dumps(reused_request), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("cannot reuse requestEvidence.path" in error for error in errors):
            raise AssertionError("request-as-runtime fixture did not fail")

        copied_request_path = root / "request-copy.js"
        copied_request_path.write_bytes(request_file.read_bytes())
        copied_request = json.loads(json.dumps(valid_manifest))
        copied_request["runtimeEvidence"]["artifacts"][0].update(
            {
                "path": copied_request_path.name,
                "sha256": hashlib.sha256(copied_request_path.read_bytes()).hexdigest(),
            }
        )
        manifest_path.write_text(json.dumps(copied_request), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("sha256 cannot reuse requestEvidence bytes" in error for error in errors):
            raise AssertionError("renamed-request-as-runtime fixture did not fail")

        forbidden_context = json.loads(json.dumps(valid_manifest))
        forbidden_context["independentCritic"]["provenance"]["contextAllowlist"].append(
            "implementation-notes"
        )
        manifest_path.write_text(json.dumps(forbidden_context), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("contextAllowlist must contain only" in error for error in errors):
            raise AssertionError("forbidden-critic-context fixture did not fail")

        incomplete_final_round = json.loads(json.dumps(valid_manifest))
        incomplete_final_round["reviewRounds"][-1]["outputViews"] = {
            "hero": incomplete_final_round["reviewRounds"][-1]["outputViews"]["hero"]
        }
        manifest_path.write_text(json.dumps(incomplete_final_round), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("final review round is missing required views" in error for error in errors):
            raise AssertionError("incomplete-final-review fixture did not fail")

        bad_lineage = json.loads(json.dumps(valid_manifest))
        diagnostics_path = root / "runtime-diagnostics.json"
        diagnostics_path.write_text(
            '{"consoleErrors":0,"requiredPathPassed":true,"fixture":"diagnostics"}',
            encoding="utf-8",
        )
        bad_lineage["runtimeEvidence"]["artifacts"].append(
            {
                "name": "diagnostics",
                "kind": "diagnostics",
                "path": diagnostics_path.name,
                "sha256": hashlib.sha256(diagnostics_path.read_bytes()).hexdigest(),
            }
        )
        bad_lineage["imageLineage"] = [
            {
                "sourceId": "bad-concept",
                "path": round_input_views["hero"]["path"],
                "sha256": round_input_views["hero"]["sha256"],
                "role": "generated-concept",
                "status": "retained-runtime",
                "bindingCues": [],
                "derivative": round_input_views["hero"],
                "operations": ["none"],
                "physicalCoverage": "1 m x 1 m",
                "projection": "UV",
                "channelSemantics": "base color",
                "runtimeBinding": {"artifactName": "diagnostics", "target": "material.map"},
            }
        ]
        manifest_path.write_text(json.dumps(bad_lineage), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("generated concepts are concept-only" in error for error in errors):
            raise AssertionError("concept-as-runtime fixture did not fail")
        if not any("derivative must differ" in error for error in errors):
            raise AssertionError("unchanged-image-derivative fixture did not fail")
        if not any("artifactName cannot target diagnostics" in error for error in errors):
            raise AssertionError("diagnostics-image-runtime fixture did not fail")

        top_level_array_path = root / "array-manifest.json"
        top_level_array_path.write_text("[]", encoding="utf-8")
        errors, _, _ = validate_manifest(top_level_array_path)
        if "manifest root must be a JSON object" not in errors:
            raise AssertionError("top-level-array fixture did not fail cleanly")

        invalid_lane = json.loads(json.dumps(valid_manifest))
        invalid_lane["fidelityLane"] = []
        manifest_path.write_text(json.dumps(invalid_lane), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if not any("fidelityLane must be one of" in error for error in errors):
            raise AssertionError("unhashable-enum fixture did not fail cleanly")

        malformed_png = root / "malformed.png"
        malformed_ihdr = struct.pack(">IIBBBBB", 1280, 720, 8, 2, 0, 0, 0)
        malformed_png.write_bytes(
            b"\x89PNG\r\n\x1a\n"
            + _png_chunk(b"IHDR", malformed_ihdr)
            + _png_chunk(b"IDAT", b"not-zlib-data")
            + _png_chunk(b"IEND", b"")
        )
        try:
            image_info(malformed_png)
        except ValueError:
            pass
        else:
            raise AssertionError("malformed PNG fixture did not fail")

        malformed_jpeg = root / "malformed.jpg"
        sof_payload = b"\x08" + struct.pack(">HH", 720, 1280) + b"\x03" + b"\x01\x11\x00" * 3
        malformed_jpeg.write_bytes(
            b"\xff\xd8"
            + b"\xff\xc0"
            + struct.pack(">H", len(sof_payload) + 2)
            + sof_payload
            + b"\xff\xd9"
        )
        try:
            image_info(malformed_jpeg)
        except ValueError:
            pass
        else:
            raise AssertionError("JPEG-without-scan fixture did not fail")

        schema_v2_partial = json.loads(json.dumps(valid_manifest))
        schema_v2_partial["schemaVersion"] = 2
        schema_v2_partial["status"] = "partial"
        manifest_path.write_text(json.dumps(schema_v2_partial), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if errors:
            raise AssertionError(f"schema-v2 partial compatibility fixture failed: {errors}")
    print("Visual evidence validator schema-integrity self-test passed; visual judgment remains external.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", nargs="?", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        _self_test()
        return 0
    if args.manifest is None:
        parser.error("manifest is required unless --self-test is used")
    errors, warnings, summary = validate_manifest(args.manifest.resolve())
    if summary:
        print(json.dumps(summary, indent=2, ensure_ascii=False))
    for warning in warnings:
        print(f"WARNING: {warning}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("Visual evidence manifest is valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
