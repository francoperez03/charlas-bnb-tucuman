# Pone el logo de BNB Chain en la tapa de la notebook del carpincho (public/mascota-carpincho.png).
# Uso: python3 scripts/carpincho-crisol.py <original.png> <salida.png>
# La original sin tocar está en ../../2026-09-28-superteam-colosseum/charlas/public/mascota-carpincho.png.
import sys
import numpy as np
from PIL import Image, ImageDraw

orig, salida = sys.argv[1], sys.argv[2]
im = Image.open(orig).convert('RGBA')

# Esquinas de la cara de la tapa, medidas a mano sobre la imagen (TL, TR, BR, BL).
TAPA = [(8, 675), (300, 727), (362, 970), (88, 925)]
GRIS = (40, 40, 40, 255)  # color medio de la tapa, muestreado

def lerp(a, b, t): return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
def interior(q, m):
    # cuadrilátero encogido hacia su centro un margen m (0..0.5) para no pisar el bisel de la tapa
    c = (sum(p[0] for p in q) / 4, sum(p[1] for p in q) / 4)
    return [lerp(p, c, m) for p in q]

# 1. tapar el logo anterior: pintar el interior de la tapa de gris
d = ImageDraw.Draw(im)
d.polygon(interior(TAPA, 0.08), fill=GRIS)

# 2. logo pixelado: se achica y se agranda sin suavizado, como el resto del voxel art
logo = Image.open('public/bnb-chain-logo-vertical.png').convert('RGBA')
logo = logo.resize((110, round(110 * logo.height / logo.width)), Image.LANCZOS)
a = np.array(logo)
a[..., 3] = np.where(a[..., 3] > 110, 255, 0)  # bordes duros
a[..., :3] = np.where(a[..., 3:] > 0, (240, 185, 11), a[..., :3])  # amarillo BNB plano
logo = Image.fromarray(a).resize((logo.width * 4, logo.height * 4), Image.NEAREST)

# 3. proyectar el logo al plano de la tapa: ocupa el 72 % del ancho, centrado
def caja(q, fx, fy):
    # subcuadrilátero centrado de fracciones fx, fy del ancho y alto (en coordenadas bilineales de la tapa)
    u0, u1, v0, v1 = (1 - fx) / 2, (1 + fx) / 2, (1 - fy) / 2, (1 + fy) / 2
    def P(u, v): return lerp(lerp(q[0], q[1], u), lerp(q[3], q[2], u), v)
    return [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]
prop = logo.height / logo.width
fx = 0.78
# alto en fracción: la tapa es más alta que ancha en pantalla, el logo mantiene su proporción aprox.
anchoTapa = np.hypot(TAPA[1][0] - TAPA[0][0], TAPA[1][1] - TAPA[0][1])
altoTapa = np.hypot(TAPA[3][0] - TAPA[0][0], TAPA[3][1] - TAPA[0][1])
fy = fx * anchoTapa * prop / altoTapa
dst = caja(TAPA, fx, fy)

def coef_perspectiva(src, dst):
    # Image.transform(PERSPECTIVE) necesita el mapeo salida→entrada: resolvemos para que dst (en la imagen) tome de src (en el logo)
    A, B = [], []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); B.append(v)
    return np.linalg.solve(np.array(A, float), np.array(B, float))
src = [(0, 0), (logo.width, 0), (logo.width, logo.height), (0, logo.height)]
capa = logo.transform(im.size, Image.PERSPECTIVE, coef_perspectiva(src, dst), Image.NEAREST)
im.alpha_composite(capa)
im.save(salida)
print('ok', salida)
