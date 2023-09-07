const ETH_NETWORK = {
    mainnet: {
        RPC_URL: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
        CHAIN_ID: 1
    },
    testnet: {
        // RPC_URL: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
        // CHAIN_ID: 5
        // RPC_URL: "https://rpc.sepolia.org",
        RPC_URL: "https://ethereum-sepolia.blockpi.network/v1/rpc/public",
        CHAIN_ID: 11155111
    }
}

const ETH_CONTRACT_ADDRESS = {
    AdminWalletAddress: "0x5141383723037FBd3818dAEcb7d4C5DF1Dc8c6B1",
    ProjectManagerAddress: "0xf9dC36E8EE98d7f4480B240B8bd0759FffdBD831",
    ProjectDetailAddress: "0xc5A075199840A73d0D1553C52377cbD7Dc670ae4",
    WETH: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
    USDCAddress: "0x5E4702eD9b138B1985ca3a978fD89a5842026F10",
    YOCAddress: "0x68CE8DbAb831DF3ab84726F37Ff78f3bB874Db3a",
    YOCSwapFactoryAddress: "0x4FD14D4B16D14466194Ec4943EEC53d624971982",
    YOCSwapRouterAddress: "0xc89206D4A1D9eafb60E5c10820144f7F5473110f",
    YOCFarmAddress: "0x85E430190B7De2bA3Ef779F411299F9887147333",
    YUSDAddress: "0xc25FA5c92d41c6e070Ad04A7420cd1D932f3D8f6",
}

const BNB_NETWORK = {
    mainnet: {
        RPC_URL: "https://bsc-dataseed1.binance.org/",
        CHAIN_ID: 56
    },
    testnet: {
        RPC_URL: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        CHAIN_ID: 97
    }
}

const BNB_CONTRACT_ADDRESS = {
    AdminWalletAddress: "0x5141383723037FBd3818dAEcb7d4C5DF1Dc8c6B1",
    ProjectManagerAddress: "0x17B04150F1569aDADEB43f5a707c8ecC45443826",
    ProjectDetailAddress: "0xF26ab3153bA7E90E2abd9EA2074e8395eA5C88a5",
    WETH: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
    YOCAddress: "0xcEceca67b067A91DD38b5b29e2A1d5B5B2204e83",
    USDCAddress: "0x932836a161E7e6dd0272BC4D8912B17af8060C84",
    YOCSwapFactoryAddress: "0x409381803Ccd13EcA63c498f78469b25f7997AC6",
    YOCSwapRouterAddress: "0x120aB1f0AfAdFce0FdB180B8a79d49840FF79A66",
    YOCFarmAddress: "0x3B53C32BfB3B4aE6f37091d105FA8ea5a1503651",
    YUSDAddress: "0xA875d23C1497056c9f2089CA0e05B940cfdd1289",
}

const NETWORK = process.env.NET_WORK === "ETH" ? ETH_NETWORK : BNB_NETWORK;
const CONTRACT_ADDRESS = process.env.NET_WORK === "ETH" ? ETH_CONTRACT_ADDRESS : BNB_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
    NETWORK,
    CONTRACT_ADDRESS,
    PRIVATE_KEY
}