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


//** 캐릭터 아이템 부착 API **//
router.post('/characters/:character_id/equip', authMiddleware, async (req, res, next) => {
    try {
        const { character_id } = req.params;
        const { itemCode } = req.body;
        console.log(character_id);  // 콘솔 로그 확인

        // db에서 캐릭터와 아이템 가져오기
        const character = await prisma.character.findUnique({
            where: { characterId: +character_id }  // character_id를 정수로 변환
        });
        
        const item = await prisma.item.findUnique({
            where: { itemCode: +itemCode }  // itemCode를 정수로 변환
        });

        // 예외처리
        if (!character || !item) {
            return res.status(404).json({ message: "캐릭터 또는 아이템을 찾을 수 없습니다." });
        }

        // 이미 존재하는 아이템 착용 여부 확인
        const isExistItem = await prisma.characterItem.findFirst({
            where: {
                CharacterId: +character.characterId,
                ItemCode: +item.itemCode
            }
        });
        if (isExistItem) {
            return res.status(400).json({ message: "이미 착용한 아이템입니다." });
        }

        // 캐릭터아이템 db에 캐릭터Id와 아이템Id 추가하기
        await prisma.characterItem.create({
            data: {
                CharacterId: character.characterId,
                ItemCode: item.itemCode,  // itemCode가 아니라 itemId
            },
        });

        // 캐릭터 능력치 업데이트
        const updatedCharacter = await prisma.character.update({
            where: { characterId: character.characterId },
            data: {
                health: character.health + (item.itemHealth || 0),
                power: character.power + (item.itemPower || 0),
            }
        });

        return res.status(200).json({ data: updatedCharacter });
    } catch (error) {
        next(error);
    }
});

//** 캐릭터 아이템 탈착 API **//
router.delete('/characters/:character_id/unequip', authMiddleware, async (req, res, next) => {
    try {
        const { character_id } = req.params;
        const { itemCode } = req.body;
        console.log(character_id);  // 콘솔 로그 확인

        // db에서 캐릭터와 아이템 가져오기
        const character = await prisma.character.findUnique({
            where: { characterId: +character_id }  // character_id를 정수로 변환
        });
        
        const item = await prisma.item.findUnique({
            where: { itemCode: +itemCode }  // itemCode를 정수로 변환
        });

        // 예외처리: 캐릭터나 아이템이 없는 경우
        if (!character || !item) {
            return res.status(404).json({ message: "캐릭터 또는 아이템을 찾을 수 없습니다." });
        }

        // 캐릭터아이템 db에서 캐릭터Id와 아이템Id에 해당하는 레코드 제거하기
        const deletedCharacterItem = await prisma.characterItem.deleteMany({
            where: {
                CharacterId: +character.characterId,
                ItemCode: +item.itemCode
            }
        });

        // 예외처리: 삭제된 캐릭터 아이템이 없는 경우
        if (deletedCharacterItem.count === 0) {
            return res.status(404).json({ message: "해당 캐릭터가 해당 아이템을 착용하고 있지 않습니다." });
        }

        // 캐릭터 능력치 업데이트
        const updatedCharacter = await prisma.character.update({
            where: { characterId: character.characterId },
            data: {
                health: character.health - (item.itemHealth || 0),
                power: character.power - (item.itemPower || 0),
            }
        });

        return res.status(200).json({ data: updatedCharacter });
    } catch (error) {
        next(error);
    }
});


export default router;