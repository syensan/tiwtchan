from PIL import Image, ImageDraw
import os
os.makedirs('public', exist_ok=True)
for size, name in [(32,'favicon.ico'),(192,'icon-192.png'),(512,'icon-512.png')]:
    img = Image.new('RGB',(size,size),'white')
    d = ImageDraw.Draw(img)
    w = max(2,size//16)
    d.rectangle([size//6, size//6, size*5//6, size//6+w], fill='black')
    d.rectangle([size//2-w//2, size//6, size//2+w//2, size*5//6], fill='black')
    img.save(f'public/{name}')
print('OK')
