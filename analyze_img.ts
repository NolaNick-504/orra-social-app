import ZAI from 'z-ai-web-dev-sdk';
import * as fs from 'fs';

async function main() {
  const zai = await ZAI.create();
  const imgBuf = fs.readFileSync('/home/z/my-project/upload/Screenshot_20260528_141838_Gallery.jpg');
  const b64 = imgBuf.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${b64}`;
  
  const response = await zai.chat.completions.createVision({
    model: 'glm-4.6v',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Read ALL text visible in this image. What AWS page is this? What instance types, pricing, billing, or free tier info does it show? Be very detailed.' },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });

  console.log(response.choices?.[0]?.message?.content);
}

main().catch(e => console.error('Error:', e.message));
