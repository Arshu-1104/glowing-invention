const fs = require("node:fs");
const sqlite3 = require("sqlite3").verbose();

function createTable(dbName = "data.db", tableName = "myTable", tableSchema) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbName);
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS ${tableName} (${tableSchema})`,
        (err) => {
          db.close();
          if (err) {
            reject(
              new Error(`Error creating table '${tableName}': ${err.message}`),
            );
          } else {
            resolve();
          }
        },
      );
    });
  });
}

function insertData(dbName = "data.db", tableName = "myTable", data) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbName);
    db.serialize(() => {
      // Get columns dynamically from the first data item
      const columns = Object.keys(data[0]); //this line is changed
      const placeholders = columns.map(() => "?").join(",");
      const stmt = db.prepare(
        `INSERT INTO ${tableName} (${columns.join(",")}) VALUES (${placeholders})`,
      );
      data.forEach((item) => {
        const values = columns.map((col) => item[col]);
        stmt.run(values, function (err) {
          if (err) {
            reject(
              new Error(
                `Error inserting data into table '${tableName}': ${err.message}`,
              ),
            );
            return;
          }
        });
      });
      stmt.finalize(() => {
        db.close();
        resolve();
      });
    });
  });
}


//photos of individual products are stored in an directory made for each product with directory name of photoid
async function run() {
  //createDatabase();
  const schema =
    "productid INTEGER PRIMARY KEY, productname TEXT, desccription TEXT, rating REAL,sellerid TEXT, specifications TEXT,photoid TEXT";
  try {
    await createTable("data.db", "products", schema);
    const userData = [
      {
        productid: 1,
        productname: "ebefbefjbjb",
        age: 30,
        password: "abcd",
        phoneno: 9365874268,
        address: " mane",
        productid: "anfoae",
      },
      {
        id: 2,
        name: "Bob",
        age: 25,
        password: "efgh",
        phoneno: 9856745236,
        address: "af aekfb ajfboea alj",
        productid: "ohefaj",
      },
      {
        id: 3,
        name: "Charlie",
        age: 35,
        password: "afbeaof",
        phoneno: 9874536851,
        address: "afba aejfb afb efo",
        productid: "baefoujebao",
      },
    ];
    await insertData("data.db", "sellers", userData);
    console.log("Data inserted successfully.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}
//run();
