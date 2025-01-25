import express from 'express'
import * as invoiceController from '../controllers/invoiceController'

const router = express.Router()

router.post('/data', invoiceController.getInvoiceData)
router.post('/generate', invoiceController.generateInvoice)

export default router
