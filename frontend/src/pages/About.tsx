import React from 'react'
import ReactMarkdown from 'react-markdown'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import { strings } from '@/lang/about'

import '@/assets/css/about.css'

const About = () => (
  <Layout onLoad={() => { }} strict={false}>
    <div className="about">
      <h1>{strings.ABOUT_US_TITLE}</h1>
      <ReactMarkdown>{strings.ABOUT_US}</ReactMarkdown>
    </div>
    <Footer />
  </Layout>
)

export default About
