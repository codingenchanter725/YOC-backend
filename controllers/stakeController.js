const { delay, convertWeiToEth, convertEthToWei, getProvider } = require('../untils');
const { Contract, BigNumber, constants, utils, ethers } = require('ethers');
const { MaxUint256, AddressZero, Zero } = constants;
const { YOCSwapFactory, YOC, USDCToken, YOCSwapRouter, YOCPair, TokenTemplate, YOCPool, YOCFarm, TOKENPool, TokenABI, PRIVATE_KEY } = require("../config/contracts");

const { Currency, StakeDetail, StakePool } = require('../models');
const { AdminWalletAddress } = require('../config/contracts');

const allStakes = async (req, res) => {
    const { account } = req.query;
    if (account == AdminWalletAddress) {
        const pools = await StakePool.findAll({
            // order: [['createdAt', 'ASC']]
            include: [
                {
                    model: Currency,
                    as: 'currency',
                }
            ]
        })
        return res.status(200).json({
            pools
        })
    } else {
        return res.status(500).json({ error: 'you are not admin' })
    }
}

const addStake = async (req, res) => {
    const { account } = req.body;

    if (account == AdminWalletAddress) {
        try {
            if (!req.body.tokenId || !req.body.allocPoint) throw "invalid parameter";
            const currency = await Currency.findOne({
                where: {
                    id: req.body.tokenId
                }
            })
            const signer = new ethers.Wallet(PRIVATE_KEY, getProvider());
            const dummyFactory = new ethers.ContractFactory(TokenABI.abi, TokenABI.bytecode, signer)
            const dummyContract = await dummyFactory.deploy("Dummy Token for YOC Stake", "YDFD", {
                gasLimit: 630000
            });
            await dummyContract.deployed();
            console.log('stake-addstake', 'YOC Dummy Address: ', dummyContract.address);
            const YocFarmContract = new ethers.Contract(YOCFarm.address, YOCFarm.abi, signer);

            // can't identify in Farm Add Event so save temperaly
            const newPool = await StakePool.create({
                token: req.body.tokenId,
                allocPoint: req.body.allocPoint,
                totalShare: 0,
                accYocPerShare: 0
            });

            const pId = +await YocFarmContract.poolLength();
            console.log('stake-addstake', 'poolId: ', pId);

            await YocFarmContract.add(
                req.body.allocPoint,
                dummyContract.address,
                false,
                true
            )
            console.log('stake-addstake', 'create empty pool and save temp');
            let YOCPoolFactory, YOCPoolContract;
            if (currency.address == YOC.address) {
                YOCPoolFactory = new ethers.ContractFactory(YOCPool.abi, YOCPool.bytecode, signer);
                YOCPoolContract = await YOCPoolFactory.deploy(
                    YOC.address,
                    YOCFarm.address,
                    signer.address,
                    signer.address,
                    pId,
                    true
                )
            } else {
                YOCPoolFactory = new ethers.ContractFactory(TOKENPool.abi, TOKENPool.bytecode, signer);
                YOCPoolContract = await YOCPoolFactory.deploy(
                    currency.address,
                    YOC.address,
                    YOCFarm.address,
                    signer.address,
                    pId
                )
            }
            await YOCPoolContract.deployed();
            console.log('stake-addstake', "YOCStakingPool Address: ", YOCPoolContract.address);
            const tx = await dummyContract.approve(YOCPoolContract.address, MaxUint256);
            await tx.wait();
            console.log('stake-addstake', "YOCStakingPool Approve");
            await YOCPoolContract.init(
                dummyContract.address
            )
            console.log('stake-addstake', "YocStakingPool init\n");


            await StakePool.update({
                address: YOCPoolContract.address,
                poolId: pId
            }, {
                where: {
                    id: newPool.id
                }
            });
            const pool = await StakePool.findOne({
                // order: [['createdAt', 'ASC']]
                include: [
                    {
                        model: Currency,
                        as: 'currency',
                    }
                ],
                where: {
                    id: newPool.id
                }
            })

            const stakeContract = new Contract(
                YOCPoolContract.address,
                currency.address == YOC.address ? YOCPool.abi : YOCPool.TokenABI,
                getProvider()
            );
            await stakeContract.on('Deposit', async (userAddress, amount) => {
                console.log('stake-addstake', "<======== Stake-Deposit ========>");
                updateSpecialStakePool(pool);
                updateSpecialStakePoolByUser(userAddress, pool);
            })
            await stakeContract.on('Withdraw', async (userAddress, amount) => {
                console.log('stake-addstake', "<======== Stake-Withdraw ========>");
                updateSpecialStakePool(pool);
                updateSpecialStakePoolByUser(userAddress, pool);
            })
            await stakeContract.on('Harvest', async (userAddress, amount) => {
                console.log('stake-addstake', "<======== Stake-Harvest ========>");
                updateSpecialStakePool(pool);
                updateSpecialStakePoolByUser(userAddress, pool);
            })
            console.log('stake-addstake', 'complete to create the pool and save successfuly');

            return res.status(200).json({
                success: "staking pool create"
            })
        } catch (err) {
            console.log("stake-addStake", err);
            return res.status(200).json({
                error: err.reason
            })
        }
    } else {
        return res.status(500).json({ error: 'you are not admin' })
    }
}

