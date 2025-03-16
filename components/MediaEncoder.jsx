'use client'
import React, { useState } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder';


function MediaEncoder() {
    const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });
    const [aiReply, setAiReply] = useState('');
    const [aiReplyLoading, setAiReplyLoading] = useState(false)

    const handlePostToAi = async () => {
        if (!mediaBlobUrl) {
            console.error('No audio recorded');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('audio', await fetch(mediaBlobUrl).then(res => res.blob()), 'audio.mp3');
            setAiReplyLoading(true)
            // Make a POST request to your Next.js API route
            const response = await fetch('/api/voice-to-text', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload audio');
            }

            const res = await response.json();
            setAiReply(res?.data)
            setAiReplyLoading(false)
            console.log('Audio uploaded successfully:', data);
        } catch (error) {
            console.error('Error uploading audio:', error);
        }
    }

    return (
        <div>
            <div>
                <p>{status}</p>
                <div className='flex justify-start my-6'>
                    {status != "recording" ?
                        <div className='relative z-20 flex justify-center items-center'>
                            <button onClick={startRecording} className='bg-lime-300 p-2 rounded-full'>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                                </svg>
                            </button>
                            <div className='absolute -z-10 bg-lime-200 h-14 w-14 rounded-full' />
                        </div>
                        :
                        <button onClick={stopRecording} className='bg-fuchsia-300 p-2 rounded-full'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                            </svg>
                        </button>
                    }
                </div>
                <audio src={mediaBlobUrl} controls autoPlay />
            </div>
            {/* <Button className="bg-[#D1FF3A] mt-6" variant="outline">Send Voice to AI</Button> */}
            <button  onClick={handlePostToAi}  className="inline-flex items-center justify-center border align-middle select-none font-sans font-medium text-center transition-all duration-300 ease-in disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed data-[shape=pill]:rounded-full data-[width=full]:w-full focus:shadow-none text-sm rounded-md py-2 px-4 shadow-sm hover:shadow-md bg-slate-800 border-slate-800 text-slate-50 hover:bg-slate-700 hover:border-slate-700">
                Button
                </button>
            <p className='mt-12'>Response</p>
            {aiReplyLoading ?
                <div className='space-y-2'>
                    <div className='bg-gray-200 h-8 w-full animate-pulse rounded-lg' />
                    <div className='bg-gray-200 h-8 w-full animate-pulse rounded-lg' />
                    <div className='bg-gray-200 h-8 w-full animate-pulse rounded-lg' />
                    <div className='bg-gray-200 h-8 w-full animate-pulse rounded-lg' />
                </div>
                :
                <div>{aiReply ? <p dangerouslySetInnerHTML={{__html: aiReply}}></p> : "null"}</div>
            }
        </div>
    )
}

export default MediaEncoder