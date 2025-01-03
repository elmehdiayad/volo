import OpenAI from 'openai'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs/promises'
import { nanoid } from 'nanoid'
import { createWorker } from 'tesseract.js'
import * as logger from './logger'
import * as env from '../config/env.config'
import * as bookcarsTypes from ':bookcars-types'

const targetWidth = 600
const targetHeight = 400

const processImage = async (buffer: Buffer, documentType: 'license' | 'id') => {
  let pipeline = sharp(buffer)
    .resize(targetWidth, targetHeight, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .grayscale()

  if (documentType === 'license') {
    // License-specific processing
    pipeline = pipeline
      .linear(1.3, -0.1)
      .sharpen({
        sigma: 1.5,
        m1: 1.5,
        m2: 0.7,
        x1: 2,
        y2: 10,
      })
      .threshold(160)
  } else {
    // ID card-specific processing
    pipeline = pipeline
      .linear(1.2, 0)
      .sharpen({
        sigma: 1.2,
        m1: 1.2,
        m2: 0.5,
        x1: 2,
        y2: 8,
      })
      .threshold(150)
  }

  return pipeline
    .normalize()
    .median(1)
    .jpeg({ quality: 100, force: true })
    .toBuffer()
}

/**
 * Create a collage from multiple images and extract information using OCR.
 *
 * @export
 * @async
 * @param {Buffer[]} imageBuffers - Array of image buffers to process
 * @returns {Promise<{ filename: string, extractedInfo: bookcarsTypes.LicenseExtractedData }>}
 */
export const extractInformationFromCollage = async (imageBuffers: Buffer[]): Promise<{ filename: string, extractedInfo: bookcarsTypes.LicenseExtractedData }> => {
  try {
    // Process and resize each image with enhanced preprocessing
    const processedImages = await Promise.all(
      imageBuffers.map(async (buffer) => {
        const image = await processImage(buffer, 'license')

        return {
          input: image,
          blend: 'over',
        }
      }),
    )

    // Create a blank canvas for the collage
    const collage = await sharp({
      create: {
        width: targetWidth * 2,
        height: targetHeight * 2,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        { ...processedImages[0], top: 0, left: 0, blend: 'over' },
        { ...processedImages[1], top: 0, left: targetWidth, blend: 'over' },
        { ...processedImages[2], top: targetHeight, left: 0, blend: 'over' },
        { ...processedImages[3], top: targetHeight, left: targetWidth, blend: 'over' },
      ])
      .jpeg({ quality: 90 })
      .toBuffer()

    // Save the collage
    const filename = `${nanoid()}.jpg`
    const filepath = path.join(env.CDN_TEMP_LICENSES, filename)
    await fs.writeFile(filepath, collage)
    // Initialize Tesseract worker
    const worker = await createWorker('ara+fra')

    // Process each image separately with OCR
    const ocrResults = await Promise.all(
      imageBuffers.map(async (buffer) => {
        const { data: { text } } = await worker.recognize(buffer)
        return text
      }),
    )

    await worker.terminate()

    // Combine all OCR results
    const combinedText = ocrResults.join('\n\n')

    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })

    // Use OpenAI to interpret the combined OCR results
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting information from identity documents. 
          You will receive text from multiple scanned images of the MOROCCAN NATIONAL ID and MOROCCAN DRIVING LICENSE document. 
          Combine the information and resolve any conflicts to produce the most accurate result.`,
        },
        {
          role: 'user',
          content: `Extract structured information from these OCR results: ${combinedText}
          Return only a JSON object in this format:
          {
            "documentType": "type of document (Driver License or ID Card)",
            "fullName": "extracted full name",
            "dateOfBirth": "YYYY-MM-DD format",
            "placeOfBirth": "extracted place of birth",
            "documentNumber": "extracted document number in a form ^\\d{2}/\\d{6}$",
            "expiryDate": "YYYY-MM-DD format",
            "nationalId": "extracted national ID in a form ^[A-Za-z]{1,2}\\d{5,6}$",
            "licenseId: "extracted document number in a form ^\\d{2}/\\d{6}$",
          }`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 400,
    })

    // Parse the response
    const extractedInfo: bookcarsTypes.LicenseExtractedData = JSON.parse(response.choices[0].message.content || '{}')

    logger.info('[OCR] Successfully created collage and extracted information')
    return { filename, extractedInfo }
  } catch (error) {
    logger.error('[extractInformationFromCollage] Error processing images:', error)
    throw new Error('Failed to extract information from images')
  }
}