const editStake = async (req, res) => {
    const { account } = req.body;

    if (account == AdminWalletAddress) {
        console.log(req.body);
        const state = await StakePool.update({
            ...req.body
        }, {
            where: {
                id: req.body.id
            }
        })
        return res.status(200).json({
            state
        })
    } else {
        return res.status(500).json({ error: 'you are not admin' })
    }
}

const deleteStake = async (req, res) => {
    const { id, account } = req.query;
    if (account == AdminWalletAddress) {
        const farms = await StakePool.destroy({
            where: {
                id: id
            }
        })
        return res.status(200).json({
            farms
        })
    } else {
        return res.status(500).json({ error: 'you are not admin' })
    }
}

const stateStake = async (req, res) => {
    const { account } = req.body;

    if (account == AdminWalletAddress) {
        const state = await StakePool.update({
            isActive: req.body.isActive
        }, {
            where: {
                id: req.body.id
            }
        })
        return res.status(200).json({
            state
        })
    } else {
        return res.status(500).json({ error: 'you are not admin' })
    }
}

// ====================== PUBLICK ======================

const viewAllStakes = async (req, res) => {
    const pools = await StakePool.findAll({
        include: [
            {
                model: Currency,
                as: 'currency',
            }
        ],
        where: {
            isActive: true,
            isFinished: false
        }
    })
    return res.status(200).json({
        pools
    })
}

const scanMonitorStakes = async () => {
    try {
        const pools = await StakePool.findAll({
            include: [
                {
                    model: Currency,
                    as: 'currency',
                }
            ]
        })

        let YOCFarmContract = new Contract(
            YOCFarm.address,
            YOCFarm.abi,
            getProvider()
        )
        pools.forEach(async (item) => {
            const stakeContract = new Contract(
                item.address,
                item.currency.address == YOC.address ? YOCPool.abi : YOCPool.TokenABI,
                getProvider()
            )
            let totalShare = convertWeiToEth(await stakeContract.totalShares(), item.currency.decimals);
            let accYocPerShare = 0;
            if (item.currency.address != YOC.address) {
                accYocPerShare = convertWeiToEth(await stakeContract.accYocPerShare(), 18);
            }
            await StakePool.update({
                totalShare: totalShare,
                accYocPerShare: accYocPerShare
            }, {
                where: {
                    address: item.address
                }
            })

            await stakeContract.on('Deposit', async (userAddress, amount) => {
                console.log('stake-scanMonitorStakes', "<======== Stake-Deposit ========>");
                updateSpecialStakePool(item);
                updateSpecialStakePoolByUser(userAddress, item);
            })

            await stakeContract.on('Withdraw', async (userAddress, amount) => {
                console.log('stake-scanMonitorStakes', "<======== Stake-Withdraw ========>");
                updateSpecialStakePool(item);
                updateSpecialStakePoolByUser(userAddress, item);
            })

            await stakeContract.on('Harvest', async (userAddress, amount) => {
                console.log('stake-scanMonitorStakes', "<======== Stake-Harvest ========>");
                updateSpecialStakePool(item);
                updateSpecialStakePoolByUser(userAddress, item);
            })
        });
    } catch (err) {
        console.log("stake-scanMonitorStakes", err);
    }
}

