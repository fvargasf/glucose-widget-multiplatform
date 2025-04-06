import { NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function generateAccountId(userId: string): string {
  return crypto.createHash('sha256').update(userId).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const response = await axios.post('https://api.libreview.io/llu/auth/login', {
      email: username,
      password: password
    }, {
      headers: {
        'Content-Type': 'application/json',
        'version': '4.7',
        'product': 'llu.android',
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'okhttp/4.9.0'
      }
    });
    const userId = response.data.data.user.id;
    const accountId = generateAccountId(userId);

    return NextResponse.json({
      token: response.data.data.authTicket.token,
      duration: response.data.data.authTicket.duration,
      userId: userId,
      accountId: accountId
    });
  } catch (error) {
    console.error('Authentication error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: 'Authentication failed', details: error.response?.data },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 