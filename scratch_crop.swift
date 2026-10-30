
import Foundation
import CoreGraphics
import ImageIO

let url = URL(fileURLWithPath: "public/telegram-qr-winterhere.jpg")
guard let imageSource = CGImageSourceCreateWithURL(url as CFURL, nil),
      let cgImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
    print("Failed to load image")
    exit(1)
}

let width = cgImage.width
let height = cgImage.height
print("Width: \(width), Height: \(height)")

// Let's inspect pixel brightness to find the white card
guard let data = cgImage.dataProvider?.data,
      let ptr = CFDataGetBytePtr(data) else {
    exit(1)
}

let bytesPerPixel = cgImage.bitsPerPixel / 8
let bytesPerRow = cgImage.bytesPerRow

var minX = width, minY = height, maxX = 0, maxY = 0

for y in 0..<height {
    for x in 0..<width {
        let offset = y * bytesPerRow + x * bytesPerPixel
        let r = ptr[offset]
        let g = ptr[offset+1]
        let b = ptr[offset+2]
        if r > 240 && g > 240 && b > 240 {
            if x < minX { minX = x }
            if y < minY { minY = y }
            if x > maxX { maxX = x }
            if y > maxY { maxY = y }
        }
    }
}
print("White card bounding box: x=\(minX), y=\(minY), maxX=\(maxX), maxY=\(maxY), w=\(maxX-minX), h=\(maxY-minY)")
