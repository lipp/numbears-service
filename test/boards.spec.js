/* globals describe it before beforeEach afterEach */
const assert = require('assert')
const jet = require('node-jet')
const boards = require('../lib/boards')
const sinon = require('sinon')
const sinonStubPromise = require('sinon-stub-promise')
sinonStubPromise(sinon)

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

    it('provides boards/delete method', (done) => {
      jet.assert.isMethod(peer, 'boards/delete', done)
    })

    describe('boards/create', () => {
      it('is method', (done) => {
        jet.assert.isMethod(peer, 'boards/create', done)
      })

      it('forwards peer.add error', (done) => {
        const stub = sinon.stub(peer, 'add').returnsPromise().rejects('foo')
        peer.call('boards/create').catch(error => {
          assert.equal(error.message, 'foo')
          stub.restore()
          done()
        })
      })

      it('creates a board and returns its path', (done) => {
        peer.call('boards/create').then(result => {
          assert.equal(typeof result.path, 'string')
          const initVal = {
            name: '',
            tags: [],
            accounts: [],
            id: result.id
          }
          jet.assert.isState(peer, result.path, initVal, done)
        }).catch(done)
      })
    })

    describe('boards/delete', () => {
      it('is method', (done) => {
        jet.assert.isMethod(peer, 'boards/delete', done)
      })

      it('forwards peer.remove error', (done) => {
        peer.call('boards/create').then(result => {
          const stub = sinon.stub(jet.State.prototype, 'remove').returnsPromise().rejects('foo')
          peer.call('boards/delete', [result.id]).catch(error => {
            assert.equal(error.message, 'foo')
            stub.restore()
            done()
          }).catch(done)
        }).catch(done)
      })

      it('deletes a board', (done) => {
        peer.call('boards/create').then(result => {
          jet.assert.getsRemoved(peer, result.path, done)
          peer.call('boards/delete', [result.id]).catch(done)
        }).catch(done)
      })

      it('does not complain when deleting a non existing board', (done) => {
        peer.call('boards/delete', [123]).then(() => {
          done()
        }).catch(done)
      })
    })

    describe('with a board', () => {
      let path
      let id
      beforeEach(() => {
        return peer.call('boards/create').then(result => {
          path = result.path
          id = result.id
        })
      })

      afterEach(() => {
        return peer.call('boards/delete', [id])
      })

      it('can change the name', (done) => {
        jet.assert.changesTo(peer, path, {
          name: 'test',
          accounts: [],
          tags: [],
          id
        }, done)
        peer.set(path, {name: 'test'}).catch(done)
      })

      it('can change the accounts', (done) => {
        jet.assert.changesTo(peer, path, {
          name: '',
          accounts: [123],
          tags: [],
          id
        }, done)
        peer.set(path, {accounts: [123]}).catch(done)
      })

      it('can change the accounts', (done) => {
        jet.assert.changesTo(peer, path, {
          name: '',
          accounts: [],
          tags: [123],
          id
        }, done)
        peer.set(path, {tags: [123]}).catch(done)
      })

      it('can NOT change the id', (done) => {
        jet.assert.changesTo(peer, path, {
          name: '',
          accounts: [],
          tags: [],
          id
        }, done)
        peer.set(path, {id: 123}).catch(done)
      })
    })
  })
})
