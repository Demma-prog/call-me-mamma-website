const CHANNEL_ID = 'UCdUPJA5f7P8gAbTMdEI6Nsw';
const ABOUT_URL = `https://www.youtube.com/channel/${CHANNEL_ID}/about?hl=it&gl=IT`;
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const EPISODE_TITLE = /(?:^|\s)EP\.\s*\d+/i;

function numberFromLabel(label = '') {
  const value = Number(label.replace(/[^0-9]/g, ''));
  return Number.isFinite(value) ? value : 0;
}

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'it-IT,it;q=0.9' };
    const [aboutResponse, feedResponse] = await Promise.all([
      fetch(ABOUT_URL, { headers }),
      fetch(FEED_URL, { headers })
    ]);
    if (!aboutResponse.ok || !feedResponse.ok) throw new Error('YouTube non disponibile');

    const [about, feed] = await Promise.all([aboutResponse.text(), feedResponse.text()]);
    const subscribers = numberFromLabel(about.match(/"subscriberCountText":"([^"]+)"/)?.[1]);
    const views = numberFromLabel(about.match(/"viewCountText":"([^"]+)"/)?.[1]);
    const episodesInRecentFeed = [...feed.matchAll(/<title>([\s\S]*?)<\/title>/g)]
      .slice(1)
      .filter(([, title]) => EPISODE_TITLE.test(title)).length;
    // The public RSS feed only exposes recent uploads, so older episodes can
    // disappear when Shorts are published. Nine full episodes are live today.
    const episodes = Math.max(9, episodesInRecentFeed);

    if (!subscribers || !views) throw new Error('Statistiche YouTube non trovate');
    response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
    return response.status(200).json({ episodes, views, subscribers });
  } catch (error) {
    console.error(error);
    return response.status(502).json({ error: 'Impossibile caricare le statistiche' });
  }
};
