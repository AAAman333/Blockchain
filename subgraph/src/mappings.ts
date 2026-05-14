import { BigInt } from '@graphprotocol/graph-ts'
import { Deployed } from '../generated/RWAFactory/RWAFactory'
import { Asset, User } from '../generated/schema'

export function handleDeployed(event: Deployed): void {
  let senderId = event.transaction.from.toHex()
  let user = User.load(senderId)
  if (user == null) {
    user = new User(senderId)
    user.address = senderId
    user.createdAt = event.block.timestamp
    user.save()
  }

  let asset = Asset.load(event.params.addr.toHex())
  if (asset == null) {
    asset = new Asset(event.params.addr.toHex())
  }

  asset.token = event.params.addr.toHex()
  asset.factory = event.address.toHex()
  asset.createdAt = event.block.timestamp
  asset.method = event.params.method.toI32()
  asset.save()
}
