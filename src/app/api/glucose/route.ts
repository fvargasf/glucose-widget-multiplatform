import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const accountId = searchParams.get('accountId');

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    if (!userId || !accountId) {
      return NextResponse.json(
        { error: 'userId and accountId are required' },
        { status: 400 }
      );
    }

    const response = await axios.get(`https://api.libreview.io/llu/connections/${userId}/graph`, {
      headers: {
        'Content-Type': 'application/json',
        'version': '4.7',
        'product': 'llu.android',
        'Authorization': `Bearer ${token}`,
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'okhttp/4.9.0'
      }
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching glucose data:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: 'Failed to fetch glucose data', details: error.response?.data },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 