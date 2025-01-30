import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
} from '@mui/material'
import {
  BtnBold,
  Editor,
  BtnItalic,
  EditorProvider,
  Toolbar,
  ContentEditableEvent,
} from 'react-simple-wysiwyg'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { Formik, Form, FieldArray } from 'formik'
import { strings as commonStrings } from '@/lang/common'
import * as InvoiceService from '@/services/InvoiceService'
import DatePicker from '@/components/DatePicker'
import '@/assets/css/invoice-edit.css'

interface InvoiceEditProps {
  open: boolean
  bookingIds: string[]
  onClose: () => void
  onConfirm: () => void
}

const InvoiceEdit = ({
  open,
  bookingIds,
  onClose,
  onConfirm,
}: InvoiceEditProps): React.ReactNode => {
  const [loading, setLoading] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InvoiceService.InvoiceData | null>(null)
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true)
        const data = await InvoiceService.getInvoiceData(bookingIds)
        setInvoiceData(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (open && bookingIds.length > 0) {
      fetchInvoiceData()
    }
  }, [open, bookingIds])

  const handleConfirm = async (values: InvoiceService.InvoiceData) => {
    try {
      setLoading(true)
      await InvoiceService.generateInvoice(bookingIds, values)
      onConfirm()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!invoiceData) return null

  const calculateTotals = (values: InvoiceService.InvoiceData) => {
    const totalHT = values.items.reduce((total, item) => {
      const itemTotal = (Number(item.days) * Number(item.pricePerDay))
        + (item.additionalCharges?.reduce((chargeTotal, charge) => chargeTotal + Number(charge.amount), 0) || 0)
      return total + itemTotal
    }, 0)
    const tvaAmount = totalHT * (Number(values.tvaPercentage) / 100)
    const totalTTC = totalHT + tvaAmount
    return { totalHT, tvaAmount, totalTTC }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className="invoice-container">
      <DialogTitle>{commonStrings.INVOICE}</DialogTitle>
      <Formik
        initialValues={invoiceData}
        onSubmit={handleConfirm}
      >
        {({ values, handleChange, setFieldValue }) => {
          const totals = calculateTotals(values)
          return (
            <Form>
              <DialogContent>
                <div className="invoice-edit-content">
                  {/* Invoice Info */}
                  <div className="section invoice-info">
                    <div className="invoice-info-row">
                      <TextField
                        name="invoiceNumber"
                        label="Facture N°"
                        value={values.invoiceNumber}
                        onChange={handleChange}
                      />
                      <DatePicker
                        label="Date"
                        value={values.date ? new Date(values.date) : undefined}
                        onChange={(date) => setFieldValue('date', date ? date.toISOString().split('T')[0] : '')}
                        variant="outlined"
                      />
                      <TextField
                        name="place"
                        label="Lieu"
                        value={values.place}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="section">
                    <Typography variant="h6">{commonStrings.CLIENT}</Typography>
                    <TextField
                      name="client.name"
                      label={commonStrings.NAME}
                      value={values.client.name}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                    />
                    <TextField
                      name="client.ice"
                      label="ICE"
                      value={values.client.ice || ''}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                    />
                  </div>

                  {/* Items */}
                  <div className="section">
                    <Typography variant="h6">{commonStrings.ITEMS}</Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell style={{ width: '60%', whiteSpace: 'normal' }}>Désignation</TableCell>
                            <TableCell style={{ width: '15%' }}>Jours</TableCell>
                            <TableCell style={{ width: '15%' }}>P.U</TableCell>
                            <TableCell style={{ width: '15%' }}>Total</TableCell>
                            <TableCell style={{ width: '10%' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <FieldArray
                            name="items"
                            render={(arrayHelpers) => (
                              <>
                                {values.items.map((item, itemIndex) => {
                                  const itemKey = `item-${itemIndex}`
                                  return (
                                    <React.Fragment key={itemKey}>
                                      <TableRow>
                                        <TableCell style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                          <TextField
                                            name={`items.${itemIndex}.designation`}
                                            value={item.designation}
                                            onChange={(e) => {
                                              setFieldValue(`items.${itemIndex}.designation`, e.target.value)
                                            }}
                                            fullWidth
                                            multiline
                                            minRows={1}
                                          />
                                        </TableCell>
                                        <TableCell>{item.days}</TableCell>
                                        <TableCell>{item.pricePerDay}</TableCell>
                                        <TableCell>{item.total}</TableCell>
                                        <TableCell>
                                          <IconButton
                                            onClick={() => arrayHelpers.remove(itemIndex)}
                                            color="error"
                                          >
                                            <DeleteIcon />
                                          </IconButton>
                                        </TableCell>
                                      </TableRow>
                                      <FieldArray
                                        name={`items.${itemIndex}.additionalCharges`}
                                        render={(chargeHelpers) => (
                                          <>
                                            {item.additionalCharges?.map((charge, chargeIndex) => {
                                              const chargeKey = `charge-${itemIndex}-${chargeIndex}`
                                              return (
                                                <TableRow key={chargeKey} className="additional-charge-row">
                                                  <TableCell>
                                                    <TextField
                                                      type="text"
                                                      name={`items.${itemIndex}.additionalCharges.${chargeIndex}.name`}
                                                      value={charge.name}
                                                      onChange={(e) => {
                                                        setFieldValue(`items.${itemIndex}.additionalCharges.${chargeIndex}.name`, e.target.value)
                                                      }}
                                                      fullWidth
                                                    />
                                                  </TableCell>
                                                  <TableCell colSpan={1} />
                                                  <TableCell colSpan={2}>
                                                    <TextField
                                                      name={`items.${itemIndex}.additionalCharges.${chargeIndex}.amount`}
                                                      type="number"
                                                      value={charge.amount}
                                                      onChange={(e) => {
                                                        const newAmount = Number(e.target.value)
                                                        setFieldValue(`items.${itemIndex}.additionalCharges.${chargeIndex}.amount`, newAmount)
                                                        // Update the item total with the new additional charge
                                                        const totalAdditionalCharges = (item.additionalCharges || []).reduce((sum, c, idx) =>
                                                          (idx === chargeIndex ? sum + newAmount : sum + Number(c.amount)), 0)
                                                        const newTotal = (Number(item.days) * Number(item.pricePerDay)) + totalAdditionalCharges
                                                        setFieldValue(`items.${itemIndex}.total`, newTotal)
                                                      }}
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <IconButton
                                                      onClick={() => chargeHelpers.remove(chargeIndex)}
                                                      color="error"
                                                    >
                                                      <DeleteIcon />
                                                    </IconButton>
                                                  </TableCell>
                                                </TableRow>
                                              )
                                            })}
                                            <TableRow>
                                              <TableCell colSpan={6}>
                                                <Button
                                                  onClick={() => chargeHelpers.push({ name: '', amount: 0 })}
                                                  startIcon={<AddIcon />}
                                                  variant="text"
                                                  size="small"
                                                >
                                                  Add Additional Charge
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          </>
                                        )}
                                      />
                                    </React.Fragment>
                                  )
                                })}
                              </>
                            )}
                          />
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </div>

                  {/* Totals */}
                  <div className="section totals">
                    <div className="tva-input">
                      <TextField
                        name="tvaPercentage"
                        label="TVA %"
                        type="number"
                        value={values.tvaPercentage}
                        onChange={handleChange}
                        size="small"
                      />
                    </div>
                    <Typography>
                      {`Total H.T: ${totals.totalHT}`}
                    </Typography>
                    <Typography>
                      {`TVA (${values.tvaPercentage}%): ${totals.tvaAmount}`}
                    </Typography>
                    <Typography variant="h6">
                      {`Total TTC: ${totals.totalTTC}`}
                    </Typography>
                  </div>
                  <div className="section">
                    <EditorProvider>
                      <Editor value={values.supplier.bio} onChange={(e: ContentEditableEvent) => setFieldValue('supplier.bio', e.target.value)}>
                        <Toolbar>
                          <BtnBold />
                          <BtnItalic />
                        </Toolbar>
                      </Editor>
                    </EditorProvider>
                  </div>
                </div>
              </DialogContent>
              <DialogActions>
                <Button onClick={onClose} color="primary">
                  {commonStrings.CANCEL}
                </Button>
                <Button type="submit" color="primary" variant="contained" loading={loading} loadingPosition="start">
                  {commonStrings.DOWNLOAD}
                </Button>
              </DialogActions>
            </Form>
          )
        }}
      </Formik>
    </Dialog>
  )
}

export default InvoiceEdit
