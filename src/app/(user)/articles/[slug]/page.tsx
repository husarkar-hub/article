import React from 'react'

const page =async ({params}: {params: {slug: string}}) => {
    const {slug} =await params;
  return (
    <div>Article: {slug}</div>
  )
}

export default page