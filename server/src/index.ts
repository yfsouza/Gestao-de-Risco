import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { router } from './routes';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', router);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
