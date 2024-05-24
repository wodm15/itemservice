import express from 'express';
import {prisma} from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import authMiddleware from '../middlewares/auth.middleware.js';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

//** 사용자 회원가입 API **//

const validateUserId = (id) => {
    const regex = /^(?=.*[a-z])(?=.*\d)[a-z0-9]+$/;
    return regex.test(id);
  };

router.post('/sign-up',async(req, res, next)=>{
    try{
        const {id, email, password, name, age, gender, profileImage} = req.body;
        //아이디가 소문자 숫자 조합인지 확인
        if (!validateUserId(id)) {
            return res.status(400).json({ error: 'ID 는 소문자+숫자 조합만 가능합니다.' });
          }

        //중복 아이디인지 확인
        const isExistId = await prisma.users.findFirst({
            where: {
                id: id,
            },
        });
        if(isExistId){
            return res.status(409).json({message: "이미 존재하는 아이디 입니다."})
        }

        //중복 이메일인지 확인
        const isExistEmail = await prisma.users.findFirst({
            where: {
                email: email,
            },
        });
        if(isExistEmail){
            return res.status(409).json({message: "이미 존재하는 이메일 입니다."})
        }

        //중복 테스트 끝나면 솔트값 뿌리기
        const hashedPassword = await bcrypt.hash(password, 10);

         //user + userInfo 트랜잭션 구현
         const [user,  userInfo] = await prisma.$transaction(async(tx)=>{
            
            const user = await tx.users.create({
                data: {
                    id,
                    email,
                    password: hashedPassword,
                },
            })

            const userInfo = await tx.userInfos.create({
                data: {
                    UserId: user.userId,
                    name: name,
                    age: age,
                    gender: gender.toUpperCase(),
                    profileImage,
                }
            })
            return [user, userInfo]
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });

            return res.status(201).json({message: "회원가입이 완료되었습니다."});
    } catch (error){
        next(error);
    }
});

//** 사용자 로그인 API **//
router.get('/login' , async (req,res, next)=>{
    const {id, password} = req.body;
    //유저 id를 기준으로 유저 찾기( id를 유니크 키로 설정했음)
    const user = await prisma.users.findFirst({
        where: {id: id},
    });
    //해당 Id가 없을 경우 리턴
    if(!user){
        return res.status(401).json({messgae:"ID 또는 비밀번호가 틀렸습니다."});
    }
    //비밀번호 확인 (메세지는 보안을 위해 둘다 똑같이 설정함)
    if(!await bcrypt.compare(password,user.password)){
        return res.status(401).json({message:"ID 또는 비밀번호가 틀렸습니다."})
    }

    //로그인 성공 시 사용자에게 jwt 발급
    const token = jwt.sign({userId: user.userId},process.env.SECRET_KEY); 
    // Bearer로 cookie 설정 (authMiddleware 에서 검증하기 위해 Bearer 추가)
    res.cookie('autorization', `Bearer ${token}`); 
    return res.status(201).json({message: "로그인 성공"});
})

export default router;