import os
import urllib.request
from PIL import Image, ImageDraw, ImageFilter
import io

os.makedirs("apps/web/public/images", exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def download_image(url, target_path, max_width=None, quality=80):
    print(f"Baixando {url} -> {target_path}...")
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        content = resp.read()
    
    img = Image.open(io.BytesIO(content)).convert("RGB")
    if max_width and img.width > max_width:
        ratio = max_width / img.width
        new_size = (max_width, int(img.height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
    
    img.save(target_path, "JPEG", quality=quality, optimize=True)
    size_kb = os.path.getsize(target_path) / 1024
    print(f"Salvo: {target_path} ({img.width}x{img.height}, {size_kb:.1f} KB)")
    return img

# 1. Hero Forest (Landscape)
hero_img = download_image(
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=2400&q=80&fm=jpg",
    "apps/web/public/images/hero-forest.jpg",
    max_width=2400,
    quality=80
)

# 2. Hero Forest Mobile (Portrait 1080x1920 crop)
w, h = hero_img.size
target_ratio = 1080 / 1920
current_ratio = w / h

if current_ratio > target_ratio:
    # Corta as laterais
    crop_w = int(h * target_ratio)
    offset = (w - crop_w) // 2
    mobile_img = hero_img.crop((offset, 0, offset + crop_w, h))
else:
    # Corta topo/baixo
    crop_h = int(w / target_ratio)
    offset = (h - crop_h) // 2
    mobile_img = hero_img.crop((0, offset, w, offset + crop_h))

mobile_img = mobile_img.resize((1080, 1920), Image.Resampling.LANCZOS)
mobile_img.save("apps/web/public/images/hero-forest-mobile.jpg", "JPEG", quality=78, optimize=True)
print(f"Hero mobile salvo: apps/web/public/images/hero-forest-mobile.jpg ({os.path.getsize('apps/web/public/images/hero-forest-mobile.jpg')/1024:.1f} KB)")

# 3. Foliage (Por que separar)
download_image(
    "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=2400&q=80&fm=jpg",
    "apps/web/public/images/foliage.jpg",
    max_width=2400,
    quality=80
)

# 4. Glass Card Photo (Mãos com materiais recicláveis)
download_image(
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200&q=80&fm=jpg",
    "apps/web/public/images/glass-card.jpg",
    max_width=1080,
    quality=80
)

# 5. Video Thumbnail
download_image(
    "https://i.ytimg.com/vi/CyG-ZbTh_JE/hqdefault.jpg",
    "apps/web/public/images/video-thumb.jpg",
    max_width=640,
    quality=85
)

# 6. Sprout Cutout (PNG com transparência)
# Criação do broto fotográfico recortado com canal alfa transparente
# Se conseguirmos uma foto de broto e isolar o fundo, fazemos; vamos baixar uma foto de broto em fundo limpo e extrair a máscara com precisão.
print("Criando sprout cutout transparente...")
try:
    req = urllib.request.Request("https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1600&q=85&fm=jpg", headers=headers)
    with urllib.request.urlopen(req) as resp:
        sprout_raw = Image.open(io.BytesIO(resp.read())).convert("RGBA")
    
    # Processa para isolar a planta e dar transparência às bordas/fundo
    # Redimensiona
    w_sp, h_sp = sprout_raw.size
    target_h = 1200
    target_w = int(w_sp * (target_h / h_sp))
    sprout = sprout_raw.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    datas = sprout.getdata()
    newData = []
    for item in datas:
        # Detecta tons de fundo esbranquiçado/muito claro ou cinza claro das bordas
        r, g, b, a = item
        brightness = (r + g + b) / 3
        # Se for fundo muito claro ou cinza neutro
        if brightness > 230 and abs(r - g) < 25 and abs(r - b) < 25:
            newData.append((r, g, b, 0))
        elif brightness > 200 and abs(r - g) < 20 and abs(r - b) < 20:
            alpha = int(255 * (1 - (brightness - 200) / 30))
            newData.append((r, g, b, max(0, min(255, alpha))))
        else:
            newData.append((r, g, b, 255))
            
    sprout.putdata(newData)
    sprout.save("apps/web/public/images/sprout-cutout.webp", "WEBP", quality=90)
    print("Sprout cutout webp criado com sucesso!")
except Exception as e:
    print("Erro ao processar sprout da foto, criando gráfico fotográfico de broto:", e)
    sprout = Image.new("RGBA", (800, 1200), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sprout)
    # Haste e folhas verdes orgânicas
    draw.ellipse((350, 950, 450, 1150), fill=(80, 50, 30, 240)) # solo
    draw.polygon([(390, 1000), (410, 1000), (405, 500), (395, 500)], fill=(95, 141, 107, 255)) # caule
    draw.ellipse((220, 420, 400, 560), fill=(150, 188, 161, 255)) # folha esquerda
    draw.ellipse((400, 380, 580, 520), fill=(95, 141, 107, 255)) # folha direita
    draw.ellipse((350, 300, 450, 440), fill=(180, 215, 190, 255)) # broto topo
    sprout.save("apps/web/public/images/sprout-cutout.webp", "WEBP")

print("Todos os assets de imagem foram gerados com sucesso!")
