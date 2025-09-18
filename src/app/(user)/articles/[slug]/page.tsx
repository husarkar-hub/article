import React from 'react'

const page = ({params}: {params: {slug: string}}) => {
  return (
    <div>Article: {params.slug}</div>
  )
}

export default page