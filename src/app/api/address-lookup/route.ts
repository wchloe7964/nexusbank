import { NextRequest, NextResponse } from 'next/server'

interface PostcodesIoResult {
  status: number
  result: {
    postcode: string
    admin_district: string | null
    admin_county: string | null
    region: string | null
    country: string | null
  } | null
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const postcode = searchParams.get('postcode')
  const country = searchParams.get('country')

  if (!postcode) {
    return NextResponse.json(
      { supported: false, error: 'Postcode is required' },
      { status: 400 }
    )
  }

  // Only UK postcodes are supported for automatic lookup
  if (country !== 'GB') {
    return NextResponse.json({ supported: false })
  }

  try {
    const encoded = encodeURIComponent(postcode.trim())
    const res = await fetch(`https://api.postcodes.io/postcodes/${encoded}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }, // cache for 24 hours
    })

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({
          supported: true,
          error: 'Postcode not found. Please check and try again.',
        })
      }
      return NextResponse.json({
        supported: true,
        error: 'Unable to look up postcode. Please enter your address manually.',
      })
    }

    const data: PostcodesIoResult = await res.json()

    if (!data.result) {
      return NextResponse.json({
        supported: true,
        error: 'Postcode not found. Please check and try again.',
      })
    }

    return NextResponse.json({
      supported: true,
      postcode: data.result.postcode, // normalized format
      city: data.result.admin_district || data.result.region || '',
      county: data.result.admin_county || data.result.region || '',
    })
  } catch {
    return NextResponse.json({
      supported: false,
      error: 'Unable to look up address. Please enter your address manually.',
    })
  }
}
