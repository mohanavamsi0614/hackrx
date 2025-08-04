const express = require('express');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/ask', async (req, res) => {
  const { documents, questions } = req.body;

  try {
    // Download PDF from URL
    const response = await axios.get(documents, { responseType: 'arraybuffer' });
    const pdfData = await pdfParse(response.data);

    const text = pdfData.text;

    // Simple answer extraction (naive keyword match)
    const answers = questions.map((question) => {
      const lowerText = text.toLowerCase();
      const lowerQuestion = question.toLowerCase();

      const keywords = lowerQuestion
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .split(' ')
        .filter((word) => word.length > 3); // filter small/common words

      let bestMatch = '';
      let maxMatches = 0;

      const lines = text.split('\n');
      for (const line of lines) {
        let matchCount = 0;
        for (const keyword of keywords) {
          if (line.toLowerCase().includes(keyword)) {
            matchCount++;
          }
        }

        if (matchCount > maxMatches) {
          maxMatches = matchCount;
          bestMatch = line;
        }
      }

      return {
        question,
        answer: bestMatch || 'Answer not found in document',
      };
    });

    res.status(200).json({ status: 'success', answers: answers.map((i) => i.answer) });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(8000, () => {
  console.log('🚀 Server running on http://localhost:8000');
});
