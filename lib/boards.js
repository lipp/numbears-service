const jet = require('node-jet')
const uuid = require('uuid')

module.exports.init = (peer) => {
  let boards = {}

  const createBoard = new jet.Method('boards/create')
  createBoard.on('call', (args, reply) => {
    const id = uuid.v1()
    const path = 'boards/#' + id
    const initial = {
      id,
      name: '',
      tags: [],
      accounts: []
    }
    const boardState = new jet.State(path, initial)
    boardState.on('set', value => {
      const prev = boardState.value()
      return {
        value: {
          name: value.name || prev.name,
          tags: value.tags || prev.tags,
          accounts: value.accounts || prev.accounts,
          id
        }
      }
    })
    peer.add(boardState).then(() => {
      boards[id] = boardState
      reply({result: {path, id}})
    }).catch(error => {
      reply({error})
    })
  })

  const deleteBoard = new jet.Method('boards/delete')
  deleteBoard.on('call', (args, reply) => {
    const id = args[0]
    if (boards[id]) {
      boards[id].remove().then(() => {
        delete boards[id]
        reply({result: true})
      }).catch(error => {
        reply({error})
      })
    } else {
      reply({result: true})
    }
  })

  return Promise.all([
    peer.add(createBoard),
    peer.add(deleteBoard)
  ])
}
