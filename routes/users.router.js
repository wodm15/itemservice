import express from 'express';
import { prisma } from '../utils/prisma/index.js';
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

router.post('/sign-up', async (req, res, next) => {
    try {
        const { id, email, password, name, age, gender, profileImage } = req.body;

        if (!validateUserId(id)) {
            return res.status(400).json({ error: 'ID 는 소문자+숫자 조합만 가능합니다.' });
        }

        const isExistId = await prisma.users.findFirst({
            where: { id },
        });
        if (isExistId) {
            return res.status(409).json({ message: "이미 존재하는 아이디 입니다." });
        }

        const isExistEmail = await prisma.users.findFirst({
            where: { email },
        });
        if (isExistEmail) {
            return res.status(409).json({ message: "이미 존재하는 이메일 입니다." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [user, userInfo] = await prisma.$transaction(async (tx) => {
            const user = await tx.users.create({
                data: {
                    id,
                    email,
                    password: hashedPassword,
                },
            });

            const userInfo = await tx.userInfos.create({
                data: {
                    UserId: user.userId,
                    name,
                    age,
                    gender: gender.toUpperCase(),
                    profileImage,
                },
            });

            return [user, userInfo];
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
        });

        return res.status(201).json({ message: "회원가입이 완료되었습니다." });
    } catch (error) {
        next(error);
    }
});

//** 사용자 로그인 API **//
router.post('/login', async (req, res, next) => {
    const { id, password } = req.body;

    try {
        const user = await prisma.users.findFirst({
            where: { id },
        });

        if (!user) {
            console.log("User not found");
            return res.status(401).json({ message: "ID 또는 비밀번호가 틀렸습니다." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log("Invalid password");
            return res.status(401).json({ message: "ID 또는 비밀번호가 틀렸습니다." });
        }

        const token = jwt.sign({ userId: user.userId }, process.env.SECRET_KEY);
        res.cookie('authorization', `Bearer ${token}`);
        return res.status(201).json({ message: "로그인 성공" });
    } catch (error) {
        next(error);
    }
});

//** 사용자 상세조회 API **//
router.get('/users', authMiddleware, async (req, res, next) => {
    const { userId } = req.user;
    const user = await prisma.users.findFirst({
        where: { userId },
        select: {
            userId: true,
            email: true,
            createdAt: true,
            updatedAt: true,
            UserInfos: {
                select: {
                    name: true,
                    age: true,
                    gender: true,
                    profileImage: true,
                },
            },
        },
    });

    return res.status(200).json({ data: user });
});

export default router;
