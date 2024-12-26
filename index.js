require("dotenv").config();
const cors = require("cors");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const crypto = require("crypto");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nu3ic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// middleware
app.use(express.json());
app.use(cors());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const booksCollection = client.db("Library").collection("books");
    const borrowboooksCollection = client
      .db("Library")
      .collection("borrowBooks");

    // addBook
    app.post("/addBook", async (req, res) => {
      const addBook = req.body;
      console.log(addBook);
      const result = await booksCollection.insertOne(addBook);
      res.send(result);
    });

    // Function to generate a unique borrowed book ID
    const generateBorrowedBookId = (bookId, userEmail) => {
      // Combine book ID and user email
      const rawString = `${bookId}-${userEmail}`;

      // Hash the combined string to create a unique identifier
      const uniqueBookId = crypto
        .createHash("sha256")
        .update(rawString)
        .digest("hex");

      return uniqueBookId;
    };

    //Add Borrow Book
    app.post("/addBorrowBook", async (req, res) => {
      const borrowBook= req.body;
      const {bookid,email} =borrowBook;
      const borrowedBookId = generateBorrowedBookId(bookid, email);
      console.log(borrowedBookId);
      const addBorrowBook={
        ...borrowBook,borrowedBookId
      }
      console.log(addBorrowBook);
      const result = await borrowboooksCollection.insertOne(addBorrowBook);
      res.send(result);
    });


    //get all borrow book via email

    app.get("/borrowed-books", async (req, res) => {
      const { email } = req.query;
      const query = { email: email };
      const cursor = borrowboooksCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // delete one 
    app.delete('/borrowed-books/delete/:id', async(req,res)=>{
      const id= req.params.id;
      const query={borrowedBookId:id};
      const result= await borrowboooksCollection.deleteOne(query);
      res.send(result);
      
     })

    //Get All Books
    app.get("/books", async (req, res) => {
      const cursor = booksCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/latestbooks', async (req, res) => {
      try {
          const cursor = booksCollection.find().sort({ _id: -1 }).limit(6);
          const result = await cursor.toArray();
          res.send(result);
      } catch (error) {
          console.error("Error fetching latest books:", error);
      }
  });

    //get book by id
    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    // update book

    app.patch("/book/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: req.body,
      };

      const result = await booksCollection.updateOne(
        filter,
        updatedDoc,
        options
      );

      res.send(result);
    });
    // get data via category

    app.get("/books/category", async (req, res) => {
      const { category } = req.query;
      const query = { category: category };
      const cursor = booksCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
  console.log(`My server is running http://localhost:${port}`);
});
