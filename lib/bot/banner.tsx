import 'server-only';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';

/**
 * The notetaker's video tile when the recording-banner setting is on
 * (architecture.md §3.1): "{Name} is recording" on carbon, 1280×720 JPEG
 * (Recall: JPEG only, 16:9, ≤ 1.3 MB).
 */
export async function renderRecordingBanner(botName: string): Promise<Buffer> {
  const png = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 110px',
          background: '#111310',
          color: '#F3F5EF',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, color: '#C8FF3D', fontSize: 34, letterSpacing: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background: '#C8FF3D' }} />
          RECORDING
        </div>
        <div style={{ marginTop: 34, fontSize: 76, fontWeight: 700, lineHeight: 1.08, maxWidth: 1060 }}>
          {`${botName} is recording`}
        </div>
        <div style={{ marginTop: 30, fontSize: 32, color: '#9BA298' }}>
          This meeting is being recorded and transcribed.
        </div>
      </div>
    ),
    { width: 1280, height: 720 },
  );
  const buf = Buffer.from(await png.arrayBuffer());
  return sharp(buf).jpeg({ quality: 88 }).toBuffer();
}
