import React from 'react'
import ReactMarkdown from 'react-markdown'
import { strings } from '@/lang/privacy'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'

import '@/assets/css/privacy.css'

const ToS = () => {
  const onLoad = () => { }

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="privacy">
        <ReactMarkdown>
          {strings.PRIVACY_POLICY}
        </ReactMarkdown>
      </div>
      <Footer />
    </Layout>
  )
}

export default ToS
