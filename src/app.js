// src/app.js

import express from 'express';
import cookieParser from 'cookie-parser';
import logMiddleware from '../middlewares/log.middleware.js';
import errorHandlingMiddleware from '../middlewares/error-handling.middleware.js';
import UsersRouter from '../routes/users.router.js';
import CharactersRouter from '../routes/characters.router.js';
// import ItemRouter from '../routes/items.router.js';

const app = express();
const PORT = 3010;

app.use(logMiddleware);
app.use(express.json());
app.use(cookieParser());
// 라우터 설정
app.use('/api', UsersRouter); // 사용자 라우터 설정
app.use('/api', CharactersRouter); // 캐릭터 라우터 설정
// , [CharacterRouter],[ItemRouter]
app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});