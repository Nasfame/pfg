// IMPORTANT: we cannot import hardhat directly here
// because it will cause a circular dependency
import {Account} from './types'
import * as dotenv from 'dotenv'

const ENV_FILE = '.env'
dotenv.config({path: ENV_FILE})

export const loadEnv = (name: string, defaultValue: string) => {
    return process.env[name] || defaultValue
}

export const loadPrivateKey = (name: string, defaultValue: string) => {
    return loadEnv(`${name.toUpperCase()}_PRIVATE_KEY`, defaultValue)
}

export const loadAddress = (name: string, defaultValue: string) => {
    return loadEnv(`${name.toUpperCase()}_ADDRESS`, defaultValue)
}

// the default values here are the hardhat defualt insecure accounts
// this means that we get a reproducable dev environment between hardhat and geth
export const ACCOUNTS: Account[] = [{
    name: 'QB',
    address: loadAddress('admin', '0xA296a3d5F026953e17F472B497eC29a5631FB51B'),
    privateKey: loadPrivateKey('admin', '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'),
    metadata: {},
},

]

// map of account name -> account
export const NAMED_ACCOUNTS = ACCOUNTS.reduce<Record<string, Account>>((all, acc) => {
    all[acc.name] = acc
    return all
}, {})

// map of account name -> account address
export const ACCOUNT_ADDRESSES = ACCOUNTS.reduce<Record<string, string>>((all, acc) => {
    all[acc.name] = acc.address
    return all
}, {})

// flat list of private keys in order
export const PRIVATE_KEYS = ACCOUNTS.map(acc => acc.privateKey)

export const getAccount = (name: string) => {
    const account = NAMED_ACCOUNTS[name]
    if (!account) {
        throw new Error(`Unknown account ${name}`)
    }
    return account
}
