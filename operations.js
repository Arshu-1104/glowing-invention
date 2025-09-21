const sqlite3 = require("sqlite3").verbose();

async function listAllEntries(dbName = "data.db", tableName = "users") {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbName);
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      db.close();
      if (err) {
        reject(new Error(`Error listing entries: ${err.message}`));
      } else {
        resolve(rows);
      }
    });
  });
}

async function addEntry(dbName = "data.db", tableName = "users", data) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbName);
    const columns = Object.keys(data);
    const placeholders = columns.map(() => "?").join(",");
    const stmt = db.prepare(
      `INSERT INTO ${tableName} (${columns.join(",")}) VALUES (${placeholders})`,
    );
    const values = columns.map((col) => data[col]);
    stmt.run(values, function (err) {
      stmt.finalize(() => {
        db.close();
        if (err) {
          reject(new Error(`Error adding entry: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  });
}

module.exports = { listAllEntries, addEntry };

async function exampleUsage() {
  try {
    const allUsers = await listAllEntries();
    console.log("All users:", allUsers);

    const newUser = {
      id: 4,
      name: "David",
      age: 40,
      password: "ijkl",
      phoneno: 1234567890,
      address: "New Address",
    };
    await addEntry("data.db", "users", newUser);
    console.log("New user added.");

    const updatedUsers = await listAllEntries();
    console.log("Updated users:", updatedUsers);
  } catch (error) {
    console.error("Error during example usage:", error);
  }
}

//exampleUsage();
