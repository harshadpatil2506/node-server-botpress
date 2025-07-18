require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const TurndownService = require('turndown');
const turndownService = new TurndownService();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());


// // MySQL connection setup
// const db = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT || 3306
// });

// // Test DB connection
// db.connect((err) => {
//   if (err) {
//     console.error('❌ Error connecting to MySQL:', err);
//     return;
//   }
//   console.log('✅ Connected to MySQL database');
// });


// app.post('/initUserSession', (req, res) => {
//   const { session_start, session_end } = req.body;

//   // Step 1: Get the latest ticket_no
//   const getLastTicketQuery = `
//     SELECT ticket_no 
//     FROM users 
//     WHERE ticket_no IS NOT NULL 
//     ORDER BY id DESC 
//     LIMIT 1
//   `;

//   db.query(getLastTicketQuery, (err, results) => {
//     if (err) {
//       console.error('❌ Failed to fetch last ticket number:', err);
//       return res.status(500).json({ success: false, message: 'Database error while fetching ticket number' });
//     }

//     // Step 2: Generate the new ticket number
//     let newTicketNo;
//     if (results.length === 0) {
//       newTicketNo = 'Ticket_00001';
//     } else {
//       const lastTicket = results[0].ticket_no;
//       console.log(lastTicket);
//       const lastNumber = parseInt(lastTicket.split('_')[1], 10);
//       console.log(lastNumber);
//       const nextNumber = lastNumber + 1;
//       newTicketNo = `Ticket_${nextNumber.toString().padStart(5, '0')}`;
//       console.log(newTicketNo);
//     }

//     // Step 3: Insert new user with generated ticket_no
//     const insertSql = `
//       INSERT INTO users (ticket_no, session_start, session_end) 
//       VALUES (?, ?, ?)
//     `;
//     const values = [newTicketNo, session_start, session_end];

//     db.query(insertSql, values, (err, result) => {
//       if (err) {
//         console.error('❌ Failed to insert user:', err);
//         return res.status(500).json({ success: false, message: 'Database error while inserting user' });
//       }
//       //console.log('✅ User inserted with ticket_no:', newTicketNo);
//       res.status(200).json({ success: true, ticket_no: newTicketNo, message: 'Session initialized' });
//     });
//   });
// });



// app.post('/updateUserData', (req, res) => {
//   const { ticket_no, name, email, company, contactNumber, message } = req.body;
//   const sql = `
//     UPDATE users
//     SET name = ?, email = ?, company = ?, contactNumber = ?, message = ?
//     WHERE ticket_no = ?
//   `;
//   const values = [name, email, company, contactNumber, message, ticket_no];

//   db.query(sql, values, (err, result) => {
//     if (err) {
//       console.error('❌ Failed to update user data:', err);
//       return res.status(500).json({ success: false, message: 'Database error' });
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ success: false, message: 'Session not found' });
//     }

//   //  console.log('✅ User data updated');
//     res.status(200).json({ success: true, message: 'User data updated' });
//   });
// });

// app.post('/setSelectedServices', (req, res) => {
//   const { ticket_no, parentService, selectedService, subChildService, submitionTime } = req.body;
//   const sql1 = `
//     UPDATE users
//     SET session_end = ? WHERE ticket_no = ?
//   `;
//   const values1 = [submitionTime, ticket_no];

//   db.query(sql1, values1, (err, result1) => {
//     if (err) {
//       console.error('❌ Error updating sessionEnd time into users:', err);
//       return res.status(500).json({ success: false, message: 'Failed to update session end time' });
//     }

//     const sql = 'INSERT INTO userServices (ticket_no, parent_Services, child_Services, subchild_Services) VALUES (?, ?, ?, ?)';
//     const values = [ticket_no, parentService, selectedService, subChildService];

//     db.query(sql, values, (err, result2) => {
//       if (err) {
//         console.error('❌ Error inserting into userServices:', err);
//         return res.status(500).json({ success: false, message: 'Failed to insert service data' });
//       }

//       // ✅ Send response once after both DB operations succeed
//       res.status(200).json({ success: true, message: 'Session end time updated and service recorded successfully' });
//     });
//   });
// });

// app.post('/addChatHistory', (req, res) => {
//   const { ticket_no, question, answer } = req.body;
//   //console.log(req.body);
//   const sql = `
//     INSERT INTO chat_history (ticket_no, questions, answers)
//     VALUES (?, ?, ?)
//   `;
//   const values = [ticket_no, question, answer];

//   db.query(sql, values, (err, result) => {
//     if (err) {
//       console.error('❌ Failed to insert chat history:', err);
//       return res.status(500).json({ success: false, message: 'Database error' });
//     }

// //    console.log('✅ Chat history inserted for ticket_no:', ticket_no);
//     res.status(200).json({ success: true, message: 'Chat history stored' });
//   });
// });

turndownService.addRule('lineBreaks', {
  filter: ['br'],
  replacement: () => '  \n' 
});

app.post('/getAnswer', async (req, res) => {
  try {
    console.log("Incoming request:", req.body);
//https://infoagent.fidelsoftech.com/api/chat
    // const springResponse = await fetch('http://localhost:8442/api/chat', {
      const springResponse = await fetch('https://infoagent.fidelsoftech.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ZmlkZWxhcGl1c2VyOlMzY3VyZVBhJCR3b3Jk'
      },
      body: JSON.stringify(req.body) 
    });

    const contentType = springResponse.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await springResponse.text();
      return res.status(500).json({ error: '❌ fidelInfoAgent returned non-JSON response', details: text });
    }

    const data = await springResponse.json();
    const markdownAnswer = turndownService.turndown(data.answer);
      console.log(markdownAnswer)
    res.status(200).json(markdownAnswer);

  } catch (err) {
    console.error('Error calling Spring Boot API:', err);
    res.status(500).json({ error: err.message });
  }
});



app.listen(PORT, () => {
  console.log(`🚀 API Server running at http://localhost:${PORT}`);
});
