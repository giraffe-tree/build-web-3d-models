import bpy
import math
import os
from mathutils import Vector


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLEND_PATH = os.path.join(ROOT, "blender", "vela-chair.blend")
GLB_PATH = os.path.join(ROOT, "public", "assets", "vela-chair.glb")


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        pass
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "BLENDER_EEVEE"


def material(name, color, metallic=0.0, roughness=0.45, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, alpha)
    mat.use_nodes = True
    bsdf = next((node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        bsdf = mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.surface_render_method = "DITHERED"
    return mat


def assign(obj, mat):
    if obj.data and hasattr(obj.data, "materials"):
        obj.data.materials.append(mat)


def smooth(obj, angle=0.65):
    if obj.type == "MESH":
        for poly in obj.data.polygons:
            poly.use_smooth = True
        obj.data.set_sharp_from_angle(angle=angle)


def apply_modifier(obj, modifier):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)


def rounded_box(name, location, dimensions, radius, mat, rotation=(0, 0, 0), bevel_segments=4):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = obj.modifiers.new("soft product edge", "BEVEL")
    bevel.width = radius
    bevel.segments = bevel_segments
    bevel.limit_method = "ANGLE"
    apply_modifier(obj, bevel)
    smooth(obj)
    assign(obj, mat)
    return obj


def uv_sphere(name, location, scale, mat, segments=40, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    smooth(obj)
    assign(obj, mat)
    return obj


def cylinder(name, location, radius, depth, mat, direction=(0, 0, 1), vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    direction_v = Vector(direction).normalized()
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction_v)
    obj.rotation_mode = "XYZ"
    bevel = obj.modifiers.new("edge rolloff", "BEVEL")
    bevel.width = min(radius * 0.18, depth * 0.12)
    bevel.segments = 3
    apply_modifier(obj, bevel)
    smooth(obj)
    assign(obj, mat)
    return obj


def torus(name, location, major_radius, minor_radius, mat, rotation=(0, 0, 0), major_segments=64, minor_segments=12):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=minor_segments,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    smooth(obj)
    assign(obj, mat)
    return obj


def tube_curve(name, points, radius, mat, cyclic=False, resolution=2, bevel_resolution=4):
    curve = bpy.data.curves.new(name + "Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = resolution
    curve.bevel_depth = radius
    curve.bevel_resolution = bevel_resolution
    curve.resolution_u = resolution
    spline = curve.splines.new("NURBS")
    spline.points.add(len(points) - 1)
    for point, co in zip(spline.points, points):
        point.co = (*co, 1.0)
    spline.use_cyclic_u = cyclic
    spline.order_u = min(3, len(points))
    spline.use_endpoint_u = not cyclic
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    assign(obj, mat)
    return obj


def tapered_leg(name, angle, inner_r, outer_r, inner_w, outer_w, z_inner, z_outer, thickness, mat):
    # A beveled eight-vertex wedge; local X runs radially outward.
    verts_local = [
        (inner_r, -inner_w, z_inner + thickness / 2),
        (inner_r, inner_w, z_inner + thickness / 2),
        (outer_r, outer_w, z_outer + thickness / 2),
        (outer_r, -outer_w, z_outer + thickness / 2),
        (inner_r, -inner_w, z_inner - thickness / 2),
        (inner_r, inner_w, z_inner - thickness / 2),
        (outer_r, outer_w, z_outer - thickness / 2),
        (outer_r, -outer_w, z_outer - thickness / 2),
    ]
    ca, sa = math.cos(angle), math.sin(angle)
    verts = [(ca * x - sa * y, sa * x + ca * y, z) for x, y, z in verts_local]
    faces = [
        (0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1),
        (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bevel = obj.modifiers.new("forged edge", "BEVEL")
    bevel.width = 0.012
    bevel.segments = 4
    apply_modifier(obj, bevel)
    smooth(obj)
    assign(obj, mat)
    return obj


def back_width(z_t):
    # Shoulder-led teardrop silhouette with a narrow lumbar waist.
    return 0.238 + 0.035 * math.exp(-((z_t - 0.60) / 0.34) ** 2) - 0.020 * math.exp(-((z_t - 0.10) / 0.24) ** 2)


def back_y(x_norm, z_t):
    recline = 0.175 + 0.075 * z_t
    side_wrap = 0.040 * (abs(x_norm) ** 1.65)
    lumbar_push = -0.022 * math.exp(-((z_t - 0.26) / 0.20) ** 2) * (1.0 - x_norm * x_norm)
    return recline + side_wrap + lumbar_push


def back_surface(name, mat):
    nx, nz = 31, 37
    z0, z1 = 0.625, 1.245
    verts = []
    faces = []
    for iz in range(nz):
        z_t = iz / (nz - 1)
        z = z0 + (z1 - z0) * z_t
        # Follow the closed frame's rounded caps; this prevents any rectangular
        # membrane corners from projecting beyond the perimeter tube.
        cap = max(0.0, math.sin(math.pi * z_t)) ** 0.55
        width = (back_width(z_t) - 0.020) * cap
        for ix in range(nx):
            u = ix / (nx - 1)
            x_norm = -1.0 + 2.0 * u
            x = width * x_norm
            y = back_y(x_norm, z_t)
            # A tiny saddle response keeps broad highlights from reading flat.
            z_relief = 0.004 * math.cos(x_norm * math.pi) * math.sin(z_t * math.pi)
            verts.append((x, y, z + z_relief))
    for iz in range(nz - 1):
        for ix in range(nx - 1):
            a = iz * nx + ix
            faces.append((a, a + 1, a + 1 + nx, a + nx))
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    solid = obj.modifiers.new("tensioned membrane thickness", "SOLIDIFY")
    solid.thickness = 0.0035
    solid.offset = 0.0
    apply_modifier(obj, solid)
    smooth(obj)
    assign(obj, mat)
    return obj


def back_frame_points(inset=0.0):
    pts = []
    z0, z1 = 0.615 + inset, 1.255 - inset
    # Closed loop sampled from an ellipse, with width changing over height.
    for i in range(72):
        a = 2.0 * math.pi * i / 72.0
        z_t = 0.5 + 0.5 * math.sin(a)
        z = z0 + (z1 - z0) * z_t
        x_norm = math.cos(a)
        width = max(0.04, back_width(z_t) - inset * 0.55)
        x = width * x_norm
        y = back_y(x_norm, z_t) + 0.008
        pts.append((x, y, z))
    return pts


def add_caster(index, angle, mats):
    graphite, rubber, copper = mats
    radius = 0.355
    x, y = radius * math.cos(angle), radius * math.sin(angle)
    tangent = (-math.sin(angle), math.cos(angle), 0)

    # Twin wheels are offset around a tangent axis, while the fork rises radially inward.
    for side in (-1, 1):
        offset = 0.018 * side
        wx = x + tangent[0] * offset
        wy = y + tangent[1] * offset
        wheel = cylinder(
            f"Caster_{index:02d}_Wheel_{'L' if side < 0 else 'R'}",
            (wx, wy, 0.052), 0.040, 0.018, rubber, direction=tangent, vertices=36,
        )
        torus(
            f"Caster_{index:02d}_Tread_{'L' if side < 0 else 'R'}",
            (wx, wy, 0.052), 0.033, 0.007, rubber,
            rotation=(math.pi / 2, 0, angle), major_segments=36, minor_segments=10,
        )
    cylinder(f"Caster_{index:02d}_Hub", (x, y, 0.052), 0.010, 0.055, copper, direction=tangent, vertices=32)
    fork_base = (x * 0.96, y * 0.96, 0.092)
    fork_left = (x + tangent[0] * 0.029, y + tangent[1] * 0.029, 0.064)
    fork_right = (x - tangent[0] * 0.029, y - tangent[1] * 0.029, 0.064)
    tube_curve(f"Caster_{index:02d}_Fork_L", [fork_base, fork_left], 0.009, graphite)
    tube_curve(f"Caster_{index:02d}_Fork_R", [fork_base, fork_right], 0.009, graphite)
    cylinder(f"Caster_{index:02d}_Stem", (x * 0.92, y * 0.92, 0.105), 0.010, 0.050, graphite)


def build_chair():
    reset_scene()

    graphite = material("Graphite_Satin", (0.030, 0.038, 0.047), 0.10, 0.31)
    graphite_soft = material("Graphite_Soft", (0.055, 0.064, 0.073), 0.0, 0.48)
    rubber = material("Black_Elastomer", (0.014, 0.017, 0.020), 0.0, 0.67)
    basalt_textile = material("Basalt_Textile", (0.205, 0.190, 0.178), 0.0, 0.72)
    mesh_mat = material("Suspension_Mesh", (0.070, 0.090, 0.105), 0.0, 0.56, alpha=0.90)
    copper = material("Anodized_Copper", (0.38, 0.115, 0.052), 0.88, 0.28)
    steel = material("Brushed_Steel", (0.34, 0.38, 0.42), 0.92, 0.25)

    # Five-star base and casters.
    cylinder("Base_Hub", (0, 0, 0.135), 0.082, 0.085, graphite, vertices=64)
    torus("Base_Hub_Accent", (0, 0, 0.177), 0.064, 0.004, copper, major_segments=64)
    for i in range(5):
        angle = math.radians(-90 + i * 72)
        tapered_leg(f"Base_Leg_{i:02d}", angle, 0.055, 0.325, 0.053, 0.025, 0.145, 0.100, 0.042, graphite)
        add_caster(i, angle, (graphite, rubber, copper))

    # Gas lift, bellows, and tilt mechanism.
    cylinder("Gas_Lift_Chrome", (0, 0, 0.285), 0.026, 0.265, steel, vertices=64)
    cylinder("Gas_Lift_Outer", (0, 0, 0.285), 0.043, 0.185, graphite, vertices=64)
    for iz in range(5):
        torus("Bellows_Ring_%02d" % iz, (0, 0, 0.355 + iz * 0.015), 0.041 - iz * 0.002, 0.007, rubber, major_segments=48)
    rounded_box("Tilt_Housing", (0, 0.035, 0.440), (0.245, 0.255, 0.090), 0.030, graphite, rotation=(math.radians(-2), 0, 0))
    rounded_box("Tilt_Housing_Underside", (0, 0.055, 0.405), (0.180, 0.205, 0.040), 0.018, graphite_soft)

    # Seat pan, floating cushion, and perimeter piping.
    rounded_box("Seat_Pan", (0, -0.035, 0.493), (0.545, 0.465, 0.072), 0.050, graphite, rotation=(math.radians(-2), 0, 0), bevel_segments=6)
    rounded_box("Seat_Cushion", (0, -0.055, 0.531), (0.510, 0.435, 0.083), 0.060, basalt_textile, rotation=(math.radians(-2), 0, 0), bevel_segments=7)
    seat_pipe = []
    for i in range(80):
        a = 2 * math.pi * i / 80
        # Superellipse-like inset perimeter.
        ca, sa = math.cos(a), math.sin(a)
        x = 0.247 * math.copysign(abs(ca) ** 0.72, ca)
        y = -0.055 + 0.209 * math.copysign(abs(sa) ** 0.72, sa)
        z = 0.551 - 0.010 * (y + 0.055) / 0.209
        seat_pipe.append((x, y, z))
    tube_curve("Seat_Piping", seat_pipe, 0.0045, graphite_soft, cyclic=True, bevel_resolution=3)
    rounded_box("Seat_Front_Flex_Edge", (0, -0.270, 0.507), (0.410, 0.027, 0.035), 0.013, graphite_soft)

    # Back membrane and dual perimeter frame.
    back_surface("Back_Suspension_Membrane", mesh_mat)
    tube_curve("Back_Outer_Frame", back_frame_points(0.0), 0.0195, graphite, cyclic=True, bevel_resolution=5)
    tube_curve("Back_Inner_Copper_Reveal", back_frame_points(0.023), 0.0052, copper, cyclic=True, bevel_resolution=3)

    # Sculptural central support: lower mast, forked yoke, and lumbar leaf.
    tube_curve("Back_Central_Mast", [(0, 0.270, 0.465), (0, 0.305, 0.610), (0, 0.325, 0.790), (0, 0.320, 0.965)], 0.028, graphite, bevel_resolution=5)
    tube_curve("Back_Yoke_Left", [(0, 0.320, 0.835), (-0.050, 0.318, 0.935), (-0.145, 0.292, 1.055), (-0.220, 0.270, 1.120)], 0.014, copper, bevel_resolution=4)
    tube_curve("Back_Yoke_Right", [(0, 0.320, 0.835), (0.050, 0.318, 0.935), (0.145, 0.292, 1.055), (0.220, 0.270, 1.120)], 0.014, copper, bevel_resolution=4)
    rounded_box("Lumbar_Support", (0, 0.292, 0.895), (0.300, 0.028, 0.090), 0.025, graphite_soft, rotation=(math.radians(-6), 0, 0), bevel_segments=6)
    rounded_box("Lumbar_Copper_Inlay", (0, 0.275, 0.895), (0.168, 0.008, 0.013), 0.004, copper, rotation=(math.radians(-6), 0, 0), bevel_segments=3)

    # Arm posts, visible pivot collars, and soft pads.
    for side, x in (("L", -0.325), ("R", 0.325)):
        sx = -1 if x < 0 else 1
        tube_curve(f"Arm_{side}_Lower", [(sx * 0.245, 0.035, 0.455), (sx * 0.300, 0.055, 0.575), (x, 0.025, 0.684)], 0.022, graphite, bevel_resolution=5)
        cylinder(f"Arm_{side}_Pivot", (x, 0.025, 0.684), 0.030, 0.042, copper, direction=(1, 0, 0), vertices=48)
        rounded_box(f"Arm_{side}_Upright", (x, -0.015, 0.718), (0.048, 0.085, 0.115), 0.018, graphite, rotation=(math.radians(4), 0, 0), bevel_segments=5)
        rounded_box(f"Arm_{side}_Pad", (x, -0.085, 0.786), (0.088, 0.255, 0.048), 0.025, rubber, rotation=(0, 0, math.radians(sx * 2)), bevel_segments=7)
        rounded_box(f"Arm_{side}_Pad_Reveal", (x, -0.086, 0.759), (0.072, 0.215, 0.006), 0.003, copper, rotation=(0, 0, math.radians(sx * 2)), bevel_segments=2)

    # Control hardware on the user's right side; small, but readable in proof view.
    cylinder("Tilt_Control_Dial", (0.300, 0.105, 0.447), 0.043, 0.026, copper, direction=(1, 0, 0), vertices=64)
    torus("Tilt_Control_Dial_Rim", (0.316, 0.105, 0.447), 0.032, 0.004, graphite_soft, rotation=(0, math.pi / 2, 0), major_segments=48)
    tube_curve("Height_Control_Lever", [(0.245, -0.040, 0.462), (0.315, -0.065, 0.455), (0.365, -0.080, 0.445)], 0.009, graphite, bevel_resolution=4)
    rounded_box("Height_Control_Paddle", (0.372, -0.082, 0.444), (0.035, 0.065, 0.018), 0.008, rubber, rotation=(math.radians(10), 0, math.radians(-15)), bevel_segments=4)

    # Convert curve tubes to render meshes so the GLB contains all authored form.
    for obj in list(bpy.context.scene.objects):
        if obj.type == "CURVE":
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            bpy.ops.object.convert(target="MESH")
            smooth(obj)
            obj.select_set(False)

    root = bpy.data.objects.new("VELA_01_Root", None)
    bpy.context.collection.objects.link(root)
    for obj in list(bpy.context.scene.objects):
        if obj != root and obj.parent is None:
            obj.parent = root

    root["asset_id"] = "vela-chair-01"
    root["semantic_state"] = "rest"
    root["units"] = "meters"
    root["front_axis"] = "-Y"

    bpy.context.scene["asset_id"] = "vela-chair-01"
    bpy.context.scene["fidelity_lane"] = "polished-stylized"


def save_and_export():
    os.makedirs(os.path.dirname(BLEND_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(GLB_PATH), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        export_extras=True,
        export_yup=True,
    )


if __name__ == "__main__":
    build_chair()
    save_and_export()
    print("VELA chair exported:", GLB_PATH)
