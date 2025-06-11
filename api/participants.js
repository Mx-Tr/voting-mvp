// api/participants.js
const { google } = require("googleapis");

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

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = "1y4Su9Okemg_hGCKswCku1u5fRqWQ8dpOnB8CNUyZU_M"; // <-- Вставьте сюда ID вашей таблицы

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Participants!A2:C", // Получаем все строки со второй
    });

    const participants = response.data.values.map((row) => ({
      id: row[0],
      name: row[1],
      votes: parseInt(row[2], 10),
    }));

    res.status(200).json(participants);
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
};
