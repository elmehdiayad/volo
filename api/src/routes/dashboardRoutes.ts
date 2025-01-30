import express from 'express'
import authJwt from '../middlewares/authJwt'
import * as dashboardController from '../controllers/dashboardController'
import routeNames from '../config/dashboardRoutes.config'

const routes = express.Router()

routes.route(routeNames.dashboard).post(authJwt.verifyToken, dashboardController.getDashboardData)

export default routes
