import express from 'express';
import mongoose from 'mongoose';
import messageContent from './dbMessages.js';
import Pusher from 'pusher';
import Cors from 'cors';


// App Config
const app = express();
const port = process.env.PORT || 9000

const pusher = new Pusher({
  appId: "1198822",
  key: "73276000b79bdc9b1a40",
  secret: "05d13ef3116af93e869e",
  cluster: "ap2",
  useTLS: true
});

// Middleware
app.use(express.json());
app.use(Cors());

// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// });


// DB Config
const connection_url = 'mongodb+srv://admin:g9KzVAe1VPaGOTYr@cluster0.6at3l.mongodb.net/whatsappDB?retryWrites=true&w=majority'
mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
})

const db = mongoose.connection;
db.once("open", () => {
    console.log("DB Connected");

    const msgCollection =db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log("Change Occur",change);

        if (change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', 
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            }
        );
        }else{
            console.log("Error in triggering Pusher!")
        }
    });
});

// API Routes
app.get('/', (req, res) => res.status(200).send('hello kinjal!'))

app.get('/messages/sync', (req, res) => {
    const dbMessage = req.body

    messageContent.find((err, data) => {
        if(err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})


app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    messageContent.create(dbMessage, (err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});

// Listener
app.listen(port, () => console.log(`listining on loocalhost: ${port}`));