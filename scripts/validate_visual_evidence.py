#!/usr/bin/env python3
"""Validate the integrity and completeness of a Web 3D visual-evidence manifest."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import tempfile
from typing import Any


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


def image_info(path: Path) -> tuple[str, int, int]:
    data = path.read_bytes()
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        width, height = struct.unpack(">II", data[16:24])
        return "png", width, height
    jpeg_size = _jpeg_dimensions(data)
    if jpeg_size:
        return "jpeg", jpeg_size[0], jpeg_size[1]
    raise ValueError("unsupported or invalid image; expected PNG or JPEG")


def _nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_manifest(manifest_path: Path) -> tuple[list[str], list[str], dict[str, Any]]:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"cannot read manifest: {exc}"], warnings, {}

    if manifest.get("schemaVersion") != 1:
        errors.append("schemaVersion must be 1")
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
    for label, value in (
        ("minimumWidth", minimum_width),
        ("minimumHeight", minimum_height),
        ("minimumReviewRounds", minimum_rounds),
        ("visualScoreMinimum", score_minimum),
    ):
        if not isinstance(value, int) or value < 0:
            errors.append(f"acceptance.{label} must be a non-negative integer")

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
    resolved_views: dict[str, dict[str, Any]] = {}
    for view_name in required_views:
        view = views.get(view_name)
        if not isinstance(view, dict) or not _nonempty_string(view.get("path")):
            errors.append(f"views.{view_name}.path is required")
            continue
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
        if digest in image_hashes:
            errors.append(f"views.{view_name} duplicates pixels from views.{image_hashes[digest]}")
        else:
            image_hashes[digest] = view_name
        resolved_views[view_name] = {
            "path": str(image_path),
            "format": image_format,
            "width": width,
            "height": height,
        }

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

    rubric = manifest.get("rubric")
    if not isinstance(rubric, dict):
        errors.append("rubric must be an object")
        rubric = {}
    total_score = 0
    for field, maximum in RUBRIC_MAXIMUMS.items():
        score = rubric.get(field)
        if not isinstance(score, int) or not 0 <= score <= maximum:
            errors.append(f"rubric.{field} must be an integer from 0 to {maximum}")
            continue
        total_score += score
    if status == "complete" and isinstance(score_minimum, int) and total_score < score_minimum:
        errors.append(f"rubric total {total_score} is below declared minimum {score_minimum}")

    limitations = manifest.get("limitations")
    if not isinstance(limitations, list) or not all(_nonempty_string(item) for item in limitations):
        errors.append("limitations must be a list of strings")
    if status == "complete" and lane in POLISHED_LANES and not limitations:
        warnings.append("complete polished asset declares no limitations")

    return errors, warnings, {
        "assetId": manifest.get("assetId"),
        "fidelityLane": lane,
        "status": status,
        "viewCount": len(resolved_views),
        "identityFeatureCount": len(identity_features),
        "reviewRoundCount": len(review_rounds),
        "rubricTotal": total_score,
    }


def _self_test() -> None:
    with tempfile.TemporaryDirectory(prefix="visual-evidence-") as directory:
        root = Path(directory)
        view_names = ["hero", "orbitA", "orbitB", "neutralMaterial", "subjectProof"]
        views: dict[str, dict[str, Any]] = {}
        for index, name in enumerate(view_names):
            path = root / f"{name}.png"
            path.write_bytes(
                b"\x89PNG\r\n\x1a\n"
                + b"\x00\x00\x00\x0dIHDR"
                + struct.pack(">II", 1280, 720)
                + bytes([8, 6, 0, 0, 0, index])
            )
            views[name] = {"path": path.name}
        manifest = {
            "schemaVersion": 1,
            "assetId": "self-test",
            "fidelityLane": "polished-stylized",
            "status": "complete",
            "acceptance": {
                "visualScoreMinimum": 75,
                "minimumWidth": 1280,
                "minimumHeight": 720,
                "minimumReviewRounds": 2,
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
            "rubric": {
                "silhouetteProportion": 20,
                "constructionAttachment": 16,
                "materialLightResponse": 16,
                "surfaceDetailVariation": 12,
                "motionInteraction": 8,
                "webPresentation": 8,
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
