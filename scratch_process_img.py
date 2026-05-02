import sys
from PIL import Image, ImageChops

def process(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # Find bounding box to crop the massive white space
    bg = Image.new("RGBA", img.size, (255,255,255,255))
    diff = ImageChops.difference(img, bg)
    bbox = diff.getbbox()
    
    if bbox:
        # Add 10px padding
        pad = 10
        bbox = (
            max(0, bbox[0]-pad), 
            max(0, bbox[1]-pad), 
            min(img.width, bbox[2]+pad), 
            min(img.height, bbox[3]+pad)
        )
        img = img.crop(bbox)
        
    datas = img.getdata()
    newData = []
    
    for item in datas:
        r, g, b, a = item
        
        # If pixel is white or very light gray, make it transparent
        if r > 235 and g > 235 and b > 235:
            newData.append((255, 255, 255, 0))
        # If pixel is very dark (the DRONEACHILE text), make it white so it reads on dark bg
        elif r < 60 and g < 60 and b < 80:
            newData.append((255, 255, 255, a))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Processed image saved to {output_path}")

if __name__ == '__main__':
    process(sys.argv[1], sys.argv[2])
