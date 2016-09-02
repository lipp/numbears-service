/* globals describe it before */
const jet = require('node-jet')
const boards = require('../lib/boards')

describe('boards', () => {
  let daemon
  let peer

  before(() => {
    daemon = new jet.Daemon()
    daemon.listen()
    peer = new jet.Peer()
    return peer.connect()
  })

  describe('when init', () => {
    before(() => {
      return boards.init(peer)
    })

    it('provides boards/create method', (done) => {
      jet.assert.isMethod(peer, 'boards/create', done)
    })

    it('provides boards/delete method', (done) => {
      jet.assert.isMethod(peer, 'boards/delete', done)
    })
  })
})
