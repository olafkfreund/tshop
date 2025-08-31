import { v2 as cloudinary } from 'cloudinary'

if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  console.warn('Cloudinary credentials not configured. Image uploads will be limited.')
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export interface UploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
}

/**
 * Upload an image buffer to Cloudinary
 */
export async function uploadImage(
  buffer: Buffer,
  options: {
    folder?: string
    public_id?: string
    transformation?: any[]
    tags?: string[]
  } = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'tshop/designs',
      public_id: options.public_id,
      tags: options.tags || ['design'],
      transformation: options.transformation,
      resource_type: 'image' as const,
      quality: 'auto',
      fetch_format: 'auto',
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve(result as UploadResult)
        } else {
          reject(new Error('Upload failed with no result'))
        }
      }
    ).end(buffer)
  })
}

/**
 * Upload a base64 image to Cloudinary
 */
export async function uploadBase64Image(
  base64Data: string,
  options: {
    folder?: string
    public_id?: string
    transformation?: any[]
    tags?: string[]
  } = {}
): Promise<UploadResult> {
  const uploadOptions = {
    folder: options.folder || 'tshop/designs',
    public_id: options.public_id,
    tags: options.tags || ['design'],
    transformation: options.transformation,
    resource_type: 'image' as const,
    quality: 'auto',
    fetch_format: 'auto',
  }

  try {
    const result = await cloudinary.uploader.upload(base64Data, uploadOptions)
    return result as UploadResult
  } catch (error) {
    throw new Error(`Failed to upload image: ${error}`)
  }
}

/**
 * Generate optimized image URLs with transformations
 */
export function generateImageUrl(
  publicId: string,
  transformations: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'scale' | 'crop'
    quality?: 'auto' | number
    format?: 'auto' | 'jpg' | 'png' | 'webp'
    background?: string
  } = {}
): string {
  const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`
  
  const transformParams: string[] = []
  
  if (transformations.width) transformParams.push(`w_${transformations.width}`)
  if (transformations.height) transformParams.push(`h_${transformations.height}`)
  if (transformations.crop) transformParams.push(`c_${transformations.crop}`)
  if (transformations.quality) transformParams.push(`q_${transformations.quality}`)
  if (transformations.format) transformParams.push(`f_${transformations.format}`)
  if (transformations.background) transformParams.push(`b_${transformations.background.replace('#', 'rgb:')}`)
  
  const transformString = transformParams.length > 0 ? `${transformParams.join(',')}/` : ''
  
  return `${baseUrl}/${transformString}${publicId}`
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

/**
 * Generate design mockup with product overlay
 */
export function generateDesignMockup(
  designPublicId: string,
  productType: 'tshirt' | 'cap' | 'tote-bag',
  options: {
    color?: string
    size?: 'sm' | 'md' | 'lg'
  } = {}
): string {
  const mockupOverlays: Record<string, any> = {
    tshirt: {
      overlay: 'tshop/mockups/tshirt-template',
      width: 400,
      height: 500,
      designTransform: 'w_120,h_140,c_fit,g_center,x_0,y_-20',
    },
    cap: {
      overlay: 'tshop/mockups/cap-template',
      width: 400,
      height: 300,
      designTransform: 'w_100,h_50,c_fit,g_center,x_0,y_-30',
    },
    'tote-bag': {
      overlay: 'tshop/mockups/tote-template',
      width: 350,
      height: 400,
      designTransform: 'w_110,h_130,c_fit,g_center,x_0,y_0',
    },
  }

  const mockup = mockupOverlays[productType]
  if (!mockup) return generateImageUrl(designPublicId)

  // Create transformation for design positioning
  const designLayer = `l_${designPublicId.replace(/\//g, ':')},${mockup.designTransform}`
  
  // Create transformation for mockup overlay
  const mockupLayer = `l_${mockup.overlay.replace(/\//g, ':')},w_${mockup.width},h_${mockup.height},c_scale`
  
  const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`
  const transformations = [
    `w_${mockup.width},h_${mockup.height},c_fill,b_white`,
    designLayer,
    mockupLayer,
    'f_auto,q_auto'
  ].join('/')
  
  return `${baseUrl}/${transformations}/v1/transparent.png`
}

/**
 * Get image info and metadata
 */
export async function getImageInfo(publicId: string) {
  try {
    const result = await cloudinary.api.resource(publicId)
    return {
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      created_at: result.created_at,
      tags: result.tags,
      secure_url: result.secure_url,
    }
  } catch (error) {
    console.error('Error getting image info:', error)
    return null
  }
}

export { cloudinary }