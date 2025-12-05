// index.js

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Setup body parser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set the view engine to Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Route to fetch records and display them on homepage
app.get('/', async (req, res) => {
  let allRecords = [];
  let after = null;

  try {
    // Fetch records from the custom object 'Pets'
    do {
      const url = `https://api.hubapi.com/crm/v3/objects/p147224070_pets?limit=100${after ? `&after=${after}` : ''}&properties=name&properties=age&properties=type&properties=bio`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
        },
      });

      console.log(response.data.results); // Log to check properties

      allRecords = allRecords.concat(response.data.results);

      after = response.data.paging ? response.data.paging.next.after : null;
    } while (after);

    res.render('homepage', {
      title: 'Custom Pets List',
      records: allRecords,
    });
  } catch (error) {
    console.error('Error fetching records:', error.response ? error.response.data : error.message);
    res.status(500).send('Error retrieving records.');
  }
});

// Route to render the form for adding a new pet
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Add New Pet',
  });
});

// Route to handle form submission and add new pet record
app.post('/update-cobj', async (req, res) => {
  const { name, age, type, bio } = req.body;

  try {
    // Make API request to create a new custom object record
    const response = await axios.post(
      `https://api.hubapi.com/crm/v3/objects/p147224070_pets`,
      {
        properties: {
          name,
          age,
          type,
          bio,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Record created:', response.data); // Log created record

    // Redirect to homepage after adding the pet
    res.redirect('/');
  } catch (error) {
    console.error('Error creating record:', error.response ? error.response.data : error.message);
    res.status(500).send('Error creating record.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
