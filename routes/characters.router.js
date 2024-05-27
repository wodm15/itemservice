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
    console.log(userId);
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






// router.delete('/characters:character_id') //캐릭터 삭제
// router.get('/characters:character_id') //캐릭터 상세조회

export default router;