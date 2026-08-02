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
FIDELITY_LANES = {"blockout", "polished-stylized", "reference-faithful", "photoreal-hero"}
STATUSES = {"complete", "partial", "blockout", "failed-validation"}
POLISHED_LANES = {"polished-stylized", "reference-faithful", "photoreal-hero"}
STATUS_RANK = {"failed-validation": 0, "blockout": 1, "partial": 2, "complete": 3}
SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")


def _jpeg_dimensions(data: bytes) -> tuple[int, int] | None:
    if not data.startswith(b"\xff\xd8"):
        return None
    offset = 2
    sof_markers = {
        0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
        0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF,
    }
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
        if marker in {0xD8, 0xD9}:
            continue
        if offset + 2 > len(data):
            return None
        segment_length = struct.unpack(">H", data[offset:offset + 2])[0]
        if segment_length < 2 or offset + segment_length > len(data):
            return None
        if marker in sof_markers and segment_length >= 7:
            height, width = struct.unpack(">HH", data[offset + 3:offset + 7])
            return width, height
        offset += segment_length
    return None


def _png_dimensions(data: bytes) -> tuple[int, int] | None:
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        return None
    offset = 8
    dimensions: tuple[int, int] | None = None
    saw_idat = False
    saw_iend = False
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
        if chunk_type == b"IHDR":
            if dimensions is not None or length != 13:
                return None
            width, height = struct.unpack(">II", data[chunk_start:chunk_start + 8])
            if width <= 0 or height <= 0:
                return None
            dimensions = (width, height)
        elif chunk_type == b"IDAT":
            saw_idat = True
        elif chunk_type == b"IEND":
            if length != 0:
                return None
            saw_iend = True
            offset = crc_end
            break
        offset = crc_end
    if dimensions and saw_idat and saw_iend and offset == len(data):
        return dimensions
    return None


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


def _png_chunk(chunk_type: bytes, payload: bytes) -> bytes:
    crc = zlib.crc32(chunk_type)
    crc = zlib.crc32(payload, crc) & 0xFFFFFFFF
    return struct.pack(">I", len(payload)) + chunk_type + payload + struct.pack(">I", crc)


def _solid_png(width: int, height: int, rgb: tuple[int, int, int]) -> bytes:
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    scanline = b"\x00" + bytes(rgb) * width
    pixels = scanline * height
    return (
        b"\x89PNG\r\n\x1a\n"
        + _png_chunk(b"IHDR", ihdr)
        + _png_chunk(b"IDAT", zlib.compress(pixels, level=9))
        + _png_chunk(b"IEND", b"")
    )


