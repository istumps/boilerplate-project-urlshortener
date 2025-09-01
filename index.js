require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');             
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

function validateUrl(userUrl, callback) {
  try {
    const parsed = new URL(userUrl);

    if (!/^https?:\/\//.test(parsed.href)) {
      return callback(false);
    }

    dns.lookup(parsed.hostname, (err) => {
      if (err) return callback(false);
      return callback(true);
    });
  } catch (err) {
    return callback(false);
  }
}

const urlMap = new Map();

app.post('/api/shorturl', function (req, res) {
  const url = req.body.url;

  if (!url) {
    return res.json({ error: 'invalid url' });
  }

  validateUrl(url, (isValid) => {
    if (!isValid) {
      return res.json({ error: 'invalid url' });
    }

    let shortUrl;
    do {
      shortUrl = uuidv4().slice(0, 6);
    } while (urlMap.has(shortUrl));

    urlMap.set(shortUrl, url);

    return res.json({ original_url: url, short_url: shortUrl });
  });
});

app.get('/api/shorturl/:short_url', function (req, res) {
  const short_url = req.params.short_url;
  const original_url = urlMap.get(short_url);

  if (!original_url) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(original_url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
