import { SeoService } from '../server/src/modules/seo/seoService';

async function test() {
  console.log('Testing llms.txt generation...');
  const txt = await SeoService.renderLlmsTxt();
  console.log('--- llms.txt preview (first 500 chars) ---');
  console.log(txt.slice(0, 500));

  console.log('\nTesting renderSoftwareHtml for windows-ltsc (zero-source fallback)...');
  const swRes = await SeoService.renderSoftwareHtml('windows-ltsc');
  console.log('Status:', swRes.status);
  console.log('Contains fallback:', swRes.html.includes('官方获取渠道与授权说明'));
  console.log('Contains FAQPage:', swRes.html.includes('FAQPage'));

  console.log('\nTesting renderTutorialHtml for wireshark (draft software link fix)...');
  const tutRes = await SeoService.renderTutorialHtml('wireshark-http-tcp-handshake-capture');
  console.log('Status:', tutRes.status);
  console.log('Does NOT have dead link href="/software/wireshark":', !tutRes.html.includes('href="https://softtribe.top/software/wireshark"'));
  console.log('Has safe notice:', tutRes.html.includes('官方渠道核验入库中'));
}

test().catch(console.error);
