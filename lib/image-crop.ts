/**
 * Helper function to crop an image to a square based on crop parameters.
 * 
 * @param imageSrc - The source image (URL or File)
 * @param pixelCrop - Crop parameters from react-easy-crop (x, y, width, height)
 * @param outputSize - The desired output size (square, e.g. 600)
 * @returns Promise<Blob> - The cropped image as a Blob
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  outputSize: number = 600
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Set canvas size to output size (square)
  canvas.width = outputSize
  canvas.height = outputSize

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  )

  // Convert canvas to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      0.92 // Quality (0-1)
    )
  })
}

/**
 * Create an Image element from a source (URL or File)
 */
function createImage(src: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    
    image.onload = () => resolve(image)
    image.onerror = (error) => reject(error)
    
    if (typeof src === 'string') {
      image.src = src
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          image.src = e.target.result as string
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(src)
    }
  })
}

/**
 * Convert crop area from react-easy-crop format to pixel coordinates
 * 
 * @param image - The image element
 * @param cropArea - Crop area from react-easy-crop (x, y, width, height in percentage)
 * @returns Pixel coordinates for cropping
 */
export function getPixelCrop(
  image: HTMLImageElement,
  cropArea: { x: number; y: number; width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  return {
    x: (cropArea.x * scaleX),
    y: (cropArea.y * scaleY),
    width: (cropArea.width * scaleX),
    height: (cropArea.height * scaleY),
  }
}

