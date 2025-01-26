import OpenAI from 'openai'
import { createWorker } from 'tesseract.js'
import * as logger from './logger'
import * as env from '../config/env.config'
import * as bookcarsTypes from ':bookcars-types'

/**
 * Process documents and extract information using OCR.
 *
 * @export
 * @async
 * @param {Buffer[]} imageBuffers - Array of image buffers to process
 * @returns {Promise<{ filenames: string[], extractedInfo: bookcarsTypes.LicenseExtractedData }>}
 */
export const processDocuments = async (imageBuffers: Buffer[]): Promise<{ extractedInfo: bookcarsTypes.LicenseExtractedData }> => {
  try {
    // Initialize Tesseract worker
    const worker = await createWorker('ara+fra')

    // Process each image with OCR
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
            "licenseId": "extracted document number in a form ^\\d{2}/\\d{6}$"
          }`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 400,
    })

    // Parse the response
    const extractedInfo: bookcarsTypes.LicenseExtractedData = JSON.parse(response.choices[0].message.content || '{}')

    logger.info('[OCR] Successfully processed documents and extracted information')
    return { extractedInfo }
  } catch (error) {
    logger.error('[processDocuments] Error processing images:', error)
    throw new Error('Failed to extract information from images')
  }
}
