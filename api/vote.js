const { google } = require('googleapis');

module.exports = async (req, res) => {

  // --- НАЧАЛО БЛОКА ДЛЯ CORS ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // В продакшене лучше указать конкретный домен
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // --- КОНЕЦ БЛОКА ДЛЯ CORS ---

  // В реальном проекте здесь будет проверка на метод POST
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Only POST requests allowed' });
  }

  try {
    const { id } = req.body; // Получаем ID из тела запроса
    if (!id) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1y4Su9Okemg_hGCKswCku1u5fRqWQ8dpOnB8CNUyZU_M'; // <-- Вставьте сюда ID вашей таблицы

    // Находим строку с нужным ID
    const range = `Participants!A2:C`;
    const getResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = getResponse.data.values;
    const rowIndex = rows.findIndex(row => row[0] === id.toString());

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Увеличиваем количество голосов
    const currentVotes = parseInt(rows[rowIndex][2], 10);
    const newVotes = currentVotes + 1;

    // Обновляем ячейку
    // rowIndex + 2, потому что нумерация строк в API начинается с 1, а у нас еще заголовок
    const updateRange = `Participants!C${rowIndex + 2}`; 
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[newVotes]],
      },
    });

    res.status(200).json({ id, newVotes });

  } catch (error) {
    console.error('Error processing vote:', error);
    res.status(500).json({ error: 'Failed to process vote' });
  }
};