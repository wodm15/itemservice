// src/app.js

import express from 'express';
import cookieParser from 'cookie-parser';
import logMiddleware from './middlewares/log.middleware.js';
import errorHandlingMiddleware from './middlewares/error-handling.middleware.js';
import UsersRouter from '../routes/users.router.js';
import CharacterRouter from '../routes/characters.router.js';
import ItemRouter from '../routes/items.router.js';

const app = express();
const PORT = 3010;

app.use(logMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use('/api',[UsersRouter], [CharacterRouter],[ItemRouter]);
app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '3010포트로 서버가 열렸어요!');
});