#!/usr/bin/env python3
import os, json, base64
from io import BytesIO
from collections import deque
import numpy as np
from PIL import Image

SPRITES_DIR = os.path.expanduser("~/Desktop/sprites")
PREVIEW_DIR = os.path.expanduser("~/Desktop/sprites_processed")
OUT_JSON = "/tmp/sprites_poses_b64.json"

os.makedirs(PREVIEW_DIR, exist_ok=True)

def remove_bg(img):
    img = img.convert("RGBA")
    data = np.array(img)
    h, w = data.shape[:2]

    # Sample bg color from corners
    n = 8
    samples = np.concatenate([
        data[:n,:n,:3].reshape(-1,3), data[:n,-n:,:3].reshape(-1,3),
        data[-n:,:n,:3].reshape(-1,3), data[-n:,-n:,:3].reshape(-1,3),
    ])
    bg = samples.mean(axis=0).astype(int)

    def is_bg(r, g, b):
        dist = max(abs(int(r)-bg[0]), abs(int(g)-bg[1]), abs(int(b)-bg[2]))
        return dist < 55 or (r > 200 and g > 200 and b > 200)

    # Phase 1: flood fill from edges (removes detected bg + white)
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()
    for x in range(w): queue.append((0,x)); queue.append((h-1,x))
    for y in range(h): queue.append((y,0)); queue.append((y,w-1))
    while queue:
        y, x = queue.popleft()
        if visited[y,x]: continue
        visited[y,x] = True
        r,g,b,a = data[y,x]
        if is_bg(r, g, b):
            data[y,x,3] = 0
            for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:
                ny,nx = y+dy,x+dx
                if 0<=ny<h and 0<=nx<w and not visited[ny,nx]:
                    queue.append((ny,nx))

    # Phase 2: fresh pass from transparent boundary — catches white inner box
    # blocked by a dark frame in Phase 1 (separate visited2 to re-examine frame pixels)
    visited2 = np.zeros((h, w), dtype=bool)
    queue2 = deque()
    transparent = data[:,:,3] == 0
    for y in range(h):
        for x in range(w):
            if not transparent[y,x]: continue
            for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:
                ny,nx = y+dy,x+dx
                if 0<=ny<h and 0<=nx<w and not transparent[ny,nx]:
                    queue2.append((ny,nx))
    while queue2:
        y,x = queue2.popleft()
        if visited2[y,x]: continue
        visited2[y,x] = True
        r,g,b,a = data[y,x]
        if r > 185 and g > 185 and b > 185:  # white/near-white only
            data[y,x,3] = 0
            transparent[y,x] = True
            for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:
                ny,nx = y+dy,x+dx
                if 0<=ny<h and 0<=nx<w and not visited2[ny,nx]:
                    queue2.append((ny,nx))

    return Image.fromarray(data)

def pad_square_resize(img, size=200):
    bbox = img.getbbox()
    if bbox: img = img.crop(bbox)
    cw, ch = img.size
    dim = max(cw, ch)
    square = Image.new("RGBA", (dim,dim), (0,0,0,0))
    square.paste(img, ((dim-cw)//2, (dim-ch)//2))
    return square.resize((size,size), Image.Resampling.LANCZOS)

def to_b64(img):
    buf = BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

cats = {}
for fname in sorted(os.listdir(SPRITES_DIR)):
    if not fname.endswith(".png"): continue
    parts = fname.replace(".png","").split("_")
    if len(parts) < 2: continue
    cat_id, pose = parts[0], parts[1]
    try:
        img = Image.open(os.path.join(SPRITES_DIR, fname))
        img = remove_bg(img)
        img = pad_square_resize(img)
        # Save preview (white bg for visibility)
        preview = Image.new("RGBA", img.size, (255,255,255,255))
        preview.paste(img, mask=img)
        preview.save(os.path.join(PREVIEW_DIR, fname))
        b64 = to_b64(img)
        if cat_id not in cats: cats[cat_id] = {}
        cats[cat_id][pose] = b64
        print(f"  ✓ {cat_id}/{pose} ({len(b64)//1024}kb)")
    except Exception as e:
        print(f"  ✗ {fname}: {e}")

result = {}
for cat_id, poses in cats.items():
    ordered = [poses[p] for p in ["sit","mid","tro"] if p in poses]
    if ordered: result[cat_id] = ordered

with open(OUT_JSON, "w") as f: json.dump(result, f)
print(f"\nSaved {OUT_JSON} — {os.path.getsize(OUT_JSON)//1024}kb")
