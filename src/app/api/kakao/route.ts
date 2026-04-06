import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { code } = await req.json()

  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.NEXT_PUBLIC_KAKAO_JS_KEY!,
      redirect_uri: 'http://localhost:3000/auth/callback',
      code,
    }),
  })

  const tokenData = await tokenRes.json()

  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  })

  const user = await userRes.json()

  return NextResponse.json(user)
}