const updateSpecialStakePool = async (item) => {
    try {
        const stakeContract = new Contract(
            item.address,
            item.currency.address == YOC.address ? YOCPool.abi : YOCPool.TokenABI,
            getProvider()
        )
        let totalShare = convertWeiToEth(await stakeContract.totalShares(), item.currency.decimals);
        let accYocPerShare = 0;
        if (item.currency.address != YOC.address) {
            accYocPerShare = convertWeiToEth(await stakeContract.accYocPerShare(), 18);
        }
        await StakePool.update({
            totalShare: totalShare,
            accYocPerShare: accYocPerShare
        }, {
            where: {
                address: item.address
            }
        })
    } catch (err) {
        console.log("stake-updateSpecialStakePool", err);
    }
}

const updateSpecialStakePoolByUser = async (userAddress, item) => {
    try {
        const stakeContract = new Contract(
            item.address,
            item.currency.address == YOC.address ? YOCPool.abi : YOCPool.TokenABI,
            getProvider()
        )
        let userInfo = await stakeContract.userInfo(userAddress), userAmount = 0;
        if (item.currency.address == YOC.address) {
            userAmount = convertWeiToEth(userInfo.shares, YOC.decimals);
        } else {
            userAmount = convertWeiToEth(userInfo.amount, item.currency.decimals);
        }
        const userDetail = await StakeDetail.findOne({
            where: {
                userAddress: userAddress,
                stakeId: item.id
            }
        })
        if (userDetail) {
            await StakeDetail.update({
                amount: userAmount
            }, {
                where: {
                    userAddress: userAddress,
                    stakeId: item.id
                }
            })
        } else {
            const pool = await StakePool.create({
                userAddress: userAddress,
                stakeId: item.id,
                amount: userAmount,
                tokenId: item.currency.id
            })
        }
    } catch (err) {
        console.log("stake-updateSpecialStakePoolByUser", err);
    }
}

const userStakeDetail = async (req, res) => {
    const { address, stakeId } = req.query;
    let data;
    try {
        data = await StakeDetail.findOne({
            include: [
                {
                    model: StakePool,
                    as: 'stake',
                    include: [
                        {
                            model: Currency,
                            as: 'currency'
                        }
                    ]
                },
            ],
            where: {
                userAddress: address,
                stakeId: stakeId
            }
        })
    } catch (err) {
        console.log("stake-userStakeDetail", err);
    }

    return res.status(200).json({
        stakeData: data
    })
}

const userStakeDetailUpdateAllowance = async (req, res) => {
    try {
        const { address, balance, stakeId } = req.body;

        let data = await StakeDetail.findOne({
            where: {
                userAddress: address,
                stakeId: stakeId,
            }
        })

        const pool = await StakePool.findOne({
            include: [
                {
                    model: Currency,
                    as: 'currency',
                }
            ]
        })
        const tokenContract = new Contract(
            pool.currency.address,
            TokenTemplate.abi,
            getProvider()
        )
        const allowance = convertWeiToEth(await tokenContract.allowance(address, pool.address), pool.currency.decimals)
        console.log('stake-userStakeDetailUpdateAllowance:', address, balance, stakeId, allowance);
        let state = 0;
        if (data) {
            state = await StakeDetail.update({
                isActive: true,
                allowance: allowance,
            }, {
                where: {
                    userAddress: address,
                    stakeId: stakeId,
                }
            })

        } else {
            state = await StakeDetail.create({
                isActive: true,
                stakeId: stakeId,
                userAddress: address,
                allowance: allowance,
            })
        }
        return res.status(200).json({
            state
        })
    } catch (err) {
        console.log('stake-userStakeDetailUpdateAllowance', err);
    }
}

module.exports = {
    allStakes,
    addStake,
    editStake,
    deleteStake,
    stateStake,

    viewAllStakes,
    scanMonitorStakes,
    userStakeDetail,
    userStakeDetailUpdateAllowance
}