export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Forward to T-Drive API
        const tDriveFormData = new FormData();
        tDriveFormData.append('file', file);
        tDriveFormData.append('folder', 'grabnext-digital-products');

        const tDriveResponse = await fetch('https://t-drive.pages.dev//api/v1/upload', {
            method: 'POST',
            headers: {
                'x-api-key': 'sk_live_666ef1580e67a292ef0d46f123ac854fed62a778fa33bbf4',
            },
            body: tDriveFormData
        });

        const data = await tDriveResponse.json();

        if (data.success) {
            return NextResponse.json(data.file, { status: 200 })
        } else {
            console.error('[T-Drive Upload Error]', data.error)
            return NextResponse.json({ error: data.error || 'T-Drive upload failed' }, { status: 500 })
        }

    } catch (error: any) {
        console.error('[Upload API Error]', error)
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
    }
}
