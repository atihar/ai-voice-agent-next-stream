'use client'
import dynamic from 'next/dynamic';
const MediaEncoder = dynamic(() => import('../components/MediaEncoder'), {
  ssr: false,
});

import React from 'react'

function VoiceUI() {
  return (
    <div><MediaEncoder/></div>
  )
}

export default VoiceUI