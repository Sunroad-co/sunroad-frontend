/**
 * Decode an image file with EXIF orientation support and downscale if needed.
 * 
 * @param file - The image file to decode
 * @param opts - Options for decoding and downscaling
 * @returns Promise resolving to a canvas element with the decoded and downscaled image
 */
export async function decodeAndDownscale(
  file: File,
  opts?: { maxDim?: number }
): Promise<HTMLCanvasElement> {
  const maxDim = opts?.maxDim ?? 2000

  try {
    // Try using createImageBitmap with orientation support (modern browsers)
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Calculate downscaled dimensions
    const { width, height } = bitmap
    let targetWidth = width
    let targetHeight = height

    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height)
      targetWidth = Math.round(width * scale)
      targetHeight = Math.round(height * scale)
    }

    canvas.width = targetWidth
    canvas.height = targetHeight

    // Draw the bitmap to canvas (downscaled if needed)
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

    // Clean up bitmap
    bitmap.close()

    return canvas
  } catch (error) {
    // Fallback for older browsers: use Image (orientation may not be handled)
    return new Promise((resolve, reject) => {
      const image = new Image()
      const url = URL.createObjectURL(file)
      
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            URL.revokeObjectURL(url)
            reject(new Error('Could not get canvas context'))
            return
          }

          // Calculate downscaled dimensions
          const { width, height } = image
          let targetWidth = width
          let targetHeight = height

          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height)
            targetWidth = Math.round(width * scale)
            targetHeight = Math.round(height * scale)
          }

          canvas.width = targetWidth
          canvas.height = targetHeight

          // Draw image to canvas (downscaled)
          ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

          URL.revokeObjectURL(url)
          resolve(canvas)
        } catch (err) {
          URL.revokeObjectURL(url)
          reject(err)
        }
      }

      image.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      image.src = url
    })
  }
}

