import express from 'express'
import authJwt from '../middlewares/authJwt'
import * as invoiceController from '../controllers/invoiceController'
import routeNames from '../config/invoiceRoutes.config'

const routers = express.Router()

routers.post(routeNames.data, authJwt.verifyToken, invoiceController.getInvoiceData)
routers.post(routeNames.generate, authJwt.verifyToken, invoiceController.generateInvoice)

export default routers
