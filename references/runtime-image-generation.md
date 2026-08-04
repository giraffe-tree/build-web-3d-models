# Live runtime image generation for Web 3D

## Contents

1. Decide whether generation must be live
2. Write the runtime contract
3. Keep model access server-side
4. Convert output into a 3D-safe asset
5. Cache, budget, and release resources
6. Validate success and failure paths
7. Completion boundaries

## Decide whether generation must be live

Use live generation only when value depends on input received after deployment, such as a user-authored fictional decal, personalized skin, evolving story state, or temporary scene variation. Use build-time image-assisted authoring for a fixed hero material, foliage atlas, weathering field, label, sky plate, or other asset that can ship with the build.

Do not add live generation merely to improve the default finish. It adds latency, cost, nondeterminism, moderation and privacy obligations, cache state, texture-upload work, and new failure paths. A static reviewed fallback must preserve the product's core identity and required interaction without the provider.

Do not use live imagery to solve silhouette, topology, thickness, joints, contact, collision, drainage, load paths, interior depth, physical material evidence, or reference-faithful construction. Generate only content that can be validly bound as a decal, base-color source, mask, cutout, atlas element, optional background, or explicitly art-directed surface state.

## Write the runtime contract

Record before implementation:

- user value and trigger;
- output role and prohibited content;
- projection, UV region, physical coverage, texel density, dimensions, aspect ratio, alpha, and color space;
- whether the output is optional, identity-critical, persistent, or shareable;
- prompt/input schema and supplied-reference policy;
- latency target, timeout, retry count, request rate, cost ceiling, maximum output bytes, and decoded GPU-memory ceiling;
- cache key, TTL, invalidation, retention, deletion, and user disclosure;
- authentication, authorization, moderation, abuse, and privacy handling;
- loading state, rejection state, provider-error state, offline state, and static fallback;
- exact Web views and interaction states that prove binding, scale, mip edges, cleanup, and fallback.

Keep the deterministic default scene reviewable without a network call. Do not use a random live result as the sole final evidence for a polished asset.

## Keep model access server-side

Use a dedicated model-integration skill when available. Put provider or gateway credentials only on the server. Expose a narrow authenticated application endpoint; do not ship secrets, unrestricted provider parameters, or raw gateway access to the browser.

Validate structured inputs, bound prompt length and image count, allow only declared output sizes and roles, and separate system constraints from user text. For uploaded references, verify real MIME bytes, file size, pixel count, decode memory/time, and authorized ownership before prompting. Prefer uploads or authorized object-store IDs over arbitrary URLs; if URLs are required, allow only HTTPS through a hardened fetcher that blocks private/local/link-local addresses, non-HTTP protocols, redirect escapes, oversized responses, and decompression bombs. Apply applicable moderation and authorization before generation and before publishing or sharing the result. Avoid logging private source images or prompts by default; document retention when storage is required.

Debounce rapid edits, cancel superseded requests when supported, rate-limit per user/session, and make retries bounded and idempotent. Assign a monotonically increasing request or binding version; apply last-request-wins, discard stale completions before processing/upload, and never let an older callback dispose or overwrite the current texture. Distinguish provider rejection, timeout, transport error, malformed output, stale completion, and application validation failure so the UI can choose the correct fallback.

## Convert output into a 3D-safe asset

Treat provider output as an untrusted source image, not as a ready GPU texture or coherent PBR set.

1. Verify MIME bytes, dimensions, aspect ratio, alpha policy, byte limit, and decode success.
2. Reject unwanted text, logos, borders, perspective, baked lighting, shadow, highlight, AO, watermark, malformed repetition, or unsafe content for the declared role.
3. Rectify, crop, pad, bleed transparent edges, and make required axes tileable with deterministic operations.
4. Establish physical coverage and match neighboring texel density.
5. Default live output to base color, decal, coverage/mask, cutout, or optional background. Keep frozen reviewed normal, roughness, metallic, AO, and height maps unless a deterministic role-specific transform with bounded values and per-output semantic validation exists; a generated RGB image alone cannot prove those physical channels. Never ask for unrelated final PBR maps and assume alignment.
6. Keep base color/emissive sRGB and data maps linear. Preserve independent height/normal, roughness, metallic, AO, opacity, and mask semantics.
7. Compress or resize only after the derivative passes. Recheck normals, roughness, banding, alpha bleed, mipmaps, seams, and scale after compression.
8. Bind only to the declared material, slot, mesh, UV region, decal projector, card, or background layer.

