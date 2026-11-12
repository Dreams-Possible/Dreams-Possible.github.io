"""手动生成网页使用的两张半透明雾纹理。

先安装依赖 python -m pip install Pillow，再在仓库根目录运行
python scripts/generate_fog.py。脚本在本地生成 960×600 的 WebP 图片，
写入并覆盖 assets/fog-cyan.webp 和 assets/fog-secondary.webp。

网页通过 assets/css/effects.css 加载生成的图片，浏览器不执行此脚本。
仅调整雾纹理时需要重新运行，普通预览和项目维护直接使用现有图片。
生成过程无需联网，不修改项目清单，也不提交或发布网站。
"""

from pathlib import Path
from random import Random
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets"
SIZE = (960, 600)


def field(seed: int, grid: tuple[int, int]) -> Image.Image:
    rng = Random(seed)
    pixels = bytes(rng.randrange(256) for _ in range(grid[0] * grid[1]))
    return Image.frombytes("L", grid, pixels).resize(SIZE, Image.Resampling.BICUBIC)


def create(name: str, seed: int, color: tuple[int, int, int]) -> None:
    broad = field(seed, (5, 5)).tobytes()
    medium = field(seed + 1, (16, 12)).tobytes()
    fine = field(seed + 2, (39, 28)).tobytes()
    warp = field(seed + 3, (7, 8)).tobytes()
    alpha = bytearray(SIZE[0] * SIZE[1])
    for y in range(SIZE[1]):
        yn = y / SIZE[1]
        for x in range(SIZE[0]):
            index = y * SIZE[0] + x
            xn = x / SIZE[0]
            # An irregular, feathered envelope leaves clear gaps and avoids a wave path.
            center = .48 + (warp[index] / 255 - .5) * .23
            spread = .29 + (broad[index] / 255 - .5) * .10
            envelope = max(0, 1 - abs(yn - center) / spread) ** 1.5
            edge = max(0, 1 - abs(xn - .5) * 2) ** .7
            texture = broad[index] * .30 + medium[index] * .46 + fine[index] * .24
            density = max(0, (texture - 91) / 105)
            alpha[index] = min(160, round(145 * envelope * edge * density))
    mask = Image.frombytes("L", SIZE, bytes(alpha)).filter(ImageFilter.GaussianBlur(5))
    image = Image.new("RGB", SIZE, color)
    image.putalpha(mask)
    OUT.mkdir(exist_ok=True)
    image.save(OUT / name, "WEBP", quality=83, method=6)


if __name__ == "__main__":
    create("fog-cyan.webp", 41, (37, 181, 202))
    create("fog-secondary.webp", 117, (37, 181, 202))
