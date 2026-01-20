import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001; // Use env port or default to 3001
const CONFIG_FILE = path.join(__dirname, 'db-config.json');

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); 

// Serve static files from the React build directory
// In production with Nginx, Nginx handles this, but this is a fallback
app.use(express.static(path.join(__dirname, 'dist')));

// --- Helper Functions ---

// Read DB Config (Priority: ENV -> db-config.json)
async function getDbConfig() {
  // 1. Try Environment Variables first (Best for Production)
  if (process.env.DB_HOST && process.env.DB_USER) {
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'taskpulse'
    };
  }

  // 2. Fallback to local config file (Best for Setup Wizard / Dev)
  try {
    await fs.access(CONFIG_FILE);
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

// Get Database Connection
async function getDbConnection() {
  const config = await getDbConfig();
  if (!config) throw new Error('DB_NOT_CONFIGURED');
  
  return await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database
  });
}

// Map helpers for snake_case <-> camelCase
const toCamel = (o) => {
  const newO = { ...o };
  if (newO.group_id) { newO.groupId = newO.group_id; delete newO.group_id; }
  if (newO.assigned_to) { newO.assignedTo = newO.assigned_to; delete newO.assigned_to; }
  if (newO.start_date) { newO.startDate = newO.start_date; delete newO.start_date; }
  if (newO.due_date) { newO.dueDate = newO.due_date; delete newO.due_date; }
  if (newO.task_id) { newO.taskId = newO.task_id; delete newO.task_id; }
  if (newO.progress_snapshot) { newO.progressSnapshot = newO.progress_snapshot; delete newO.progress_snapshot; }
  if (newO.is_completed !== undefined) { newO.isCompleted = !!newO.is_completed; delete newO.is_completed; }
  return newO;
};

// --- Endpoints ---

// Check Config Status
app.get('/api/config', async (req, res) => {
  const config = await getDbConfig();
  // Mask password for security
  const safeConfig = config ? { ...config, password: '***' } : {};
  res.json({ configured: !!config, config: safeConfig });
});

// Save Config (Writes to file, useful for UI setup wizard)
app.post('/api/config', async (req, res) => {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// Initialize Database (Create Tables)
app.post('/api/init', async (req, res) => {
  let connection;
  try {
    const config = await getDbConfig();
    if (!config) return res.status(400).json({ error: 'Database not configured' });

    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database
    });

    const queries = [
      `CREATE TABLE IF NOT EXISTS \`groups\` (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        role VARCHAR(255),
        avatar TEXT,
        group_id VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255),
        outcome TEXT,
        assigned_to VARCHAR(255),
        start_date VARCHAR(50),
        due_date VARCHAR(50),
        progress INT
      )`,
      `CREATE TABLE IF NOT EXISTS daily_logs (
        id VARCHAR(255) PRIMARY KEY,
        task_id VARCHAR(255),
        date VARCHAR(50),
        progress_snapshot INT,
        note TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS milestones (
        id VARCHAR(255) PRIMARY KEY,
        task_id VARCHAR(255),
        title VARCHAR(255),
        is_completed BOOLEAN
      )`
    ];

    for (const query of queries) {
      await connection.query(query);
    }

    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Init failed:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Get Data
app.get('/api/data', async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    
    const [groups] = await connection.query('SELECT * FROM `groups`');
    const [members] = await connection.query('SELECT * FROM members');
    const [tasks] = await connection.query('SELECT * FROM tasks');
    const [logs] = await connection.query('SELECT * FROM daily_logs');
    const [milestones] = await connection.query('SELECT * FROM milestones');

    // Reassemble nested structure
    const formattedTasks = tasks.map(t => {
      const task = toCamel(t);
      task.logs = logs.filter(l => l.task_id === t.id).map(toCamel);
      task.milestones = milestones.filter(m => m.task_id === t.id).map(toCamel);
      return task;
    });

    const formattedMembers = members.map(toCamel);
    const formattedGroups = groups.map(toCamel);

    res.json({
      tasks: formattedTasks,
      members: formattedMembers,
      groups: formattedGroups
    });

  } catch (error) {
    console.error('Fetch failed:', error);
    if (error.message === 'DB_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'DB_NOT_CONFIGURED' });
    }
    res.status(500).json({ error: 'Failed to fetch data from database', details: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Save Data
app.post('/api/data', async (req, res) => {
  let connection;
  try {
    const { tasks, members, groups } = req.body;
    connection = await getDbConnection();
    
    await connection.beginTransaction();

    await connection.query('DELETE FROM daily_logs');
    await connection.query('DELETE FROM milestones');
    await connection.query('DELETE FROM tasks');
    await connection.query('DELETE FROM members');
    await connection.query('DELETE FROM `groups`');

    if (groups.length > 0) {
      const groupValues = groups.map(g => [g.id, g.name]);
      await connection.query('INSERT INTO `groups` (id, name) VALUES ?', [groupValues]);
    }

    if (members.length > 0) {
      const memberValues = members.map(m => [m.id, m.name, m.role, m.avatar, m.groupId]);
      await connection.query('INSERT INTO members (id, name, role, avatar, group_id) VALUES ?', [memberValues]);
    }

    if (tasks.length > 0) {
      const taskValues = tasks.map(t => [t.id, t.title, t.outcome, t.assignedTo, t.startDate, t.dueDate, t.progress]);
      await connection.query('INSERT INTO tasks (id, title, outcome, assigned_to, start_date, due_date, progress) VALUES ?', [taskValues]);

      const logValues = [];
      const milestoneValues = [];

      tasks.forEach(t => {
        if (t.logs) {
          t.logs.forEach(l => logValues.push([l.id, t.id, l.date, l.progressSnapshot, l.note]));
        }
        if (t.milestones) {
          t.milestones.forEach(m => milestoneValues.push([m.id, t.id, m.title, m.isCompleted]));
        }
      });

      if (logValues.length > 0) {
        await connection.query('INSERT INTO daily_logs (id, task_id, date, progress_snapshot, note) VALUES ?', [logValues]);
      }
      if (milestoneValues.length > 0) {
        await connection.query('INSERT INTO milestones (id, task_id, title, is_completed) VALUES ?', [milestoneValues]);
      }
    }

    await connection.commit();
    res.json({ success: true });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Save failed:', error);
    res.status(500).json({ error: 'Failed to save data to database' });
  } finally {
    if (connection) await connection.end();
  }
});

// All other GET requests not handled before will return the React app
// This is critical for Nginx fallbacks if Nginx passes 404s to backend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`   Backend Server Running`);
  console.log(`   - Port: ${PORT}`);
  console.log(`   - Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================\n`);
});