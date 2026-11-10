# Draws every changed region on the new image, and enlarges the regions outside
# the photos' corners: old, new, and the difference amplified eight times.
#   python3 review-regions.py <old folder> <new folder> <regions folder> <output folder>
import json
import sys
from PIL import Image, ImageChops, ImageDraw

old_folder, new_folder, regions_folder, output_folder = sys.argv[1:5]
outside = {
    'light': [('Fourth tile, bottom-right corner of its border', (1251, 322))],
    'dark': [
        ('Search field, top-right corner', (1247, 103)),
        ('Search field, bottom-right corner', (1247, 134)),
        ('Clay mug check badge, outline (the bright arc is the photo corner beside it)', (949, 177)),
        ('Fourth tile, bottom-right corner of its border', (1253, 322)),
        ('Add selected button, top-left corner', (1149, 748)),
    ],
}
for mode, picks in outside.items():
    old = Image.open(f'{old_folder}/{mode}.png').convert('RGB')
    new = Image.open(f'{new_folder}/{mode}.png').convert('RGB')
    regions = json.load(open(f'{regions_folder}/old-vs-new-regions-{mode}.json'))['regions']
    marked = new.copy()
    draw = ImageDraw.Draw(marked)
    for region in regions:
        colour = (220, 0, 220) if region['counted'] else (0, 160, 255)
        draw.rectangle([region['left'] - 6, region['top'] - 6, region['right'] + 6, region['bottom'] + 6], outline=colour, width=2)
    marked.save(f'{output_folder}/{mode}-changed-regions.png', optimize=True)
    rows = []
    for label, (x, y) in picks:
        box = (max(x - 16, 0), max(y - 16, 0), min(x + 24, old.width), min(y + 24, old.height))
        before, after = old.crop(box), new.crop(box)
        difference = ImageChops.difference(before, after).point(lambda value: min(255, value * 8))
        scale = 6
        width, height = before.size
        row = Image.new('RGB', (width * scale * 3 + 40, height * scale + 24), (128, 128, 128))
        for index, image in enumerate([before, after, difference]):
            row.paste(image.resize((width * scale, height * scale), Image.NEAREST), (index * (width * scale + 20), 24))
        ImageDraw.Draw(row).text((4, 4), f'{label}: old, new, difference x8', fill=(255, 255, 255))
        rows.append(row)
    sheet = Image.new('RGB', (max(r.width for r in rows), sum(r.height + 8 for r in rows)), (64, 64, 64))
    top = 0
    for row in rows:
        sheet.paste(row, (0, top))
        top += row.height + 8
    sheet.save(f'{output_folder}/{mode}-outside-photo-corners-zoom.png', optimize=True)
