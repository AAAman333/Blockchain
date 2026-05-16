import { Address, BigInt, Entity, ethereum, store, Value } from '@graphprotocol/graph-ts'

function loadOrCreateUser(senderId: string, createdAt: BigInt): Entity {
  let user = store.get('User', senderId)
  if (user == null) {
    user = new Entity()
    user.set('id', Value.fromString(senderId))
    user.set('address', Value.fromString(senderId))
    user.set('createdAt', Value.fromBigInt(createdAt))
    store.set('User', senderId, user)
  }
  return user!
}

export function handleAssetDeployed(event: ethereum.Event): void {
  let senderId = event.transaction.from.toHexString()
  loadOrCreateUser(senderId, event.block.timestamp)

  let assetId = event.parameters[0].value.toAddress().toHexString()
  let method = event.parameters[1].value.toBigInt()

  let asset = store.get('Asset', assetId)
  if (asset == null) {
    asset = new Entity()
    asset.set('id', Value.fromString(assetId))
  }

  asset.set('token', Value.fromString(assetId))
  asset.set('factory', Value.fromString(event.address.toHexString()))
  asset.set('createdAt', Value.fromBigInt(event.block.timestamp))
  asset.set('method', Value.fromI32(method.toI32()))
  store.set('Asset', assetId, asset)
}

export function handleProposalCreated(event: ethereum.Event): void {
  let proposalId = event.parameters[0].value.toBigInt()
  let id = proposalId.toString()

  let targets = event.parameters[2].value.toAddressArray()
  let values = event.parameters[3].value.toBigIntArray()
  let calldatas = event.parameters[5].value.toBytesArray()

  let proposal = new Entity()
  proposal.set('id', Value.fromString(id))
  proposal.set('proposalId', Value.fromBigInt(proposalId))
  proposal.set('proposer', Value.fromString(event.parameters[1].value.toAddress().toHexString()))
  proposal.set('description', Value.fromString(event.parameters[8].value.toString()))
  proposal.set('startBlock', Value.fromBigInt(event.parameters[6].value.toBigInt()))
  proposal.set('endBlock', Value.fromBigInt(event.parameters[7].value.toBigInt()))
  proposal.set('executed', Value.fromBoolean(false))
  proposal.set('createdAt', Value.fromBigInt(event.block.timestamp))
  proposal.set('governor', Value.fromString(event.address.toHexString()))
  proposal.set('targets', Value.fromStringArray(targets.map<string>((target: Address) => target.toHexString())))
  proposal.set('values', Value.fromBigIntArray(values))
  proposal.set('calldatas', Value.fromStringArray(calldatas.map<string>((bytes) => bytes.toHexString())))

  store.set('Proposal', id, proposal)
}

export function handleProposalExecuted(event: ethereum.Event): void {
  let proposalId = event.parameters[0].value.toBigInt()
  let id = proposalId.toString()
  let proposal = store.get('Proposal', id)
  if (proposal !== null) {
    proposal.set('executed', Value.fromBoolean(true))
    store.set('Proposal', id, proposal)
  }
}

export function handleVaultDeposit(event: ethereum.Event): void {
  let depositId = event.transaction.hash.toHexString().concat('-').concat(event.logIndex.toString())
  let deposit = new Entity()

  deposit.set('id', Value.fromString(depositId))
  deposit.set('caller', Value.fromString(event.parameters[0].value.toAddress().toHexString()))
  deposit.set('owner', Value.fromString(event.parameters[1].value.toAddress().toHexString()))
  deposit.set('vault', Value.fromString(event.address.toHexString()))
  deposit.set('assets', Value.fromBigInt(event.parameters[2].value.toBigInt()))
  deposit.set('shares', Value.fromBigInt(event.parameters[3].value.toBigInt()))
  deposit.set('createdAt', Value.fromBigInt(event.block.timestamp))
  deposit.set('transaction', Value.fromString(event.transaction.hash.toHexString()))

  store.set('Deposit', depositId, deposit)
}
