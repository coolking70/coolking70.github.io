const parts = [
  'src/game0.b64',
  'src/game1.b64',
  'src/game2.b64',
  'src/game3.b64',
  'src/game4.b64'
];

try {
  const responses = await Promise.all(parts.map(path => fetch(path)));
  for (const response of responses) {
    if (!response.ok) throw new Error(`${response.status} ${response.url}`);
  }

  const encoded = await Promise.all(responses.map(response => response.text()));
  const decoder = new TextDecoder();
  const code = encoded.map(value => {
    const binary = atob(value.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return decoder.decode(bytes);
  }).join('');

  const blobUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  await import(blobUrl);
  URL.revokeObjectURL(blobUrl);
} catch (error) {
  console.error(error);
  document.body.innerHTML = `<pre style="padding:24px;color:#fff;background:#111;white-space:pre-wrap">游戏加载失败：${String(error)}<\/pre>`;
}
