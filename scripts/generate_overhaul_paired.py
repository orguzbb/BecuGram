import os
import shutil
from PIL import Image, ImageChops, ImageDraw

TG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'audit_screenshots', 'phase4_7', 'telegram'))
OVERHAUL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'audit_screenshots', 'overhaul'))
PAIRED_DIR = os.path.join(OVERHAUL_DIR, 'paired')
ARTIFACT_DIR = r'C:\Users\user\.gemini\antigravity\brain\488a2d5f-72c4-43de-a15c-abbf8d7ca837'
ARTIFACT_OVERHAUL = os.path.join(ARTIFACT_DIR, 'overhaul_paired')

os.makedirs(PAIRED_DIR, exist_ok=True)
os.makedirs(ARTIFACT_OVERHAUL, exist_ok=True)

MAPPINGS = [
    ('01_main_screen_telegram.png', '01_rebuilt_main_light.png', 'overhaul_paired_01_main.png', 'Main Screen (1440x900) Full-bleed Web A Shell'),
    ('03_active_conversation_telegram.png', '02_rebuilt_chat_grouped_bubbles.png', 'overhaul_paired_02_active_chat.png', 'Active Chat with Grouped Bubbles & Tails'),
    ('04_message_bubbles_telegram.png', '02_rebuilt_chat_grouped_bubbles.png', 'overhaul_paired_03_bubbles.png', 'Message Grouping (Start, Middle, End) & Tails'),
    ('02_chat_list_telegram.png', '03_rebuilt_hamburger_drawer.png', 'overhaul_paired_04_drawer.png', 'Slide-Out Navigation Drawer & Surface Header'),
    ('09_sticker_picker_telegram.png', '04_rebuilt_sticker_picker.png', 'overhaul_paired_05_sticker_picker.png', 'Sticker & Emoji Reaction Capsule'),
    ('01_main_screen_telegram.png', '05_rebuilt_dark_chat.png', 'overhaul_paired_06_dark_theme.png', 'Dark Theme Telegram Web A Violet Bubbles'),
    ('12_mobile_conversation_telegram.png', '07_rebuilt_mobile_chat.png', 'overhaul_paired_07_mobile_chat.png', 'Mobile Conversation View (375x812)')
]

def make_side_by_side(tg_path, becu_path, out_path, title):
    img_tg = Image.open(tg_path).convert('RGB')
    img_becu = Image.open(becu_path).convert('RGB')

    target_h = max(img_tg.height, img_becu.height)
    if img_tg.height != target_h:
        w_tg = int(img_tg.width * (target_h / img_tg.height))
        img_tg = img_tg.resize((w_tg, target_h), Image.Resampling.LANCZOS)
    if img_becu.height != target_h:
        w_becu = int(img_becu.width * (target_h / img_becu.height))
        img_becu = img_becu.resize((w_becu, target_h), Image.Resampling.LANCZOS)

    header_h = 60
    total_w = img_tg.width + img_becu.width + 12
    total_h = target_h + header_h

    canvas = Image.new('RGB', (total_w, total_h), (24, 24, 27))
    draw = ImageDraw.Draw(canvas)

    draw.text((24, 20), f"TELEGRAM WEB A (Reference): {title}", fill=(51, 144, 236))
    draw.text((img_tg.width + 30, 20), f"BECUGRAM REBUILT (Target): {title}", fill=(52, 211, 153))

    canvas.paste(img_tg, (0, header_h))
    canvas.paste(img_becu, (img_tg.width + 12, header_h))

    canvas.save(out_path, quality=92)
    return canvas

print("--- Generating Overhaul Paired Images ---")
for tg_rel, becu_rel, out_name, title in MAPPINGS:
    tg_file = os.path.join(TG_DIR, tg_rel)
    becu_file = os.path.join(OVERHAUL_DIR, becu_rel)

    if not os.path.exists(tg_file):
        print(f"Skipping {out_name}: tg_file not found ({tg_file})")
        continue
    if not os.path.exists(becu_file):
        print(f"Skipping {out_name}: becu_file not found ({becu_file})")
        continue

    paired_out = os.path.join(PAIRED_DIR, out_name)
    make_side_by_side(tg_file, becu_file, paired_out, title)
    shutil.copyfile(paired_out, os.path.join(ARTIFACT_OVERHAUL, out_name))
    print(f"Generated {out_name}")

print("--- Overhaul Paired Generation Complete! ---")
