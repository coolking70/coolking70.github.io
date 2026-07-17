const parts = [
  'src/part00.txt',
  'src/part01.txt',
  'src/part02.txt',
  'src/part03.txt',
  'src/part04.txt',
  'src/part05.txt',
  'src/part06.txt',
  'src/part07.txt',
  'src/part08.txt',
  'src/part09.txt',
  'src/part10.txt'
];

try {
  const responses = await Promise.all(parts.map(path => fetch(path)));
  for (const response of responses) {
    if (!response.ok) throw new Error(`${response.status} ${response.url}`);
  }
  const code = (await Promise.all(responses.map(response => response.text()))).join('');
  const blobUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  await import(blobUrl);
  URL.revokeObjectURL(blobUrl);
} catch (error) {
  console.error(error);
  document.body.innerHTML = `<pre style="padding:24px;color:#fff;background:#111;white-space:pre-wrap">游戏加载失败：${String(error)}<\/pre>`;
}
