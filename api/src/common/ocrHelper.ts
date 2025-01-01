import OpenAI from 'openai'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs/promises'
import { nanoid } from 'nanoid'
import * as logger from './logger'
import * as env from '../config/env.config'
import * as bookcarsTypes from ':bookcars-types'

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
    // Define target dimensions for each image
    const targetWidth = 600
    const targetHeight = 400

    // Process and resize each image
    const processedImages = await Promise.all(
      imageBuffers.map(async (buffer) => {
        const image = await sharp(buffer)
          .resize(targetWidth, targetHeight, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .jpeg()
          .toBuffer()

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
    console.log(filename)

    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })

    // Convert collage to base64
    const base64Image = collage.toString('base64')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: 'Extract information from these documents on this JSON format: {documentType: null, fullName: null, dateOfBirth: null, placeOfBirth: null, documentNumber: null, expiryDate: null, nationalId: null }',
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 400,
    })

    // Parse the response
    const extractedInfo: bookcarsTypes.LicenseExtractedData = JSON.parse(response.choices[0].message.content || '{}')
    // const extractedInfo: bookcarsTypes.LicenseExtractedData = {
    //   documentType: 'Driver License',
    //   fullName: 'John Doe',
    //   dateOfBirth: '1990-01-01',
    //   placeOfBirth: 'New York',
    //   documentNumber: 'DL123456789',
    //   expiryDate: '2025-01-01',
    //   nationalId: 'ID987654321',
    // }

    logger.info('[OCR] Successfully created collage and extracted information')
    return { filename, extractedInfo }
  } catch (error) {
    logger.error('[extractInformationFromCollage] Error processing images:', error)
    throw new Error('Failed to extract information from images')
  }
}
