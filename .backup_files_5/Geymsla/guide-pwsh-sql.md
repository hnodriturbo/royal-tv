# 🐘 PostgreSQL & VSCode Quick Reference

## 🚀 Connecting to Postgres in PowerShell

```sh
psql -U postgres -d royal_tv -h localhost
```

* `-U postgres` — your database username
* `-d royal_tv` — your database name
* `-h localhost` — host (useful if running locally)

### 💡 Tip: If `psql` isn’t recognized, add PostgreSQL to your PATH or navigate to its bin folder.

---

## 🔑 Common `psql` CLI Commands

| Command              | Description              |
| -------------------- | ------------------------ |
| `\l`                 | List all databases       |
| `\c db_name`         | Connect to database      |
| `\dt`                | List all tables          |
| `\d table_name`      | Describe table structure |
| `SELECT * FROM ...;` | Query table data         |
| `\q`                 | Quit/exit psql           |

---

## 🖥️ Using VSCode Extensions (GUI)

### 1️⃣ PostgreSQL by Chris Kolkman

* Install from Extensions (Ctrl+Shift+X): `PostgreSQL`
* Click the PostgreSQL sidebar, add new connection, fill host/port/user/password/db

### 2️⃣ Database Client (cweijan)

* Supports many databases
* Search for `Database Client` in Extensions

---

## 🌈 Example SQL Queries

```sql
-- Show all users\SELECT * FROM users;

-- List tables
\dt

-- Show table info
\d subscriptionPayment

-- Filtered query
SELECT username, email FROM users WHERE role = 'admin';
```

---

## 📝 Notes & Tips

* Password is prompted securely when you connect.
* Use arrow keys and Tab for navigation in CLI.
* Extension GUIs let you browse and edit data visually.
* Your default Postgres port is usually 5432.
* Use strong passwords for your database users!

---

## 🛠️ More Resources

* [PostgreSQL Documentation](https://www.postgresql.org/docs/)
* [VSCode PostgreSQL Extension](https://marketplace.visualstudio.com/items?itemName=ckolkman.vscode-postgres)
* [Database Client Extension](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-database-client2)
