import os
import shutil
from PIL import Image, ImageChops, ImageDraw

TG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'audit_screenshots', 'phase4_6'))
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'audit_screenshots', 'phase4_7'))
PAIRED_DIR = os.path.join(BASE_DIR, 'paired')
DIFF_DIR = os.path.join(BASE_DIR, 'differences')
ARTIFACT_DIR = r'C:\Users\user\.gemini\antigravity\brain\488a2d5f-72c4-43de-a15c-abbf8d7ca837'
ARTIFACT_PAIRED = os.path.join(ARTIFACT_DIR, 'phase4_7_paired')
ARTIFACT_DIFF = os.path.join(ARTIFACT_DIR, 'phase4_7_differences')

for d in [PAIRED_DIR, DIFF_DIR, ARTIFACT_PAIRED, ARTIFACT_DIFF]:
    os.makedirs(d, exist_ok=True)

MAPPINGS = [
    # (telegram_file, becugram_relative_file, out_name, title)
    ('01_main_screen_telegram.png', os.path.join('after', 'after_main_light.png'), 'paired_01_main_screen.png', 'Main Screen (1440x900)'),
    ('02_chat_list_telegram.png', os.path.join('after', 'after_main_light.png'), 'paired_02_chat_list.png', 'Chat List & Navigation Header'),
    ('03_active_conversation_telegram.png', os.path.join('after', 'after_chat_light.png'), 'paired_03_active_conversation.png', 'Active Conversation View (1440x900)'),
    ('04_message_bubbles_telegram.png', os.path.join('interaction_states', 'bubbles_and_tails_light.png'), 'paired_04_message_bubbles.png', 'Incoming & Outgoing Message Bubbles & Tails'),
    ('05_chat_header_telegram.png', os.path.join('after', 'after_chat_light.png'), 'paired_05_chat_header.png', 'Chat Header & Action Buttons'),
    ('06_message_composer_telegram.png', os.path.join('interaction_states', 'bubbles_and_tails_light.png'), 'paired_06_message_composer.png', 'Floating Composer Capsule & Media Buttons'),
    ('07_context_menu_telegram.png', os.path.join('interaction_states', 'context_menu_light.png'), 'paired_07_context_menu.png', 'Message Right-Click Context Menu'),
    ('08_emoji_picker_telegram.png', os.path.join('interaction_states', 'emoji_picker_light.png'), 'paired_08_emoji_picker.png', 'Emoji Tab in Reaction Capsule'),
    ('09_sticker_picker_telegram.png', os.path.join('interaction_states', 'sticker_picker_light.png'), 'paired_09_sticker_picker.png', 'Sticker Tab in Reaction Capsule'),
    ('10_profile_panel_telegram.png', os.path.join('after', 'after_chat_light.png'), 'paired_10_profile_panel.png', 'Profile Panel Drawer'),
    ('11_settings_telegram.png', os.path.join('interaction_states', 'settings_view_light.png'), 'paired_11_settings.png', 'Settings Modal & Navigation Items'),
    ('12_mobile_conversation_telegram.png', os.path.join('mobile', 'mobile_375x812_chat.png'), 'paired_12_mobile_conversation.png', 'Mobile Conversation (375x812)')
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

    # Header labels
    draw.text((24, 20), f"TELEGRAM WEB A (Reference): {title}", fill=(51, 144, 236))
    draw.text((img_tg.width + 30, 20), f"BECUGRAM PHASE 4.7 (Target): {title}", fill=(52, 211, 153))

    canvas.paste(img_tg, (0, header_h))
    canvas.paste(img_becu, (img_tg.width + 12, header_h))

    canvas.save(out_path, quality=92)
    return canvas

def make_difference(tg_path, becu_path, out_path):
    img_tg = Image.open(tg_path).convert('RGB')
    img_becu = Image.open(becu_path).convert('RGB')

    common_size = (min(img_tg.width, img_becu.width), min(img_tg.height, img_becu.height))
    img_tg = img_tg.resize(common_size, Image.Resampling.LANCZOS)
    img_becu = img_becu.resize(common_size, Image.Resampling.LANCZOS)

    diff = ImageChops.difference(img_tg, img_becu)
    diff = diff.point(lambda p: min(255, p * 3))

    header_h = 40
    canvas = Image.new('RGB', (common_size[0], common_size[1] + header_h), (15, 15, 18))
    draw = ImageDraw.Draw(canvas)
    draw.text((20, 12), "Visual Pixel Difference (Amplified 3x)", fill=(244, 63, 94))
    canvas.paste(diff, (0, header_h))

    canvas.save(out_path, quality=92)
    return canvas

print("--- Generating Phase 4.7 Paired Comparisons and Differences ---")
for tg_rel, becu_rel, out_name, title in MAPPINGS:
    tg_file = os.path.join(TG_DIR, tg_rel)
    becu_file = os.path.join(BASE_DIR, becu_rel)

    if not os.path.exists(tg_file):
        print(f"Skipping {out_name}: tg_file not found ({tg_file})")
        continue
    if not os.path.exists(becu_file):
        print(f"Skipping {out_name}: becu_file not found ({becu_file})")
        continue

    paired_out = os.path.join(PAIRED_DIR, out_name)
    make_side_by_side(tg_file, becu_file, paired_out, title)
    shutil.copyfile(paired_out, os.path.join(ARTIFACT_PAIRED, out_name))
    print(f"Generated {out_name}")

    # Difference for key visual landmarks
    if 'main_screen' in out_name or 'message_bubbles' in out_name or 'chat_header' in out_name or 'mobile_conversation' in out_name:
        diff_name = out_name.replace('paired_', 'diff_')
        diff_out = os.path.join(DIFF_DIR, diff_name)
        make_difference(tg_file, becu_file, diff_out)
        shutil.copyfile(diff_out, os.path.join(ARTIFACT_DIFF, diff_name))
        print(f"Generated {diff_name}")

print("--- Complete! ---")
