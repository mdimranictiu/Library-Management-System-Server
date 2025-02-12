require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const crypto = require("crypto");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nu3ic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Middleware
app.use(express.json());
app.use(cors());

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect(); // Ensure MongoDB is connected before defining collections
    // console.log("Connected to MongoDB successfully!");

    const booksCollection = client.db("Library").collection("books");
    const borrowBooksCollection = client.db("Library").collection("borrowBooks");
    const feedbacksCollection = client.db("Library").collection("feedbacks");
    const contactsCollection = client.db("Library").collection("contacts");
    const reportsCollection = client.db("Library").collection("reports");
    const suggestBookCollection = client.db("Library").collection("suggestBook");

    // JWT Token Generation
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Middleware: Verify Token
    const verifyToken = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized Access" });
      }

      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // Add a New Book (Protected)
    app.post("/addBook", verifyToken, async (req, res) => {
      const newBook = req.body;
      try {
        const result = await booksCollection.insertOne(newBook);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error adding book", error });
      }
    });
    app.post("/submit/feedback", async (req, res) => {
      const feedback = req.body;
    
      try {
        const result = await feedbacksCollection.insertOne(feedback);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error adding feedback", error });
      }
    });
    app.post("/submit/contact", async (req, res) => {
      const contact = req.body;
    
      try {
        const result = await contactsCollection.insertOne(contact);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error ", error });
      }
    });
    app.post("/submit/suggest-book", async (req, res) => {
      const suggestBook = req.body;
    
      try {
        const result = await suggestBookCollection.insertOne(suggestBook);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error ", error });
      }
    });
    app.post("/submit/report-issue", async (req, res) => {
      const report = req.body;
    
      try {
        const result = await reportsCollection.insertOne(report);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error ", error });
      }
    });
///////////////////////////////
    // Generate Unique Borrowed Book ID
    const generateBorrowedBookId = (bookId, userEmail) => {
      return crypto.createHash("sha256").update(`${bookId}-${userEmail}`).digest("hex");
    };

    // Add Borrowed Book (Protected)
    app.post("/addBorrowBook", verifyToken, async (req, res) => {
      const borrowBook = req.body;
      const { bookid, email } = borrowBook;
      const borrowedBookId = generateBorrowedBookId(bookid, email);
      const newBorrowEntry = { ...borrowBook, borrowedBookId };

      try {
        const result = await borrowBooksCollection.insertOne(newBorrowEntry);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error borrowing book", error });
      }
    });

    // Get Borrowed Books by Email (Protected)
    app.get("/borrowed-books", verifyToken, async (req, res) => {
      const { email } = req.query;
      try {
        const borrowedBooks = await borrowBooksCollection.find({ email }).toArray();
        res.json(borrowedBooks);
      } catch (error) {
        res.status(500).json({ message: "Error fetching borrowed books", error });
      }
    });

    // Delete Borrowed Book by ID (Protected)
    app.delete("/borrowed-books/delete/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      try {
        const result = await borrowBooksCollection.deleteOne({ borrowedBookId: id });
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Error deleting book", error });
      }
    });

    // Get All Books with Pagination & Search (Protected)
    app.get("/books", verifyToken, async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * 8;
      const search = req.query?.search || "";
      const query = {
        $or: [
          { category: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          { authorName: { $regex: search, $options: "i" } }
        ]
      };

      try {
        const total = await booksCollection.countDocuments(query);
        const books = await booksCollection.find(query).skip(skip).limit(8).toArray();
        res.json({ books, currentPage: page, totalPages: Math.ceil(total / 8), totalBooks: total });
      } catch (error) {
        res.status(500).json({ message: "Error fetching books", error });
      }
    });

    // Get Latest Books
    app.get('/latestbooks', async (req, res) => {
      try {
        const latestBooks = await booksCollection.find().sort({ _id: -1 }).limit(6).toArray();
        res.json(latestBooks);
      } catch (error) {
        console.error("Error fetching latest books:", error);
        res.status(500).json({ message: "Error fetching latest books", error });
      }
    });

    // Get a Single Book by ID (Protected)
    app.get("/book/find/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      try {
        const book = await booksCollection.findOne({ _id: new ObjectId(id) });
        res.json(book);
      } catch (error) {
        res.status(500).json({ message: "Error fetching book", error });
      }
    });

    // Update Book Details (Protected)
    app.patch("/book/update/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const updatedData = { $set: req.body };

      try {
        const result = await booksCollection.updateOne({ _id: new ObjectId(id) }, updatedData);
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Error updating book", error });
      }
    });

    // Get Books by Category (Protected)
    app.get("/books/category", verifyToken, async (req, res) => {
      const { category } = req.query;
      try {
        const books = await booksCollection.find({ category }).toArray();
        res.json(books);
      } catch (error) {
        res.status(500).json({ message: "Error fetching category books", error });
      }
    });

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run().catch(console.error);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
