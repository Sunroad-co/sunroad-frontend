/**
 * Helper function to crop an image based on crop parameters.
 * 
 * @param source - The source image (canvas, ImageBitmap, or data URL string for backward compatibility)
 * @param pixelCrop - Crop parameters from react-easy-crop (x, y, width, height)
 * @param outW - The desired output width
 * @param outH - The desired output height
 * @param opts - Options for output format and quality
 * @returns Promise<Blob> - The cropped image as a Blob
 */
export async function getCroppedImg(
  source: HTMLCanvasElement | ImageBitmap | string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  outW: number,
  outH: number,
  opts?: {
    mime?: 'image/jpeg' | 'image/webp' | 'image/png'
    quality?: number
    background?: string
  }
): Promise<Blob> {
  const mime = opts?.mime ?? 'image/jpeg'
  const quality = opts?.quality ?? 0.82
  const background = opts?.background ?? '#fff'

  // Handle string source (backward compatibility - convert to image first)
  let imageSource: HTMLCanvasElement | ImageBitmap | HTMLImageElement

  if (typeof source === 'string') {
    imageSource = await createImageFromString(source)
  } else {
    imageSource = source
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Set canvas size to output dimensions
  canvas.width = outW
  canvas.height = outH

  // For non-alpha formats (JPEG), fill with background color first to flatten transparency
  if (mime === 'image/jpeg') {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, outW, outH)
  }

  // Get source dimensions
  let sourceWidth: number
  let sourceHeight: number

  if (imageSource instanceof HTMLCanvasElement) {
    sourceWidth = imageSource.width
    sourceHeight = imageSource.height
  } else if (imageSource instanceof ImageBitmap) {
    sourceWidth = imageSource.width
    sourceHeight = imageSource.height
  } else {
    sourceWidth = imageSource.naturalWidth
    sourceHeight = imageSource.naturalHeight
  }

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    imageSource,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  )

  // Convert canvas to blob with specified MIME type
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        resolve(blob)
      },
      mime,
      quality
    )
  })
}

/**
 * Create an Image element from a data URL string (for backward compatibility)
 */
function createImageFromString(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    // Only set crossOrigin for non-data URLs (blob URLs or http/https)
    if (!src.startsWith('data:')) {
      image.crossOrigin = 'anonymous'
    }
    
    image.onload = () => resolve(image)
    image.onerror = (error) => reject(error)
    image.src = src
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

/**
 * Generate a JPEG blob from a canvas with specified crop and output dimensions
 * 
 * @param canvas - The source canvas element
 * @param cropPixels - Crop parameters (x, y, width, height)
 * @param outW - The desired output width
 * @param outH - The desired output height
 * @param quality - JPEG quality (0-1), defaults to 0.82
 * @returns Promise<Blob> - The generated JPEG blob
 */
export async function generateJpegFromCanvas(
  canvas: HTMLCanvasElement,
  cropPixels: { x: number; y: number; width: number; height: number },
  outW: number,
  outH: number,
  quality: number = 0.82
): Promise<Blob> {
  const outputCanvas = document.createElement('canvas')
  const ctx = outputCanvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Set canvas size to output dimensions
  outputCanvas.width = outW
  outputCanvas.height = outH

  // Fill with white background (for JPEG)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, outW, outH)

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    canvas,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    outW,
    outH
  )

  // Convert canvas to blob
  return new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      quality
    )
  })
}
