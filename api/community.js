const AIRTABLE_BASE_ID = 'app4L184UfK3HhhWV';
const AIRTABLE_TABLE_ID = 'tblKL7mzurmCxClBC';
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;

function json(response, status, payload) {
  response.setHeader('Cache-Control', 'no-store');
  return response.status(status).json(payload);
}

function clean(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

async function airtableRequest(url, options = {}) {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error('AIRTABLE_TOKEN non configurato');

  const result = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!result.ok) throw new Error(`Airtable: ${result.status}`);
  return result.json();
}

module.exports = async function handler(request, response) {
  try {
    if (request.method === 'GET') {
      const params = new URLSearchParams({
        filterByFormula: "{Stato}='Approvato'",
        maxRecords: '20',
        'sort[0][field]': 'Data invio',
        'sort[0][direction]': 'desc'
      });
      const data = await airtableRequest(`${AIRTABLE_URL}?${params}`);
      const reviews = data.records.map(({ id, fields }) => ({
        id,
        name: clean(fields.Nome, 60),
        message: clean(fields.Messaggio, 500),
        rating: Math.min(5, Math.max(1, Number(fields.Valutazione) || 5))
      }));
      response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return response.status(200).json({ reviews });
    }

    if (request.method === 'POST') {
      const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
      if (body.website) return json(response, 200, { ok: true });

      const name = clean(body.name, 60);
      const email = clean(body.email, 120);
      const message = clean(body.message, 500);
      const rating = Number(body.rating);
      if (name.length < 2 || message.length < 10 || !/^\S+@\S+\.\S+$/.test(email) || rating < 1 || rating > 5 || body.consent !== true) {
        return json(response, 400, { error: 'Controlla i dati inseriti.' });
      }

      await airtableRequest(AIRTABLE_URL, {
        method: 'POST',
        body: JSON.stringify({ fields: {
          Nome: name,
          Messaggio: message,
          Valutazione: rating,
          Stato: 'Da approvare',
          Email: email,
          'Data invio': new Date().toISOString(),
          'Consenso privacy': true,
          Origine: 'Sito web'
        } })
      });
      return json(response, 201, { ok: true });
    }

    response.setHeader('Allow', 'GET, POST');
    return json(response, 405, { error: 'Metodo non consentito' });
  } catch (error) {
    console.error(error);
    const code = error.message.includes('non configurato')
      ? 'CONFIG_MISSING'
      : error.message.startsWith('Airtable:') ? 'AIRTABLE_UPSTREAM' : 'UNKNOWN';
    return json(response, 500, {
      error: 'Servizio community temporaneamente non disponibile.',
      code
    });
  }
};
