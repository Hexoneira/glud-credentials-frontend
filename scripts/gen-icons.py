import struct, zlib, os

def png(width, height, pixels):
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        c += struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        return c
    raw = b""
    for y in range(height):
        raw += b"\x00" + b"".join(bytes(pixels[y][x]) for x in range(width))
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9))
            + chunk(b"IEND", b""))

def make_icon(size, path):
    px = [[(28, 33, 40, 255)] * size for _ in range(size)]  # #1c2128
    # rounded corners (alpha 0) with radius ~ 18% of size
    r = int(size * 0.18)
    def corner_dist(x, y, cx, cy):
        return ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
    for y in range(size):
        for x in range(size):
            if x < r and y < r and corner_dist(x, y, r, r) > r:
                px[y][x] = (0, 0, 0, 0)
            if x >= size - r and y < r and corner_dist(x, y, size - 1 - r, r) > r:
                px[y][x] = (0, 0, 0, 0)
            if x < r and y >= size - r and corner_dist(x, y, r, size - 1 - r) > r:
                px[y][x] = (0, 0, 0, 0)
            if x >= size - r and y >= size - r and corner_dist(x, y, size - 1 - r, size - 1 - r) > r:
                px[y][x] = (0, 0, 0, 0)
    # glowing outline
    for y in range(size):
        for x in range(size):
            if y < 2 or y >= size - 2 or x < 2 or x >= size - 2:
                if px[y][x][3] != 0:
                    px[y][x] = (34, 254, 251, 200)
    # H shape in cyan
    cyan = (34, 254, 251, 255)
    bar_w = max(2, int(size * 0.11))
    bar_h = int(size * 0.56)
    bridge_h = max(2, int(size * 0.11))
    top = int(size * 0.22)
    bar_x = int(size * 0.26)
    bar_x2 = size - bar_x - bar_w
    bridge_y = top + (bar_h - bridge_h) // 2
    for y in range(top, top + bar_h):
        for x in range(bar_x, bar_x + bar_w):
            px[y][x] = cyan
        for x in range(bar_x2, bar_x2 + bar_w):
            px[y][x] = cyan
    for y in range(bridge_y, bridge_y + bridge_h):
        for x in range(bar_x, bar_x2 + bar_w):
            px[y][x] = cyan
    with open(path, "wb") as f:
        f.write(png(size, size, px))

os.makedirs("public/icons", exist_ok=True)
make_icon(512, "public/icons/icon-512.png")
make_icon(192, "public/icons/icon-192.png")
make_icon(180, "public/icons/apple-touch-icon.png")
print("icons OK")
