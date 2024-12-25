require('dotenv').config();
const cors = require('cors');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nu3ic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// middleware
app.use(express.json());
app.use(cors());




// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

   

    const booksCollection=client.db('Library').collection('books');
 
// addBook
    app.post('/addBook', async (req,res)=>{
      const addBook= req.body;
    console.log(addBook);
    const result= await booksCollection.insertOne(addBook);
    res.send(result);
    })
   

    //GetAllBooks
    app.get('/books',async (req,res)=>{
      const cursor=booksCollection.find();
      const result= await cursor.toArray();
      res.send(result)
    })

    //getbookby id
    app.get('/book/:id',async(req,res)=>{
      const id=req.params.id;
      const query= {_id: new ObjectId(id)}
      const result= await booksCollection.findOne(query);
      res.send(result)
    })

    // update book

    app.patch('/book/:id',async (req,res)=>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
          $set: req.body
      }

      const result = await booksCollection.updateOne(filter, updatedDoc, options)

      res.send(result)

    })
    // get data via category

    app.get('/books/category',async (req,res)=>{
      const {category}=req.query;
      const query = category ? { category: category } : {};
      const cursor=booksCollection.find(query);
      const result= await cursor.toArray();
      res.send(result)
    })

 
  
 
   
 

















    // Send a ping to confirm a successful connection
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port,(req,res)=>{
    console.log(`My server is running http://localhost:${port}`)
})