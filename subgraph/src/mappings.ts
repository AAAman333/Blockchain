import { BigInt } from '@graphprotocol/graph-ts'
import { Deployed } from '../generated/RWAFactory/RWAFactory'
import { Asset, User } from '../generated/schema'

export function handleDeployed(event: Deployed): void {
  let senderId = event.transaction.from.toHexString()
  let user = User.load(senderId)
  if (user == null) {
    user = new User(senderId)
    user.address = event.transaction.from.toHexString()
    user.createdAt = event.block.timestamp
    user.save()
  }

  let assetId = event.params.addr.toHexString()
  let asset = Asset.load(assetId)
  if (asset == null) {
    asset = new Asset(assetId)
  }

  asset.token = assetId
  asset.factory = event.address.toHexString()
  asset.createdAt = event.block.timestamp
  asset.method = event.params.method.toI32()
  asset.save()
}
