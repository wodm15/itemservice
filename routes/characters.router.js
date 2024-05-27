import express from 'express';
import {prisma} from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router =express.Router();



//캐릭터 이름 생성 필터링
const validateCharacter = (name) => {
    const regex = /^(?:[a-z]+|[a-z0-9]+)$/;
    return regex.test(name);
};

//** 캐릭터 생성 API **//
router.post('/characters',authMiddleware, async(req, res, next)=>{
    try{
    const userId =req.user.userId; //userId 외래키 가져오기
    const {name} = req.body;

    const isExistName = await prisma.character.findFirst({
        where: {name},
    });
    if(!(validateCharacter(name))){
        return res.status(401).json({message:"캐릭터는 소문자 또는 소문자 숫자 조합만 가능합니다."})
    }

    if(isExistName){
        return res.status(401).json({message:"이미 존재하는 캐릭터 이름입니다."});
    }
    //캐릭터 스키마에 캐릭터 생성
    const character = await prisma.character.create({
        data: {
            UserId: +userId,
            name,
            health: 500, 
            power: 100,
            money: 10000,
        },
    })
    return res.status(201).json({data: character});
}catch (error){
    next(error);
}
})

//** 캐릭터 삭제 API **//
router.delete('/characters/:character_id', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.userId; // 인증된 사용자의 userId 가져오기
        const characterId = req.params.character_id;
        
        // 캐릭터가 해당 사용자의 것인지 확인
        const isExistId = await prisma.character.findFirst({
            where: {
                UserId: +userId,
                characterId: +characterId
            }
        });
        
        if (!isExistId) {
            return res.status(401).json({ message: "해당 캐릭터가 존재하지 않거나 삭제할 수 없습니다." });
        }

        // 캐릭터 삭제
        await prisma.character.delete({ where: { characterId: +characterId } });
        
        return res.status(201).json({ message: "캐릭터가 삭제되었습니다." });
    } catch (error) {
        next(error);
    }
});

//** 캐릭터 전체조회 API **//
router.get('/characters',authMiddleware,async(req, res, next)=>{
    const userId = req.user.userId;
    
    const characterList = await prisma.character.findMany({
        where: {UserId: +userId},
    })
    return res.status(201).json({data: characterList});
})

//** 캐릭터 상세조회 API **//
router.get('/characters/:character_id', authMiddleware, async(req, res, next) => {
    try {
        const userId = req.user.userId; // 사용자의 userId 가져오기
        const characterId = req.params.character_id;

        const isExistId = await prisma.character.findFirst({
            where: { characterId: +characterId },
        });

        if (!isExistId) {
            return res.status(401).json({ message: "해당 캐릭터가 존재하지 않습니다." });
        }

        const character = await prisma.character.findFirst({
            where: { characterId: +characterId },
            select: {
                UserId: true,
                name: true,
                health: true,
                power: true,
                money: true,
            }
        });

        return res.status(200).json({ data: character });
    } catch (error) {
        next(error);
    }
});



export default router;