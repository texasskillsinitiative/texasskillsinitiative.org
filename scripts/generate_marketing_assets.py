from pathlib import Path
from PIL import Image, ImageDraw


def make_gradient(size, colors, direction='vertical'):
    width, height = size
    base = Image.new('RGBA', size)
    draw = ImageDraw.Draw(base)
    steps = max(width, height)
    for i in range(steps):
        t = i / max(steps - 1, 1)
        pos = int(t * (width - 1)) if direction == 'horizontal' else int(t * (height - 1))
        start = colors[0]
        end = colors[-1]
        r = int(start[0] + (end[0] - start[0]) * t)
        g = int(start[1] + (end[1] - start[1]) * t)
        b = int(start[2] + (end[2] - start[2]) * t)
        a = int(start[3] + (end[3] - start[3]) * t) if len(start) > 3 else 255
        line = [(pos, 0), (pos, height)] if direction == 'horizontal' else [(0, pos), (width, pos)]
        draw.line(line, fill=(r, g, b, a))
    return base


def create_asset(path, size, gradient_colors):
    img = make_gradient(size, gradient_colors)
    draw = ImageDraw.Draw(img)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)


def main():
    assets = [
        (Path('assets/pages/rubric/rubric-phase-01-refined.png'), (640, 320), ((20, 34, 56, 255), (94, 122, 169, 255))),
        (Path('assets/pages/rubric/rubric-phase-02-refined.png'), (640, 320), ((25, 45, 35, 255), (118, 160, 99, 255))),
        (Path('assets/pages/rubric/rubric-phase-03-refined.png'), (640, 320), ((10, 24, 32, 255), (177, 111, 69, 255))),
        (Path('assets/pages/rubric/rubric-phase-04-refined.png'), (640, 320), ((18, 18, 38, 255), (102, 66, 138, 255))),
        (Path('assets/pages/engagement/engagement-hero-connection.png'), (900, 400), ((16, 20, 32, 255), (76, 60, 112, 255))),
        (Path('assets/pages/engagement/engagement-personas.png'), (720, 360), ((15, 36, 38, 255), (90, 158, 146, 255)))
    ]
    for path, size, colors in assets:
        create_asset(path, size, colors)


if __name__ == '__main__':
    main()
