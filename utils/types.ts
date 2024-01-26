export interface Account {
    name: string,
    address?: string, //no worries we can derive from private key
    privateKey: string,
    metadata?: Record<string, string>,
}