def validate_manifest(manifest_path: Path) -> tuple[list[str], list[str], dict[str, Any]]:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"cannot read manifest: {exc}"], warnings, {}

    schema_version = manifest.get("schemaVersion")
    if schema_version not in {1, 2}:
        errors.append("schemaVersion must be 1 or 2")
    if not _nonempty_string(manifest.get("assetId")):
        errors.append("assetId is required")

    lane = manifest.get("fidelityLane")
    if lane not in FIDELITY_LANES:
        errors.append(f"fidelityLane must be one of {sorted(FIDELITY_LANES)}")
    status = manifest.get("status")
    if status not in STATUSES:
        errors.append(f"status must be one of {sorted(STATUSES)}")

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
    if schema_version == 2 and not isinstance(critic_required, bool):
        errors.append("acceptance.independentCriticRequired must be a boolean")
        critic_required = False
    if schema_version == 1 and lane in POLISHED_LANES:
        warnings.append("schema v1 does not bind final reviews or critics to exact evidence bytes")

    identity_features = manifest.get("identityFeatures")
    if not isinstance(identity_features, list):
        errors.append("identityFeatures must be a list")
        identity_features = []
    if lane in POLISHED_LANES and len(identity_features) < 5:
        errors.append("polished lanes require at least 5 identityFeatures")
    for index, feature in enumerate(identity_features):
        prefix = f"identityFeatures[{index}]"
        if not isinstance(feature, dict):
            errors.append(f"{prefix} must be an object")
            continue
        for field in ("name", "representation", "evidenceView", "status"):
            if not _nonempty_string(feature.get(field)):
                errors.append(f"{prefix}.{field} is required")
        if feature.get("evidenceView") not in required_views:
            errors.append(f"{prefix}.evidenceView must name a required view")
        if feature.get("status") not in {"verified", "partial", "omitted"}:
            errors.append(f"{prefix}.status must be verified, partial, or omitted")
        if status == "complete" and feature.get("critical") is True and feature.get("status") != "verified":
            errors.append(f"{prefix} is critical but not verified for complete status")

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
        if schema_version == 2:
            if not _nonempty_string(view.get("semanticState")):
                errors.append(f"views.{view_name}.semanticState is required for schema v2")
            fixed_time = view.get("fixedTimeSeconds")
            if (
                not isinstance(fixed_time, (int, float))
                or isinstance(fixed_time, bool)
                or not math.isfinite(fixed_time)
            ):
                errors.append(f"views.{view_name}.fixedTimeSeconds must be finite for schema v2")
            direction = view.get("cameraDirection")
            if not _finite_vector(direction):
                errors.append(f"views.{view_name}.cameraDirection must contain 3 finite numbers")
            elif view_name in {"hero", "orbitA", "orbitB"}:
                primary_directions.append(direction)
            ui_mode = view.get("uiMode")
            if ui_mode not in {"page", "review"}:
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
        if schema_version == 2:
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

    if schema_version == 2 and len(primary_directions) == 3:
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

    if schema_version == 2:
        final_review = manifest.get("finalReview")
        if not isinstance(final_review, dict):
            errors.append("finalReview must be an object for schema v2")
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

    critic_status = None
    critic_total = None
    critic = manifest.get("independentCritic")
    if schema_version == 2 and (critic_required or critic is not None):
        if not isinstance(critic, dict):
            errors.append("independentCritic must be an object when required")
        else:
            report_path_value = critic.get("reportPath")
            if not _nonempty_string(report_path_value):
                errors.append("independentCritic.reportPath is required")
            else:
                report_path = Path(report_path_value)
                if not report_path.is_absolute():
                    report_path = manifest_path.parent / report_path
                if not report_path.is_file() or report_path.stat().st_size < 100:
                    errors.append("independentCritic.reportPath must reference a non-empty critic report")
            critic_status = critic.get("status")
            if critic_status not in STATUSES:
                errors.append(f"independentCritic.status must be one of {sorted(STATUSES)}")
            critic_total = _rubric_total(critic.get("rubric"), "independentCritic.rubric", errors)
            _validate_bound_hashes(
                critic.get("reviewedViewHashes"),
                "independentCritic.reviewedViewHashes",
                required_views,
                actual_view_hashes,
                errors,
            )
            if status in STATUS_RANK and critic_status in STATUS_RANK:
                if STATUS_RANK[status] > STATUS_RANK[critic_status]:
                    errors.append(
                        f"manifest status {status} is more optimistic than critic status {critic_status}"
                    )
            if status == "complete" and isinstance(score_minimum, int) and critic_total < score_minimum:
                errors.append(
                    f"independent critic total {critic_total} is below declared minimum {score_minimum}"
                )

    limitations = manifest.get("limitations")
    if not isinstance(limitations, list) or not all(_nonempty_string(item) for item in limitations):
        errors.append("limitations must be a list of strings")
    if status == "complete" and lane in POLISHED_LANES and not limitations:
        warnings.append("complete polished asset declares no limitations")

    return errors, warnings, {
        "assetId": manifest.get("assetId"),
        "schemaVersion": schema_version,
        "fidelityLane": lane,
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
            path.write_bytes(_solid_png(1280, 720, (20 + index, 40 + index, 60 + index)))
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
        rubric = {
            "silhouetteProportion": 20,
            "constructionAttachment": 16,
            "materialLightResponse": 16,
            "surfaceDetailVariation": 12,
            "motionInteraction": 8,
            "webPresentation": 8,
        }
        manifest = {
            "schemaVersion": 2,
            "assetId": "self-test",
            "fidelityLane": "polished-stylized",
            "status": "complete",
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
            "views": views,
            "reviewRounds": [
                {
                    "largestDefects": ["defect"],
                    "change": "changed the asset",
                    "result": "visible improvement",
                },
                {
                    "largestDefects": ["remaining defect"],
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
            },
            "limitations": ["self-test fixture"],
        }
        manifest_path = root / "quality-evidence.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        errors, _, _ = validate_manifest(manifest_path)
        if errors:
            raise AssertionError(f"valid fixture failed: {errors}")
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
    print("Visual evidence validator self-test passed.")


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
