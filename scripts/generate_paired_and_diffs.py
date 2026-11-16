import os
import shutil
from PIL import Image, ImageChops, ImageDraw, ImageFont

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'audit_screenshots', 'phase4_6'))
PAIRED_DIR = os.path.join(BASE_DIR, 'paired')
DIFF_DIR = os.path.join(BASE_DIR, 'differences')
ARTIFACT_DIR = r'C:\Users\user\.gemini\antigravity\brain\488a2d5f-72c4-43de-a15c-abbf8d7ca837'
ARTIFACT_PAIRED = os.path.join(ARTIFACT_DIR, 'paired')
ARTIFACT_DIFF = os.path.join(ARTIFACT_DIR, 'differences')

for d in [PAIRED_DIR, DIFF_DIR, ARTIFACT_PAIRED, ARTIFACT_DIFF]:
    os.makedirs(d, exist_ok=True)

ITEMS = [
    ('01_main_screen', 'Main Screen (1440x900)'),
    ('02_chat_list', 'Chat List & Navigation (1440x900)'),
    ('03_active_conversation', 'Active Private Conversation (1440x900)'),
    ('04_message_bubbles', 'Incoming & Outgoing Message Bubbles'),
    ('05_chat_header', 'Chat Header (56px)'),
    ('06_message_composer', 'Floating Message Composer Capsule'),
    ('07_context_menu', 'Message Context Menu'),
    ('08_emoji_picker', 'Emoji Picker Tab'),
    ('09_sticker_picker', 'Sticker Picker Tab'),
    ('10_profile_panel', 'Profile Panel Drawer'),
    ('11_settings', 'Settings View & Grouped Cards'),
    ('12_mobile_conversation', 'Mobile Conversation (375x812)')
]

def make_side_by_side(tg_path, becu_path, out_path, title):
    img_tg = Image.open(tg_path).convert('RGB')
    img_becu = Image.open(becu_path).convert('RGB')

    # Normalize height to match taller image
    target_h = max(img_tg.height, img_becu.height)
    if img_tg.height != target_h:
        w_tg = int(img_tg.width * (target_h / img_tg.height))
        img_tg = img_tg.resize((w_tg, target_h), Image.Resampling.LANCZOS)
    if img_becu.height != target_h:
        w_becu = int(img_becu.width * (target_h / img_becu.height))
        img_becu = img_becu.resize((w_becu, target_h), Image.Resampling.LANCZOS)

    header_h = 60
    total_w = img_tg.width + img_becu.width + 10
    total_h = target_h + header_h

    canvas = Image.new('RGB', (total_w, total_h), (24, 24, 27))
    draw = ImageDraw.Draw(canvas)

    # Header
    draw.text((20, 20), f"TELEGRAM WEB A (Reference): {title}", fill=(51, 144, 236))
    draw.text((img_tg.width + 30, 20), f"BECUGRAM (Target): {title}", fill=(52, 211, 153))

    # Paste
    canvas.paste(img_tg, (0, header_h))
    canvas.paste(img_becu, (img_tg.width + 10, header_h))

    canvas.save(out_path, quality=92)
    return canvas

def make_difference(tg_path, becu_path, out_path):
    img_tg = Image.open(tg_path).convert('RGB')
    img_becu = Image.open(becu_path).convert('RGB')

    # Resize to identical dimensions
    common_size = (min(img_tg.width, img_becu.width), min(img_tg.height, img_becu.height))
    img_tg = img_tg.resize(common_size, Image.Resampling.LANCZOS)
    img_becu = img_becu.resize(common_size, Image.Resampling.LANCZOS)

    diff = ImageChops.difference(img_tg, img_becu)
    # Enhance difference visibility
    diff = diff.point(lambda p: min(255, p * 3))

    header_h = 40
    canvas = Image.new('RGB', (common_size[0], common_size[1] + header_h), (15, 15, 18))
    draw = ImageDraw.Draw(canvas)
    draw.text((20, 12), f"Visual Pixel Difference (Amplified 3x)", fill=(244, 63, 94))
    canvas.paste(diff, (0, header_h))

    canvas.save(out_path, quality=92)
    return canvas

print("--- Generating Paired Comparisons and Differences ---")
for prefix, title in ITEMS:
    tg_file = os.path.join(BASE_DIR, f"{prefix}_telegram.png")
    becu_file = os.path.join(BASE_DIR, f"{prefix}_becugram.png")

    if not os.path.exists(tg_file) or not os.path.exists(becu_file):
        print(f"Skipping {prefix}: files not found")
        continue

    # 1. Paired side-by-side
    paired_out = os.path.join(PAIRED_DIR, f"paired_{prefix}.png")
    make_side_by_side(tg_file, becu_file, paired_out, title)
    shutil.copyfile(paired_out, os.path.join(ARTIFACT_PAIRED, f"paired_{prefix}.png"))
    print(f"Generated paired_{prefix}.png")

    # 2. Difference image for primary screens
    if prefix in ['01_main_screen', '04_message_bubbles', '05_chat_header', '12_mobile_conversation']:
        diff_out = os.path.join(DIFF_DIR, f"diff_{prefix}.png")
        make_difference(tg_file, becu_file, diff_out)
        shutil.copyfile(diff_out, os.path.join(ARTIFACT_DIFF, f"diff_{prefix}.png"))
        print(f"Generated diff_{prefix}.png")

print("--- All Paired and Difference Images Generated Successfully ---")
