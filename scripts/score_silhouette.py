#!/usr/bin/env python3
"""Fixed-camera silhouette IoU diagnostic between a render and a reference image.

Compares the foreground masks of a render and a reference taken from the same
camera, and reports strict IoU plus an edge-tolerant IoU that forgives
disagreement inside a thin band around mask boundaries. Optional depth-map
inputs add a foreground-masked Pearson correlation.

This is diagnostic only, never a hard gate. Foreground extraction is estimated
from the image borders, so the score is sensitive to non-uniform backgrounds;
the img2threejs benchmark once blocked a delivery on a 0.001 IoU delta, which
is extraction noise, not signal. Treat deltas below ~0.01 as equivalent and
always read the confidence note before acting on the number.

Requires Pillow: pip install Pillow

Usage:
  python3 scripts/score_silhouette.py RENDER.png REFERENCE.png [--json]
  python3 scripts/score_silhouette.py RENDER.png REFERENCE.png \
      --depth-render D1.png --depth-reference D2.png
  python3 scripts/score_silhouette.py --self-test
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageFilter, ImageStat
except ImportError:
    print("error: Pillow is required; install with: pip install Pillow", file=sys.stderr)
    sys.exit(2)

NOISE_FLOOR = 0.01


def _max_channel_difference(image: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    background = Image.new("RGB", image.size, color)
    diff = ImageChops.difference(image, background)
    red, green, blue = diff.split()
    return ImageChops.lighter(ImageChops.lighter(red, green), blue)


def _border_color(image: Image.Image, strip: int) -> tuple[tuple[int, int, int], float]:
    """Median border color and its spread; the spread measures background uniformity."""
    width, height = image.size
    strip = max(1, min(strip, width // 4, height // 4))
    boxes = [
        (0, 0, width, strip),
        (0, height - strip, width, height),
        (0, 0, strip, height),
        (width - strip, 0, width, height),
    ]
    samples: list[tuple[int, int, int]] = []
    for box in boxes:
        region = image.crop(box).resize((8, 8))
        data = region.tobytes()
        samples.extend(tuple(data[i:i + 3]) for i in range(0, len(data), 3))
    channels = list(zip(*samples))
    medians = tuple(int(sorted(values)[len(values) // 2]) for values in channels)
    spread = sum(
        abs(pixel[channel] - medians[channel])
        for pixel in samples
        for channel in range(3)
    ) / (len(samples) * 3)
    return medians, spread


def foreground_mask(image: Image.Image, threshold: int | None) -> tuple[Image.Image, float, int]:
    """Binary 0/255 mask plus the background spread and threshold used."""
    color, spread = _border_color(image, max(2, min(image.size) // 100))
    effective = threshold if threshold is not None else max(12, int(spread * 4) + 8)
    distance = _max_channel_difference(image.convert("RGB"), color)
    mask = distance.point(lambda value: 255 if value > effective else 0)
    return mask, spread, effective


def _count(mask: Image.Image) -> int:
    return mask.histogram()[255]


def _dilate(mask: Image.Image, radius: int) -> Image.Image:
    return mask.filter(ImageFilter.MaxFilter(radius * 2 + 1))


def _erode(mask: Image.Image, radius: int) -> Image.Image:
    return mask.filter(ImageFilter.MinFilter(radius * 2 + 1))


def iou_pair(mask_a: Image.Image, mask_b: Image.Image, edge_tolerance: int) -> dict[str, float]:
    intersection = _count(ImageChops.darker(mask_a, mask_b))
    union = _count(ImageChops.lighter(mask_a, mask_b))
    strict = intersection / union if union else 1.0
    if edge_tolerance <= 0:
        return {"strict": strict, "tolerant": strict}
    band_a = ImageChops.difference(_dilate(mask_a, edge_tolerance), _erode(mask_a, edge_tolerance))
    band_b = ImageChops.difference(_dilate(mask_b, edge_tolerance), _erode(mask_b, edge_tolerance))
    bands = ImageChops.lighter(band_a, band_b)
    disagreement = ImageChops.difference(mask_a, mask_b)
    hard = ImageChops.darker(disagreement, ImageChops.invert(bands))
    tolerant = 1.0 - _count(hard) / union if union else 1.0
    return {"strict": strict, "tolerant": tolerant}


def depth_correlation(
    depth_a: Image.Image,
    depth_b: Image.Image,
    mask: Image.Image,
) -> float | None:
    """Pearson correlation over the foreground union; None if degenerate."""
    values_a = depth_a.convert("L").tobytes()
    values_b = depth_b.convert("L").tobytes()
    flags = mask.tobytes()
    pairs = [(a, b) for a, b, flag in zip(values_a, values_b, flags) if flag]
    if len(pairs) < 64:
        return None
    mean_a = sum(a for a, _ in pairs) / len(pairs)
    mean_b = sum(b for _, b in pairs) / len(pairs)
    cov = sum((a - mean_a) * (b - mean_b) for a, b in pairs)
    var_a = sum((a - mean_a) ** 2 for a, _ in pairs)
    var_b = sum((b - mean_b) ** 2 for _, b in pairs)
    if var_a == 0 or var_b == 0:
        return None
    return cov / (var_a * var_b) ** 0.5


def compare(
    render_path: Path,
    reference_path: Path,
    threshold: int | None,
    edge_tolerance: int,
    depth_render_path: Path | None,
    depth_reference_path: Path | None,
) -> dict:
    render = Image.open(render_path).convert("RGB")
    reference = Image.open(reference_path).convert("RGB")
    warnings: list[str] = []
    if render.size != reference.size:
        warnings.append(
            f"image sizes differ ({render.size} vs {reference.size}); reference resized to match"
        )
        reference = reference.resize(render.size, Image.LANCZOS)

    mask_render, spread_render, used_threshold = foreground_mask(render, threshold)
    mask_reference, _, _ = foreground_mask(reference, threshold)
    scores = iou_pair(mask_render, mask_reference, edge_tolerance)

    pixels = render.size[0] * render.size[1]
    area_render = _count(mask_render) / pixels
    area_reference = _count(mask_reference) / pixels

    confidence_reasons: list[str] = []
    if spread_render > 24:
        confidence_reasons.append(f"render background is not uniform (spread {spread_render:.1f})")
    for label, fraction in (("render", area_render), ("reference", area_reference)):
        if fraction < 0.01 or fraction > 0.90:
            confidence_reasons.append(f"{label} foreground covers {fraction:.1%} of frame")
    if warnings:
        confidence_reasons.extend(warnings)
    confidence = "high" if not confidence_reasons else "low"

    result: dict = {
        "render": str(render_path),
        "reference": str(reference_path),
        "width": render.size[0],
        "height": render.size[1],
        "iouStrict": round(scores["strict"], 4),
        "iouEdgeTolerant": round(scores["tolerant"], 4),
        "edgeTolerancePx": edge_tolerance,
        "foregroundThreshold": used_threshold,
        "foregroundFractionRender": round(area_render, 4),
        "foregroundFractionReference": round(area_reference, 4),
        "confidence": confidence,
        "confidenceReasons": confidence_reasons,
        "status": "diagnostic only, never a hard gate",
    }

    if depth_render_path and depth_reference_path:
        depth_render = Image.open(depth_render_path)
        depth_reference = Image.open(depth_reference_path)
        if depth_render.size != render.size or depth_reference.size != render.size:
            warnings.append("depth maps resized to render size")
            depth_render = depth_render.resize(render.size, Image.LANCZOS)
            depth_reference = depth_reference.resize(render.size, Image.LANCZOS)
        union = ImageChops.lighter(mask_render, mask_reference)
        correlation = depth_correlation(depth_render, depth_reference, union)
        result["depthPearsonForeground"] = (
            round(correlation, 4) if correlation is not None else None
        )
        if correlation is None:
            result["confidenceReasons"].append("depth correlation degenerate (flat depth or tiny mask)")

    return result


def print_report(result: dict) -> None:
    print(f"render:    {result['render']}")
    print(f"reference: {result['reference']}")
    print(f"size:      {result['width']}x{result['height']}")
    print(f"IoU strict:        {result['iouStrict']:.4f}")
    print(f"IoU edge-tolerant: {result['iouEdgeTolerant']:.4f} (band {result['edgeTolerancePx']} px)")
    if "depthPearsonForeground" in result:
        value = result["depthPearsonForeground"]
        print(f"depth Pearson (foreground): {value if value is not None else 'n/a'}")
    print(f"foreground fraction: render {result['foregroundFractionRender']:.1%}, "
          f"reference {result['foregroundFractionReference']:.1%}")
    print(f"confidence: {result['confidence']}")
    for reason in result["confidenceReasons"]:
        print(f"  - {reason}")
    print(f"note: IoU deltas below ~{NOISE_FLOOR} are extraction noise; treat as equivalent")
    print(result["status"])


def self_test() -> int:
    """Synthetic fixed-camera scenes; no file IO, no network."""
    base = Image.new("RGB", (256, 256), (30, 30, 34))

    def with_square(image: Image.Image, offset: int) -> Image.Image:
        copy = image.copy()
        for y in range(96, 160):
            for x in range(96 + offset, 160 + offset):
                copy.putpixel((x, y), (200, 190, 170))
        return copy

    mask_a, _, _ = foreground_mask(with_square(base, 0), None)
    identical = iou_pair(mask_a, mask_a, 2)
    shifted = iou_pair(mask_a, foreground_mask(with_square(base, 12), None)[0], 2)
    flat = iou_pair(
        foreground_mask(base, None)[0],
        foreground_mask(base, None)[0],
        2,
    )
    checks = [
        ("identical scenes give IoU 1.0", identical["strict"] == 1.0),
        ("shift lowers strict IoU", shifted["strict"] < identical["strict"]),
        ("edge tolerance recovers part of the shift", shifted["tolerant"] >= shifted["strict"]),
        ("empty-vs-empty stays 1.0", flat["strict"] == 1.0),
    ]
    failed = [name for name, ok in checks if not ok]
    for name, ok in checks:
        print(f"{'PASS' if ok else 'FAIL'} {name}")
    print(f"shifted-12px strict IoU: {shifted['strict']:.4f}, tolerant: {shifted['tolerant']:.4f}")
    print("SELF-TEST PASS" if not failed else "SELF-TEST FAIL")
    return 0 if not failed else 1


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("render", nargs="?", type=Path, help="render image (PNG or JPEG)")
    parser.add_argument("reference", nargs="?", type=Path, help="reference image (PNG or JPEG)")
    parser.add_argument(
        "--threshold",
        type=int,
        default=None,
        help="foreground distance threshold 0-255 (default: auto from background spread)",
    )
    parser.add_argument(
        "--edge-tolerance",
        type=int,
        default=2,
        help="boundary band in pixels forgiven by the tolerant IoU (default: 2)",
    )
    parser.add_argument("--depth-render", type=Path, default=None, help="render depth map")
    parser.add_argument("--depth-reference", type=Path, default=None, help="reference depth map")
    parser.add_argument("--json", action="store_true", help="print the result as JSON")
    parser.add_argument("--self-test", action="store_true", help="run synthetic checks and exit")
    args = parser.parse_args()

    if args.self_test:
        return self_test()
    if not args.render or not args.reference:
        parser.error("render and reference images are required (or run --self-test)")
    for path in (args.render, args.reference, args.depth_render, args.depth_reference):
        if path is not None and not path.is_file():
            print(f"error: image does not exist: {path}", file=sys.stderr)
            return 2
    if (args.depth_render is None) != (args.depth_reference is None):
        print("error: --depth-render and --depth-reference must be given together", file=sys.stderr)
        return 2

    result = compare(
        args.render,
        args.reference,
        args.threshold,
        args.edge_tolerance,
        args.depth_render,
        args.depth_reference,
    )
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print_report(result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
