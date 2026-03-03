import B2 from "backblaze-b2"

declare var Buffer: any;

const b2 = new B2({
  applicationKeyId: process.env.BACKBLAZE_KEY_ID!,
  applicationKey: process.env.BACKBLAZE_APPLICATION_KEY!,
})

let isAuthorized = false

export async function authorizeB2() {
  if (!isAuthorized) {
    await b2.authorize()
    isAuthorized = true
  }
  return b2
}

export async function uploadFile(fileName: string, fileBuffer: any, bucketId: string) {
  const b2Client = await authorizeB2()

  const uploadUrl = await b2Client.getUploadUrl({
    bucketId,
  })

  const response = await b2Client.uploadFile({
    uploadUrl: uploadUrl.data.uploadUrl,
    uploadAuthToken: uploadUrl.data.authorizationToken,
    fileName,
    data: fileBuffer,
  })

  return response.data
}

export async function uploadToBackblaze(
  file: File,
  path: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Generate unique filename with path
    const fileName = `${path.replace(/^\//, "")}`

    // Simulate progress updates
    onProgress?.(25)

    const b2Client = await authorizeB2()
    onProgress?.(50)

    const uploadUrl = await b2Client.getUploadUrl({
      bucketId: process.env.BACKBLAZE_BUCKET_ID!,
    })

    onProgress?.(75)

    const response = await b2Client.uploadFile({
      uploadUrl: uploadUrl.data.uploadUrl,
      uploadAuthToken: uploadUrl.data.authorizationToken,
      fileName,
      data: fileBuffer,
      contentType: file.type,
    })

    onProgress?.(100)

    // Return the public download URL
    return `https://f005.backblazeb2.com/file/${process.env.BACKBLAZE_BUCKET_NAME}/${fileName}`
  } catch (error) {
    console.error("Error uploading to Backblaze:", error)
    throw error
  }
}

export async function getDownloadUrl(fileName: string, bucketName: string) {
  const b2Client = await authorizeB2()
  return `https://f005.backblazeb2.com/file/${bucketName}/${fileName}`
}

export async function generateSecureDownloadUrl(fileName: string, bucketName: string, expirationHours = 24) {
  const b2Client = await authorizeB2()

  // Generate a temporary download authorization
  const authResponse = await b2Client.getDownloadAuthorization({
    bucketId: process.env.BACKBLAZE_BUCKET_ID!,
    fileNamePrefix: fileName,
    validDurationInSeconds: expirationHours * 3600,
  })

  return `https://f005.backblazeb2.com/file/${bucketName}/${fileName}?Authorization=${authResponse.data.authorizationToken}`
}