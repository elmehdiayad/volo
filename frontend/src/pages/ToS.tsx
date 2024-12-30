import React from 'react'
import ReactMarkdown from 'react-markdown'
import { strings } from '@/lang/tos'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'

import '@/assets/css/tos.css'

const ToS = () => {
  const onLoad = () => { }

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="tos">
        <ReactMarkdown>{strings.TOS}</ReactMarkdown>
      </div>
      <Footer />
    </Layout>
  )
}

export default ToS
