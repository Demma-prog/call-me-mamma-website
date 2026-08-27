const CHANNEL_ID = 'UCdUPJA5f7P8gAbTMdEI6Nsw';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const EPISODE_TITLE = /(?:^|\s)EP\.\s*\d+/i;

function decodeXml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function match(entry, expression) {
  return decodeXml(entry.match(expression)?.[1]?.trim() || '');
}

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const feedResponse = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'Call-Me-Mamma-Website/1.0' }
    });
    if (!feedResponse.ok) throw new Error(`YouTube RSS: ${feedResponse.status}`);

    const xml = await feedResponse.text();
    const items = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, entry]) => {
      const videoId = match(entry, /<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
      return {
        title: match(entry, /<title>([\s\S]*?)<\/title>/),
        videoId,
        link: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
        thumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`,
        published: match(entry, /<published>([\s\S]*?)<\/published>/)
      };
    }).filter(item => item.videoId && EPISODE_TITLE.test(item.title));

    response.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
    return response.status(200).json({ items });
  } catch (error) {
    console.error(error);
    return response.status(502).json({ error: 'Impossibile caricare gli episodi' });
  }
};
