import shutil
import os

source_full = r"C:\Users\shali\.gemini\antigravity\brain\31f426c5-f994-4d37-84b2-38d16d67b029\shakti_ai_full_logo_1777731464061.png"
source_icon = r"C:\Users\shali\.gemini\antigravity\brain\31f426c5-f994-4d37-84b2-38d16d67b029\shakti_ai_icon_only_1777731756107.png"

dest_dir = r"c:\Users\shali\OneDrive\Documents\AI_Shakti_project\frontend\public"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

shutil.copy(source_full, os.path.join(dest_dir, "shakti_full_logo.png"))
shutil.copy(source_icon, os.path.join(dest_dir, "shakti_icon.png"))

print("Logos copied successfully!")
