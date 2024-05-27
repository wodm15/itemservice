import express from 'express'
import {prisma} from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

//** 아이템 생성 API **//
router.post('/items', async (req, res, next)=>{
    try{
    const {itemCode, itemName, itemStat} = req.body;
    
    const isExistCode = await prisma.item.findFirst({
        where: {itemCode: itemCode},
    })
    if(isExistCode){
        return res.status(404).json({messageError:"이미 itemCode가 존재합니다."});
    }

    const item = await prisma.item.create({
        data: {
            itemCode,
            itemName,
            itemHealth: itemStat.health,
            itemPower: itemStat.power,
        }
    })
    return res.status(201).json({data: item});
}catch (error){
    next(error);
}
})

//** 아이템 부분 업데이트 API **//
router.patch('/items/:itemCode', async (req, res, next) => {
    try {
        const { itemCode } = req.params;
        const { itemName, itemStat } = req.body;

        const isExistCode = await prisma.item.findFirst({
            where: { itemCode: +itemCode },
        });

        if (!isExistCode) {
            return res.status(404).json({ messageError: "존재하는 item이 아닙니다." });
        }

        const item = await prisma.item.update({
            data: {
                itemName,
                itemHealth: itemStat.health,
                itemPower: itemStat.power,
            },
            where: {
                itemCode: +itemCode,
            },
        });

        return res.status(200).json({ data: item });
    } catch (error) {
        next(error);
    }
});

export default router;