Do not replace a whole orbitable facade, object, terrain, or character with a camera-dependent generated plate. If the generated cue must change silhouette or readable parallax, build the corresponding geometry or verified displacement first.

## Cache, budget, and release resources

Hash tenant/user scope, normalized inputs, model/version, prompt-template version, safety/moderation-policy version, transformation version, and the complete output contract—including role, dimensions, color space, alpha, projection, physical coverage, and channel semantics—into the cache key or its explicit invalidation rules. Keep user-private and public caches in separate namespaces; require a deliberate publish action before content becomes shared. Re-authorize every cache hit against the current user, role, and source ownership instead of treating possession of a key as access. Record generation ID, scope, source hash, derivative hash, operations, policy/model versions, timestamps, and final binding.

Use a short-lived session cache for disposable previews and a governed persistent cache only for content the user expects to keep. Provide deletion and invalidation for retained personalized assets. Do not let stale outputs cross users or survive a changed safety, prompt, projection, or channel contract.

Upload textures away from the critical frame when possible. Show a deterministic placeholder or prior valid texture until decoding, processing, and GPU upload complete. Dispose replaced textures and derived render resources; revoke object URLs and release CPU-side image buffers when no longer needed.

Budget download and decoded memory separately. Choose resolution from projected screen coverage rather than provider maximum. Avoid creating a new material or draw call per repeated element when an atlas, array, decal layer, or shared material parameter can preserve batching.

## Validate success and failure paths

Test through visible user controls, not by injecting an internal texture directly.

Always cover:

- cold success: request, loading state, validated output, deterministic processing, WebGL upload, and visible binding;
- actual display: closest and typical views under neutral and final light, including UV scale, seams, alpha/mip edges, channel response, and console state;
- timeout or provider error: bounded wait, no stuck spinner, no leaked resource, and static fallback;
- malformed or rejected output: clear state, no partial binding, and safe fallback;
- replacement and ordering: a second valid output disposes the first GPU resource, preserves interaction, and wins even when the earlier request completes later or cannot be cancelled;
- reload: declared persistence or deliberate reset behaves consistently.

When applicable, also cover moderation rejection, unauthenticated/unauthorized access, rate limit, cancellation/debounce, cache miss, cache hit, TTL expiry, offline mode, mobile memory pressure, and concurrent requests.

Record latency percentiles as diagnostic samples, request count, cache outcome, output bytes, decoded memory estimate, texture count, draw/pass impact, visible screenshot hashes, console errors, and fallback result. Do not use one favorable request as a hard latency guarantee.

## Completion boundaries

A live-generated option can improve personalization, novelty, and surface variety. It does not raise factual-reference confidence and cannot clear failed construction, geometry, attachment, contact, material-channel, or runtime gates.

Allow a polished `complete` claim only when the deterministic fallback already meets the core brief, live output is optional or safely substitutable, all required success/failure states pass, provider keys stay server-side, retained data follows the declared policy, and the generated derivative is validated in the exact runtime.

If the default identity depends on a nondeterministic request that cannot be cached, reviewed, reproduced, or replaced, label the delivery `partial`. If live generation is unnecessary for user value, remove it and ship the reviewed build-time asset.

Keep random live outputs outside static visual `imageLineage`. Bind only shipped fallback, frozen reviewed samples, or formal build-time derivatives there; record live-request evidence separately in the application test package until a dedicated runtime evidence validator is introduced.
