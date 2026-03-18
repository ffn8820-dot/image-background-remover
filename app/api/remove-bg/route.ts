import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: '没有收到图片' }, { status: 400 })
    }

    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 })
    }

    const bgFormData = new FormData()
    bgFormData.append('image_file', file)
    bgFormData.append('size', 'auto')

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: bgFormData,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: err?.errors?.[0]?.title || 'Remove.bg API 调用失败' },
        { status: response.status }
      )
    }

    const buffer = await response.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="removed-bg-${Date.now()}.png"`,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
